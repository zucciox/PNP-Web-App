import React, { useState } from 'react';
import { Shipment } from '../../types'; 
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

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
  const { units } = useGameData(); // Access units to perform the lookup
  const [isHovered, setIsHovered] = useState(false);

  // Cross-reference: Find the unit where global_id matches the shipment's unit_id
  const matchingUnit = units?.find(u => u.global_id === s.unit_id);
  
  // Use the type_id if found, otherwise fallback to the global_id (s.unit_id)
  const displayId = matchingUnit ? matchingUnit.type_id : s.unit_id;

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

        {/* Now displaying the cross-referenced type_id */}
        <div className="sub-text" style={{ marginTop: '2px', textTransform: 'uppercase' }}>
          {s.unit_type} {displayId}
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