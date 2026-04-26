import React, { useState } from 'react';
import { Facility } from '../../types';
import { useGameData } from '../../GameContext';

// Synced from Component 2
const RESOURCES = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy'
];

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520'
};

export function FacilitySummaryTable() {
  const { facilities} = useGameData();

  const [activeTab, setActiveTab] = useState<'totals' | 'facilities'>('totals');

  // --- LOGIC: AGGREGATE TOTAL PRODUCTION ---
  const productionTotals = facilities.reduce((acc, f) => {
    const type = f.output_type || 'Unknown';
    const amount = Number(f.output_amount_interval) || 0; 
    acc[type] = (acc[type] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  // --- STYLES ---
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#121212',
    color: '#e0e0e0',
    padding: '1.5rem',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid #333'
  };

  const badgeStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '0.8rem',
    border: '1px solid #2a2a2a',
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    backgroundColor: isActive ? '#333' : 'transparent',
    color: isActive ? '#ffffff' : '#888',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottom: isActive ? '2px solid #bb86fc' : '2px solid transparent'
  });

  return (
    <section style={containerStyle}>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #333', flexShrink: 0, marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('totals')} style={tabButtonStyle(activeTab === 'totals')}>
          Total Production
        </button>
        <button onClick={() => setActiveTab('facilities')} style={tabButtonStyle(activeTab === 'facilities')}>
          Facility Breakdown
        </button>
      </div>

      <div style={{ overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#444 #1e1e1e' }}>
        {activeTab === 'totals' ? (
          /* VIEW: Aggregated Totals (Matching Component 2 Style) */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {RESOURCES.map((res) => {
              const amount = productionTotals[res] || 0;
              const labelColor = resourceColors[res] || '#bb86fc';
              return (
                <div key={res} style={badgeStyle}>
                  <span style={{ color: labelColor, fontWeight: 'bold' }}>{res}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#03da3c', fontWeight: '500' }}>+{amount.toLocaleString()} 
                      <small style={{ color: '#555', fontWeight: 'normal' }}> /int</small>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.65rem' }}>Cycle: {(amount * 10).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VIEW: Individual Facility List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {facilities.map((f, idx) => {
              const intervalVal = Number(f.output_amount_interval || 0);
              return (
                <div key={f.global_id || idx} style={{ ...badgeStyle, flexDirection: 'column', padding: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{f.facility_type}</span>
                    <span style={{ color: '#999', fontSize: '0.7rem' }}>ID: {f.type_id || idx}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: resourceColors[f.output_type || ''] || '#888', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {f.output_type || 'NONE'}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#03da3c', fontSize: '0.85rem', fontWeight: '600' }}>
                        +{intervalVal.toLocaleString()} <small style={{ color: '#555', fontWeight: 'normal' }}>/int</small>
                      </span>
                      <div style={{ color: '#777', fontSize: '0.7rem' }}>
                        {(intervalVal * 10).toLocaleString()} /cycle
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {facilities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No active production facilities.
          </div>
        )}
      </div>
    </section>
  );
}