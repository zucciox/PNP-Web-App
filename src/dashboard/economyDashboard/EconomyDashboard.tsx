import React, { useState, useEffect } from 'react';
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
  flexWrap: 'wrap', // Allows columns to stack on smaller screens
  gap: '20px',      // More reasonable gap
  justifyContent: 'center', 
  alignItems: 'flex-start',
  width: '100%',
  padding: '20px',
  boxSizing: 'border-box'
};

const COLUMN_STYLE: React.CSSProperties = {
  flex: '1 1 300px', // Grow and shrink, but base size is 300px
  maxWidth: '500px', // Prevents tables from becoming comically wide on ultrawide monitors
  minWidth: '300px'
};

function App() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<resourceStockpileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFacilitySummary, setShowFacilitySummary] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [unitsRes, facilitiesRes, resourcesRes] = await Promise.all([
          supabase.from('Units').select('*'),
          supabase.from('Facilities').select('*'),
          supabase.from('Resource Stockpiles').select('*'),
        ]);

        if (unitsRes.error) throw unitsRes.error;
        if (facilitiesRes.error) throw facilitiesRes.error;
        if (resourcesRes.error) throw resourcesRes.error;

        setUnits(unitsRes.data || []);
        setFacilities(facilitiesRes.data || []);
        setResources(resourcesRes.data || []);
      } catch (error) {
        console.error('Critical Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading Economic Data...</div>;
  }

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Economy Dashboard</h1>
      </header>
      
      <main style={DASHBOARD_CONTAINER}>
        <section style={COLUMN_STYLE}>
          <ResourceStockpileTable resourceStockpileData={resources} />
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

export default App;