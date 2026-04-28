import React from 'react';
import { GameProvider, useGameData } from '../GameContext';

// --- ADDITIONAL STYLES ---
const ADMIN_PANEL_STYLE: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  padding: '15px 20px',
  borderBottom: '2px solid #333',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  fontFamily: 'sans-serif'
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
  transition: 'background-color 0.2s'
};

const BUTTON_HOVER_STYLE: React.CSSProperties = {
  backgroundColor: '#444'
};

function AdminPanel() {
  const { gameState } = useGameData();

  // Functionality left blank as requested
  const handlePause = () => {
    console.log("Pause interval triggered");
  };

  const handleAdvance = () => {
    console.log("Advance interval triggered");
  };

  if (!gameState) return null;

  return (
    <div style={ADMIN_PANEL_STYLE}>
      <div style={ADMIN_LABEL_STYLE}>Admin Controls</div>
      
      <button 
        style={ADMIN_BUTTON_STYLE} 
        onClick={handlePause}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#444')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#333')}
      >
        Pause Interval
      </button>

      <button 
        style={ADMIN_BUTTON_STYLE} 
        onClick={handleAdvance}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#444')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#333')}
      >
        Advance Interval
      </button>

      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
        Current Game State: {gameState.is_paused || 'Active'}
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