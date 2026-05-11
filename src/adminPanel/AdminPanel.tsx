import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameProvider, useGameData } from '../GameContext';
import { supabase } from '../supabaseClient';
import WorldDashboard from '../dashboard/worldDashboard/WorldDashboard';

const LOADING_STYLE: React.CSSProperties = { textAlign: 'center', fontFamily: 'sans-serif', marginTop: '1rem', color: 'white' };

function AdminPanelContent() {
  const { gameState } = useGameData(); // Assuming gameState contains 'id' and 'is_active'
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [detectedRole, setDetectedRole] = useState<string>('Unknown');

  const [showAddModal, setShowAddModal] = useState(false);
  const [pieceType, setPieceType] = useState('');
  const [nationId, setNationId] = useState('');

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('Profiles')
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

  // --- NEW TOGGLE PAUSE LOGIC ---
  const handleTogglePause = async () => {
    if (!gameState) return;
    
    setLoading(true);
    setError(null);

    try {
      // Toggle the current state
      const nextState = !gameState.is_active;

      const { error: updateError } = await supabase
        .from('GameState') // Ensure this matches your actual table name
        .update({ is_active: nextState })
        .eq('id', gameState.id); // Or your specific row identifier

      if (updateError) throw updateError;
    } catch (err: any) {
      setError(err.message || "Failed to update pause state");
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
      if (data && data !== 'Success') {
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
      display: 'flex', alignItems: 'center', gap: '20px', fontFamily: 'sans-serif', flexWrap: 'wrap'
    }}>
      <div style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', borderRight: '1px solid #444', paddingRight: '15px' }}>
        Admin Controls
      </div>
      
      <button 
        style={{ backgroundColor: '#2b3a4f', color: 'white', border: '1px solid #3d5069', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }} 
        onClick={() => navigate('/dashboard')}
      >
        Switch to Nation View
      </button>

      {/* --- UPDATED PAUSE BUTTON --- */}
      <button 
        style={{
          backgroundColor: gameState.is_active ? '#4a3728' : '#2e4d2e', 
          color: 'white', 
          border: '1px solid #444', 
          padding: '8px 16px',
          cursor: loading ? 'not-allowed' : 'pointer', 
          fontSize: '13px', 
          fontWeight: 'bold',
          textTransform: 'uppercase', 
          opacity: loading ? 0.5 : 1
        }} 
        onClick={handleTogglePause}
        disabled={loading}
      >
        {loading ? 'Updating...' : gameState.is_active ? 'Pause Game' : 'Unpause Game'}
      </button>

      <button 
        style={{ backgroundColor: '#333', color: 'white', border: '1px solid #444', padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', opacity: loading ? 0.5 : 1 }} 
        onClick={handleAdvance}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Advance Interval'}
      </button>

      <button 
        style={{ backgroundColor: '#2e4d2e', color: 'white', border: '1px solid #3e633e', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }} 
        onClick={() => { setError(null); setShowAddModal(true); }}
      >
        + Add Piece
      </button>

      {!showAddModal && error && (
        <div style={{ color: '#ff4d4d', fontSize: '12px', marginLeft: '10px' }}>{error}</div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <form onSubmit={handleAddPiece} style={{ backgroundColor: '#222', padding: '30px', border: '1px solid #444', borderRadius: '8px', width: '350px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'white', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Add Piece to Map</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Piece Type</label>
              <input style={{ backgroundColor: '#111', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '4px' }} value={pieceType} onChange={(e) => setPieceType(e.target.value)} placeholder="e.g. Tank, Factory..." required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Nation ID</label>
              <input style={{ backgroundColor: '#111', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '4px' }} value={nationId} onChange={(e) => setNationId(e.target.value)} placeholder="e.g. A, B..." required />
            </div>
            {error && <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '10px', fontSize: '12px', borderRadius: '4px', lineHeight: '1.4' }}><strong>RPC Error:</strong><br/>{error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '12px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Adding...' : 'Confirm'}</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, backgroundColor: '#444', color: 'white', border: 'none', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
        Current Status: <strong style={{ color: gameState.is_active ? '#4caf50' : '#ff4d4d' }}>{gameState.is_active ? 'ACTIVE' : 'PAUSED'}</strong>
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