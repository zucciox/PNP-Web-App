import React, { useState } from 'react';
import { Settlement } from '../../types';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const resourceColors: Record<string, string> = {
  Treasury: '#daa520', Energy: '#ffea00', Fuel: '#e3242b',
  Water: '#3d5a99', Food: '#a0522d', Oxygen: '#4a7c36', Steel: '#7a5a30',
  Aluminum: '#7b409e', Copper: '#8b4513', Platinum: '#2d74b3', Titanium: '#58b7e6',
  Gold: '#daa520', Diamond: '#74a1d3', Uranium: '#76a34d'
};

type ViewMode = 'consumption' | 'reserves';

export function SettlementsTable() {
  const { settlements } = useGameData();
  const [viewMode, setViewMode] = useState<ViewMode>('consumption');

  const consumptionMap: { key: keyof Settlement; label: string }[] = [
    { key: 'treasury_cr', label: 'Treasury' },
    { key: 'energy_cr', label: 'Energy' },
    { key: 'fuel_cr', label: 'Fuel' },
    { key: 'water_cr', label: 'Water' },
    { key: 'food_cr', label: 'Food' },
    { key: 'oxygen_cr', label: 'Oxygen' },
    { key: 'steel_cr', label: 'Steel' },
    { key: 'aluminum_cr', label: 'Aluminum' },
    { key: 'copper_cr', label: 'Copper' },
    { key: 'platinum_cr', label: 'Platinum' },
    { key: 'titanium_cr', label: 'Titanium' },
    { key: 'gold_cr', label: 'Gold' },
    { key: 'diamond_cr', label: 'Diamond' },
    { key: 'uranium_cr', label: 'Uranium' },
  ];

  const reservesMap: { key: keyof Settlement; label: string }[] = [
    { key: 'Treasury', label: 'Treasury' },
    { key: 'Energy', label: 'Energy' },
    { key: 'Fuel', label: 'Fuel' },
    { key: 'Water', label: 'Water' },
    { key: 'Food', label: 'Food' },
    { key: 'Oxygen', label: 'Oxygen' },
    { key: 'Steel', label: 'Steel' },
    { key: 'Aluminum', label: 'Aluminum' },
    { key: 'Copper', label: 'Copper' },
    { key: 'Platinum', label: 'Platinum' },
    { key: 'Titanium', label: 'Titanium' },
    { key: 'Gold', label: 'Gold' },
    { key: 'Diamond', label: 'Diamond' },
    { key: 'Uranium', label: 'Uranium' },
  ];

  const currentMap = viewMode === 'consumption' ? consumptionMap : reservesMap;

  return (
    <section className="summary-container">
      <header className="tab-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        <h3 className="consumption-header" style={{ margin: 0 }}>
          Settlement {viewMode === 'consumption' ? 'Consumption' : 'Reserves'}
        </h3>
        <div className="toggle-container" style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={() => setViewMode('consumption')}
            className={`tab-button ${viewMode === 'consumption' ? 'active' : ''}`}
            style={{ padding: '2px 12px', fontSize: '0.75rem' }}
          >
            Consumption
          </button>
          <button 
            onClick={() => setViewMode('reserves')}
            className={`tab-button ${viewMode === 'reserves' ? 'active' : ''}`}
            style={{ padding: '2px 12px', fontSize: '0.75rem' }}
          >
            Reserves
          </button>
        </div>
      </header>
      
      <div className="scroll-area">
        <div className="settlement-grid">
          {settlements.map((s) => (
            <div key={`${s.settlement_type}-${s.type_id}`} className="settlement-card">
              <div className="settlement-title">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="settlement-name">{s.name}</span>
                  <span className="sub-text" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {s.settlement_type}
                  </span>
                </div>
                <span className="settlement-id">ID: {s.type_id}</span>
              </div>

              <div className="resource-grid">
                {currentMap.map((res) => {
                  const val = Number(s[res.key]) || 0;
                  
                  // Only show values strictly above zero for both modes
                  if (val <= 0) return null;

                  return (
                    <div key={res.key} className="resource-item">
                      <span style={{ color: resourceColors[res.label] || '#bb86fc', fontWeight: 'bold' }}>
                        {res.label}
                      </span>
                      <span style={{ color: viewMode === 'consumption' ? '#ff4444' : '#4488ff', fontFamily: 'monospace' }}>
                        {viewMode === 'consumption' ? '-' : ''}{formatResourceValue(val)} 
                        <small className="resource-unit"> {viewMode === 'consumption' ? '/c' : ''}</small>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}