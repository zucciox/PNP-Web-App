import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Unit, UnitType } from '../../types'; 
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import { OperatingCostsTable } from './OperatingCostsTable';


const resourceColors: Record<string, string> = {
    Treasury: '#daa520', Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
    Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520', Diamond: '#74a1d3',
    Uranium: '#76a34d', Oxygen: '#4a7c36', Food: '#a0522d', Water: '#3d5a99', 
    Fuel: '#e3242b', Energy: '#ffea00'
  };
  
  // We keep UI keys as PascalCase to avoid breaking your styles and rendering
  const DISPLAY_RESOURCES = [
    'Treasury', 'Energy', 'Steel', 'Aluminum', 'Copper', 'Platinum', 
    'Titanium', 'Gold', 'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel'
  ];

  // Resources that are refined into other resources
  const RAW_RESOURCES = [
    'Iron Ore', 'Aluminum Ore', 'Copper Ore', 'Platinum Ore', 
    'Titanium Ore', 'Gold Ore', 'Diamond Ore', 'Uranium Ore', 'Oil', 'Gas'
  ];
  
  // Helper mapping function to convert UI display names into the new backend keys
  const getBackendKey = (resourceName: string): string => {
    if (resourceName === 'Treasury') return 'Treasury';
    
    // Explicit mappings for special cases
    const explicitMappings: Record<string, string> = {
      NaturalGas: 'natural_gas',
      Gas: 'natural_gas', // Maps "Gas" from RAW_RESOURCES to "natural_gas"
      Oil: 'oil',
      CopperOre: 'copper_ore',
      GoldOre: 'gold_ore',
      IronOre: 'iron_ore',
      AluminumOre: 'aluminum_ore',
      TitaniumOre: 'titanium_ore',
      PlatinumOre: 'platinum_ore',
      UraniumOre: 'uranium_ore'
    };
  
    if (explicitMappings[resourceName]) {
      return explicitMappings[resourceName];
    }
  
    // Fallback for names: snake_case formatting + force lowercase
    return resourceName
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  };


  const convertToRaw: Record<string, string> = {
    'Fuel': 'Oil', 
    'Copper': 'Copper Ore',
    'Energy': 'Gas',
    'Titanium': 'Titanium Ore',
    'Platinum': 'Platinum Ore',
    'Gold': 'Gold Ore',
    'Diamond': 'Diamond Ore',
    'Steel': 'Iron Ore',
    'Uranium': 'Uranium Ore',
    'Aluminum': 'Aluminum Ore',

    // Placeholders
    'Oxygen': 'Oxygen',
    'Food': 'Food',
    'Water': 'Water',
    'Treasury': 'Treasury'
  };

