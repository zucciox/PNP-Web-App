import React from 'react';
import '../../App.css';
import { useGameData } from '../../GameContext';
import { FactoryStore } from './Store';
import { ActiveOrders } from './ActiveOrders';

// Updated container to handle the sidebar layout
const DASHBOARD_CONTAINER: React.CSSProperties = { 
  display: 'flex',
  flexDirection: 'row', // Align side-by-side
  gap: '20px',      
  width: '100%',
  padding: '20px',
  boxSizing: 'border-box',
  alignItems: 'flex-start',
};

// Wrapper for the Store to make it take up more space
const STORE_SECTION: React.CSSProperties = {
  flex: 3, // Takes up 3 parts of the available space
  minWidth: '600px', // Prevents it from getting too squashed
};

// Wrapper for the Orders Sidebar
const SIDEBAR_SECTION: React.CSSProperties = {
  flex: 1, // Takes up 1 part of the available space
  minWidth: '300px',
  position: 'sticky', // Optional: keeps orders visible while scrolling store
  top: '20px',
};

export default function StoreDashboard() {
  const { } = useGameData();

  return (
    <div className="container" style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <main style={DASHBOARD_CONTAINER}>
        <div style={STORE_SECTION}>
          <FactoryStore />
        </div>
        
        <aside style={SIDEBAR_SECTION}>
          <ActiveOrders/>
        </aside>
      </main>
    </div>
  );
}