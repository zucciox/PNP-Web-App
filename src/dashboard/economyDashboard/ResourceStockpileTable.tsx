import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { Facility, Settlement } from '../../types';

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

  if (!resources) return <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>Loading...</div>;

  const getInventory = (item: any) => {
    return ALL_RESOURCE_KEYS
      .map(key => ({ key, value: item[key] }))
      .filter(res => res.value > 0);
  };

  const tabButtonStyle = (isActive: boolean) => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    backgroundColor: isActive ? '#333' : 'transparent',
    color: isActive ? '#ffffff' : '#888',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    fontSize: '0.8rem',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    borderBottom: isActive ? '2px solid #bb86fc' : '2px solid transparent'
  });

  const locationCardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '10px'
  };

  // Reusable Grid Component for the inner card data
  const ResourceGrid = ({ items }: { items: { key: string, value: number }[] }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px' }}>
      {items.map(res => (
        <div key={res.key} style={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#252525',
          padding: '3px 8px',
          borderRadius: '3px',
          fontSize: '0.75rem',
          border: '1px solid #2a2a2a'
        }}>
          <span style={{ color: resourceColors[res.key] || '#aaa', fontWeight: '500' }}>{res.key}</span>
          <span style={{ color: '#eee', fontFamily: 'monospace' }}>{formatResourceValue(res.value)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section style={{ 
      backgroundColor: '#121212', color: '#e0e0e0', padding: '1.5rem', borderRadius: '8px',
      fontFamily: 'sans-serif', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #333'
    }}>
      <header style={{ display: 'flex', borderBottom: '1px solid #333', marginBottom: '1rem', flexShrink: 0 }}>
        <button onClick={() => setActiveTab('totals')} style={tabButtonStyle(activeTab === 'totals')}>National Reserves</button>
        <button onClick={() => setActiveTab('location')} style={tabButtonStyle(activeTab === 'location')}>By Location</button>
      </header>

      <div style={{ overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {activeTab === 'totals' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {ALL_RESOURCE_KEYS.filter(k => (resources as any)[k] !== undefined).map(res => (
              <div key={res} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#252525', padding: '6px 10px', borderRadius: '3px', fontSize: '0.85rem', border: '1px solid #2a2a2a' }}>
                <span style={{ color: resourceColors[res] || '#bb86fc', fontWeight: 'bold' }}>{res}</span>
                <span style={{ color: '#03da3c', fontFamily: 'monospace' }}>{formatResourceValue((resources as any)[res] || 0)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Settlements */}
            {settlements.map((s: Settlement) => {
              const inv = getInventory(s);
              if (inv.length === 0) return null;
              return (
                <div key={s.name} style={locationCardStyle}>
                  <div style={{ color: '#bb86fc', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.name}</div>
                  <ResourceGrid items={inv} />
                </div>
              );
            })}

            {/* Facilities */}
            {facilities.map((f: Facility) => {
              const inv = getInventory(f);
              if (inv.length === 0) return null;
              return (
                <div key={f.global_id} style={locationCardStyle}>
                  <div style={{ color: '#03dac6', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>{f.facility_type} # {f.type_id}</div>
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