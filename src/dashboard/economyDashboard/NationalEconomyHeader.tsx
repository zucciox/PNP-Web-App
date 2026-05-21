import React, { useMemo, useState } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

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

export function NationalEconomyHeader() {
  const { facilities, facilityTypes, settlements, nation } = useGameData();
  const [viewMode, setViewMode] = useState<'interval' | 'cycle'>('interval');

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

  const ResourceColumn = ({ title, data, valueColor, suffix = "", controls, prefix ="" }: any) => (
    <div className="dashboard-column" style={{ flex: 1, minWidth: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="economy-column-header" style={{ margin: 0 }}>{title}</h2>
        {controls}
      </div>
      <div className="summary-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <div className="resource-grid" style={{ padding: '10px' }}>
          {DISPLAY_RESOURCES.map(res => {
            const finalValue = viewMode === 'cycle' && title.includes("Production") 
              ? data[res] * 10 
              : data[res];
              
            return (
              <div key={res} className="resource-item" style={{ borderBottom: '1px solid #333' }}>
                <span style={{ color: resourceColors[res], fontWeight: 'bold' }}>{res}</span>
                <span style={{ color: valueColor, fontFamily: 'monospace' }}>
                  {prefix}{finalValue.toLocaleString()}{suffix}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const ProductionToggle = (
    <div className="toggle-container" style={{ display: 'flex', gap: '5px', paddingRight: '10px' }}>
      <button 
        onClick={() => setViewMode('interval')}
        className={`tab-button ${viewMode === 'interval' ? 'active' : ''}`}
        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
      >
        Interval
      </button>
      <button 
        onClick={() => setViewMode('cycle')}
        className={`tab-button ${viewMode === 'cycle' ? 'active' : ''}`}
        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
      >
        Cycle
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '20px', width: '100%', marginBottom: '20px' }}>
      <ResourceColumn 
        title="National Consumption" 
        data={stats.consumption} 
        valueColor="#ff4444" 
        suffix="/c"
        prefix="-" 
      />
      <ResourceColumn 
        title="National Reserves" 
        data={stats.reserves} 
        valueColor="#4488ff" 
        prefix="" 
      />
      <ResourceColumn 
        title="National Production" 
        data={stats.production} 
        valueColor="#44ff44" 
        suffix={viewMode === 'interval' ? "/i" : "/c"}
        prefix="+" 
        controls={ProductionToggle}
      />
    </div>
  );
}