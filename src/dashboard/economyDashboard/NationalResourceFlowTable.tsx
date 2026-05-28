import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Unit, UnitType } from '../../types'; 
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';


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
  
  // Helper mapping function to convert UI display names into the new backend keys
  const getBackendKey = (resourceName: string): string => {
    if (resourceName === 'Treasury') return 'Treasury'; // Left unchanged as it wasn't listed in the migration array
    if (resourceName === 'NaturalGas') return 'natural_gas';
    
    // Handle listed compound words dynamically or explicitly
    const compoundWords: Record<string, string> = {
      NaturalGas: 'natural_gas',
      CopperOre: 'copper_ore',
      GoldOre: 'gold_ore',
      IronOre: 'iron_ore',
      AluminumOre: 'aluminum_ore',
      TitaniumOre: 'titanium_ore',
      PlatinumOre: 'platinum_ore',
      UraniumOre: 'uranium_ore'
    };
  
    if (compoundWords[resourceName]) {
      return compoundWords[resourceName];
    }
  
    // Fallback for single words -> force lowercase
    return resourceName.toLowerCase();
  };
  

export function NationalResourceFlowTable() {
  const { facilities, facilityTypes, settlements, nation } = useGameData();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totals = {
      reserves: {} as Record<string, number>,
      production: {} as Record<string, number>,
      consumption: {} as Record<string, number>
    };

    DISPLAY_RESOURCES.forEach(r => {
      totals.reserves[r] = 0;
      totals.production[r] = 0;
      totals.consumption[r] = 0;
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

    // 2. Production
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
        
        if (matchedRes) {
          let amount = Number(typeDef.output_amount_interval) || 0;
          if (typeDef.is_variable_output) amount *= (Number(f.workers_assigned) || 0);
          totals.production[matchedRes] += amount;
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
          <div style={s.title}>National Resource Flow</div>
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
                const finalConsumptionValue = stats.consumption[r]*10;
                const finalProductionValue = stats.production[r];

                return (
                  <tr 
                    key={r}
                  >
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: resourceColors[r] || '#bb86fc' }}>
                        {r}
                      </span>
                    </td>
                    <td style={s.td}><span style={{ color: '#4488ff' }}>{finalReserveValue.toLocaleString()}</span></td>
                    <td style={s.td}><span style={{ color: '#ff4444' }}>-{finalConsumptionValue.toLocaleString()}/c</span></td>
                    <td style={s.td}><span style={{ color: '#44ff44' }}>+{finalProductionValue.toLocaleString()}/c</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
    </section>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', border: '1px solid #333', width: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' },
  searchField: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '180px' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableWrap: { overflow: 'visible' },
  table: { borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: { fontFamily: 'monospace', padding: '0.8rem 1rem', borderBottom: '1px solid #222', fontSize: '0.9rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', fontWeight: 600, fontSize: '0.8rem' },
  hpLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: '#999' },
  barBg: { height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width .3s' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', textAlign: 'center' },
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