import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Added for routing
import { supabase } from '../../supabaseClient';
import { UnitTable } from '../militaryDashboard/UnitTable'; 
import { FacilityTable } from './FacilityTable'; 
import { FacilitySummaryTable } from './FacilitySummaryTable'; 
import { ResourceStockpileTable } from './ResourceStockpileTable'; 
import { Unit, Facility, resourceStockpileData } from '../../types'; 
import '../../App.css';


// Optimized Styling
const DASHBOARD_CONTAINER: React.CSSProperties = { 
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '10px',      
  justifyContent: 'center', 
  alignItems: 'flex-start',
  width: '100%',
  padding: '20px',
  boxSizing: 'border-box'
};

const COLUMN_STYLE: React.CSSProperties = {
  flex: '1 1 300px', // Grow and shrink, but base size is 300px
  maxWidth: '500px', // Prevents tables from becoming comically wide on ultrawide monitors
  minWidth: '100px'
};

const RESOURCETOTALS_STYLE: React.CSSProperties = {
  flex: '1 1 300px', // Grow and shrink, but base size is 300px
  maxWidth: '300px', // Prevents tables from becoming comically wide on ultrawide monitors
  minWidth: '200px'
};

interface EconomyDashboardProps {
    facilities: Facility[];
    units: Unit[];
    resources: resourceStockpileData | null;
}

export default function EconomyDashboard({ facilities, units, resources }: EconomyDashboardProps) {

  const [showFacilitySummary, setShowFacilitySummary] = useState<boolean>(false);
  return (
    <div className="container" style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      
      
      <main style={DASHBOARD_CONTAINER}>
        {/* Note: In a full routing setup, you would likely move these 
            sections into their own Page components and use <Routes> here */}
        <section style={RESOURCETOTALS_STYLE}>
          <h2>Resource Production</h2>
          {resources ? (
            <ResourceStockpileTable resourceStockpileData={resources} />
          ) : (
            <p>No stockpile data found.</p>
          )}
        </section>

        <section style={COLUMN_STYLE}>
          <UnitTable units={units} />
        </section>

        <section style={COLUMN_STYLE}>
          <div className="table-header-actions" style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-toggle"
              onClick={() => setShowFacilitySummary(prev => !prev)}
            >
              {showFacilitySummary ? "View Detailed List" : "View Summary Totals"}
            </button>
          </div>

          {showFacilitySummary ? (
            <FacilitySummaryTable facilities={facilities} />
          ) : (
            <FacilityTable facilities={facilities} />
          )}
        </section>
      </main>
    </div>
  );
}