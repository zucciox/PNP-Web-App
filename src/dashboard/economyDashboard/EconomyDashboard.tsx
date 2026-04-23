import React, { useState, useEffect } from 'react';
import { FacilityTable } from './FacilityTable'; 
import { FacilitySummaryTable } from './FacilitySummaryTable'; 
import { ConsumptionRatesTable } from './ConsumptionRatesTable'; 
import { ResourceStockpileTable } from './ResourceStockpileTable'; 
import { Unit, Facility, resourceStockpileData, Settlement } from '../../types'; 
import '../../App.css';
import { OperatingCostsTable } from './OperatingCostsTable';


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

const COLUMN_STYLE: React.CSSProperties = {
  flex: '1 1 500px', // Grow and shrink, but base size is 300px
  maxWidth: '500px', // Prevents tables from becoming comically wide on ultrawide monitors
  minWidth: '100px',
};

const RESOURCE_CONSUMPTION_STYLE: React.CSSProperties = {
    flex: '1 1 400px', // Grow and shrink, but base size is 300px
    maxWidth: '400px', // Prevents tables from becoming comically wide on ultrawide monitors
    minWidth: '100px'
  };


interface EconomyDashboardProps {
    facilities: Facility[];
    units: Unit[];
    resources: resourceStockpileData | null;
    settlements: Settlement[];
}

export default function EconomyDashboard({ facilities, units, resources, settlements }: EconomyDashboardProps) {

  const [showFacilitySummary, setShowFacilitySummary] = useState<boolean>(false);
  return (
    <div className="container" style={{ backgroundColor: '#121212', minHeight: '100vh', color: 'white' }}>
      <main style={DASHBOARD_CONTAINER}>

        <section style={RESOURCE_CONSUMPTION_STYLE}>
            <h2>Resource Consumption</h2>
            {settlements ? (
                <ConsumptionRatesTable settlements={settlements} />
                ) : (
                <p>No consumption data found.</p>
            )}

            <br/>

            {units && facilities ? (
            <OperatingCostsTable 
                units={units} 
                facilities={facilities} 
            />
            ) : (
            <p>Loading unit and facility data...</p>
            )}
        </section>

        <section style={COLUMN_STYLE}>
            <h2>Resource Production</h2>
            
            {resources ? (
                <ResourceStockpileTable resourceStockpileData={resources} />
                ) : (
                <p>No stockpile data found.</p>
            )}

            <br/>

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

        <section style={COLUMN_STYLE}>
            <h2>Resource Management</h2>
        </section>
      </main>
    </div>
  );
}