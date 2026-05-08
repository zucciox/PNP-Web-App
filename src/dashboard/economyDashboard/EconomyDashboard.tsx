import React from 'react';
import { ProductionSummaryTable } from './ProductionSummaryTable'; 
import { ConsumptionRatesTable } from './ConsumptionRatesTable'; 
import { ResourceStockpileTable } from './ResourceStockpileTable'; 
import { OperatingCostsTable } from './OperatingCostsTable';
import { ShipmentsTable } from './ShipmentsTable';
import { ManagementActions } from './ManagementActions';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 
import { FacilityTable } from './FacilityTable';
import { WorkersTable } from './WorkerTable';

export default function EconomyDashboard() {
  const { facilities, settlements, units, shipments } = useGameData();

  return (
    <div className="dashboard-root">
      <main className="dashboard-grid">
        
        {/* Resource Consumption Column */}
        <section className="dashboard-column">
          <h2 className="economy-column-header">Resource Consumption</h2>
          {settlements ? <ConsumptionRatesTable /> : <p>No consumption data found.</p>}
          <div className="spacer-v" />
          {units && facilities ? <OperatingCostsTable /> : <p>Loading unit and facility data...</p>}
        </section>

        {/* Resource Production Column */}
        <section className="dashboard-column">
          <h2 className="economy-column-header">Resource Production</h2>
          <ResourceStockpileTable />
          <div className="spacer-v" />
          <ProductionSummaryTable />
        </section>

        {/* Resource Management Column */}
        <section className="dashboard-column">
          <h2 className="economy-column-header">Resource Management</h2>
          {shipments ? <ShipmentsTable /> : <p>No shipment data found.</p>}
          <div className="spacer-v" />
          <ManagementActions />
        </section>

      </main>
      <FacilityTable/>
      <WorkersTable/>
    </div>
  );
}