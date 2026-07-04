import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameProvider, useGameData } from '../GameContext';
import { supabase } from '../supabaseClient';
import WorldDashboard from '../dashboard/worldDashboard/WorldDashboard';
import '../styles/adminStyles.css';

function AdminNotificationView() {
  const { notifications } = useGameData();
  const filtered = notifications
    .filter(n => !n.is_resolved && n.is_admin === true)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleResolve = async (id: number) => {
    try {
      const { error } = await supabase.from('Notifications').update({ is_resolved: true }).eq('id', id);
      if (error) throw error;
    } catch (err) { console.error(err); }
  };

  return (
    <div className="admin-notification-container">
      <div className="admin-notification-header">
        <span className="admin-notification-title">Admin Alerts ({filtered.length})</span>
      </div>
      <div className="admin-notification-body">
        {filtered.length === 0 ? (
          <div className="admin-notification-empty">No pending admin alerts</div>
        ) : (
          filtered.map(n => (
            <div key={n.id} className="admin-notification-item">
              <div className="admin-notification-item-header">{n.header}</div>
              <div className="admin-notification-item-body">{n.body}</div>
              <div className="admin-notification-actions">
                <button className="admin-notification-dismiss" onClick={() => handleResolve(n.id)}>Dismiss</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GameFeedView() {
  const { gameFeed } = useGameData();
  const filtered = gameFeed
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="admin-notification-container">
      <div className="admin-notification-header">
        <span className="admin-notification-title">Game Feed ({filtered.length})</span>
      </div>
      <div className="admin-notification-body">
        {filtered.length === 0 ? (
          <div className="admin-notification-empty">No game events</div>
        ) : (
          filtered.map(n => (
            <div key={n.id} style={{display: 'block'}} className="admin-notification-item">
              <div className="admin-notification-item-body">{n.body}</div>
              <div>Interval: {n.interval} | Cycle: {n.cycle}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AdminPanelContent() {
  const { gameState, notifications } = useGameData(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [detectedRole, setDetectedRole] = useState<string>('Unknown');
  
  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTreasuryModal, setShowTreasuryModal] = useState(false);
  
  // Shared Form Parameters
  const [pieceType, setPieceType] = useState('');
  const [nationId, setNationId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [treasuryAmount, setTreasuryAmount] = useState('');

  const adminNotifCount = notifications.filter(n => !n.is_resolved && n.is_admin === true).length;

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsAdmin(false); return; }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role || 'No Role Found';
        setDetectedRole(role);
        setIsAdmin(role.toLowerCase() === 'admin');
      } catch { setIsAdmin(false); }
    };
    checkAdminRole();
  }, []);

  const handleQueueAction = async (action: 'pause' | 'resume' | 'restart') => {
    if (!gameState) return;
    if (action === 'restart' && !window.confirm("Are you sure?")) return;
    setLoading(true);
    try {
      await supabase.from('game_state').update({ queue_action: action }).eq('id', gameState.id);
      await handleAdvance();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('interval_update');
      if (rpcError) throw new Error(rpcError.message);
      if (data && data !== 'SUCCESS') setError(data);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('add_piece', { p_piece_type: pieceType, p_nation_id: nationId });
      if (rpcError) throw new Error(rpcError.message);
      setShowAddModal(false);
      setPieceType('');
      setNationId('');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleDeletePiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to permanently delete this ${pieceType}?`)) return;
    setLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc('delete_piece', { 
        p_type: pieceType, 
        p_type_id: parseInt(typeId, 10), 
        p_nation_id: nationId 
      });
      if (rpcError) throw new Error(rpcError.message);
      setShowDeleteModal(false);
      setPieceType('');
      setTypeId('');
      setNationId('');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleAdjustTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc('adjust_treasury', {
        p_nation_id: nationId,
        p_amount: parseInt(treasuryAmount, 10)
      });
      if (rpcError) throw new Error(rpcError.message);
      setShowTreasuryModal(false);
      setNationId('');
      setTreasuryAmount('');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (isAdmin === null) return <div className="admin-loading">Verifying Admin Credentials...</div>; 

  if (isAdmin === false) {
    return (
      <div className="admin-access-denied">
        <div>⚠️ ACCESS DENIED</div>
        <div>Authorized Role Required: <strong>Admin</strong></div>
        <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="admin-container">

      {error && (
        <div className="admin-error-banner" style={{ backgroundColor: '#b30000', color: '#fff', padding: '10px', margin: '10px 0', borderRadius: '4px', textAlign: 'center' }}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '15px', background: 'transparent', border: '1px solid #fff', color: '#fff', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <div className="admin-panel-bar">
        <div className="admin-controls-title">Admin Controls</div>
        <button className="admin-btn" style={{ background: '#2836d4' }} onClick={() => navigate('/dashboard')}>Nation View</button>
        <button className="admin-btn" style={{ background: gameState.is_active ? '#4a3728' : '#2e4d2e' }} onClick={() => handleQueueAction(gameState.is_active ? 'pause' : 'resume')}>
          {loading ? '...' : gameState.is_active ? 'Pause' : 'Resume'}
        </button>
        <button className="admin-btn" style={{ background: '#b30000' }} onClick={() => handleQueueAction('restart')}>Restart</button>
        <button className="admin-btn" style={{ background: '#333' }} onClick={handleAdvance}>Advance Interval</button>
        <button className="admin-btn" style={{ background: '#2e4d2e' }} onClick={() => setShowAddModal(true)}>+ Add Piece</button>
        <button className="admin-btn" style={{ background: '#b30000' }} onClick={() => setShowDeleteModal(true)}>- Delete Piece</button>
        <button className="admin-btn" style={{ background: '#bda118', color: '#000', fontWeight: 'bold' }} onClick={() => setShowTreasuryModal(true)}>Adjust Treasury</button>

        {showAddModal && (
          <div className="admin-modal-overlay">
            <form onSubmit={handleAddPiece} className="admin-modal-form">
              <h3>Add Piece</h3>
              <span>Piece Type</span>
              <input value={pieceType} onChange={(e) => setPieceType(e.target.value)} required />
              <span>Nation ID</span>
              <input value={nationId} onChange={(e) => setNationId(e.target.value)} required />
              <button type="submit" className="admin-btn-modal" disabled={loading}>Confirm</button>
              <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
            </form>
          </div>
        )}

        {showDeleteModal && (
          <div className="admin-modal-overlay">
            <form onSubmit={handleDeletePiece} className="admin-modal-form">
              <h3>Delete Piece</h3>
              <span>Piece Type (e.g. Worker, Factory)</span>
              <input value={pieceType} onChange={(e) => setPieceType(e.target.value)} required />
              <span>Type ID (Integer)</span>
              <input type="number" value={typeId} onChange={(e) => setTypeId(e.target.value)} required />
              <span>Nation ID / Owner Nation</span>
              <input value={nationId} onChange={(e) => setNationId(e.target.value)} required />
              <button type="submit" className="admin-btn-modal" style={{ background: '#b30000' }} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Piece'}
              </button>
              <button type="button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </form>
          </div>
        )}

        {showTreasuryModal && (
          <div className="admin-modal-overlay">
            <form onSubmit={handleAdjustTreasury} className="admin-modal-form">
              <h3>Adjust Nation Treasury</h3>
              <span>Nation ID</span>
              <input value={nationId} onChange={(e) => setNationId(e.target.value)} required />
              <span>Adjustment Amount (Accepts negative values to deduct)</span>
              <input type="number" value={treasuryAmount} onChange={(e) => setTreasuryAmount(e.target.value)} placeholder="e.g. 5000 or -2500" required />
              <button type="submit" className="admin-btn-modal" style={{ background: '#bda118', color: '#000' }} disabled={loading}>
                {loading ? 'Processing...' : 'Apply Adjustment'}
              </button>
              <button type="button" onClick={() => setShowTreasuryModal(false)}>Cancel</button>
            </form>
          </div>
        )}
      </div>
      <AdminNotificationView/>
      <GameFeedView/>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <GameProvider>
      <AdminPanelContent />
    </GameProvider>
  );
}