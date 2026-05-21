import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GameProvider, useGameData } from '../GameContext';
import EconomyDashboard from './economyDashboard/EconomyDashboard';
import MilitaryDashboard from './militaryDashboard/MilitaryDashboard';
import StoreDashboard from './storeDashboard/StoreDashboard';
import WorldDashboard from './worldDashboard/WorldDashboard';
import CombatAlert from './CombatAlert'; 

// Changed: Added curly braces for the named export import
import { NotificationWindow } from './NotificationWindow'; 


const LOADING_STYLE: React.CSSProperties = { textAlign: 'center', fontFamily: 'sans-serif', marginTop: '1rem', color: 'white' };
const BANNER_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', backgroundColor: '#1a1a1a', padding: '10px 20px', color: 'white', fontFamily: 'sans-serif' };
const COUNTDOWN_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: 'auto' };
const NATION_CARD_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: '20px' };
const TAB_CONTAINER_STYLE: React.CSSProperties = { display: 'flex', gap: '30px', alignItems: 'center', marginRight: '40px', marginTop: '5px' };
const TAB_STYLE: React.CSSProperties = { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#ffffff', padding: '5px 10px' };
const ACTIVE_TAB_STYLE: React.CSSProperties = { ...TAB_STYLE, backgroundColor: '#333333' };
const DASHBOARD_CONTAINER: React.CSSProperties = { width: '100%', padding: '0px', boxSizing: 'border-box' };
const ADMIN_BTN_STYLE: React.CSSProperties = { backgroundColor: '#d97706', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' };
const SELECT_STYLE: React.CSSProperties = { backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', padding: '2px 5px', fontSize: '14px', marginLeft: '10px' };

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<string>('Economy');
  const { loading, nationId, gameState, notifications, profile } = useGameData(); 
  const [timerString, setTimerString] = useState<string>('00:00');
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'Admin';
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  const unreadCount = notifications.filter(n => {
    if (n.is_resolved) return false;
    const isForMyNation = n.receiving_nation === nationId;
    const isAdminNotif = isAdmin && n.is_admin === true;
    return isForMyNation || isAdminNotif;
  }).length;

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

  const handleNationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNation = e.target.value;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ nation_id: newNation }).eq('id', user.id);
    window.location.reload();
  };

  if (loading) return <div style={LOADING_STYLE}><h1>Loading Game Data...</h1></div>;

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white', position: 'relative' }}>
      <CombatAlert />

      <nav style={BANNER_STYLE}>
        <div style={NATION_CARD_STYLE}>
          <span>Nation: {nationId}</span>
          {isAdmin && (
            <select value={nationId || ''} onChange={handleNationChange} style={SELECT_STYLE}>
              {alphabet.map(letter => (
                <option key={letter} value={letter}>{letter}</option>
              ))}
            </select>
          )}
        </div>
        
        <div style={COUNTDOWN_STYLE}>
          <span style={{ color: '#888', fontSize: '12px', marginRight: '8px' }}>NEXT INTERVAL:</span>
          <span style={{ color: timerString === '00:00' ? '#ff4d4d' : '#00ff88' }}>{timerString}</span>
        </div>

        <div style={TAB_CONTAINER_STYLE}>
          {['World', 'Economy', 'Military', 'Store'].map(tab => (
            <div key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? ACTIVE_TAB_STYLE : TAB_STYLE}>
              {tab}
            </div>
          ))}

          {/* Notification Trigger */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', fontSize: '20px', marginLeft: '10px' }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-10px', backgroundColor: '#ff4d4d',
                color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          {isAdmin && <button onClick={() => navigate('/admin')} style={ADMIN_BTN_STYLE}>ADMIN VIEW</button>}
        </div>
      </nav>

      {showNotifications && (
        <NotificationWindow onClose={() => setShowNotifications(false)} />
      )}

      <main style={DASHBOARD_CONTAINER}>
        {activeTab === 'Economy' && <EconomyDashboard />}
        {activeTab === 'Military' && <MilitaryDashboard />}
        {activeTab === 'Store' && <StoreDashboard />}
        {activeTab === 'World' && <WorldDashboard />}
      </main>
    </div>
  );
}

export default function Dashboard() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    };
    checkUser();
  }, []);

  if (!authChecked) return <div style={LOADING_STYLE}><h1>Verifying Identity...</h1></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <GameProvider>
      <DashboardContent />
    </GameProvider>
  );
}