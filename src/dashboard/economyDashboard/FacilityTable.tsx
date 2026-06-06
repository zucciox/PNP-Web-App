import React, { useState, useEffect } from 'react';
import { useGameData } from '../../GameContext';
import { Facility } from '../../types'; 
import '../../styles/economyStyles.css';
import { supabase } from '../../supabaseClient';
import { negativeTextColor, resourceColors } from '../../styleConstants';
import { stableTextColor } from '../../styleConstants';
import { additiveTextColor } from '../../styleConstants';
import { useMemo } from 'react';

const STORAGE_RESOURCES = [
  'Energy', 'Gas', 'Coal', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 
  'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 
  'Uranium', 'Oil', 'Methane', 'Copper Ore', 'Gold Ore', 
  'Iron Ore', 'Aluminum Ore', 'Titanium Ore', 'Platinum Ore', 'Uranium Ore'
];

// Helper mapping function to convert UI display names into the new backend keys
const getBackendKey = (resourceName: string): string => {
  const compoundWords: Record<string, string> = {
    'Copper Ore': 'copper_ore',
    'Gold Ore': 'gold_ore',
    'Iron Ore': 'iron_ore',
    'Aluminum Ore': 'aluminum_ore',
    'Titanium Ore': 'titanium_ore',
    'Platinum Ore': 'platinum_ore',
    'Uranium Ore': 'uranium_ore'
  };

  if (compoundWords[resourceName]) {
    return compoundWords[resourceName];
  }

  // Single word columns are now lowercase
  return resourceName.toLowerCase();
};

interface ShippingUnit {
  id: number;
  unit_type: string;
  type_id: number;
  display_name: string;
}

const getMaxHealth = (facilityType: string): number => {
  return facilityType === 'Military Base' ? 300 : 50;
};

const containsResource = (facilityGID: number, facilities: Facility[], queryRes: string): boolean => {
  const facility = facilities.find(f => f.global_id === facilityGID);
  if (!facility) return false;

  return STORAGE_RESOURCES.some(res => {
    if (res.toLowerCase().includes(queryRes.toLowerCase())) {
      const backendKey = getBackendKey(res);
      const amount = facility[backendKey as keyof Facility]?? 0;
      
      return amount > 0;
    }
    return false;
  });
};

const getHealthGradient = (percentage: number): string => {
  if (percentage > 60) return 'linear-gradient(90deg, #2e7d32, #4caf50)';
  if (percentage > 30) return 'linear-gradient(90deg, #ff9800, #ffeb3b)';
  return 'linear-gradient(90deg, #c62828, #ef5350)';
};

