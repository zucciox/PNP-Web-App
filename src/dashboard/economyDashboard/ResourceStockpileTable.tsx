import React, { useState } from 'react';
import { useGameData } from '../../GameContext';

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520'
};

const RESOURCES = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy'
];

export function ResourceStockpileTable() {
  const { resources } = useGameData();
  const [activeTab, setActiveTab] = useState<'totals' | 'location'>('totals');

  // 1. Guard Clause: This "narrows" the type so TypeScript knows 
  // resources is NOT null for the rest of the component.
  if (!resources) {
    return (
      <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
        Loading National Reserves...
      </div>
    );
  }

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
    transition: '0.2s ease'
  });

  return (
    <section style={{ 
      backgroundColor: '#121212', 
      color: '#e0e0e0', 
      padding: '1.5rem',
      borderRadius: '8px',
      fontFamily: 'sans-serif',
      maxHeight: '80vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'thin',
      scrollbarColor: '#444 #1e1e1e'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #333', 
        marginBottom: '1rem' 
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('totals')}
            style={tabButtonStyle(activeTab === 'totals')}
          >
            National Reserves
          </button>
          <button 
            onClick={() => setActiveTab('location')}
            style={tabButtonStyle(activeTab === 'location')}
          >
            Reserves By Location
          </button>
        </div>
      </header>

      {activeTab === 'totals' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '6px' 
        }}>
          {RESOURCES.map((res) => {
            
            // Accessing data safely
            const rawValue = (resources as any)[res] ?? 0;
            
            // Grabbing color from constants
            const labelColor = resourceColors[res] || '#ffffff';

            return (
              <div key={res} style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#252525',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '0.85rem',
                border: '1px solid #2a2a2a'
              }}>
                <span style={{ color: labelColor, fontWeight: 'bold' }}>{res}</span>
                <span style={{ color: '#03da3c', fontFamily: 'monospace' }}>
                  {formatResourceValue(rawValue)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
          Location breakdown coming soon...
        </div>
      )}
    </section>
  );
}