import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { UnitTable } from '../militaryDashboard/UnitTable'; 
import { FacilityTable } from './FacilityTable'; 
import { FacilitySummaryTable } from './FacilitySummaryTable'; // New Import
import { ResourceStockpileTable } from './ResourceStockpileTable'; 
import '../../App.css';

import { Unit, Facility, resourceStockpileData } from '../../types'; 

function App() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resourceStockpileData, setResources] = useState<resourceStockpileData[]>([]);
  
  // 1. Add state to toggle between Facility views
  const [showFacilitySummary, setshowFacilitySummary] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Units
      const { data: unitsData, error: unitsError } = await supabase
        .from('Units')
        .select('*');
      if (unitsError) console.error('Error fetching units:', unitsError);
      else if (unitsData) setUnits(unitsData as Unit[]);

      // Fetch Facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from('Facilities')
        .select('*');
      if (facilitiesError) console.error('Error fetching facilities:', facilitiesError);
      else if (facilitiesData) setFacilities(facilitiesData as Facility[]);

      // Fetch Resource Data 
      const { data: resourceStockpileData, error: resourceStockpileDataError } = await supabase
        .from('Resource Stockpiles')
        .select('*');
      if (resourceStockpileDataError) console.error('Error fetching resources:', resourceStockpileDataError);
      else if (resourceStockpileData) setResources(resourceStockpileData as resourceStockpileData[]);
    };

    fetchData();
  }, []);

  return (
    <div className="container">
      <h1>Economy</h1>
      
      <ResourceStockpileTable resourceStockpileData={resourceStockpileData} />

      <br />

      <UnitTable units={units} />

      <br />

      {/* 2. Add the Toggle Button */}
      <div className="table-header-actions">
        <button onClick={() => setshowFacilitySummary(!showFacilitySummary)}>
          Switch to {showFacilitySummary ? "All Facilities" : "Facility Totals"}
        </button>
      </div>

      {/* 3. Conditional Rendering Logic */}
      {showFacilitySummary ? (
        <FacilitySummaryTable facilities={facilities} />
      ) : (
        <FacilityTable facilities={facilities} />
      )}

    </div>
  );
}

export default App;