import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; // Import the new styles

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
  const { facilities } = useGameData();
  const [activeTab, setActiveTab] = useState<'totals' | 'facilities'>('totals');

  const productionTotals = facilities.reduce((acc, f) => {
    const type = f.output_type || 'Unknown';
    const amount = Number(f.output_amount_interval) || 0; 
    acc[type] = (acc[type] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section className="summary-container">
      {/* Tab Navigation */}
      <div className="tab-nav">
        <button 
          onClick={() => setActiveTab('totals')} 
          className={`tab-button ${activeTab === 'totals' ? 'active' : ''}`}
        >
          Total Production
        </button>
        <button 
          onClick={() => setActiveTab('facilities')} 
          className={`tab-button ${activeTab === 'facilities' ? 'active' : ''}`}
        >
          Facility Breakdown
        </button>
      </div>
      
      <div className="scroll-area">
        {activeTab === 'totals' ? ( 
          /* TOTAL VIEW - Reusing .resource-grid and .resource-item from stylesheet */
          <div className="resource-grid">
            {RESOURCES.map((res) => {
              const amount = productionTotals[res] || 0;
              const labelColor = resourceColors[res] || '#bb86fc';
              return (
                <div key={res} className="resource-item">
                  <span style={{ color: labelColor, fontWeight: 'bold' }}>{res}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div className="pos-value">
                      +{amount.toLocaleString()} 
                      <small className="resource-unit"> /int</small>
                    </div>
                    <div className="sub-text">Cycle: {(amount * 10).toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* FACILITY BREAKDOWN VIEW */
          <div className="facility-grid">
            {facilities.map((f, idx) => {
              const intervalVal = Number(f.output_amount_interval || 0);
              return (
                <div key={f.global_id || idx} className="resource-item" style={{ flexDirection: 'column', height: 'auto' }}>
                  <div className="facility-card-header">
                    <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.75rem' }}>{f.facility_type}</span>
                    <span className="sub-text">#{f.type_id || idx}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: resourceColors[f.output_type || ''] || '#888', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {f.output_type || 'NONE'}
                    </span>
                    <div style={{ textAlign: 'right' }}>
                      <span className="pos-value" style={{ fontSize: '0.8rem' }}>
                        +{intervalVal.toLocaleString()}
                      </span>
                      <div className="resource-unit" style={{ fontSize: '0.6rem' }}>int</div>
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