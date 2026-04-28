import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Unit } from '../../types';
import { useGameData } from '../../GameContext';

const TYPE_COLORS: Record<string, string> = {
  Infantry: '#4caf50', Tank: '#e53935', Air: '#42a5f5', Naval: '#26a69a', Artillery: '#ff9800',
};

const getHealthColor = (pct: number) => pct >= 70 ? '#03da3c' : pct >= 35 ? '#ffb300' : '#cf6679';

export function ActiveUnitsTable() {
  const { units } = useGameData() as { units: Unit[] };
  const activeUnits = useMemo(() => (units || []).filter(u => u.is_active), [units]);

  return (
    <section style={s.container}>
      <style>{`
        .info-wrap { position: relative; cursor: help; display: flex; align-items: center; }
        .tooltip { 
          visibility: hidden; opacity: 0; position: absolute; 
          right: 30px; top: 50%; transform: translateY(-50%);
          width: 120px; background: #1e1e1e; border: 1px solid #444; 
          padding: 8px; border-radius: 4px; z-index: 100;
          transition: opacity 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        }
        .info-wrap:hover .tooltip { visibility: visible; opacity: 1; }
        .menu-btn:hover { background: #333 !important; }
        .menu-item:hover { background: #3d3d3d !important; color: #fff !important; }
      `}</style>
      
      <div style={s.header}>
        <div style={s.title}>Active Units</div>
        <div style={{ fontSize: '0.85rem', color: '#666' }}>{activeUnits.length} Deployed</div>
      </div>

      <div style={s.tableWrap}>
        {activeUnits.length > 0 ? (
          <table style={s.table}>
            <thead>
              <tr>{['Unit', 'ID', 'Health', 'Stats', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {activeUnits.map((u, i) => {
                const pct = Math.max(0, Math.min(100, (u.health / u.max_health) * 100));
                const hColor = getHealthColor(pct);
                return (
                  <tr key={`${u.type_id}-${i}`}>
                    <td style={s.td}><span style={{ ...s.badge, color: TYPE_COLORS[u.unit_type] || '#bb86fc' }}>{u.unit_type}</span></td>
                    <td style={s.td}><span style={{ color: '#aaa' }}>#{u.type_id}</span></td>
                    <td style={s.td}>
                      <div style={{ width: '130px' }}>
                        <div style={s.hpLabel}>
                          <span>{u.health} / {u.max_health}</span>
                          <span style={{ color: hColor, fontWeight: 'bold' }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={s.barBg}><div style={{ ...s.barFill, width: `${pct}%`, background: hColor }} /></div>
                      </div>
                    </td>
                    <td style={s.td}><InfoIcon unit={u} /></td>
                    <td style={s.td}><ActionMenu unit={u} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div style={s.empty}>No active units.</div>}
      </div>
    </section>
  );
}

const ActionMenu = ({ unit }: { unit: Unit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        className="menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={s.actionBtn}
      >
        •••
      </button>

      {isOpen && (
        <div style={s.popover}>
          <div 
            className="menu-item" 
            style={s.menuItem} 
            onClick={() => { console.log('Attack with', unit.type_id); setIsOpen(false); }}
          >
            <span style={{ color: '#e53935', marginRight: '8px' }}>⚔</span> Attack
          </div>
          <div 
            className="menu-item" 
            style={s.menuItem} 
            onClick={() => { console.log('Demobilize', unit.type_id); setIsOpen(false); }}
          >
            <span style={{ color: '#aaa', marginRight: '8px' }}>⚑</span> Demobilize
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon = ({ unit }: { unit: Unit }) => (
  <div className="info-wrap">
    <div className="tooltip">
      <div style={{ color: '#fff', borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '2px', fontWeight: 'bold' }}>Unit Stats</div>
      <div style={s.statRow}><span>Dmg:</span> <b>{unit.damage}</b></div>
      <div style={s.statRow}><span>Atk:</span> <b>{unit.num_attacks}</b></div>
      <div style={s.statRow}><span>Rng:</span> <b>{unit.attack_range}</b></div>
      <div style={s.statRow}><span>Spd:</span> <b>{unit.speed}</b></div>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', fontFamily: 'sans-serif', border: '1px solid #333', width: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#eee', letterSpacing: '0.05em' },
  tableWrap: { overflow: 'visible', paddingBottom: '1rem' },
  table: { borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: { padding: '0.8rem 1rem', borderBottom: '1px solid #222', fontSize: '0.95rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', fontWeight: 600, fontSize: '0.85rem' },
  hpLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: '#999' },
  barBg: { height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width .3s ease-in-out' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', fontSize: '1rem', textAlign: 'center' },
  actionBtn: { background: '#222', border: '1px solid #444', color: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', transition: '0.2s' },
  popover: { position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '4px', zIndex: 110, width: '120px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' },
  menuItem: { padding: '10px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s', color: '#bbb' }
};