export function FacilityTable() {
  const { facilities, facilityTypes, profile, units, unitTypes, shipments } = useGameData();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [activeShipmentFacility, setActiveShipmentFacility] = useState<Facility | null>(null);
  const [activeDeliveryFacility, setActiveDeliveryFacility] = useState<Facility | null>(null);
  const [availableUnits, setAvailableUnits] = useState<ShippingUnit[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [shipmentForm, setShipmentForm] = useState({
    resource: '',
    amount: '',
    unitId: '',
    unitType: '',
    destination: '',
    notes: ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    shipmentId: '',
    amount: ''
  });

  const selectedShipment = shipments?.find(s => s.shipment_id === parseInt(deliveryForm.shipmentId));

  useEffect(() => {
    if (activeShipmentFacility && units && unitTypes) {
      const validUnits = units.filter((u: any) => {
        const typeData = unitTypes.find(t => t.unit_type === u.unit_type);
        return !!u.is_active && !!typeData?.is_shipment_enabled;
      });

      setAvailableUnits(validUnits.map((u: any) => ({
        id: u.global_id,
        unit_type: u.unit_type,
        type_id: u.type_id,
        display_name: `${u.unit_type} #${u.type_id}`
      })));
    }
  }, [activeShipmentFacility, units, unitTypes]);

  const handleToggle = async (globalId: number) => {
    setErrorMsg(null);
    const { error } = await supabase.rpc('toggle_facility', { p_global_id: globalId });
    if (error) setErrorMsg(`Toggle failed: ${error.message}`);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.nation_id || !activeShipmentFacility) return;

    setLoading(true);
    

    const { error } = await supabase.rpc('create_shipment', { 
      p_resource: shipmentForm.resource,
      p_amount: parseInt(shipmentForm.amount), 
      p_origin_id: activeShipmentFacility.type_id, 
      p_origin_type: activeShipmentFacility.facility_type,
      p_origin_nation: profile.nation_id,
      p_unit_id: parseInt(shipmentForm.unitId),       
      p_unit_type: shipmentForm.unitType,             
      p_destination: shipmentForm.destination, 
      p_notes: shipmentForm.notes,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setActiveShipmentFacility(null);
      setShipmentForm({ resource: '', amount: '', unitId: '', unitType: '', destination: '', notes: '' });
      setLoading(false);
    }
  };

  const handleCompleteShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeliveryFacility || !profile?.nation_id) return;

    setLoading(true);
    const { error } = await supabase.rpc('complete_shipment', { 
      p_shipment_id: parseInt(deliveryForm.shipmentId),
      p_amount: parseInt(deliveryForm.amount),
      p_destination_id: activeDeliveryFacility.type_id,
      p_destination_type: activeDeliveryFacility.facility_type,
      p_destination_nation: profile.nation_id
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setActiveDeliveryFacility(null);
      setDeliveryForm({ shipmentId: '', amount: '' });
      setLoading(false);
    }
  };

  const getOperatingCost = (facility: Facility): number => {
    const typeDef = facilityTypes.find((t: any) => t.facility_type === facility.facility_type);
    return Number(typeDef?.oc_interval ?? 0);
  };

  const filteredFacilities = useMemo(() => {
    return (facilities || [])
      .filter(f => {
        const query = searchQuery.toLowerCase();
        const typeDef = facilityTypes.find((t: any) => t.facility_type === f.facility_type);
        return (
          f.facility_type?.toLowerCase().includes(query) || 
          f.type_id?.toString().includes(query) ||
          typeDef?.output_type?.toLowerCase().includes(query) ||
          typeDef?.input_type?.toLowerCase().includes(query) ||
          containsResource(f.global_id, facilities, query)
        );
      });
  }, [units, searchQuery]);

  const groups = {
    production: filteredFacilities
    .filter(f => {
      const typeInfo = facilityTypes.find(t => t.facility_type === f.facility_type);
      return typeInfo?.output_type !== null;
    })
    .sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    }),
    factories: filteredFacilities.filter(f => {
      return f.facility_type?.includes("Factory");
    })
    .sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    }),
    other: filteredFacilities.filter(f => {
      const typeInfo = facilityTypes.find(t => t.facility_type === f.facility_type);
      return typeInfo?.output_type === null && !f.facility_type?.includes("Factory");
    })
    .sort((a, b) => {
      return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    }),
  };

  const renderProductionLine = (facility: Facility, typeInfo: any) => {
    const outputAmt = typeInfo?.output_amount_interval;
    const outputType = typeInfo?.output_type;
    const facilityName = facility.facility_type || "";
    const workers = Number(facility.workers_assigned || 0);

    if (!outputType && (!outputAmt || outputAmt === 0)) {
        if (facilityName.includes("Factory")) {
            let refineryText = "";
            if (facilityName.includes("Tier IV")) refineryText = "Refines Platinum & Uranium"
            else if (facilityName.includes("Tier III")) refineryText = "Refines Aluminum & Titanium";
            else if (facilityName.includes("Tier II")) refineryText = "Refines Iron & Diamonds";
            else if (facilityName.includes("Tier I")) refineryText = "Refines Copper & Gold";
            return refineryText ? <span className="pos-value" style={{ color: '#4db6ac' }}>{refineryText}</span> : null;
        }
        return null;
    }
    const baseOutput = Number(outputAmt || 0);
    const finalOutput = typeInfo?.is_variable_output ? baseOutput * workers : baseOutput;

    return (
      <>
        <span style={{color: additiveTextColor}} className="pos-value">+{finalOutput.toLocaleString()} {outputType || facilityName}</span>
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
            const numWorkers = facility.workers_assigned;
            
            // Filter dynamic items by mapping to the backend schema property string safely
            const availableInStorage = STORAGE_RESOURCES.filter(res => {
              const backendKey = getBackendKey(res);
              console.log("Looked for key: ", getBackendKey(res))
              return (Number(facility[backendKey as keyof Facility]) || 0) > 0;
            });

            const currentHealth = Number(facility.health) || 0;
            const maxHealth = getMaxHealth(facility.facility_type || '');
            const healthPercentage = Math.min(Math.max((currentHealth / maxHealth) * 100, 0), 100);

            return (
              <div key={facility.global_id} className="facility-card-wrapper">
                <div 
                  className={`facility-card ${!facility.is_active ? 'inactive-facility' : ''}`}
                >
                  <div className="facility-card-header">
                    <span style={{color: resourceColors[typeInfo?.output_type || '']}}>{facility.facility_type} {facility.is_active ? '' : <span style={{color: 'red'}}>(INACTIVE)</span>}</span>
                    <span className="settlement-id">#{facility.type_id}</span>
                  </div>

                  <div className="card-body">
                    <div className="facility-health-container" style={{ margin: '2px 0 10px 0', padding: '0 4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '3px', opacity: 0.85 }}>
                        <span style={{ fontWeight: 'bold' }}>{currentHealth} / {maxHealth} HP</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${healthPercentage}%`, 
                          height: '100%', 
                          background: getHealthGradient(healthPercentage),
                          transition: 'width 0.4s ease, background 0.4s ease' 
                        }} />
                      </div>
                    </div>

                    <div className="production-info">{renderProductionLine(facility, typeInfo)}</div>
                    <div className="cost-info" style={{ marginTop: '4px', textAlign: 'center' }}>
                      <span className="sub-text"> operating cost: </span>
                      <span className="neg-value" style={{ color: facility.is_active ? '#ff5252' : '#533', fontWeight: 'bold', textDecoration: facility.is_active ? 'none' : 'line-through' }}>-${opCost.toLocaleString()}</span>
                    </div>

                    <div className="cost-info" style={{ marginTop: '4px', textAlign: 'center' }}>
                      <span className="sub-text"> workers assigned: </span>
                        {
                          typeInfo?.needs_workers ? <span className="neg-value" style={{fontWeight: 'bold' }}>{numWorkers}</span> : <span>N/A</span>
                        }    
                    </div>

                    <div className="stored-resources-section">
                      <h5 className="section-title">Storage</h5>
                      <div className="storage-mini-grid">
                        {availableInStorage.map(res => {
                          const backendKey = getBackendKey(res);
                          const value = Number(facility[backendKey as keyof Facility]) || 0;
                          return (
                            <div key={res} className="storage-pill">
                              <span style={{ color: resourceColors[res], marginRight: '4px' }}>●</span>
                              <span className="res-label">{res}:</span> 
                              <span className="res-value" style={{ color: stableTextColor}}>{value.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="card-overlay" style={{ flexDirection: 'column', gap: '6px', padding: '10px' }}>
                    <button onClick={() => handleToggle(facility.global_id)} className={facility.is_active ? 'btn-disable' : 'btn-enable'} style={{ width: '90%' }}>
                      {facility.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => setActiveShipmentFacility(facility)} className="btn-primary" style={{ width: '90%', fontSize: '0.75rem' }}>
                      Create Shipment
                    </button>
                    <button onClick={() => setActiveDeliveryFacility(facility)} className="btn-secondary" style={{ width: '90%', fontSize: '0.75rem', background: '#3d5a99' }}>
                      Deliver Shipment
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
    <div className="summary-container" style={{ paddingLeft: '1rem',  paddingRight: '1rem', height: '87vh'}}>
      {errorMsg && <div className="error-banner">{errorMsg}</div>}
    
      <div style={{display: 'flex', paddingTop: '20px', width: '100%', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px'}}>
          <input 
            type="text"
            placeholder="Search name, output, or storage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input search-field" 
            style={{width: '30%', height: '15px'}}
          />
          <div className="info-icon" style={{marginRight: '5px'}}>
              ?
              <div className="tooltip" style={{right: '30px'}}>
                <p>Facilities are the backbone of your economy, responsible for producing and refining 
                  the resources that support your settlements and allow for manufacturing.</p>
                <p></p>
              </div>
          </div>
        </div>

      <div className="scroll-area" style={{overflowY: 'auto' }}>

        {renderGroup("Factories", groups.factories)}
        {renderGroup("Production Facilities", groups.production)}
        {renderGroup("Support & Logistics", groups.other)}
      </div>

      {/* CREATE SHIPMENT MODAL */}
      {activeShipmentFacility && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Ship from {activeShipmentFacility.facility_type} #{activeShipmentFacility.type_id}</h4>
            <form onSubmit={handleCreateShipment}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Resource</label>
                  <select 
                    value={shipmentForm.resource} 
                    onChange={(e) => setShipmentForm({...shipmentForm, resource: e.target.value})} 
                    required
                    className="modal-select"
                  >
                    <option value="" disabled>Select Resource</option>
                    {STORAGE_RESOURCES.filter(res => {
                      const backendKey = getBackendKey(res);
                      return (Number(activeShipmentFacility[backendKey as keyof Facility]) || 0) > 0;
                    }).map(res => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Amount</label>
                  <input type="number" value={shipmentForm.amount} onChange={(e) => setShipmentForm({...shipmentForm, amount: e.target.value})} required />
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Shipping Unit</label>
                  <select 
                    required className="modal-select"
                    value={shipmentForm.unitId}
                    onChange={(e) => {
                        const selectedUnit = availableUnits.find(u => u.id === parseInt(e.target.value));
                        if (selectedUnit) setShipmentForm({...shipmentForm, unitId: selectedUnit.type_id.toString(), unitType: selectedUnit.unit_type});
                    }}
                  >
                    <option value="" disabled>Select Unit...</option>
                    {availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.display_name}</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Destination Label</label>
                  <input type="text" value={shipmentForm.destination} onChange={(e) => setShipmentForm({...shipmentForm, destination: e.target.value})} required />
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes</label>
                  <textarea 
                    rows={2} 
                    value={shipmentForm.notes} 
                    onChange={(e) => setShipmentForm({...shipmentForm, notes: e.target.value})} 
                    placeholder="Optional details..."
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={() => setActiveShipmentFacility(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVER SHIPMENT MODAL */}
      {activeDeliveryFacility && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Deliver to {activeDeliveryFacility.facility_type} #{activeDeliveryFacility.type_id}</h4>
            <form onSubmit={handleCompleteShipment}>
              <div className="form-grid">
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select Incoming Shipment</label>
                  <select 
                    required className="modal-select"
                    value={deliveryForm.shipmentId}
                    onChange={(e) => {
                      const ship = shipments?.find(s => s.shipment_id === parseInt(e.target.value));
                      setDeliveryForm({ shipmentId: e.target.value, amount: ship ? ship.amount.toString() : '' });
                    }}
                  >
                    <option value="" disabled>Select shipment...</option>
                    {shipments?.map(s => (
                      // Handle displaying legacy uppercase/snake_case string values cleanly in the selector text
                      <option key={s.shipment_id} value={s.shipment_id}>ID: {s.shipment_id} — {s.resource} ({s.amount})</option>
                    ))}
                  </select>
                </div>

                {selectedShipment && (
                  <div className="info-box" style={{ gridColumn: 'span 2', background: '#222', padding: '10px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #444' }}>
                    <span style={{ color: '#aaa' }}>Manifest: </span> 
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                        {selectedShipment.amount} {selectedShipment.resource} on {selectedShipment.unit_type} #{units?.find(u => u.global_id === selectedShipment.unit_id)?.type_id || "Unknown"}
                    </span>
                    <div style={{ marginTop: '4px', opacity: 0.8, fontSize: '0.75rem' }}>
                        Heading to: {selectedShipment.destination}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Amount to Deposit</label>
                  <input 
                    type="number" 
                    max={selectedShipment?.amount}
                    value={deliveryForm.amount} 
                    onChange={(e) => setDeliveryForm({...deliveryForm, amount: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={() => setActiveDeliveryFacility(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || !selectedShipment}>
                  {loading ? 'Processing...' : 'Finalize Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}