import React, { useState, useMemo } from 'react';
import { useGameData } from '../../GameContext';
import { Facility, Settlement } from '../../types';
import '../../styles/economyStyles.css'; 

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520',
};

// Treasury is kept here for UI ordering, but handled differently in logic
const ALL_RESOURCE_KEYS = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy',
];

export function ResourceStockpileTable() {
  // Destructure 'nation' from context
  const { facilities, settlements, nation } = useGameData();
  const [activeTab, setActiveTab] = useState<'totals' | 'location'>('totals');

  const calculatedTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    
    // 1. Set Treasury directly from the Nation object
    totals['Treasury'] = nation?.Treasury || 0;

    // 2. Initialize other resource keys at 0
    ALL_RESOURCE_KEYS.forEach(key => {
      if (key !== 'Treasury') totals[key] = 0;
    });

    const accumulate = (source: any[]) => {
      source.forEach(item => {
        ALL_RESOURCE_KEYS.forEach(key => {
          // Skip Treasury during accumulation since it's global
          if (key !== 'Treasury' && item[key]) {
            totals[key] += (Number(item[key]) || 0);
          }
        });
      });
    };

    accumulate(settlements);
    accumulate(facilities);
    
    return totals;
  }, [settlements, facilities, nation]); // Added nation to dependency array

  const getInventory = (item: any) => {
    // Filter out Treasury for individual location grids 
    // as it is a national resource, not a local one
    return ALL_RESOURCE_KEYS
      .filter(key => key !== 'Treasury')
      .map(key => ({ key, value: item[key] || 0 }))
      .filter(res => res.value > 0); // Optional: only show resources present at location
  };

  const ResourceGrid = ({ items, isGlobal = false }: { items: { key: string, value: number }[], isGlobal?: boolean }) => (
    <div className="resource-grid" style={{ marginTop: '8px' }}>
      {items.map(res => (
        <div key={res.key} className="resource-item">
          <span style={{ color: resourceColors[res.key] || '#bb86fc', fontWeight: 'bold' }}>{res.key}</span>
          <span className={isGlobal ? "pos-value" : "resource-value-neutral"}>
            {formatResourceValue(res.value)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <section className="summary-container">
      <header className="tab-nav">
        <button 
          onClick={() => setActiveTab('totals')} 
          className={`tab-button ${activeTab === 'totals' ? 'active' : ''}`}
        >
          National Reserves
        </button>
        <button 
          onClick={() => setActiveTab('location')} 
          className={`tab-button ${activeTab === 'location' ? 'active' : ''}`}
        >
          By Location
        </button>
      </header>

      <div className="scroll-area">
        {activeTab === 'totals' ? (
          <ResourceGrid 
            items={ALL_RESOURCE_KEYS.map(k => ({ key: k, value: calculatedTotals[k] }))} 
            isGlobal 
          />
        ) : (
          <div className="action-list">
            {settlements.map((s: Settlement) => {
              const inv = getInventory(s);
              return (
                <div key={s.name} className="settlement-card">
                  <div className="settlement-title" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {s.name}
                  </div>
                  <ResourceGrid items={inv} />
                </div>
              );
            })}

            {facilities.map((f: Facility) => {
              const inv = getInventory(f);
              if (inv.length === 0) return null;
              return (
                <div key={f.global_id} className="settlement-card">
                  <div className="settlement-title" style={{ color: '#03dac6', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {f.facility_type} # {f.type_id}
                  </div>
                  <ResourceGrid items={inv} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}