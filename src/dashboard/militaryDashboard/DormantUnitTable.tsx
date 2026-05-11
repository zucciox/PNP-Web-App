import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Unit, Settlement, Facility, UnitType } from '../../types';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';

interface GameDataContext {
  units: Unit[];
  settlements: Settlement[];
  facilities: Facility[];
  unitTypes: UnitType[];
  refreshData?: () => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  Troops: '#4caf50', Tank: '#e53935'
};

export function DormantUnitsTable() {
  const { units, settlements, facilities, unitTypes, refreshData } = useGameData() as GameDataContext;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const typeStatsMap = useMemo(() => {
    const map: Record<string, UnitType> = {};
    (unitTypes || []).forEach(t => { map[t.unit_type] = t; });
    return map;
  }, [unitTypes]);

  const filteredDormantUnits = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    return (units || [])
      .filter(u => !u.is_active)
      .map(unit => {
        let location = "Unknown";
        let isError = false;

        const hasSettlement = unit.inactive_settlement !== null && unit.inactive_settlement !== undefined;
        const hasFacility = unit.inactive_facility !== null && unit.inactive_facility !== undefined;

        if (hasSettlement && hasFacility) {
          location = "LOC_ERROR: DUAL_ASSIGNED";
          isError = true;
        } else if (hasSettlement) {
          const s = settlements?.find(s => s.global_id === unit.inactive_settlement);
          location = s ? s.name : `Settlement #${unit.inactive_settlement}`;
        } else if (hasFacility) {
          const f = facilities?.find(f => f.global_id === unit.inactive_facility);
          location = f ? `${f.facility_type} ${f.type_id}` : `Facility #${unit.inactive_facility}`;
        } else {
          location = "In Transit / Void";
        }

        return { ...unit, location, isError };
      })
      .filter(u => {
        return (
          u.unit_type.toLowerCase().includes(query) ||
          u.type_id.toString().includes(query) ||
          u.location.toLowerCase().includes(query)
        );
      });
  }, [units, settlements, facilities, searchQuery]);

  const handleMobilize = async (unit: Unit) => {
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('toggle_unit', {
        p_type_id: unit.type_id,
        p_unit_type: unit.unit_type,
        p_military_base_type_id: 0, 
        p_nation_id: unit.nation_id
      });

      if (rpcError) throw rpcError;
      if (refreshData) await refreshData();
    } catch (err: any) {
      setError(err.message || 'Mobilization failed');
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={s.container}>
      <style>{`
        .info-wrap { position: relative; cursor: help; display: flex; align-items: center; }
        .tooltip { 
          visibility: hidden; opacity: 0; position: absolute; 
          right: 30px; top: 50%; transform: translateY(-50%);
          width: 140px; background: #1e1e1e; border: 1px solid #444; 
          padding: 8px; border-radius: 4px; z-index: 100;
          transition: opacity 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.6);
        }
        .info-wrap:hover .tooltip { visibility: visible; opacity: 1; }
        .menu-btn:hover { background: #333 !important; color: #fff !important; }
        .menu-item:hover { background: #3d3d3d !important; color: #fff !important; }
        .search-input::placeholder { color: #555; }
      `}</style>
      
      <div style={s.header}>
        <div>
          <div style={s.title}>Dormant Units</div>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {loading ? 'Processing...' : `${filteredDormantUnits.length} Visible`}
          </div>
        </div>
        <input 
          type="text"
          placeholder="Search reserve..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={s.searchField}
        />
      </div>

      {error && <div style={s.globalError}>{error}</div>}

      <div style={s.tableWrap}>
        {filteredDormantUnits.length > 0 ? (
          <table style={s.table}>
            <thead>
              <tr>
                {['Unit', 'ID', 'Storage Location', 'Stats', 'Status', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDormantUnits.map((u) => {
                const stats = typeStatsMap[u.unit_type];
                return (
                  <tr key={u.global_id}>
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: TYPE_COLORS[u.unit_type] || '#bb86fc', opacity: 0.7 }}>
                        {u.unit_type}
                      </span>
                    </td>
                    <td style={s.td}><span style={{ color: '#666' }}>#{u.type_id}</span></td>
                    <td style={s.td}>
                      <span style={{ color: u.isError ? '#cf6679' : '#aaa', fontSize: '0.9rem' }}>
                        {u.location}
                      </span>
                    </td>
                    <td style={s.td}><InfoIcon stats={stats} /></td>
                    <td style={s.td}>
                      <div style={{ ...s.statusTag, borderColor: u.isError ? '#cf6679' : '#444' }}>
                        {u.isError ? 'CONFLICT' : 'STANDBY'}
                      </div>
                    </td>
                    <td style={s.td}>
                        <ActionMenu unit={u} onMobilize={() => handleMobilize(u)} loading={loading} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={s.empty}>No matching units in reserve.</div>
        )}
      </div>
    </section>
  );
}

const ActionMenu = ({ unit, onMobilize, loading }: { unit: Unit, onMobilize: () => void, loading: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        className="menu-btn"
        disabled={loading}
        onClick={() => setIsOpen(!isOpen)}
        style={s.actionBtn}
      >
        •••
      </button>

      {isOpen && (
        <div style={s.popover}>
          <div 
            className="menu-item" 
            style={{ ...s.menuItem, color: '#4caf50' }} 
            onClick={() => { onMobilize(); setIsOpen(false); }}
          >
            <span style={{ marginRight: '8px' }}>▲</span> Mobilize Unit
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon = ({ stats }: { stats?: UnitType }) => (
  <div className="info-wrap">
    <div className="tooltip">
      <div style={{ color: '#fff', borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '2px', fontWeight: 'bold' }}>Base Stats</div>
      {stats ? (
        <>
          <div style={s.statRow}><span>Dmg:</span> <b>{stats.damage}</b></div>
          <div style={s.statRow}><span>Atk:</span> <b>{stats.num_attacks}</b></div>
          <div style={s.statRow}><span>Rng:</span> <b>{stats.attack_range}</b></div>
          <div style={s.statRow}><span>Spd:</span> <b>{stats.speed}</b></div>
        </>
      ) : <div style={{ fontSize: '0.7rem', color: '#666' }}>No data</div>}
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', border: '1px solid #333', width: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' },
  searchField: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '180px' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' },
  globalError: { color: '#cf6679', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 'bold', padding: '5px', border: '1px solid #cf6679', borderRadius: '4px' },
  tableWrap: { overflow: 'visible' },
  table: { borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: { padding: '0.8rem 1rem', borderBottom: '1px solid #222', fontSize: '0.95rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', fontWeight: 600, fontSize: '0.85rem' },
  statusTag: { fontSize: '0.65rem', padding: '2px 6px', borderRadius: '3px', border: '1px solid #444', color: '#777', textTransform: 'uppercase' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', textAlign: 'center' },
  actionBtn: { background: '#1a1a1a', border: '1px solid #444', color: '#666', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' },
  popover: { position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '4px', zIndex: 110, width: '150px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' },
  menuItem: { padding: '10px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s', color: '#bbb' }
};