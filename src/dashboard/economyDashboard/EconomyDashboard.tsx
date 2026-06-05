import React from 'react';
import { SettlementsTable } from './SettlementsTable'; 
import { ShipmentsTable } from './ShipmentsTable';
import { FacilityTable } from './FacilityTable';
import '../../styles/economyStyles.css'; 
import { NationalResourceFlowTable } from './NationalResourceFlowTable';
import { useState } from 'react';
import StoreDashboard from '../storeDashboard/StoreDashboard';
import { WorkersTable } from './WorkerTable';
import { ShipmentsNew } from './ShipmentsNew';

const TAB_CONTAINER_STYLE: React.CSSProperties = { display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center', marginBottom: '5px'};
const TAB_STYLE: React.CSSProperties = { cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#ffffff', padding: '5px 10px' };
const ACTIVE_TAB_STYLE: React.CSSProperties = { ...TAB_STYLE, backgroundColor: '#333333', borderRadius: '10px' };

export default function EconomyDashboard() {
  const [activePanel, setActivePanel] = useState<string>('Facilities');

  return (
    <div className="dashboard-root" style={{ padding: '20px' }}>

      <NationalResourceFlowTable/>

      <div style={{width: '70%'}}> 
        <div style={TAB_CONTAINER_STYLE}>
            {['Facilities', 'Settlements', 'Shipments', 'Factories', 'Workers', 'Shipments New'].map(panel => (
              <div key={panel} onClick={() => setActivePanel(panel)} style={activePanel === panel ? ACTIVE_TAB_STYLE : TAB_STYLE}>
                {panel}
              </div>
            ))}
        </div>

        {activePanel === 'Facilities' && <FacilityTable />}
        {activePanel === 'Settlements' && <SettlementsTable />}
        {activePanel === 'Shipments' && <ShipmentsTable />}
        {activePanel === 'Factories' && <StoreDashboard />}
        {activePanel === 'Workers' && <WorkersTable />}
        {activePanel === 'Shipments New' && <ShipmentsNew />}
      </div>

    
    </div>
  );
}