import React, { useState, useEffect } from 'react';
import '../../App.css';
import { useGameData } from '../../GameContext';
import '../../styles/adminStyles.css';
import { nationColors } from '../../styleConstants';

export default function WorldDashboard() {
  const { gameState } = useGameData();
  const [timerString, setTimerString] = useState<string>('00:00');

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
    return <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>Loading game state...</div>;
  }

  const isQueuedToPause = gameState.is_active && gameState.queue_action === 'pause';
  const statusText = isQueuedToPause 
    ? "GAME WILL PAUSE AT THE END OF THIS INTERVAL" 
    : (gameState.is_active ? 'ACTIVE' : 'PAUSED');

  // Dynamic color calculations for inline styles
  const timerColor = timerString === '00:00' ? '#ff4d4d' : '#00ff66';
  const statusColor = isQueuedToPause ? '#ffcc00' : (gameState.is_active ? '#00ff66' : '#ff4d4d');

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '20px', minHeight: '95vh', boxSizing: 'border-box', backgroundColor: '#121212', color: '#fff' }}>
      <div style={{ width: '350px', height: '91vh' }}>
        <Leaderboard />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', height: '90vh' }}>
        
        {/* Large Timer Section */}
        <div style={{ backgroundColor: '#111', padding: '40px 20px', borderRadius: '8px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1.5 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: '#aaa', marginBottom: '10px' }}>TIME UNTIL NEXT INTERVAL</div>
          <div style={{ fontSize: '6rem', fontWeight: '900', fontFamily: 'monospace', color: timerColor, lineHeight: 1 }}>
            {timerString}
          </div>
        </div>

        {/* Stats Row Grid Container */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', flex: 1 }}>
          
          {/* Status Card */}
          <div style={{ backgroundColor: '#111', padding: '30px 20px', borderRadius: '8px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1.5px', color: '#aaa', marginBottom: '15px' }}>STATUS</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: statusColor, textAlign: 'center', padding: '0 10px' }}>
              {statusText}
            </span>
          </div>

          {/* Cycle Card */}
          <div style={{ backgroundColor: '#111', padding: '30px 20px', borderRadius: '8px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1.5px', color: '#aaa', marginBottom: '15px' }}>CURRENT CYCLE</span>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>{gameState.cycle}</span>
          </div>

          {/* Interval Card */}
          <div style={{ backgroundColor: '#111', padding: '30px 20px', borderRadius: '8px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1.5px', color: '#aaa', marginBottom: '15px' }}>INTERVAL</span>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>#{gameState.interval}</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const { nationScores, nation } = useGameData();
  const filtered = nationScores
    .sort((a, b) => b.total_points - a.total_points)
    .filter(n => n.isactive)

  return (
    <div className="admin-notification-container" style={{height: '90vh', backgroundColor: '#111'}}>
      <div className="admin-notification-header">
        <span className="admin-notification-title">Leaderboard</span>
        <div className="info-icon">
            ?
            <div className="tooltip" style={{left: '-20px'}}>
              The top nations across all planets in the game.
            </div>
        </div>
      </div>
      <div className="admin-notification-body">
        {filtered.length === 0 ? (
          <div className="admin-notification-empty">No scores found</div>
        ) : (
          filtered.map((n, index) => (
            <div key={n.id} style={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center', borderColor: n.id == nation?.id && 'green' || '', backgroundColor: n.id == nation?.id && 'darkgreen' || ''}} className="admin-notification-item">
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <span style={{width: '15px', textAlign: 'center', fontWeight: 'bold', backgroundColor: (index + 1) == 1 ? 'darkgoldenrod' : (index + 1) == 2 ? 'silver' : (index + 1) == 3 ? 'brown' : 'darkslategray', borderRadius: '20px', padding: '5px'}}>{index + 1}</span>
                <span style={{color: nationColors[n.id], fontWeight: 'bold', fontStyle: 'italic'}}>Nation {n.id} {(n.id == nation?.id) && '(You)'}</span>
              </div>
              <span style={{fontWeight: 'bold'}}> {n.total_points} Points</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}