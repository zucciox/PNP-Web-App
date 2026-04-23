import React, { useState } from 'react';
import { Unit, Facility } from '../../types';

interface OperatingCostsTableProps {
  units: Unit[];
  facilities: Facility[];
}

export function OperatingCostsTable({ units, facilities }: OperatingCostsTableProps) {
  // State to track active view: 'units' or 'facilities'
  const [activeTab, setActiveTab] = useState<'units' | 'facilities'>('units');

  // Calculate Totals (regardless of active tab)
  const totalInterval = [...units, ...facilities].reduce((acc, item) => acc + item.oc_interval, 0);
  const totalCycle = totalInterval * 10; 

  // Reusing Component 1's Container Styles
  const containerStyle: React.CSSProperties = {
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
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '0.75rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  };

  const badgeStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '0.8rem',
    border: '1px solid #2a2a2a',
    marginBottom: '4px'
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    backgroundColor: isActive ? '#333' : 'transparent',
    color: isActive ? '#ffffff' : '#888',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    transition: '0.2s ease'
  });

  return (
    <section style={containerStyle}>
      {/* Header with Switcher */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        borderBottom: '1px solid #333', 
        marginBottom: '1rem' 
      }}>
        <h3 style={{ margin: 0, paddingBottom: '0.5rem', color: '#ffffff' }}>
          {activeTab === 'units' ? 'UNIT COSTS' : 'FACILITY COSTS'}
        </h3>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('units')}
            style={tabButtonStyle(activeTab === 'units')}
          >
            Units
          </button>
          <button 
            onClick={() => setActiveTab('facilities')}
            style={tabButtonStyle(activeTab === 'facilities')}
          >
            Facilities
          </button>
        </div>
      </header>

      {/* Total Banner (Always Visible) */}
      <div style={{ 
        ...cardStyle, 
        display: 'flex', 
        justifyContent: 'space-around', 
        marginBottom: '1.5rem',
        borderColor: '#bb86fc',
        background: 'linear-gradient(145deg, #1e1e1e, #252525)'
      }}>
        <div>
          <span style={{ color: '#999', fontSize: '0.8rem', display: 'block' }}>Total by Interval</span>
          <span style={{ color: '#03dac6', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalInterval.toLocaleString()}</span>
        </div>
        <div style={{ borderLeft: '1px solid #333' }}></div>
        <div>
          <span style={{ color: '#999', fontSize: '0.8rem', display: 'block' }}>Total by Cycle</span>
          <span style={{ color: '#03dac6', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalCycle.toLocaleString()}</span>
        </div>
      </div>

      {/* Conditional List Rendering */}
      <div style={cardStyle}>
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'units' ? (
            units.map((u, i) => (
              <div key={i} style={badgeStyle}>
                <span style={{ color: '#999' }}>{u.unit_type} <small style={{fontSize: '0.6rem'}}>#{u.type_id}</small></span>
                <span style={{ color: '#03dac6', fontWeight: '500' }}>{u.oc_interval.toLocaleString()}</span>
              </div>
            ))
          ) : (
            facilities.map((f, i) => (
              <div key={i} style={badgeStyle}>
                <span style={{ color: '#999' }}>{f.facility_type} <small style={{fontSize: '0.6rem'}}>#{f.type_id}</small></span>
                <span style={{ color: '#03dac6', fontWeight: '500' }}>{f.oc_interval.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}