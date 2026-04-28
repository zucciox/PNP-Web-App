import React, { useState } from 'react';
import { GameProvider, useGameData } from '../GameContext';
import EconomyDashboard from './economyDashboard/EconomyDashboard';
import MilitaryDashboard from './militaryDashboard/MilitaryDashboard';

// --- STYLES ---
const LOADING_STYLE: React.CSSProperties = { textAlign: 'center', fontFamily: 'sans-serif', marginTop: '1rem' };
const BANNER_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '10px 20px', color: 'white', fontFamily: 'sans-serif', borderBottom: '1px solid #333' };
const NATION_CARD_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: 'auto' };
const TAB_CONTAINER_STYLE: React.CSSProperties = { display: 'flex', gap: '30px', alignItems: 'center', marginRight: '40px' };
const TAB_STYLE: React.CSSProperties = { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#ffffff', padding: '5px 10px' };
const ACTIVE_TAB_STYLE: React.CSSProperties = { ...TAB_STYLE, backgroundColor: '#333333' };
const DASHBOARD_CONTAINER: React.CSSProperties = { width: '100%', padding: '0px', boxSizing: 'border-box' };

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>('Economy');
  const { loading, nationId } = useGameData();

  if (loading) return <div style={LOADING_STYLE}><h1>Loading...</h1></div>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <nav style={BANNER_STYLE}>
        <div style={NATION_CARD_STYLE}><span>Nation: {nationId}</span></div>
        <div style={TAB_CONTAINER_STYLE}>
          {['World', 'Economy', 'Military', 'Store'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? ACTIVE_TAB_STYLE : TAB_STYLE}>
              {tab}
            </div>
          ))}
        </div>
      </nav>
      
      <main style={DASHBOARD_CONTAINER}>
        {activeTab === 'Economy' && <EconomyDashboard />}
        {activeTab === 'Military' && <MilitaryDashboard />}
        {/* Other dashboards no longer need props passed! */}
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