import React, { useState, useEffect } from 'react';
import { GameProvider, useGameData } from '../GameContext';
import EconomyDashboard from './economyDashboard/EconomyDashboard';
import MilitaryDashboard from './militaryDashboard/MilitaryDashboard';

const LOADING_STYLE: React.CSSProperties = { textAlign: 'center', fontFamily: 'sans-serif', marginTop: '1rem' };
const BANNER_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', backgroundColor: '#1a1a1a', padding: '10px 20px', color: 'white', fontFamily: 'sans-serif', borderBottom: '1px solid #333' };
const COUNTDOWN_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: 'auto' };
const NATION_CARD_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: '20px' };
const TAB_CONTAINER_STYLE: React.CSSProperties = { display: 'flex', gap: '30px', alignItems: 'center', marginRight: '40px', marginTop: '5px' };
const TAB_STYLE: React.CSSProperties = { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#ffffff', padding: '5px 10px' };
const ACTIVE_TAB_STYLE: React.CSSProperties = { ...TAB_STYLE, backgroundColor: '#333333' };
const DASHBOARD_CONTAINER: React.CSSProperties = { width: '100%', padding: '0px', boxSizing: 'border-box' };

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>('Economy');
  const { loading, nationId, gameState } = useGameData();
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
      
      setTimerString(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
  
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
  
    return () => clearInterval(interval);
  }, [gameState?.next_interval_time]);

  if (loading) return <div style={LOADING_STYLE}><h1>Loading...</h1></div>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <nav style={BANNER_STYLE}>

        <div style={NATION_CARD_STYLE}>
          <span>Nation: {nationId}</span>
        </div>

        <div style={COUNTDOWN_STYLE}>
          <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>NEXT INTERVAL:</span>
          <span style={{ color: timerString === '00:00' ? '#ff4d4d' : '#00ff88' }}>
            {timerString}
          </span>
        </div>

        <div style={TAB_CONTAINER_STYLE}>
          {['World', 'Economy', 'Military', 'Store'].map(tab => (
            <div 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              style={activeTab === tab ? ACTIVE_TAB_STYLE : TAB_STYLE}
            >
              {tab}
            </div>
          ))}
        </div>
      </nav>
      
      <main style={DASHBOARD_CONTAINER}>
        {activeTab === 'Economy' && <EconomyDashboard />}
        {activeTab === 'Military' && <MilitaryDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <DashboardContent />
    </GameProvider>
  );
}