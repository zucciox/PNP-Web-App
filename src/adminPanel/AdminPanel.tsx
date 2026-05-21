import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameProvider, useGameData } from '../GameContext';
import { supabase } from '../supabaseClient';
import WorldDashboard from '../dashboard/worldDashboard/WorldDashboard';

const LOADING_STYLE: React.CSSProperties = { 
  textAlign: 'center', 
  fontFamily: 'sans-serif', 
  marginTop: '1rem', 
  color: 'white' 
};

/**
 * Specialized Notification Window for Admins
 * Filters strictly for is_admin -> true
 */
function AdminNotificationView({ onClose }: { onClose: () => void }) {
  const { notifications } = useGameData();

  const filtered = notifications
    .filter(n => !n.is_resolved && n.is_admin === true)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleResolve = async (id: number) => {
    try {
      const { error } = await supabase
        .from('Notifications')
        .update({ is_resolved: true })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Error resolving notification:", err);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: '55px', right: '20px', width: '350px', maxHeight: '500px',
      backgroundColor: '#262626', border: '1px solid #d97706', borderRadius: '8px',
      boxShadow: '0px 10px 30px rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', flexDirection: 'column',
      color: 'white', textAlign: 'left'
    }}>
      <div style={{ 
        padding: '12px', borderBottom: '1px solid #444', fontWeight: 'bold', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#332b1a', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'
      }}>
        <span style={{ color: '#d97706', fontSize: '12px', textTransform: 'uppercase' }}>Admin Logs ({filtered.length})</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px', fontSize: '13px' }}>No pending admin alerts</div>
        ) : (
          filtered.map(n => (
            <div key={n.id} style={{ 
              backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '4px', 
              marginBottom: '8px', borderLeft: '4px solid #d97706' 
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{n.header}</div>
              <div style={{ color: '#bbb', fontSize: '12px', margin: '4px 0' }}>{n.body}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
                <button 
                  onClick={() => handleResolve(n.id)}
                  style={{ background: '#333', border: '1px solid #444', color: '#ccc', fontSize: '10px', cursor: 'pointer', padding: '2px 8px' }}
                >
                  Dismiss
                </button>
              </div>
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pieceType, setPieceType] = useState('');
  const [nationId, setNationId] = useState('');

  // Admin Notification Badge Count
  const adminNotifCount = notifications.filter(n => !n.is_resolved && n.is_admin === true).length;

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setDetectedRole(`Error: ${profileError.message}`);
          setIsAdmin(false);
          return;
        }

        const role = profile?.role || 'No Role Found';
        setDetectedRole(role);
        setIsAdmin(role.toLowerCase() === 'admin');
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, []);

  const handleQueueAction = async (action: 'pause' | 'resume' | 'restart') => {
    if (!gameState) return;
    if (action === 'restart' && !window.confirm("Are you sure? This resets cycle and interval to 0.")) return;

    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('game_state')
        .update({ queue_action: action })
        .eq('id', gameState.id);
      if (updateError) throw updateError;
      await handleAdvance();
    } catch (err: any) {
      setError(err.message || `Failed to queue ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('interval_update');
      if (rpcError) throw new Error(rpcError.message);
      if (data && data !== 'SUCCESS' && !data.startsWith('SUCCESS:')) {
        setError(data);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Failed to advance interval");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('add_piece', {
        p_piece_type: pieceType,
        p_nation_id: nationId
      });
      if (rpcError) throw new Error(rpcError.message);
      if (data && (data.includes('CRITICAL ERROR') || data.includes('Invalid'))) {
        setError(data);
        return;
      }
      setShowAddModal(false);
      setPieceType('');
      setNationId('');
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin === null) return <div style={LOADING_STYLE}>Verifying Admin Credentials...</div>; 

  if (isAdmin === false) {
    return (
      <div style={{ 
        backgroundColor: '#1a1a1a', padding: '20px', color: '#ff4d4d', 
        textAlign: 'center', fontSize: '13px', borderBottom: '2px solid #b30000' 
      }}>
        <div style={{ fontWeight: 'bold' }}>⚠️ ACCESS DENIED</div>
        <div>Authorized Role Required: <strong>Admin</strong></div>
        <div style={{ color: '#888', fontSize: '11px' }}>Your Role: "{detectedRole}"</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '10px', backgroundColor: '#333', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div style={{
      backgroundColor: '#1a1a1a', padding: '15px 20px', borderBottom: '2px solid #333',
      display: 'flex', alignItems: 'center', gap: '15px', fontFamily: 'sans-serif', flexWrap: 'wrap',
      position: 'relative'
    }}>
      <div style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid #444', paddingRight: '15px' }}>
        Admin Controls
      </div>
      
      <button 
        style={{ backgroundColor: '#2b3a4f', color: 'white', border: '1px solid #3d5069', padding: '8px 16px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} 
        onClick={() => navigate('/dashboard')}
      >
        Nation View
      </button>

      <button 
        style={{
          backgroundColor: gameState.is_active ? '#4a3728' : '#2e4d2e', 
          color: 'white', border: '1px solid #444', padding: '8px 16px',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold',
          textTransform: 'uppercase', opacity: loading ? 0.5 : 1
        }} 
        onClick={() => handleQueueAction(gameState.is_active ? 'pause' : 'resume')}
        disabled={loading}
      >
        {loading ? '...' : gameState.is_active ? 'Pause Game' : 'Resume Game'}
      </button>

      <button 
        style={{
          backgroundColor: '#b30000', color: 'white', border: '1px solid #444', padding: '8px 16px',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold',
          textTransform: 'uppercase', opacity: loading ? 0.5 : 1
        }} 
        onClick={() => handleQueueAction('restart')}
        disabled={loading}
      >
        Restart Clock
      </button>

      <button 
        style={{ backgroundColor: '#333', color: 'white', border: '1px solid #444', padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: loading ? 0.5 : 1 }} 
        onClick={handleAdvance}
        disabled={loading || !gameState.is_active}
      >
        {loading ? 'Processing...' : 'Tick Interval'}
      </button>

      <button 
        style={{ backgroundColor: '#2e4d2e', color: 'white', border: '1px solid #3e633e', padding: '8px 16px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }} 
        onClick={() => { setError(null); setShowAddModal(true); }}
      >
        + Add Piece
      </button>

      {/* ADMIN NOTIFICATION BUTTON */}
      <button 
        style={{ 
          backgroundColor: showNotifications ? '#d97706' : '#333', 
          color: 'white', border: '1px solid #444', padding: '8px 16px', 
          cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', 
          textTransform: 'uppercase', position: 'relative'
        }} 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        Logs
        {adminNotifCount > 0 && (
          <span style={{
            position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ff4d4d',
            color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px',
            border: '2px solid #1a1a1a'
          }}>
            {adminNotifCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <AdminNotificationView onClose={() => setShowNotifications(false)} />
      )}

      {!showAddModal && error && (
        <div style={{ color: '#ff4d4d', fontSize: '11px', marginLeft: '10px', maxWidth: '200px' }}>{error}</div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <form onSubmit={handleAddPiece} style={{ backgroundColor: '#222', padding: '30px', border: '1px solid #444', borderRadius: '8px', width: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'white', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Add Piece to Map</h3>
            <input style={{ backgroundColor: '#111', border: '1px solid #444', color: 'white', padding: '10px' }} value={pieceType} onChange={(e) => setPieceType(e.target.value)} placeholder="Piece Type (e.g. Tank)" required />
            <input style={{ backgroundColor: '#111', border: '1px solid #444', color: 'white', padding: '10px' }} value={nationId} onChange={(e) => setNationId(e.target.value)} placeholder="Nation ID" required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '10px', fontWeight: 'bold' }}>Confirm</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, backgroundColor: '#444', color: 'white', border: 'none', padding: '10px' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#666', textAlign: 'right' }}>
        <div>Interval: <strong>{gameState.interval}</strong></div>
        Status: <strong style={{ color: gameState.is_active ? '#4caf50' : '#ff4d4d' }}>{gameState.is_active ? 'ACTIVE' : 'PAUSED'}</strong>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <GameProvider>
      <AdminPanelContent />
      <WorldDashboard/>
    </GameProvider>
  );
}