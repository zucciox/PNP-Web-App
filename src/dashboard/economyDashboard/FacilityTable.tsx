import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { Facility } from '../../types'; 
import '../../styles/economyStyles.css';
import { supabase } from '../../supabaseClient';

const STORAGE_RESOURCES = [
  'Energy', 'Gas', 'Coal', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 
  'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 
  'Uranium', 'Oil', 'Methane', 'NaturalGas', 'CopperOre', 'GoldOre', 
  'IronOre', 'AluminumOre', 'TitaniumOre', 'PlatinumOre', 'UraniumOre'
];

const extendedColors: Record<string, string> = {
  Energy: '#ffea00', Gas: '#000000', Coal: '#444444', Fuel: '#e3242b',
  Water: '#3d5a99', Food: '#a0522d', Oxygen: '#4a7c36', Steel: '#7a5a30',
  Aluminum: '#7b409e', Copper: '#8b4513', Platinum: '#2d74b3', Titanium: '#58b7e6',
  Gold: '#daa520', Diamond: '#74a1d3', Uranium: '#76a34d', Oil: '#1a1a1a',
  Methane: '#ff5722', NaturalGas: '#4db6ac', CopperOre: '#cd7f32', GoldOre: '#ffd700',
  IronOre: '#8b0000', AluminumOre: '#c0c0c0', TitaniumOre: '#4682b4', PlatinumOre: '#e5e4e2',
  UraniumOre: '#32cd32'
};

export function FacilityTable() {
  const { facilities, facilityTypes } = useGameData();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getOperatingCost = (facility: Facility): number => {
    const typeDef = facilityTypes.find((t: any) => t.facility_type === facility.facility_type);
    return Number(typeDef?.oc_interval ?? 0);
  };

  const handleToggle = async (globalId: number) => {
    setErrorMsg(null);
    const { error } = await supabase.rpc('toggle_facility', { 
      p_global_id: globalId 
    });

    if (error) {
      setErrorMsg(`Toggle failed: ${error.message}`);
    }
  };

  // --- Grouping Logic ---
  const groups = {
    production: facilities.filter(f => {
      const typeInfo = facilityTypes.find(t => t.facility_type === f.facility_type);
      const isRefinery = f.facility_type?.includes("Tier"); 
      return typeInfo?.output_type !== null || isRefinery;
    }),
    factories: facilities.filter(f => {
      const typeInfo = facilityTypes.find(t => t.facility_type === f.facility_type);
      const isFactory = f.facility_type?.includes("Factory");
      const inProduction = typeInfo?.output_type !== null || f.facility_type?.includes("Tier");
      return isFactory && !inProduction;
    }),
    other: facilities.filter(f => {
      const typeInfo = facilityTypes.find(t => t.facility_type === f.facility_type);
      const isFactory = f.facility_type?.includes("Factory");
      return typeInfo?.output_type === null && !isFactory;
    })
  };

  const renderProductionLine = (facility: Facility, typeInfo: any) => {
    const outputAmt = typeInfo?.output_amount_interval;
    const outputType = typeInfo?.output_type;
    const inputType = typeInfo?.input_type;
    const facilityName = facility.facility_type || "";
    const workers = Number(facility.workers_assigned || 0);

    // Logic for factories that don't have a single output_type (Refineries)
    if (!outputType && (!outputAmt || outputAmt === 0)) {
        if (facilityName.includes("Factory")) {
            let refineryText = "";
            if (facilityName.includes("Tier I")) refineryText = "Refines Copper & Gold";
            else if (facilityName.includes("Tier II")) refineryText = "Refines Iron & Diamonds";
            else if (facilityName.includes("Tier III")) refineryText = "Refines Aluminum & Titanium";
            else if (facilityName.includes("Tier IV")) refineryText = "Refines Platinum & Uranium";
            
            return refineryText ? <span className="pos-value" style={{ color: '#4db6ac' }}>{refineryText}</span> : null;
        }
        return null;
    }

    if (!outputAmt && inputType && outputType) {
      return <span className="pos-value">Produces {outputType}</span>;
    }

    const baseOutput = Number(outputAmt || 0);
    const finalOutput = typeInfo?.is_variable_output ? baseOutput * workers : baseOutput;

    return (
      <>
        <span className="pos-value">+{finalOutput.toLocaleString()} {outputType || facilityName}</span>
        <span className="sub-text"> per interval</span>
      </>
    );
  };

  const renderGroup = (title: string, items: Facility[]) => {
    if (items.length === 0) return null;
    return (
      <div className="facility-group-section" style={{ marginBottom: '2rem' }}>
        <h3 className="group-title" style={{ borderBottom: '1px solid #444', paddingBottom: '5px', color: '#aaa' }}>{title}</h3>
        <div className="facility-grid">
          {items.map((facility: Facility) => {
            const typeInfo = facilityTypes.find(t => t.facility_type === facility.facility_type);
            const opCost = getOperatingCost(facility);
            const workers = Number(facility.workers_assigned || 0);
            const showWorkers = typeInfo?.needs_workers !== false;

            return (
              <div key={facility.global_id} className="facility-card-wrapper">
                <div className={`facility-card ${!facility.is_active ? 'inactive-facility' : ''}`}>
                  <div className="facility-card-header">
                    <span>{facility.facility_type}</span>
                    <span className="settlement-id">#{facility.type_id}</span>
                  </div>

                  <div className="card-body">
                    <div className="production-info">
                      {renderProductionLine(facility, typeInfo)}
                    </div>

                    <div className="cost-info" style={{ marginTop: '4px', textAlign: 'center' }}>
                      <span className="sub-text"> operating cost: </span>
                      <span className="neg-value" style={{ 
                        color: '#ff5252', 
                        fontWeight: 'bold',
                        textDecoration: !facility.is_active ? 'line-through' : 'none',
                        opacity: !facility.is_active ? 0.7 : 1
                      }}>
                        -${opCost.toLocaleString()}
                      </span>
                    </div>

                    {showWorkers && (
                      <div className="workers-info" style={{ 
                        marginTop: '8px', 
                        padding: '4px 0', 
                        borderTop: '1px solid #333', 
                        borderBottom: '1px solid #333', 
                        textAlign: 'center' 
                      }}>
                        <span className="sub-text">Workers: </span>
                        <span style={{ color: '#58b7e6', fontWeight: 'bold' }}>
                          {workers.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="stored-resources-section">
                      <h5 className="section-title">Stored Resources</h5>
                      <div className="storage-mini-grid">
                        {STORAGE_RESOURCES.map(res => {
                          const amount = (facility[res as keyof Facility] as number) || 0;
                          if (amount <= 0) return null;

                          return (
                            <div key={res} className="storage-pill">
                              <span style={{ color: extendedColors[res], marginRight: '4px' }}>●</span>
                              <span className="res-label">{res}:</span> 
                              <span className="res-value">{amount.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="card-overlay">
                    <button 
                      onClick={() => handleToggle(facility.global_id)}
                      className={facility.is_active ? 'btn-disable' : 'btn-enable'}
                    >
                      {facility.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="summary-container" style={{ padding: '1rem' }}>
      <h2 className="consumption-header">Facilities</h2>
      {errorMsg && <div className="error-banner">{errorMsg}</div>}
      
      <div className="scroll-area" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {renderGroup("Production Facilities", groups.production)}
        {renderGroup("Factories", groups.factories)}
        {renderGroup("Support & Logistics", groups.other)}
      </div>
    </div>
  );
}