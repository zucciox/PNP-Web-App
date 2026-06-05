import React, { useState, useEffect, useRef } from 'react';
import { Facility, Settlement, Shipment } from '../../types';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/economyStyles.css'; 
import { additiveTextColor, negativeTextColor, resourceColors, stableTextColor } from '../../styleConstants';
import { createPortal } from 'react-dom';

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

const convertToRaw: Record<string, string> = {
  'Fuel': 'Oil', 
  'Copper': 'Copper Ore',
  'Energy': 'Gas',
  'Titanium': 'Titanium Ore',
  'Platinum': 'Platinum Ore',
  'Gold': 'Gold Ore',
  'Diamond': 'Diamond Ore',
  'Steel': 'Iron Ore',
  'Uranium': 'Uranium Ore',
  'Aluminum': 'Aluminum Ore',

  // Placeholders
  'Oxygen': 'Oxygen',
  'Food': 'Food',
  'Water': 'Water',
  'Treasury': 'Treasury'
};

const SHIPMENT_RESOURCES = [
  'Energy', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 'Aluminum', 
  'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 'Uranium'
];

const DISPLAY_RESOURCES = [
  'Treasury', 'Energy', 'Steel', 'Aluminum', 'Copper', 'Platinum', 
  'Titanium', 'Gold', 'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel'
];

const facilityStored = (facilities: Facility[], resource: string): number => {
    
  let total = 0;
  facilities.forEach(f => {
    total += f[getBackendKey(resource)]
  })

  return total
}

const settlementStored = (settlements: Settlement[], resource: string, settlement: string): number => {
    
  let total = 0;
  settlements.forEach(s => {
    if (s.name !== settlement) total += Number(s[getBackendKey(resource)]) || 0
  })

  return total
}

const shipmentStored = (shipments: Shipment[],resource: string): number => {
  
  let total = 0;
  shipments.forEach(s => {
    if (s.resource === resource) {
      total += s.amount
    }
  })

  return total
}

