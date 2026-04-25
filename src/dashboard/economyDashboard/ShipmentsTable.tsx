import React, { useState } from 'react';
import { Shipment } from '../../types'; 
import { useGameData } from '../../GameContext';

export function ShipmentsTable() {
  const {shipments } = useGameData();
  return (
    <section style={styles.wrap}>
      <header style={styles.header}>
        <h3 style={styles.title}>Active Shipments</h3>
        <span style={styles.count}>{shipments.length} Total</span>
      </header>

      <div style={styles.grid}>
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
      style={styles.card} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.cardContent}>
        <div style={styles.top}>
          <strong style={styles.resource}>{s.amount} {s.resource}</strong>
          <span style={styles.id}>#{s.shipment_id}</span>
        </div>

        <div style={styles.meta}>
          <span title={s.origin_nation} style={styles.truncate}>{s.origin_nation}</span>
          <span style={{ opacity: 0.3 }}>&rarr;</span>
          <span title={s.destination} style={styles.truncate}>{s.destination}</span>
        </div>

        <div style={styles.sub}>
          <span>{s.unit_type} {s.unit_id}</span>
        </div>
      </div>

      {/* Hover Overlay for Notes */}
      {s.notes && isHovered && (
        <div style={styles.notesOverlay}>
          <small style={{ fontWeight: 'bold', display: 'block', marginBottom: 2 }}>Notes:</small>
          {s.notes}
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 12,
    background: '#121212',
    color: '#e5e5e5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
    borderBottom: '1px solid #2a2a2a',
    paddingBottom: 6,
  },
  title: { margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' },
  count: { fontSize: 10, opacity: 0.5 },
  
  grid: {
    display: 'grid',
    gap: 6,
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  },

  card: {
    position: 'relative',
    background: '#1b1b1b',
    border: '1px solid #2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
    minHeight: '64px', // Flexible height to prevent cutoff
  },

  cardContent: {
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },

  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  resource: {
    color: '#bb86fc',
    fontSize: 12,
    fontWeight: 700,
  },

  id: { fontSize: 9, opacity: 0.4, fontFamily: 'monospace' },

  meta: {
    fontSize: 11,
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    color: '#ccc',
  },

  truncate: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '70px',
  },

  sub: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },

  notesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#121212',
    padding: 6,
    fontSize: 10,
    lineHeight: '1.3',
    zIndex: 2,
    overflowY: 'auto',
    border: '1px solid #bb86fc',
  },
};