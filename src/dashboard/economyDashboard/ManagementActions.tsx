import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

export function ManagementActions() {
  const { units, shipments } = useGameData();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const ACTIONS = [
    {
      id: 'shipment',
      label: 'Create Shipment',
      count: shipments.length,
      tooltip: 'Create a new shipment of resources from one place to another',
      onClick: () => {}
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
      count: null,
      tooltip: 'Send money to another nation',
      onClick: () => {}
    },
  ];

  return (
    <section className="summary-container">
      <header className="consumption-header">
        <h3>
          Logistics & Command
        </h3>
      </header>

      <div className="action-list">
        {ACTIONS.map((action) => (
          <div 
            key={action.id} 
            className="resource-item action-button"
            onClick={action.onClick}
            style={{ padding: '0.8rem 1.2rem' }} // Slight padding override for button feel
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="cost-label" style={{ color: '#fff', fontWeight: 'bold' }}>
                {action.label}
              </span>
              {action.count !== null && (
                <span className="sub-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  ({action.count})
                </span>
              )}
            </div>
            
            <div 
              className="info-icon"
              onMouseEnter={() => setHoveredIcon(action.id)}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              i
              {hoveredIcon === action.id && (
                <div className="tooltip">
                  {action.tooltip}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}