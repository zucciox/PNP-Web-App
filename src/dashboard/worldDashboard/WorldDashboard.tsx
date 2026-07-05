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
    return <div>Loading game state...</div>;
  }

  // Determine status display logic
  const isQueuedToPause = gameState.is_active && gameState.queue_action === 'pause';
  const statusText = isQueuedToPause 
    ? "GAME WILL PAUSE AT THE END OF THIS INTERVAL" 
    : (gameState.is_active ? 'ACTIVE' : 'PAUSED');

  return (
    <div style={{display: 'flex', gap: '20px', padding: '10px', textAlign: 'center'}}>
      <Leaderboard/>
      <div className="admin-status-grid-container">
        <div className="admin-timer-section">
          <div className="admin-timer-label">TIME UNTIL NEXT INTERVAL</div>
          <div className={`admin-timer-value ${timerString === '00:00' ? 'timer-zero' : 'timer-running'}`}>
            {timerString}
          </div>
        </div>

        <div className="admin-big-card">
          <span className="admin-card-label">STATUS</span>
          <span className={`admin-card-value status-text ${
            isQueuedToPause ? 'status-gold-warning' : (gameState.is_active ? 'status-green-active' : 'status-red-paused')
          }`}>
            {statusText}
          </span>
        </div>

        <div className="admin-big-card">
          <span className="admin-card-label">CURRENT CYCLE</span>
          <span className="admin-card-value standard-value">{gameState.cycle}</span>
        </div>

        <div className="admin-big-card">
          <span className="admin-card-label">INTERVAL</span>
          <span className="admin-card-value standard-value">#{gameState.interval}</span>
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const { nationScores, nation } = useGameData();
  const filtered = nationScores
    .sort((a, b) => b.total_points - a.total_points)
    .filter(n => (n.total_points != 0))

  return (
    <div className="admin-notification-container" style={{minHeight: '90vh', backgroundColor: '#111'}}>
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
            <div key={n.nation} style={{display: 'flex', flexDirection: 'row', gap: '5px', alignItems: 'center', borderColor: n.nation == nation?.id && 'green' || '', backgroundColor: n.nation == nation?.id && 'darkgreen' || ''}} className="admin-notification-item">
              <span style={{width: '15px', textAlign: 'center', fontWeight: 'bold', border: '1px solid', backgroundColor: (index + 1) == 1 ? 'darkgoldenrod' : (index + 1) == 2 ? 'silver' : (index + 1) == 3 ? 'brown' : 'darkslategray', borderRadius: '20px', padding: '5px'}}>{index + 1}</span>
              <span style={{color: nationColors[n.nation], fontWeight: 'bold'}}>Nation {n.nation}</span>
              <span> {n.total_points} Points</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
