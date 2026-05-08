import React from 'react'; 
import { useGameData } from '../../GameContext'; 
import '../../styles/economyStyles.css'; 

export function OperatingCostsTable() { 
  const { facilities, units, facilityTypes, unitTypes } = useGameData(); 

  const getOperatingCost = (item: any): number => { 
    if ('unit_type' in item) { 
      const typeDef = unitTypes.find((t: any) => t.unit_type === item.unit_type); 
      return Number(typeDef?.oc_interval ?? 0); 
    } else { 
      const typeDef = facilityTypes.find((t: any) => t.facility_type === item.facility_type); 
      return Number(typeDef?.oc_interval ?? 0); 
    } 
  }; 

  // Combined total only for active items
  const totalInterval = [...units, ...facilities]
    .filter(item => item.is_active)
    .reduce((acc, item) => acc + getOperatingCost(item), 0); 

  const totalCycle = totalInterval * 10; 

  const formatCurrency = (value: number | undefined | null) => { 
    return (value ?? 0).toLocaleString(undefined); 
  }; 

  // Calculating sub-totals for active items
  const activeUnits = units.filter(u => u.is_active);
  const activeFacilities = facilities.filter(f => f.is_active);

  const unitsTotal = activeUnits.reduce((acc, u) => acc + getOperatingCost(u), 0);
  const facilitiesTotal = activeFacilities.reduce((acc, f) => acc + getOperatingCost(f), 0);

  return ( 
    <section className="summary-container"> 
      <h3>Operating Costs</h3> 

      <div className="settlement-card costs-summary-card"> 
        <div> 
          <span className="cost-label">Total Per Interval</span> 
          <span className="cost-value-large">${formatCurrency(totalInterval)}</span> 
        </div> 
        <div className="divider-v"></div> 
        <div> 
          <span className="cost-label">Total Per Cycle</span> 
          <span className="cost-value-large">${formatCurrency(totalCycle)}</span> 
        </div> 
      </div> 

      <div className="settlement-card" style={{ marginTop: '12px', padding: '16px' }}>
        <div className="resource-item">
          <span>Active Units ({activeUnits.length}/{units.length})</span>
          <span className="resource-value">${formatCurrency(unitsTotal)}</span>
        </div>
        <div className="resource-item" style={{ marginTop: '8px' }}>
          <span>Active Facilities ({activeFacilities.length}/{facilities.length})</span>
          <span className="resource-value">${formatCurrency(facilitiesTotal)}</span>
        </div>
      </div>
    </section> 
  ); 
}