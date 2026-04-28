import React, { useState } from 'react';
import { Shipment, Unit, Facility } from '../../types';
import { useGameData } from '../../GameContext';


export function ManagementActions() {
  const {facilities, units, shipments } = useGameData();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const ACTIONS = [
    {
      id: 'shipment',
      label: 'Create Shipment',
      count: shipments.length,
      tooltip: 'Create a new shipment of resources from one place to another',
      onClick: () => {} // UPDATE LATER
    },
    {
      id: 'reassign',
      label: 'Reassign Workers',
      count: units.length,
      tooltip: 'Detach workers from a facility or attach them to another',
      onClick: () => {}
    },
    {
      id: 'payment',
      label: 'Make Payment',
      count: null, // Payments don't necessarily need a count display
      tooltip: 'Send money to another nation',
      onClick: () => {} // UPDATE LATER
    },
  ];

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#121212',
    color: '#e0e0e0',
    padding: '1.5rem',
    borderRadius: '8px',
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid #1e1e1e'
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    border: '1px solid #2a2a2a',
    borderRadius: '4px',
    padding: '0.8rem 1.2rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    outline: 'none'
  };

  const labelGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#ffffff',
  };

  const countStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#888',
    fontVariantNumeric: 'tabular-nums'
  };

  const iconContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#333',
    color: '#daa520', 
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'help',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    right: '120%',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#000000',
    color: '#e0e0e0',
    padding: '8px 12px',
    borderRadius: '4px',
    width: '180px',
    fontSize: '0.75rem',
    lineHeight: '1.4',
    zIndex: 10,
    border: '1px solid #444',
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    pointerEvents: 'none',
  };

  return (
    <section style={containerStyle}>
      <header style={{ borderBottom: '1px solid #333', marginBottom: '0.5rem' }}>
        <h3 style={{ 
          fontSize: '0.75rem', 
          color: '#888', 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          margin: '0 0 0.5rem 0' 
        }}>
          Logistics & Command
        </h3>
      </header>

      {ACTIONS.map((action) => (
        <div 
          key={action.id} 
          style={buttonStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#252525')}
          onClick={action.onClick}
        >
          <div style={labelGroupStyle}>
            <span style={labelStyle}>{action.label}</span>
            {action.count !== null && (
              <span style={countStyle}>({action.count})</span>
            )}
          </div>
          
          <div 
            style={iconContainerStyle}
            onMouseEnter={() => setHoveredIcon(action.id)}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            i
            {hoveredIcon === action.id && (
              <div style={tooltipStyle}>
                {action.tooltip}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}