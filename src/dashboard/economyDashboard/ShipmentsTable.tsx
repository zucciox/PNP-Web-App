import React, { useState } from 'react';
import { Shipment } from '../../types'; 
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; // Import the new styles

export function ShipmentsTable() {
  const { shipments } = useGameData();
  
  return (
    <section className="summary-container">
      <header className="consumption-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 className="settlement-title" style={{ margin: 0 }}>Active Shipments</h3>
        <span className="sub-text">{shipments.length} Total</span>
      </header>

      <div className="facility-grid" style={{ marginTop: '1rem' }}>
        {shipments.map((s) => (
          <ShipmentCard key={s.shipment_id} shipment={s} />
        ))}
      </div>
    </section>
  );
}

function ShipmentCard({ shipment: s }: { shipment: Shipment }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article 
      className="settlement-card shipment-card-root"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', minHeight: '64px', padding: '6px 8px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="facility-card-header" style={{ border: 'none', marginBottom: 0 }}>
          <strong className="settlement-title" style={{ fontSize: '12px', margin: 0 }}>
            {s.amount} {s.resource}
          </strong>
          <span className="settlement-id" style={{ fontFamily: 'monospace' }}>#{s.shipment_id}</span>
        </div>

        <div className="sub-text" style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#ccc' }}>
          <span className="shipment-truncate" title={s.origin_nation}>{s.origin_nation}</span>
          <span style={{ opacity: 0.3 }}>&rarr;</span>
          <span className="shipment-truncate" title={s.destination}>{s.destination}</span>
        </div>

        <div className="sub-text" style={{ marginTop: '2px', textTransform: 'uppercase' }}>
          {s.unit_type} {s.unit_id}
        </div>
      </div>

      {s.notes && isHovered && (
        <div className="shipment-notes-overlay">
          <small style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Notes:</small>
          {s.notes}
        </div>
      )}
    </article>
  );
}