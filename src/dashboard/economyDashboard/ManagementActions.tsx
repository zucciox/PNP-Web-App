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
  
  const [activeModal, setActiveModal] = useState<'payment' | 'shipment' | null>(null);
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