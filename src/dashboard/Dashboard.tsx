import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Unit, Facility, resourceStockpileData } from '../types'; 

// New Dashboard Imports
//import WorldDashboard from './worldDashboard/WorldDashboard';
import EconomyDashboard from './economyDashboard/EconomyDashboard';
//import MilitaryDashboard from './militaryDashboard/MilitaryDashboard';
//import StoreDashboard from './storeDashboard/StoreDashboard';

import '../App.css';

// --- STYLES ---
const LOADING_STYLE: React.CSSProperties = { textAlign: 'center', fontFamily: 'sans-serif', marginTop: '1rem' };
const BANNER_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '10px 20px', color: 'white', fontFamily: 'sans-serif', borderBottom: '1px solid #333' };
const NATION_CARD_STYLE: React.CSSProperties = { backgroundColor: '#262626', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 'bold', marginRight: 'auto' };
const TAB_CONTAINER_STYLE: React.CSSProperties = { display: 'flex', gap: '30px', alignItems: 'center', marginRight: '40px' };
const TAB_STYLE: React.CSSProperties = { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#ffffff', padding: '5px 10px' };
const ACTIVE_TAB_STYLE: React.CSSProperties = { ...TAB_STYLE, backgroundColor: '#333333' };
const DASHBOARD_CONTAINER: React.CSSProperties = { width: '100%', padding: '20px', boxSizing: 'border-box' };

function App() {
  // State Switcher (replaces routing)
  const [activeTab, setActiveTab] = useState<string>('Economy');
  
  // Data State
  const [units, setUnits] = useState<Unit[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<resourceStockpileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [nationName, setNationName] = useState<string>("A");
  const [nationId, setNationId] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;
    let mounted = true;
  
    const initializeDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
  
      const { data: profile } = await supabase
        .from('Profiles')
        .select('nation_id')
        .eq('id', user.id)
        .single();
  
      if (!profile || !mounted) return;
  
      const nationId = profile.nation_id;
  
      setNationId(nationId);
  
      await fetchData(nationId);
  
      channel = supabase
      .channel(`nation-updates-${nationId}`)

      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Units',
        filter: `nation_id=eq.${nationId}`
      }, () => fetchData(nationId))

      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'Facilities',
        filter: `owner_nation=eq.${nationId}`
      }, () => fetchData(nationId))

      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ResourceStockpiles',
        filter: `nation_id=eq.${nationId}`
      }, () => fetchData(nationId))

      .subscribe();
  
      setLoading(false);
    };
  
    initializeDashboard();
  
    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchData = async (id: string) => {
    const [unitsRes, facilitiesRes, resourcesRes] = await Promise.all([
      supabase.from('Units').select('*').eq('nation_id', id),
      supabase.from('Facilities').select('*').eq('owner_nation', id),
      supabase.from('ResourceStockpiles').select('*').eq('nation_id', id).single(),
    ]);

    setUnits(unitsRes.data || []);
    setFacilities(facilitiesRes.data || []);
    setResources(resourcesRes.data as resourceStockpileData);
  };

  // Switcher Logic for rendering the correct dashboard component
  const renderActiveDashboard = () => {
    const props = { facilities, units, resources };
    
    switch (activeTab) {
      //case 'World': return <WorldDashboard {...props} />;
      case 'Economy': return <EconomyDashboard {...props} />;
      //case 'Military': return <MilitaryDashboard {...props} />;
      //case 'Store': return <StoreDashboard {...props} />;
      //default: return <EconomyDashboard {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={LOADING_STYLE}>
        <h1>Loading Command Center...</h1>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      
      {/* Navigation Banner */}
      <nav style={BANNER_STYLE}>
        <div style={NATION_CARD_STYLE}>
          <span style={{ color: '#ccc' }}>Nation:</span>
          <span style={{ color: '#d9534f' }}>{nationName}</span>
        </div>

        <div style={TAB_CONTAINER_STYLE}>
          {['World', 'Economy', 'Military', 'Store'].map((tab) => (
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
      
      {/* Main Viewport */}
      <main style={DASHBOARD_CONTAINER}>
        {renderActiveDashboard()}
      </main>
    </div>
  );
}

export default App;