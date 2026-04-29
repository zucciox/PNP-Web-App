import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; // Import the new styles

export function OperatingCostsTable() {
  const { facilities, units } = useGameData();
  const [activeTab, setActiveTab] = useState<'units' | 'facilities'>('units');

  const totalInterval = [...units, ...facilities].reduce((acc, item) => acc + item.oc_interval, 0);
  const totalCycle = totalInterval * 10;

  return (
    <section className="summary-container">
      <h3 className="consumption-header operating-header">
        Operating Costs
      </h3>

      {/* Summary Highlight Card */}
      <div className="settlement-card costs-summary-card">
        <div>
          <span className="cost-label">Total Per Interval</span>
          <span className="cost-value-large">${totalInterval.toLocaleString()}</span>
        </div>
        <div className="divider-v"></div>
        <div>
          <span className="cost-label">Total Per Cycle</span>
          <span className="cost-value-large">${totalCycle.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button 
          onClick={() => setActiveTab('units')} 
          className={`tab-button ${activeTab === 'units' ? 'active' : ''}`}
        >
          Units ({units.length})
        </button>
        <button 
          onClick={() => setActiveTab('facilities')} 
          className={`tab-button ${activeTab === 'facilities' ? 'active' : ''}`}
        >
          Facilities ({facilities.length})
        </button>
      </div>

      {/* List Area */}
      <div className="scroll-area">
        <div className="settlement-card tab-content-area">
          {(activeTab === 'units' ? units : facilities).map((item, i) => (
            <div key={`${activeTab}-${i}`} className="resource-item" style={{ marginBottom: '6px' }}>
              <span style={{ color: '#e0e0e0' }}>
                {'unit_type' in item ? item.unit_type : item.facility_type} 
                <small className="sub-text"> ID:{item.type_id}</small>
              </span>
              <span className="resource-value">${item.oc_interval.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}