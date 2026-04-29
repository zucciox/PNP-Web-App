import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { Facility, Settlement } from '../../types';
import '../../styles/economyStyles.css'; // Import the new styles

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520',
  Oil: '#222', Methane: '#ffeb3b', NaturalGas: '#00bcd4'
};

const ALL_RESOURCE_KEYS = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy', 'Oil', 'Methane', 'NaturalGas',
  'CopperOre', 'GoldOre', 'IronOre', 'AluminumOre', 'TitaniumOre', 'PlatinumOre', 'UraniumOre'
];

export function ResourceStockpileTable() {
  const { resources, facilities, settlements } = useGameData();
  const [activeTab, setActiveTab] = useState<'totals' | 'location'>('totals');

  if (!resources) return <div className="scroll-area" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  const getInventory = (item: any) => {
    return ALL_RESOURCE_KEYS
      .map(key => ({ key, value: item[key] }))
      .filter(res => res.value > 0);
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
            items={ALL_RESOURCE_KEYS.filter(k => (resources as any)[k] !== undefined).map(k => ({ key: k, value: (resources as any)[k] }))} 
            isGlobal 
          />
        ) : (
          <div className="action-list">
            {/* Settlements */}
            {settlements.map((s: Settlement) => {
              const inv = getInventory(s);
              if (inv.length === 0) return null;
              return (
                <div key={s.name} className="settlement-card">
                  <div className="settlement-title" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {s.name}
                  </div>
                  <ResourceGrid items={inv} />
                </div>
              );
            })}

            {/* Facilities */}
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