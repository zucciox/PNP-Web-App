import React, { useState, useEffect } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/economyStyles.css'; 

// Resource options helper
const RESOURCE_OPTIONS = [
  'Energy', 'Gas', 'Coal', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 
  'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 
  'Uranium', 'Oil', 'Methane', 'Copper Ore', 'Gold Ore', 
  'Iron Ore', 'Aluminum Ore', 'Titanium Ore', 'Platinum Ore', 'Uranium Ore'
].map(res => ({
  value: res,
  label: res.replace(/([A-Z])/g, ' $1').trim() 
}));

interface ShippingUnit {
  id: number;
  unit_type: string;
  type_id: number;
  display_name: string;
}

export function ManagementActions() {
  const { shipments, profile, units, unitTypes } = useGameData();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  
  const [activeModal, setActiveModal] = useState<'payment' | 'shipment' | 'complete' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableUnits, setAvailableUnits] = useState<ShippingUnit[]>([]);

  const [payNationInput, setPayNationInput] = useState('');
  const [payAmountInput, setPayAmountInput] = useState('');

  const initialShipmentState = {
    resource: '',
    amount: '', 
    originId: '',
    originType: '', 
    unitId: '',        
    unitType: '',      
    destination: '', 
    notes: ''
  };

  const [shipmentForm, setShipmentForm] = useState(initialShipmentState);

  const [completeForm, setCompleteForm] = useState({
    shipmentId: '',
    amount: '', 
    destinationId: '',
    destinationType: '', 
    destinationNation: ''
  });

  const selectedShipment = shipments?.find(s => s.shipment_id === parseInt(completeForm.shipmentId));

  // Fetch valid shipping units when the shipment modal is opened
  useEffect(() => {
    if (activeModal === 'shipment') {
      fetchShippingUnits();
    }
  }, [activeModal, units, unitTypes]);

  const fetchShippingUnits = () => {
    console.log("--- Debug: Fetching Shipping Units ---");
    console.log("Raw Units from Context:", units);
    console.log("UnitTypes Map from Context:", unitTypes);
  
    if (!units || units.length === 0) {
      console.warn("Debug: No units found in context.");
      return;
    }
  
    if (!unitTypes || Object.keys(unitTypes).length === 0) {
      console.warn("Debug: No unitTypes found in context.");
      return;
    }
  
    try {
      const validUnits = units.filter((u: any) => {
        // Search the array for the object where unit_type matches
        const typeData = unitTypes.find(t => t.unit_type === u.unit_type);
        
        const isActive = !!u.is_active;
        const hasTypeData = !!typeData;
        const isEnabled = !!typeData?.is_shipment_enabled;
      
        return isActive && hasTypeData && isEnabled;
      });
  
      console.log("Final Filtered Units:", validUnits);
  
      const formattedUnits = validUnits.map((u: any) => ({
        id: u.global_id, // Your new global_id
        unit_type: u.unit_type,
        type_id: u.type_id,
        display_name: `${u.unit_type} #${u.type_id}`
      }));
      
      console.log("Setting availableUnits to:", formattedUnits);
      setAvailableUnits(formattedUnits);
  
    } catch (err) {
      console.error("Debug: Error in fetchShippingUnits logic:", err);
      setErrorMessage("Error processing unit data.");
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMessage('');
    setPayNationInput('');
    setPayAmountInput('');
    setShipmentForm(initialShipmentState);
    setCompleteForm({ 
      shipmentId: '', 
      amount: '',
      destinationId: '', 
      destinationType: '',
      destinationNation: ''
    });
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
  
    if (!profile?.nation_id) {
      setErrorMessage('Error: User profile or Nation ID not found.');
      return;
    }
  
    const { error } = await supabase.rpc('create_shipment', { 
      p_resource: shipmentForm.resource,
      p_amount: parseInt(shipmentForm.amount), 
      p_origin_id: parseInt(shipmentForm.originId), 
      p_origin_type: shipmentForm.originType,
      p_origin_nation: profile.nation_id,
      p_unit_id: parseInt(shipmentForm.unitId),       
      p_unit_type: shipmentForm.unitType,             
      p_destination: shipmentForm.destination, 
      p_notes: shipmentForm.notes,
    });
  
    if (error) setErrorMessage(error.message);
    else closeModal();
  };

  // ... handlePayNation and handleCompleteShipment remain the same ...
  const handleCompleteShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const { error } = await supabase.rpc('complete_shipment', { 
      p_shipment_id: parseInt(completeForm.shipmentId),
      p_amount: parseInt(completeForm.amount),
      p_destination_id: parseInt(completeForm.destinationId),
      p_destination_type: completeForm.destinationType,
      p_destination_nation: completeForm.destinationNation
    });
    if (error) setErrorMessage(error.message);
    else closeModal();
  };

  const handlePayNation = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.rpc('pay_nation', { 
      nation: payNationInput, 
      amount: parseInt(payAmountInput)
    });
    if (error) setErrorMessage(error.message);
    else closeModal();
  };

  const ACTIONS = [
    { id: 'shipment', label: 'Create Shipment', count: shipments?.length || 0, tooltip: 'Withdraw resources and load onto a unit', onClick: () => setActiveModal('shipment') },
    { id: 'complete_shipment', label: 'Complete Shipment', count: null, tooltip: 'Deposit unit resources into a destination', onClick: () => setActiveModal('complete') },
    { id: 'payment', label: 'Make Payment', count: null, tooltip: 'Transfer currency to another nation', onClick: () => setActiveModal('payment') },
  ];

  return (
    <section className="summary-container">
      <header className="consumption-header">
        <h3>Logistics & Command</h3>
      </header>

      <div className="action-list">
        {ACTIONS.map((action) => (
          <div key={action.id} className="resource-item action-button" onClick={action.onClick} style={{ padding: '0.8rem 1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span className="cost-label" style={{ color: '#fff', fontWeight: 'bold' }}>{action.label}</span>
              {action.count !== null && <span className="sub-text">({action.count})</span>}
            </div>
            <div className="info-icon" onMouseEnter={() => setHoveredIcon(action.id)} onMouseLeave={() => setHoveredIcon(null)}>
              i
              {hoveredIcon === action.id && <div className="tooltip">{action.tooltip}</div>}
            </div>
          </div>
        ))}
      </div>

      {activeModal === 'complete' && (
  <div className="modal-overlay">
    <div className="modal-content modal-large">
      <h4>Complete Shipment</h4>
      <p className="sub-text">Deposit resources from an active shipment into a target destination.</p>
      
      <form onSubmit={handleCompleteShipment}>
        <div className="form-grid">
          
          {/* SHIPMENT SELECTION DROPDOWN */}
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label>Select Active Shipment</label>
            <select 
              required
              className="modal-select"
              value={completeForm.shipmentId}
              onChange={(e) => {
                const ship = shipments?.find(s => s.shipment_id === parseInt(e.target.value));
                setCompleteForm({
                  ...completeForm,
                  shipmentId: e.target.value,
                  // Default the amount to the full shipment amount for convenience
                  amount: ship ? ship.amount.toString() : ''
                });
              }}
            >
              <option value="" disabled>Select a shipment to deliver...</option>
              {shipments && shipments.length > 0 ? (
                shipments.map((s) => (
                  <option key={s.shipment_id} value={s.shipment_id}>
                    ID: {s.shipment_id} — {s.resource} ({s.amount})
                  </option>
                ))
              ) : (
                <option disabled>No active shipments found</option>
              )}
            </select>
          </div>

          {/* SHIPMENT INFO CARD */}
          {selectedShipment && (
            <div className="info-box" style={{ gridColumn: 'span 2', background: '#222', padding: '10px', borderRadius: '4px', border: '1px solid #444', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>
                <strong>Cargo:</strong> {selectedShipment.amount}x {selectedShipment.resource} <br />
                <strong>Currently on:</strong> {selectedShipment.unit_type} #{units?.find(u => u.global_id === selectedShipment.unit_id)?.type_id || "Unknown ID"}<br />
                <strong>Destination:</strong> {selectedShipment.destination}
              </p>
            </div>
          )}

          <div className="input-group">
            <label>Amount to Deposit</label>
            <input 
              type="number" 
              placeholder="Amount" 
              max={selectedShipment?.amount}
              value={completeForm.amount} 
              onChange={(e) => setCompleteForm({...completeForm, amount: e.target.value})} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Dest. Nation (A-Z)</label>
            <input 
              type="text" 
              maxLength={1} 
              value={completeForm.destinationNation} 
              onChange={(e) => setCompleteForm({...completeForm, destinationNation: e.target.value.toUpperCase()})} 
              required 
            />
          </div>

          {/* BACK TO TEXT INPUT */}
          <div className="input-group">
            <label>Destination Type</label>
            <input 
              type="text" 
              placeholder="Unit, City, Mine, etc." 
              value={completeForm.destinationType} 
              onChange={(e) => setCompleteForm({...completeForm, destinationType: e.target.value})} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Target type_id / Unit ID</label>
            <input 
              type="number" 
              value={completeForm.destinationId} 
              onChange={(e) => setCompleteForm({...completeForm, destinationId: e.target.value})} 
              required 
            />
          </div>
        </div>

        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <div className="modal-actions" style={{ marginTop: '15px' }}>
          <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">Finalize Delivery</button>
        </div>
      </form>
    </div>
  </div>
)}

     {activeModal === 'payment' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Send Payment</h4>
            <form onSubmit={handlePayNation}>
              <div className="input-group">
                <label>Nation (A-Z)</label>
                <input type="text" maxLength={1} value={payNationInput} onChange={(e) => setPayNationInput(e.target.value.toUpperCase())} required />
              </div>
              <div className="input-group">
                <label>Amount</label>
                <input type="number" value={payAmountInput} onChange={(e) => setPayAmountInput(e.target.value)} required />
              </div>
              {errorMessage && <p className="error-text">{errorMessage}</p>}
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'shipment' && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Logistics Shipment</h4>
            <p className="sub-text">Originating from Nation: <strong>{profile?.nation_id || 'Loading...'}</strong></p>
            
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
                    {RESOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Amount</label>
                  <input type="number" value={shipmentForm.amount} onChange={(e) => setShipmentForm({...shipmentForm, amount: e.target.value})} required />
                </div>
                
                <div className="input-group">
                  <label>Origin Type (e.g. City)</label>
                  <input type="text" value={shipmentForm.originType} onChange={(e) => setShipmentForm({...shipmentForm, originType: e.target.value})} required />
                </div>

                <div className="input-group">
                  <label>Origin type_id</label>
                  <input type="number" value={shipmentForm.originId} onChange={(e) => setShipmentForm({...shipmentForm, originId: e.target.value})} required />
                </div>

                <hr style={{ gridColumn: 'span 2', width: '100%', margin: '10px 0', borderColor: '#444' }} />

                {/* UPDATED UNIT DROPDOWN */}
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select Shipping Unit</label>
                  <select 
                    required
                    className="modal-select"
                    value={shipmentForm.unitId}
                    onChange={(e) => {
                        const selectedUnit = availableUnits.find(u => u.id === parseInt(e.target.value));
                        if (selectedUnit) {
                            setShipmentForm({
                                ...shipmentForm, 
                                unitId: selectedUnit.type_id.toString(),
                                unitType: selectedUnit.unit_type
                            });
                        }
                    }}
                  >
                    <option value="" disabled>Select an available unit...</option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Destination Label</label>
                  <input type="text" placeholder="Friendly name for logs" value={shipmentForm.destination} onChange={(e) => setShipmentForm({...shipmentForm, destination: e.target.value})} required />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '10px' }}>
                <label>Notes</label>
                <textarea rows={2} value={shipmentForm.notes} onChange={(e) => setShipmentForm({...shipmentForm, notes: e.target.value})} />
              </div>

              {errorMessage && <p className="error-text">{errorMessage}</p>}

              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}