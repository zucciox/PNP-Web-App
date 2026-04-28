import React, { useState } from 'react';
import { Unit, Facility } from '../../types';
import { useGameData } from '../../GameContext';

export function OperatingCostsTable() {
  const { facilities, units } = useGameData();
  const [activeTab, setActiveTab] = useState<'units' | 'facilities'>('units');

  const totalInterval = [...units, ...facilities].reduce((acc, item) => acc + item.oc_interval, 0);
  const totalCycle = totalInterval * 10; 

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

  const scrollAreaStyle: React.CSSProperties = {
    overflowY: 'auto',          
    paddingRight: '8px',       
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
    padding: '6px 10px',
    borderRadius: '3px',
    fontSize: '0.85rem',
    border: '1px solid #2a2a2a',
    marginBottom: '6px'
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
      <h3 style={{ 
        marginTop: 0, 
        color: '#ffffff', 
        borderBottom: '1px solid #333', 
        paddingBottom: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Operating Costs
      </h3>


      <div style={{ 
        ...cardStyle, 
        display: 'flex', 
        justifyContent: 'space-around', 
        marginBottom: '1rem',
        borderColor: '#bb86fc', 
        background: 'linear-gradient(145deg, #1e1e1e, #252525)',
        flexShrink: 0 
      }}>
        <div>
          <span style={{ color: '#999', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Total Per Interval</span>
          <span style={{ color: '#da0303', fontSize: '1.2rem', fontWeight: 'bold' }}>${totalInterval.toLocaleString()}</span>
        </div>
        <div style={{ borderLeft: '1px solid #333' }}></div>
        <div>
          <span style={{ color: '#999', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Total Per Cycle</span>
          <span style={{ color: '#da0303', fontSize: '1.2rem', fontWeight: 'bold' }}>${totalCycle.toLocaleString()}</span>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <button onClick={() => setActiveTab('units')} style={tabButtonStyle(activeTab === 'units')}>
          Units ({units.length})
        </button>
        <button onClick={() => setActiveTab('facilities')} style={tabButtonStyle(activeTab === 'facilities')}>
          Facilities ({facilities.length})
        </button>
      </div>

      <div style={scrollAreaStyle}>
        <div style={{ ...cardStyle, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
          {activeTab === 'units' ? (
            units.map((u, i) => (
              <div key={`unit-${i}`} style={badgeStyle}>
                <span style={{ color: '#e0e0e0' }}>
                  {u.unit_type} <small style={{ color: '#666', fontSize: '0.65rem' }}>ID:{u.type_id}</small>
                </span>
                <span style={{ color: '#da0303', fontWeight: '600' }}>${u.oc_interval.toLocaleString()}</span>
              </div>
            ))
          ) : (
            facilities.map((f, i) => (
              <div key={`fac-${i}`} style={badgeStyle}>
                <span style={{ color: '#e0e0e0' }}>
                  {f.facility_type} <small style={{ color: '#666', fontSize: '0.65rem' }}>ID:{f.type_id}</small>
                </span>
                <span style={{ color: '#da0303', fontWeight: '600' }}>${f.oc_interval.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}