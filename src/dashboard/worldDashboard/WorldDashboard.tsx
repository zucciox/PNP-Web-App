import React, { useState, useEffect } from 'react';
import '../../App.css';
import { useGameData } from '../../GameContext';

export default function WorldDashboard() {
  const { gameState } = useGameData();
  const [timerString, setTimerString] = useState<string>('00:00');

  // Interval Logic moved here for high-visibility display
  useEffect(() => {
    if (!gameState?.next_interval_time) return;
    
    const calculateTime = () => {
      const target = new Date(gameState.next_interval_time).getTime();
      const now = Date.now();
      const diff = target - now;
      
      if (isNaN(target) || diff <= 0) {
        setTimerString('00:00');
        return;
      }
      
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimerString(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [gameState?.next_interval_time]);

  if (!gameState) {
    return <div style={fullPageCenter}>Loading game state...</div>;
  }

  return (
    <div style={containerStyle}>
      <div style={contentWrapper}>
        
        {/* BIG INTERVAL TIMER */}
        <div style={timerSectionStyle}>
          <div style={timerLabelStyle}>TIME UNTIL NEXT INTERVAL</div>
          <div style={{ 
            ...timerValueStyle, 
            color: timerString === '00:00' ? '#ff4d4d' : '#00ff88' 
          }}>
            {timerString}
          </div>
        </div>

        {/* LARGE DATA GRID */}
        <div style={gridStyle}>
          <div style={bigCardStyle}>
            <span style={labelStyle}>STATUS</span>
            <span style={{ 
              ...valueStyle, 
              color: gameState.is_active ? '#4dff88' : '#ff4d4d'  
            }}>
              {gameState.is_active ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>

          <div style={bigCardStyle}>
            <span style={labelStyle}>CURRENT CYCLE</span>
            <span style={valueStyle}>{gameState.cycle}</span>
          </div>

          <div style={bigCardStyle}>
            <span style={labelStyle}>INTERVAL</span>
            <span style={valueStyle}>#{gameState.interval}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- BIG SCREEN STYLES ---

const containerStyle: React.CSSProperties = {
  backgroundColor: '#121212',
  minHeight: '90vh', // Accounts for the top nav
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
  textAlign: 'center',
  padding: '40px'
};

const contentWrapper: React.CSSProperties = {
  maxWidth: '1200px',
  width: '100%'
};

const titleStyle: React.CSSProperties = {
  fontSize: '3rem',
  letterSpacing: '0.5rem',
  color: '#555',
  marginBottom: '40px',
  fontWeight: 900
};

const timerSectionStyle: React.CSSProperties = {
  marginBottom: '60px',
  padding: '40px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '20px',
  border: '1px solid #333'
};

const timerLabelStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  letterSpacing: '0.2rem',
  color: '#888',
  marginBottom: '10px'
};

const timerValueStyle: React.CSSProperties = {
  fontSize: '12rem', // Massive display for big screens
  fontWeight: 800,
  fontFamily: 'monospace',
  lineHeight: '1'
};

const gridStyle: React.CSSProperties = {
  display: 'grid', 
  gridTemplateColumns: 'repeat(3, 1fr)', 
  gap: '30px',
  marginTop: '20px' 
};

const bigCardStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  padding: '30px',
  borderRadius: '12px',
  border: '1px solid #444',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const labelStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  color: '#aaa',
  fontWeight: 600
};

const valueStyle: React.CSSProperties = {
  fontSize: '3.5rem',
  fontWeight: 700
};

const fullPageCenter: React.CSSProperties = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '2rem'
};