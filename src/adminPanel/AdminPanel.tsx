import React, { useState } from 'react';
import { GameProvider, useGameData } from '../GameContext';
import { supabase } from '../supabaseClient';

const ADMIN_PANEL_STYLE: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  padding: '15px 20px',
  borderBottom: '2px solid #333',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  fontFamily: 'sans-serif',
  flexWrap: 'wrap'
};

const ADMIN_LABEL_STYLE: React.CSSProperties = {
  color: '#ff4d4d',
  fontWeight: 'bold',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  borderRight: '1px solid #444',
  paddingRight: '15px'
};

const ADMIN_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: '#333',
  color: 'white',
  border: '1px solid #444',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  transition: 'all 0.2s'
};

const ERROR_STYLE: React.CSSProperties = {
  color: '#ff4d4d',
  fontSize: '12px',
  marginLeft: '10px'
};

function AdminPanel() {
  const { gameState } = useGameData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePause = () => {
    // Implement pause logic here or via another RPC
    console.log("Pause interval triggered");
  };

  const handleAdvance = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calling the Postgres function via Supabase RPC
      const { error: rpcError } = await supabase.rpc('interval_update');

      if (rpcError) {
        throw new Error(rpcError.message);
      }
      
      console.log("Interval advanced successfully");
    } catch (err: any) {
      console.error("RPC Error:", err);
      setError(err.message || "Failed to advance interval");
    } finally {
      setLoading(false);
    }
  };

  if (!gameState) return null;

  return (
    <div style={ADMIN_PANEL_STYLE}>
      <div style={ADMIN_LABEL_STYLE}>Admin Controls</div>
      
      <button 
        style={{
          ...ADMIN_BUTTON_STYLE,
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }} 
        onClick={handlePause}
        disabled={loading}
      >
        Pause Interval  
      </button>

      <button 
        style={{
          ...ADMIN_BUTTON_STYLE,
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer'
        }} 
        onClick={handleAdvance}
        disabled={loading}
        onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#444')}
        onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#333')}
      >
        {loading ? 'Processing...' : 'Advance Interval'}
      </button>

      {error && <div style={ERROR_STYLE}>⚠️ {error}</div>}

      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
        Current Game State: <strong>{gameState.is_paused ? 'Paused' : 'Active'}</strong>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AdminPanel />
    </GameProvider>
  );
}