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
    <div> 
      <div style={{display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center'}}>
        <h3>Operating Costs</h3> 
        <div className="info-icon">
                ?
                <div className="tooltip" style={{right: '30px'}}>
                  <p>
                    You pay Operating Costs from your Treasury <span style={{color: 'AccentColor'}}>each interval. </span>
                     Facilities and Units make up your total Operating Costs.
                  </p>
                  <p>
                    If you don't have enough in your Treasury, your nation will go into debt!
                  </p>
                </div>
          </div>
      </div>

      <div className="settlement-card costs-summary-card"> 
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}> 
          <span>Units:</span> 
          <span style={{color: '#ff5252'}}>${formatCurrency(unitsTotal)}</span> 
          <div className="divider-v"></div> 
          <span>Facilities:</span> 
          <span style={{color: '#ff5252'}}>${formatCurrency(facilitiesTotal)}</span> 
          <div className="divider-v"></div> 
          <span>Total:</span> 
          <span style={{fontWeight: 'bold', color: '#ff5252', fontSize: '1rem'}}>${formatCurrency(facilitiesTotal+unitsTotal)}</span> 
        </div> 
      </div> 
    </div> 
  ); 
}