// Helper mapping function to convert UI display names into the new backend keys
const getBackendKey = (resourceName: string): string => {
  if (resourceName === 'Treasury') return 'Treasury'; // Preserved case format

  const compoundWords: Record<string, string> = {
    NaturalGas: 'natural_gas',
    CopperOre: 'copper_ore',
    GoldOre: 'gold_ore',
    IronOre: 'iron_ore',
    AluminumOre: 'aluminum_ore',
    TitaniumOre: 'titanium_ore',
    PlatinumOre: 'platinum_ore',
    UraniumOre: 'uranium_ore'
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

const getMaxHealth = (settlementType: string): number => {
  switch (settlementType) {
    case 'Capital': return 350;
    case 'City': return 250;
    case 'Town': return 150;
    default: return 100;
  }
};

const getHealthGradient = (percentage: number): string => {
  if (percentage > 60) return 'linear-gradient(90deg, #2e7d32, #4caf50)';
  if (percentage > 30) return 'linear-gradient(90deg, #ff9800, #ffeb3b)';
  return 'linear-gradient(90deg, #c62828, #ef5350)';
};

export function SettlementsTable() {
  const { settlements, profile, units, unitTypes, shipments, nation, facilities } = useGameData();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeShipmentSettlement, setActiveShipmentSettlement] = useState<Settlement | null>(null);
  const [activeDeliverySettlement, setActiveDeliverySettlement] = useState<Settlement | null>(null);
  const [availableUnits, setAvailableUnits] = useState<ShippingUnit[]>([]);

  // Create Shipment Form
  const [shipmentForm, setShipmentForm] = useState({
    resource: '',
    amount: '',
    unitId: '',
    unitType: '',
    destination: '',
    notes: ''
  });

  // Complete Shipment Form
  const [deliveryForm, setDeliveryForm] = useState({
    shipmentId: '',
    amount: ''
  });

  const selectedShipment = shipments?.find(s => s.shipment_id === parseInt(deliveryForm.shipmentId));

  // Fetch valid shipping units
  useEffect(() => {
    if (activeShipmentSettlement && units && unitTypes) {
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
  }, [activeShipmentSettlement, units, unitTypes]);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!profile?.nation_id || !activeShipmentSettlement) return;

    setLoading(true);

    // Convert selection parameter to backend naming schema format
    const backendResourceName = getBackendKey(shipmentForm.resource);

    const { error } = await supabase.rpc('create_shipment', { 
      p_resource: backendResourceName,
      p_amount: parseInt(shipmentForm.amount), 
      p_origin_id: activeShipmentSettlement.type_id, 
      p_origin_type: activeShipmentSettlement.settlement_type,
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
      setActiveShipmentSettlement(null);
      setShipmentForm({ resource: '', amount: '', unitId: '', unitType: '', destination: '', notes: '' });
      setLoading(false);
    }
  };

  const handleCompleteShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!activeDeliverySettlement || !profile?.nation_id) return;

    setLoading(true);
    const { error } = await supabase.rpc('complete_shipment', { 
      p_shipment_id: parseInt(deliveryForm.shipmentId),
      p_amount: parseInt(deliveryForm.amount),
      p_destination_id: activeDeliverySettlement.type_id,
      p_destination_type: activeDeliverySettlement.settlement_type,
      p_destination_nation: profile.nation_id
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setActiveDeliverySettlement(null);
      setDeliveryForm({ shipmentId: '', amount: '' });
      setLoading(false);
    }
  };


  const resourceMap = [
    { key: 'Treasury', label: 'Treasury' }, { key: 'Energy', label: 'Energy' },
    { key: 'Fuel', label: 'Fuel' }, { key: 'Water', label: 'Water' },
    { key: 'Food', label: 'Food' }, { key: 'Oxygen', label: 'Oxygen' },
    { key: 'Steel', label: 'Steel' }, { key: 'Aluminum', label: 'Aluminum' },
    { key: 'Copper', label: 'Copper' }, { key: 'Platinum', label: 'Platinum' },
    { key: 'Titanium', label: 'Titanium' }, { key: 'Gold', label: 'Gold' },
    { key: 'Diamond', label: 'Diamond' }, { key: 'Uranium', label: 'Uranium' },
    { key: 'treasury_cr', label: 'Treasury' }, { key: 'energy_cr', label: 'Energy' },
    { key: 'fuel_cr', label: 'Fuel' }, { key: 'water_cr', label: 'Water' },
    { key: 'food_cr', label: 'Food' }, { key: 'oxygen_cr', label: 'Oxygen' },
    { key: 'steel_cr', label: 'Steel' }, { key: 'aluminum_cr', label: 'Aluminum' },
    { key: 'copper_cr', label: 'Copper' }, { key: 'platinum_cr', label: 'Platinum' },
    { key: 'titanium_cr', label: 'Titanium' }, { key: 'gold_cr', label: 'Gold' },
    { key: 'diamond_cr', label: 'Diamond' }, { key: 'uranium_cr', label: 'Uranium' },
  ];

  return (
    <section className="summary-container" style={{height: '87vh'}}>
      <header className="tab-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
        <h3 className="consumption-header" style={{ margin: 0 }}>
          Settlements
        </h3>
      </header>
      
      {errorMsg && <div className="error-banner">{errorMsg}</div>}

      <div className="scroll-area">
        <div className="settlement-grid">
          {settlements.map((s) => {
            const currentHealth = Number(s.health) || 0;
            const maxHealth = getMaxHealth(s.settlement_type);
            const healthPercentage = Math.min(Math.max((currentHealth / maxHealth) * 100, 0), 100);

            return (
              <div key={`${s.settlement_type}-${s.type_id}`} className="settlement-card">
                <div className="settlement-title">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="settlement-name">{s.name}</span>
                    <span className="sub-text" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{s.settlement_type}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className="settlement-id">ID: {s.type_id}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-primary" style={{ fontSize: '0.6rem', padding: '2px 6px' }} onClick={() => setActiveShipmentSettlement(s)}>Ship</button>
                          <button className="btn-secondary" style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#3d5a99' }} onClick={() => setActiveDeliverySettlement(s)}>Deliver</button>
                      </div>
                  </div>
                </div>

                <div className="settlement-health-container" style={{ margin: '8px 0 12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px', opacity: 0.9 }}>
                    <span style={{ fontWeight: 'bold' }}>{currentHealth} / {maxHealth} HP</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${healthPercentage}%`, 
                      height: '100%', 
                      background: getHealthGradient(healthPercentage),
                      transition: 'width 0.4s ease, background 0.4s ease' 
                    }} />
                  </div>
                </div>

                <div className="resource-grid">

                  {DISPLAY_RESOURCES.map((res) => {
                    let reserveVal = ''
                    let crVal = ''
                    {
                      res === 'Treasury' ? 
                        reserveVal = 'N/A'
                        : 
                        reserveVal = s[getBackendKey(res)]?.toLocaleString() || '0'
                        crVal = s[getBackendKey(res)+'_cr']?.toLocaleString() || '0'
                    }
                    return (
                      <StockpileFeedbackIcon resource={res} stockpileAmount={Number(reserveVal)} consumptionAmount={Number(crVal)} settlement={s} settlements={settlements} facilities={facilities} shipments={shipments}/>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE SHIPMENT MODAL */}
      {activeShipmentSettlement && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Ship from {activeShipmentSettlement.name}</h4>
            <form onSubmit={handleCreateShipment}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Resource</label>
                  <select value={shipmentForm.resource} onChange={(e) => setShipmentForm({...shipmentForm, resource: e.target.value})} required className="modal-select">
                    <option value="" disabled>Select Resource</option>
                    {SHIPMENT_RESOURCES.filter(res => {
                      const backendKey = getBackendKey(res);
                      return (Number(activeShipmentSettlement[backendKey as keyof Settlement]) || 0) > 0;
                    }).map(res => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    max={activeShipmentSettlement[getBackendKey(shipmentForm.resource) as keyof Settlement] as number || 0} 
                    value={shipmentForm.amount} 
                    onChange={(e) => setShipmentForm({...shipmentForm, amount: e.target.value})} 
                    required 
                  />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Shipping Unit</label>
                  <select required className="modal-select" value={shipmentForm.unitId} onChange={(e) => {
                        const selectedUnit = availableUnits.find(u => u.id === parseInt(e.target.value));
                        if (selectedUnit) setShipmentForm({...shipmentForm, unitId: selectedUnit.type_id.toString(), unitType: selectedUnit.unit_type});
                    }}>
                    <option value="" disabled>Select Unit...</option>
                    {availableUnits.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Destination Label</label>
                  <input type="text" placeholder="Friendly Name" value={shipmentForm.destination} onChange={(e) => setShipmentForm({...shipmentForm, destination: e.target.value})} required />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Notes</label>
                  <textarea rows={2} value={shipmentForm.notes} onChange={(e) => setShipmentForm({...shipmentForm, notes: e.target.value})} placeholder="e.g: In exchange from oxygen from A" />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={() => setActiveShipmentSettlement(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Create Shipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVER SHIPMENT MODAL */}
      {activeDeliverySettlement && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Deliver to {activeDeliverySettlement.name}</h4>
            <form onSubmit={handleCompleteShipment}>
              <div className="form-grid">
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select Incoming Shipment</label>
                  <select required className="modal-select" value={deliveryForm.shipmentId} onChange={(e) => {
                      const ship = shipments?.find(s => s.shipment_id === parseInt(e.target.value));
                      setDeliveryForm({ shipmentId: e.target.value, amount: ship ? ship.amount.toString() : '' });
                    }}>
                    <option value="" disabled>Select shipment...</option>
                    {shipments?.map(s => <option key={s.shipment_id} value={s.shipment_id}>ID: {s.shipment_id} — {s.resource} ({s.amount}) – Destination: {s.destination}</option>)}
                  </select>
                </div>

                {selectedShipment && (
                  <div className="info-box" style={{ gridColumn: 'span 2', background: '#222', padding: '10px', fontSize: '0.85rem', border: '1px solid #444', borderRadius: '4px' }}>
                    <span style={{ color: '#aaa' }}>Manifest: </span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>
                        {selectedShipment.amount} {selectedShipment.resource} on {selectedShipment.unit_type} #{units?.find(u => u.global_id === selectedShipment.unit_id)?.type_id || "Unknown"}
                    </span>
                    <div style={{ marginTop: '4px', opacity: 0.8, fontSize: '0.75rem' }}>
                        Destination: {selectedShipment.destination}
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <label>Amount to Deposit</label>
                  <input type="number" max={selectedShipment?.amount} value={deliveryForm.amount} onChange={(e) => setDeliveryForm({...deliveryForm, amount: e.target.value})} required />
                </div>
              </div>
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={() => setActiveDeliverySettlement(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || !selectedShipment}>
                  {loading ? 'Processing...' : 'Deposit Resources'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function StockpileFeedbackIcon({ resource: r, stockpileAmount: rA, settlement: s, settlements: settlements, consumptionAmount: cA, facilities: facilities, shipments: shipments }: { resource: string, stockpileAmount: number, consumptionAmount: number, settlement: Settlement, settlements: Settlement[], facilities: Facility[], shipments: Shipment[] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const iconRef = useRef<HTMLDivElement>(null);

  // Cross-reference: Find the unit where global_id matches the shipment's unit_id
  const hasCR = cA > 0
  const isMeetingCR = rA >= cA
  const rawResourceText = <span style={{color: resourceColors[convertToRaw[r] ?? 'white']}}>{convertToRaw[r]}</span>
  const resourceText = <span style={{color: resourceColors[r]}}>{r}</span>
  const settlementName = <span style={{color: stableTextColor}}>{s.name}</span>

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      
      const estimatedTooltipHeight = 450; 
      const spaceBelow = window.innerHeight - rect.bottom;
  
      if (spaceBelow < estimatedTooltipHeight) {
        // FLIP UP: Not enough space below, so render it ABOVE the icon
        setTooltipStyle({
          position: 'fixed',
          // Pin the bottom of the tooltip to the top of the icon (plus a 4px gap)
          bottom: window.innerHeight - rect.top + 4, 
          right: window.innerWidth - rect.right,
          zIndex: 9999,
        });
      } else {
        // RENDER DOWN: Plenty of space, render it BELOW the icon normally
        setTooltipStyle({
          position: 'fixed',
          top: rect.bottom + 4, 
          right: window.innerWidth - rect.right,
          zIndex: 9999,
        });
      }
    }
  };

  return (
    <div 
      ref = {iconRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      key={r} className="settlement-resource" 
      style={{backgroundColor: rA  > cA ? cA > 0 ? '#042415' : '#222' : cA > 0 ? '#240404' : '#222', border: 'none', height: '15px', alignItems: 'center'}}
    >
      <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: resourceColors[r] || '#bb86fc', fontWeight: 'bold' }}>
          {r}:
          {cA > rA && <div>⛔️</div>}
          {cA <= rA && cA > 0 && <div>✅</div>}
        </span>

        <div style={{ display: 'flex', gap: '5px' }}>
          <span style={{ color: stableTextColor }}>{rA}</span>
          {
            cA > 0 && ( 
              <span>
                /
                <span style={{ color: negativeTextColor }}> {cA}</span>
              </span>
            )
          }
        </div>
      </div>

      {isHovered && hasCR && createPortal (
        <div 
          className="resource-feedback-overlay" 
          style={tooltipStyle}
        >

          <span style={{color: isMeetingCR ? '#44ff44' : '#ff4444'}}>
            {isMeetingCR ? 
              <span>✅ You have enough {resourceText} in {settlementName} to meet your upcoming consumption rate.</span>
              : 
              <span>⛔️ You DO NOT have enough {resourceText} in {settlementName} to meet your upcoming consumption rate!
              </span>}
          </span>

        {r !== 'Treasury' && rA < cA ?  
        <p> 
          Nationwide, you have:{' '}
          
          <p style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
          <div>
            • <span style={{fontWeight: 'bold', color: resourceColors[r]}}>
            {facilityStored(facilities, r).toLocaleString()} {r}
            </span>{' '}
            stored in facilities
          </div>

          <div>
            • <span style={{fontWeight: 'bold', color: resourceColors[r]}}>
              {shipmentStored(shipments, r).toLocaleString()} {r}
            </span>{' '}
            moving on active shipments
          </div>

          <div>
            • <span style={{fontWeight: 'bold', color: resourceColors[r]}}>
              {settlementStored(settlements, r, s.name).toLocaleString()} {r}
            </span>{' '}
            in other settlements.
          </div>
        </p>
        </p>
         : null}  

          {rA <= cA ? 
          <div>To meet your consumption rate, you need to ship <span style={{color: negativeTextColor, fontWeight: 'bold'}}> {cA-rA} </span> more {resourceText} into <span style={{color: stableTextColor}}>{s.name}</span> by the end of this cycle. <div/>
          </div>       
           :
           ''
        }   
        </div>,
        document.body
      )}
    </div>
  );
}