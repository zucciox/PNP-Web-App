import React, { useState, useEffect } from 'react';
import { Unit, Facility, resourceStockpileData, Settlement, Shipment } from '../../types'; 
import '../../App.css';
import { useGameData } from '../../GameContext';
import { ActiveUnitsTable } from './ActiveUnitTable';
import { DormantUnitsTable } from './DormantUnitTable';


// Optimized Styling
const DASHBOARD_CONTAINER: React.CSSProperties = { 
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '10px',      
  justifyContent: 'left', 
  alignItems: 'flex-start',
  width: '100%',
  padding: '10px',
  boxSizing: 'border-box',
};




export default function MilitaryDashboard() {

  const { resources, facilities, settlements, units, shipments } = useGameData();

  return (
    <div className="container" style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <main style={DASHBOARD_CONTAINER}>

        {units ? ( <ActiveUnitsTable />  ) : (
            <p>No units data found.</p>
        )}

        {units ? ( <DormantUnitsTable />  ) : (
            <p>No dormant unit data found.</p>
        )}
        
      </main>
    </div>
  );
}