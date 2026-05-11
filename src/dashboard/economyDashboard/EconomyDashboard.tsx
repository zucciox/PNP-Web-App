import React from 'react';
import { NationalEconomyHeader } from './NationalEconomyHeader';
import { ProductionSummaryTable } from './ProductionSummaryTable'; 
import { SettlementsTable } from './SettlementsTable'; 
import { OperatingCostsTable } from './OperatingCostsTable';
import { ShipmentsTable } from './ShipmentsTable';
import { ManagementActions } from './ManagementActions';
import { FacilityTable } from './FacilityTable';
import { WorkersTable } from './WorkerTable';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

export default function EconomyDashboard() {
  const { facilities, settlements, units, shipments } = useGameData();

  return (
    <div className="dashboard-root" style={{ padding: '20px' }}>
      {/* NEW FULL-WIDTH ROW */}
      <NationalEconomyHeader />

      <hr style={{ borderColor: '#333', margin: '40px 0' }} />

      {/* DISPLACED COMPONENTS (Unorganized Bottom Section) */}
      <div className="displaced-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ flex: '1 1 45%' }}>
          <SettlementsTable />
        </div>
        
        <div style={{ flex: '1 1 45%' }}>
          {shipments && <ShipmentsTable />}
        </div>

        <div style={{ flex: '1 1 45%' }}>
          <OperatingCostsTable />
        </div>

        <div style={{ flex: '1 1 45%' }}>
          <ManagementActions />
        </div>

        <div style={{ width: '100%' }}>
          <FacilityTable />
        </div>

        <div style={{ width: '100%' }}>
          <WorkersTable />
        </div>
      </div>
    </div>
  );
}