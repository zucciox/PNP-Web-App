import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Unit, UnitType } from '../../types'; 
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';

interface GameDataContext {
  units: Unit[];
  unitTypes: UnitType[];
  refreshData?: () => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  Troops: '#4caf50', 
  Tank: '#e53935'
};

// Helper to check for "High Stakes" units
const isStrategicUnit = (type: string) => 
  ['Cruise Missile', 'ICBM', 'Nuclear Warhead'].includes(type);

const getHealthColor = (pct: number): string => 
  pct >= 70 ? '#03da3c' : pct >= 35 ? '#ffb300' : '#cf6679';

export function ActiveUnitsTable() {
  const { units, unitTypes, refreshData } = useGameData() as GameDataContext;
  
  const [modalUnit, setModalUnit] = useState<Unit | null>(null);
  const [baseTypeId, setBaseTypeId] = useState<string>('');

  const [attackModalUnit, setAttackModalUnit] = useState<Unit | null>(null);
  const [victimData, setVictimData] = useState({ nation: '', typeId: '', unitType: '' });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const filteredUnits = useMemo(() => {
    return (units || [])
      .filter(u => u.is_active && u.unit_type !== 'Worker')
      .filter(u => {
        const query = searchQuery.toLowerCase();
        return (
          u.unit_type.toLowerCase().includes(query) || 
          u.type_id.toString().includes(query)
        );
      });
  }, [units, searchQuery]);

  const typeStatsMap = useMemo(() => {
    const map: Record<string, UnitType> = {};
    (unitTypes || []).forEach(t => { map[t.unit_type] = t; });
    return map;
  }, [unitTypes]);

  const toggleSelection = (globalId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(globalId)) next.delete(globalId);
      else next.add(globalId);
      return next;
    });
  };

  const handleDemobilize = async (): Promise<void> => {
    const unitsToProcess = isBulkMode 
        ? (units || []).filter(u => selectedIds.has(u.global_id))
        : modalUnit ? [modalUnit] : [];

    if (unitsToProcess.length === 0 || !baseTypeId) return;
    
    setLoading(true);
    setError(null);

    try {
      await Promise.all(unitsToProcess.map(unit => 
        supabase.rpc('toggle_unit', {
          p_type_id: unit.type_id,
          p_unit_type: unit.unit_type,
          p_military_base_type_id: parseInt(baseTypeId, 10),
          p_nation_id: unit.nation_id
        })
      ));

      setModalUnit(null);
      setBaseTypeId('');
      setSelectedIds(new Set());
      setIsBulkMode(false);
      
      if (refreshData) await refreshData(); 
    } catch (err: any) {
      setError(err.message || 'Check Base ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttack = async (): Promise<void> => {
    if (!attackModalUnit || !victimData.nation || !victimData.typeId || !victimData.unitType) return;
    if ((attackModalUnit.attacks_remaining ?? 0) <= 0) {
        setError("Unit has no attacks remaining.");
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('attack_piece', {
        p_aggressor_nation: attackModalUnit.nation_id,
        p_victim_nation: victimData.nation,
        p_aggressor_type_id: attackModalUnit.type_id,
        p_aggressor_piece_type: attackModalUnit.unit_type, 
        p_victim_type_id: parseInt(victimData.typeId, 10),
        p_victim_piece_type: victimData.unitType         
      });

      if (rpcError) throw rpcError;
      setAttackModalUnit(null);
      setVictimData({ nation: '', typeId: '', unitType: '' });
      if (refreshData) await refreshData(); 
    } catch (err: any) {
      setError(err.message || 'Attack failed.');
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
        .menu-btn:hover { background: #333 !important; }
        .menu-item:hover:not(.disabled) { background: #3d3d3d !important; color: #fff !important; }
        .menu-item.disabled { cursor: not-allowed; opacity: 0.5; }
        .search-input::placeholder { color: #555; }
        .unit-row { cursor: pointer; transition: background 0.2s; }
        .unit-row:hover { background: #1a1a1a; }
        .unit-row.selected { background: #1a237e !important; }
      `}</style>
      
      <div style={s.header}>
        <div>
          <div style={s.title}>Active Combat Units</div>
          <div style={{ fontSize: '0.85rem', color: '#666', display: 'flex', gap: '10px' }}>
            <span>{filteredUnits.length} Visible</span>
            {selectedIds.size > 0 && (
                <span style={{ color: '#bb86fc', fontWeight: 'bold' }}>
                    {selectedIds.size} Selected
                </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <button 
                onClick={() => { setIsBulkMode(true); setBaseTypeId(''); setError(null); }}
                style={{ ...s.confirmBtn, background: '#cf6679', padding: '6px 12px', fontSize: '0.75rem' }}
            >
                Demobilize Selected
            </button>
          )}
          <input 
            type="text"
            placeholder="Search type or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={s.searchField}
          />
        </div>
      </div>

      <div style={s.tableWrap}>
        {filteredUnits.length > 0 ? (
          <table style={s.table}>
            <thead>
              <tr>
                {['Unit', 'Type ID', 'Health', 'Status', 'Stats', 'Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => {
                const isSelected = selectedIds.has(u.global_id);
                const stats = typeStatsMap[u.unit_type];
                const maxHealth = stats?.max_health || u.max_health || 100;
                const pct = Math.max(0, Math.min(100, (u.health / maxHealth) * 100));
                const hColor = getHealthColor(pct);
                const isStrategic = isStrategicUnit(u.unit_type);

                return (
                  <tr 
                    key={u.global_id} 
                    className={`unit-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(u.global_id)}
                  >
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: TYPE_COLORS[u.unit_type] || '#bb86fc' }}>
                        {u.unit_type}
                      </span>
                    </td>
                    <td style={s.td}><span style={{ color: '#aaa' }}>#{u.type_id}</span></td>
                    <td style={s.td}>
                      {isStrategic ? (
                        <span style={{ color: '#03da3c', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>Intact</span>
                      ) : (
                        <div style={{ width: '130px' }}>
                          <div style={s.hpLabel}>
                            <span>{u.health} / {maxHealth}</span>
                            <span style={{ color: hColor, fontWeight: 'bold' }}>{pct.toFixed(0)}%</span>
                          </div>
                          <div style={s.barBg}>
                            <div style={{ ...s.barFill, width: `${pct}%`, background: hColor }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={s.td}>
                      {isStrategic ? (
                        <span style={{ color: '#03da3c', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase' }}>Ready</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {[...Array(stats?.num_attacks || 1)].map((_, idx) => (
                            <span key={idx} style={{ color: idx < (u.attacks_remaining ?? 0) ? '#e53935' : '#333', marginRight: '2px' }}>⚔</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={s.td}><InfoIcon stats={stats} /></td>
                    <td style={s.td} onClick={(e) => e.stopPropagation()}>
                        <ActionMenu 
                            unit={u} 
                            onDemobilize={() => { setModalUnit(u); setIsBulkMode(false); }} 
                            onAttack={() => setAttackModalUnit(u)}
                        />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div style={s.empty}>No matching units found.</div>}
      </div>

      {/* Demobilize Modal */}
      {(modalUnit || isBulkMode) && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>
                {isBulkMode ? `Demobilize ${selectedIds.size} Units` : `Demobilize ${modalUnit?.unit_type}`}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#bbb', lineHeight: '1.4' }}>
              Assigning {isBulkMode ? 'selected units' : `Unit #${modalUnit?.type_id}`} to reserve. 
            </p>
            <input 
              type="number" 
              placeholder="Target Base ID"
              value={baseTypeId}
              onChange={(e) => setBaseTypeId(e.target.value)}
              style={s.input}
              autoFocus
            />
            {error && <div style={s.error}>{error}</div>}
            <div style={s.modalActions}>
              <button onClick={() => { setModalUnit(null); setIsBulkMode(false); setError(null); setBaseTypeId(''); }} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleDemobilize} disabled={loading || !baseTypeId} style={s.confirmBtn}>
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attack Modal */}
      {attackModalUnit && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#e53935' }}>
              {isStrategicUnit(attackModalUnit.unit_type) ? 'Initialize Launch' : 'Command Attack'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#bbb' }}>
              Aggressor: {attackModalUnit.unit_type} #{attackModalUnit.type_id}
            </p>
            <input placeholder="Victim Nation ID" value={victimData.nation} onChange={(e) => setVictimData({...victimData, nation: e.target.value})} style={s.input} />
            <input placeholder="Victim Piece Type" value={victimData.unitType} onChange={(e) => setVictimData({...victimData, unitType: e.target.value})} style={s.input} />
            <input type="number" placeholder="Victim Type ID" value={victimData.typeId} onChange={(e) => setVictimData({...victimData, typeId: e.target.value})} style={s.input} />
            {error && <div style={s.error}>{error}</div>}
            <div style={s.modalActions}>
              <button onClick={() => { setAttackModalUnit(null); setError(null); }} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleAttack} disabled={loading || !victimData.nation || !victimData.typeId} style={{ ...s.confirmBtn, background: '#e53935' }}>
                {loading ? 'Processing...' : (isStrategicUnit(attackModalUnit.unit_type) ? 'Confirm Launch' : 'Execute Attack')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const ActionMenu = ({ unit, onDemobilize, onAttack }: { unit: Unit, onDemobilize: () => void, onAttack: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canAttack = (unit.attacks_remaining ?? 0) > 0;
  const isStrategic = isStrategicUnit(unit.unit_type);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button className="menu-btn" onClick={() => setIsOpen(!isOpen)} style={s.actionBtn}>•••</button>
      {isOpen && (
        <div style={s.popover}>
          <div className={`menu-item ${!canAttack ? 'disabled' : ''}`} style={s.menuItem} onClick={() => { if (canAttack) { onAttack(); setIsOpen(false); } }}>
            <span style={{ color: !canAttack ? '#444' : '#e53935', marginRight: '8px' }}>
              {isStrategic ? '🚀' : '⚔'}
            </span> 
            {canAttack ? (isStrategic ? 'Launch' : 'Attack Target') : 'All attacks used'}
          </div>
          <div className="menu-item" style={s.menuItem} onClick={() => { onDemobilize(); setIsOpen(false); }}>
            <span style={{ color: '#aaa', marginRight: '8px' }}>⚑</span> Demobilize
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon = ({ stats }: { stats?: UnitType }) => (
  <div className="info-wrap">
    <div className="tooltip">
      {stats ? (
        <>
          <div style={s.statRow}><span>Dmg:</span> <b>{stats.damage}</b></div>
          <div style={s.statRow}><span>Rng:</span> <b>{stats.attack_range}</b></div>
          <div style={s.statRow}><span>Spd:</span> <b>{stats.speed}</b></div>
        </>
      ) : <div style={{ fontSize: '0.7rem' }}>No data</div>}
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  </div>
);

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', border: '1px solid #333', width: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' },
  searchField: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '180px' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableWrap: { overflow: 'visible' },
  table: { borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: { padding: '0.8rem 1rem', borderBottom: '1px solid #222', fontSize: '0.9rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 8px', fontWeight: 600, fontSize: '0.8rem' },
  hpLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.7rem', color: '#999' },
  barBg: { height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width .3s' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', textAlign: 'center' },
  actionBtn: { background: '#222', border: '1px solid #444', color: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' },
  popover: { position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '4px', zIndex: 110, width: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  menuItem: { padding: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#bbb' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { background: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #444', width: '320px' },
  input: { width: '100%', padding: '12px', marginTop: '12px', background: '#121212', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#ff5252', fontSize: '0.75rem', marginTop: '12px', background: 'rgba(255,82,82,0.1)', padding: '8px', borderRadius: '4px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { background: 'transparent', border: 'none', color: '#777', cursor: 'pointer' },
  confirmBtn: { background: '#4caf50', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};