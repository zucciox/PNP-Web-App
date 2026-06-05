import React, { useMemo, useState } from 'react';
import { useGameData } from '../../GameContext';

type SortKey = "id" | "amount" | "resource";

export function ShipmentsNew() {
  const { shipments = [], units = [] } = useGameData();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("id");

  // Filter and sort mechanism from the reference style
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    const list = shipments.filter((s) => {
      if (!q) return true;
      return (
        s.resource.toLowerCase().includes(q) ||
        s.origin_nation.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        String(s.shipment_id).includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === "amount") return b.amount - a.amount;
      if (sortBy === "resource") return a.resource.localeCompare(b.resource);
      return b.shipment_id - a.shipment_id;
    });
  }, [shipments, query, sortBy]);

  const totalAmount = shipments.reduce((sum, s) => sum + s.amount, 0);

  return (
    <section style={styles.wrap}>
      <header style={styles.header}>
        <div>
          <h3 style={styles.title}>Active Shipments</h3>
          <p style={styles.subtitle}>
            {filtered.length} shown · {shipments.length} total · {totalAmount.toLocaleString()} units
          </p>
        </div>

        <div style={styles.controls}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={styles.search}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={styles.select}
          >
            <option value="id">Newest</option>
            <option value="amount">Largest</option>
            <option value="resource">Resource</option>
          </select>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div style={styles.empty}>No shipments found.</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((s) => (
            <ShipmentCard key={s.shipment_id} shipment={s} units={units} />
          ))}
        </div>
      )}
    </section>
  );
}

function ShipmentCard({ shipment: s, units }: { shipment: any; units: any[] }) {
  const [open, setOpen] = useState(false);

  // Maintain your data cross-referencing logic
  const matchingUnit = units?.find(u => u.global_id === s.unit_id);
  const displayId = matchingUnit ? matchingUnit.type_id : s.unit_id;
  const hasNotes = s.notes?.trim().length > 0;

  return (
    <article
      style={{
        ...styles.card,
        ...(open ? styles.cardActive : {}),
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div style={styles.cardTop}>
        <span style={styles.badge}>{s.resource}</span>
        <span style={styles.id}>#{s.shipment_id}</span>
      </div>

      <div style={styles.amount}>
        {s.amount.toLocaleString()}
      </div>

      <div style={styles.route}>
        <span style={styles.ellipsis} title={s.origin_nation}>
          {s.origin_nation}
        </span>
        <span style={styles.arrow}>→</span>
        <span style={styles.ellipsis} title={s.destination}>
          {s.destination}
        </span>
      </div>

      <div style={styles.footer}>
        <span style={{ textTransform: 'uppercase' }}>
          {s.unit_type || 'Unit'} {displayId}
        </span>
        {hasNotes && <span style={styles.notePill}>Notes</span>}
      </div>

      {hasNotes && open && (
        <div style={styles.overlay}>
          <div style={styles.overlayTitle}>Shipment Notes</div>
          <div>{s.notes}</div>
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: "linear-gradient(180deg, #0d1117 0%, #111827 100%)",
    border: "1px solid #1f2937",
    borderRadius: 18,
    padding: 18,
    color: "#e5e7eb",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    boxShadow: "0 12px 30px rgba(0,0,0,.35)",
    height: '87vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#94a3b8",
  },
  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  search: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 10,
    outline: "none",
    minWidth: 180,
    fontSize: 13,
  },
  select: {
    background: "#111827",
    border: "1px solid #334155",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    overflowY: 'auto',
    paddingRight: 4
  },
  empty: {
    padding: 30,
    textAlign: "center",
    color: "#94a3b8",
    border: "1px dashed #334155",
    borderRadius: 14,
  },
  card: {
    position: "relative",
    background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 14,
    minHeight: 150,
    transition: "all .18s ease",
    overflow: "hidden",
  },
  cardActive: {
    transform: "translateY(-2px)",
    border: "1px solid #6366f1",
    boxShadow: "0 14px 24px rgba(99,102,241,.18)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    background: "rgba(99,102,241,.14)",
    color: "#a5b4fc",
    border: "1px solid rgba(99,102,241,.25)",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  id: {
    fontSize: 11,
    color: "#64748b",
  },
  amount: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 14,
    color: "#f8fafc",
  },
  route: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#cbd5e1",
    marginBottom: 16,
  },
  arrow: {
    color: "#64748b",
    flexShrink: 0,
  },
  ellipsis: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#94a3b8",
  },
  notePill: {
    fontSize: 10,
    background: "#1e293b",
    border: "1px solid #334155",
    padding: "4px 8px",
    borderRadius: 999,
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(2, 6, 23, .96)",
    padding: 14,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#e2e8f0",
    overflowY: "auto",
  },
  overlayTitle: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#a5b4fc",
    marginBottom: 8,
  },
};