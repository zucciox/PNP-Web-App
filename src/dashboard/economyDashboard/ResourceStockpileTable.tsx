import React, { useState } from 'react';
import { resourceStockpileData } from '../../types';

interface ResourceStockpileTableProps {
  resourceStockpileData: resourceStockpileData;
}

const formatResourceValue = (value: number): string | number => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value;
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

export function ResourceStockpileTable({ resourceStockpileData }: ResourceStockpileTableProps) {
  // State to track active view: 'totals' or 'location'
  const [activeTab, setActiveTab] = useState<'totals' | 'location'>('totals');

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
      {/* Header with Switcher */}
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
            By Location
          </button>
        </div>
      </header>

      {/* Conditional Rendering based on state */}
      {activeTab === 'totals' ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '6px' 
        }}>
          {RESOURCES.map((res) => {
            const dbKey = res as keyof resourceStockpileData;
            const rawValue = (resourceStockpileData[dbKey] as number) ?? 0;
            const labelColor = resourceColors[res] || '#333';

            return (
              <div key={res} style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#252525',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '0.8rem',
                border: '1px solid #2a2a2a'
              }}>
                <span style={{ color: labelColor, marginRight: '4px' }}>{ res }</span>
                <span style={{ color: '#03dac6', fontWeight: '500' }}>{rawValue}</span>
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