export function NationalResourceFlowTable() {
  const { facilities, facilityTypes, settlements, nation } = useGameData();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totals = {
      reserves: {} as Record<string, number>,
      production: {} as Record<string, number>,
      rawProduction: {} as Record<string, number>,
      consumption: {} as Record<string, number>
    };

    DISPLAY_RESOURCES.forEach(r => {
      totals.reserves[r] = 0;
      totals.production[r] = 0;
      totals.rawProduction[r] = 0;
      totals.consumption[r] = 0;
    });

    RAW_RESOURCES.forEach(r => {
      totals.rawProduction[r] = 0;
    });

    // 1. Reserves
    totals.reserves['Treasury'] = nation?.Treasury || 0;
    
    settlements.forEach(s => {
      DISPLAY_RESOURCES.forEach(r => { 
        if (r !== 'Treasury') {
          const backendKey = getBackendKey(r);
          totals.reserves[r] += (Number(s[backendKey]) || 0); 
        }
      });
    });
    
    facilities.forEach(f => {
      DISPLAY_RESOURCES.forEach(r => { 
        if (r !== 'Treasury') {
          const backendKey = getBackendKey(r);
          totals.reserves[r] += (Number(f[backendKey]) || 0); 
        }
      });
    });

    // 2. Production & Raw Production
    totals.production['Treasury'] = Number(nation?.interval_income) || 0;
    facilities.forEach(f => {
      if (!f.is_active) return;
      const typeDef = facilityTypes.find(t => t.facility_type === f.facility_type);
      if (typeDef && typeDef.output_type) {
        // Formats "Natural Gas" or "NaturalGas" into "natural_gas" / single words to "lowercase"
        const normalizedOutputType = typeDef.output_type
          .trim()
          .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore between camelCase/PascalCase words
          .replace(/\s+/g, '_')               // Replace spaces with underscores
          .toLowerCase();

        // Match normalized type against backend key schemas
        const matchedRes = DISPLAY_RESOURCES.find(r => getBackendKey(r) === normalizedOutputType);
        const matchedRawRes = RAW_RESOURCES.find(r => getBackendKey(r) === normalizedOutputType);
        
        if (matchedRes) {
          let amount = Number(typeDef.output_amount_interval) || 0;
          if (typeDef.is_variable_output) amount *= (Number(f.workers_assigned) || 0);
          totals.production[matchedRes] += amount;
          //console.log("Found primary resource producer:", typeDef.facility_type, " which produces this much output: ", typeDef.output_amount_interval)
        }
        else if (matchedRawRes) {
          totals.rawProduction[matchedRawRes] += Number(typeDef.output_amount_interval)
          console.log("Found raw resource producer:", typeDef.facility_type, " which produces this much " + typeDef.output_type + ": " + typeDef.output_amount_interval)
          //totals.rawProduction[matchedRawRes] += typeDef.is_variable_output ?  : Number(typeDef.output_amount_interval)
        }
      }
    });

    // 3. Consumption
    settlements.forEach(s => {
      // Direct mappings using the safe key converter rules + original '_cr' suffixes
      totals.consumption['Treasury'] += (Number(s.treasury_cr) || 0);
      totals.consumption['Energy'] += (Number(s.energy_cr) || 0); // energy_cr
      totals.consumption['Steel'] += (Number(s.steel_cr) || 0);   // steel_cr
      totals.consumption['Aluminum'] += (Number(s.aluminum_cr) || 0);
      totals.consumption['Copper'] += (Number(s.copper_cr) || 0);
      totals.consumption['Platinum'] += (Number(s.platinum_cr) || 0);
      totals.consumption['Titanium'] += (Number(s.titanium_cr) || 0);
      totals.consumption['Gold'] += (Number(s.gold_cr) || 0);
      totals.consumption['Diamond'] += (Number(s.diamond_cr) || 0);
      totals.consumption['Uranium'] += (Number(s.uranium_cr) || 0);
      totals.consumption['Oxygen'] += (Number(s.oxygen_cr) || 0);
      totals.consumption['Food'] += (Number(s.food_cr) || 0);
      totals.consumption['Water'] += (Number(s.water_cr) || 0);
      totals.consumption['Fuel'] += (Number(s.fuel_cr) || 0);
    });

    console.log("Raw Production Data:", totals.rawProduction);
    return totals;
  }, [facilities, facilityTypes, settlements, nation]);

  return (
    <section style={s.container}>
      <style>{`
        .info-wrap { position: relative; cursor: help; display: flex; align-items: center; }
        .tooltip { 
          visibility: hidden; opacity: 0; position: absolute; 
          right: 30px; top: 50%; transform: translateY(-50%);
          width: 140px; background: #1e1e1e; border: 1px solid #444; 
          padding: 8px; border-radius: 4px; z-index: 100;
          transition: opacity 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        }
        .info-wrap:hover .tooltip { visibility: visible; opacity: 1; }
        .menu-btn:hover { background: #333 !important; }
        .menu-item:hover:not(.disabled) { background: #3d3d3d !important; color: #fff !important; }
        .menu-item.disabled { cursor: not-allowed; opacity: 0.5; }
        .search-input::placeholder { color: #555; }
        .unit-row { cursor: pointer; transition: background 0.2s; }
        .unit-row:hover { background: #1a1a1a; }
        .unit-row.selected { background: #1a237e !important; }
      `}</style>
      
      <div style={s.header}>
        <div>
          <div style={s.title}>National Resource Balance</div>
        </div>
      </div>

      <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Resource', 'Stockpile', 'Consumption', "Production"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISPLAY_RESOURCES.map((r) => {

                const finalReserveValue = stats.reserves[r];
                const finalConsumptionValue = stats.consumption[r];
                const finalProductionValue = (stats.production[r]+stats.rawProduction[convertToRaw[r]])*10;

                return (
                  <tr 
                    key={r}
                  >
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: resourceColors[r] || '#bb86fc' }}>
                        {r}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{display: 'flex', gap: '5px'}}> 
                        <ReserveFeedbackIcon resource={r} reserveAmount={finalReserveValue} consumptionAmount={finalConsumptionValue} /> 
                        <span style={{ color: '#4488ff' }}> {finalReserveValue.toLocaleString()} </span>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ color: '#ff4444' }}>-{finalConsumptionValue.toLocaleString()}/c</span></td>
                    <td style={s.td}><span style={{ color: '#44ff44' }}>{finalProductionValue > finalConsumptionValue ? '✅' : '⚠️'} +{finalProductionValue.toLocaleString()}/c</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
      <OperatingCostsTable/>
    </section>
  );

  function ReserveFeedbackIcon({ resource: r, reserveAmount: rA, consumptionAmount: cA }: { resource: string, reserveAmount: number, consumptionAmount: number }) {
    const [isHovered, setIsHovered] = useState(false);
  
    // Cross-reference: Find the unit where global_id matches the shipment's unit_id
    const isMeetingCR = rA > cA
  
    return (
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div>
          {isMeetingCR ? '✅' : '❌'}
        </div>
  
        {isHovered && (
          <span className="resource-feedback-overlay" style={{color: isMeetingCR ? '#44ff44' : '#ff4444'}}>
            {isMeetingCR ? 'You have enough ' + r + ' in reserve to meet your next consumption rate.' : 
            'You DO NOT have enough ' + r + ' in reserve to meet your next consumption rate.'}
          </span>
        )}
      </div>
    );
  }
}

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', border: '1px solid #333', maxWidth: '475px', height: '91vh' },
  header: { display: 'flex', justifyContent: 'left', alignItems: 'center', paddingBottom: '1rem' },
  searchField: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '180px' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableWrap: { overflow: 'visible', width: '100%', overflowX: 'auto', },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', },
  th: { textAlign: 'left', padding: '0.6rem .5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: {textAlign: 'left', justifyContent: 'left', fontFamily: 'monospace', padding: '0.8rem 0.5rem', borderBottom: '1px solid #222', fontSize: '0.7rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', fontWeight: 600, fontSize: '0.8rem' },
  barBg: { height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width .3s' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', textAlign: 'left' },
  actionBtn: { background: '#222', border: '1px solid #444', color: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' },
  popover: { position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '4px', zIndex: 110, width: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  menuItem: { padding: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#bbb' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { background: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #444', width: '320px' },
  input: { width: '100%', padding: '12px', marginTop: '12px', background: '#121212', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#ff5252', fontSize: '0.75rem', marginTop: '12px', background: 'rgba(255,82,82,0.1)', padding: '8px', borderRadius: '4px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { background: 'transparent', border: 'none', color: '#777', cursor: 'pointer' },
  confirmBtn: { background: '#4caf50', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};