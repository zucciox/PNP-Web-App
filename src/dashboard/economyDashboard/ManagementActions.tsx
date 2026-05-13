import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/economyStyles.css'; 

// Resource options helper
const RESOURCE_OPTIONS = [
  'Energy', 'Gas', 'Coal', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 
  'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 
  'Uranium', 'Oil', 'Methane', 'NaturalGas', 'CopperOre', 'GoldOre', 
  'IronOre', 'AluminumOre', 'TitaniumOre', 'PlatinumOre', 'UraniumOre'
].map(res => ({
  value: res,
  // Adds spaces before capital letters (e.g., IronOre -> Iron Ore)
  label: res.replace(/([A-Z])/g, ' $1').trim() 
}));

export function ManagementActions() {
  const { shipments, profile } = useGameData();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  
  const [activeModal, setActiveModal] = useState<'payment' | 'shipment' | 'complete' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

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
    const nationRegex = /^[A-Z]$/;
    if (!nationRegex.test(payNationInput)) {
      setErrorMessage('Error: Nation must be a single capital letter (A-Z).');
      return;
    }
    const { error } = await supabase.rpc('pay_nation', { 
      nation: payNationInput, 
      amount: parseInt(payAmountInput)
    });
    if (error) setErrorMessage(error.message);
    else closeModal();
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

  const ACTIONS = [
    { id: 'shipment', label: 'Create Shipment', count: shipments?.length || 0, tooltip: 'Withdraw resources and load onto a unit', onClick: () => setActiveModal('shipment') },
    { id: 'complete_shipment', label: 'Complete Shipment', count: null, tooltip: 'Deposit unit resources into a destination (Settlement or Unit)', onClick: () => setActiveModal('complete') },
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
            <p className="sub-text">Deduct from active shipment and deposit into a target (Settlement, Facility, or Unit).</p>
            <form onSubmit={handleCompleteShipment}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Shipment ID</label>
                  <input type="number" value={completeForm.shipmentId} onChange={(e) => setCompleteForm({...completeForm, shipmentId: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Amount to Deposit</label>
                  <input type="number" placeholder="Partial or full amount" value={completeForm.amount} onChange={(e) => setCompleteForm({...completeForm, amount: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Destination Nation (A-Z)</label>
                  <input type="text" maxLength={1} value={completeForm.destinationNation} onChange={(e) => setCompleteForm({...completeForm, destinationNation: e.target.value.toUpperCase()})} required />
                </div>
                <div className="input-group">
                  <label>Destination Type</label>
                  <input type="text" placeholder="Unit, City, Mine, etc." value={completeForm.destinationType} onChange={(e) => setCompleteForm({...completeForm, destinationType: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Target type_id / Unit ID</label>
                  <input type="number" value={completeForm.destinationId} onChange={(e) => setCompleteForm({...completeForm, destinationId: e.target.value})} required />
                </div>
              </div>
              {errorMessage && <p className="error-text">{errorMessage}</p>}
              <div className="modal-actions" style={{ marginTop: '15px' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Finalize</button>
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
                {/* DROPDOWN STARTS HERE */}
                <div className="input-group">
                  <label>Resource</label>
                  <select 
                    value={shipmentForm.resource} 
                    onChange={(e) => setShipmentForm({...shipmentForm, resource: e.target.value})} 
                    required
                    className="modal-select" // Assumed style in economyStyles.css
                  >
                    <option value="" disabled>Select Resource</option>
                    {RESOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* DROPDOWN ENDS HERE */}
                
                <div className="input-group">
                  <label>Amount</label>
                  <input type="number" value={shipmentForm.amount} onChange={(e) => setShipmentForm({...shipmentForm, amount: e.target.value})} required />
                </div>
                
                <div className="input-group">
                  <label>Origin Type (e.g. City, Mine)</label>
                  <input type="text" placeholder="Subtype name" value={shipmentForm.originType} onChange={(e) => setShipmentForm({...shipmentForm, originType: e.target.value})} required />
                </div>

                <div className="input-group">
                  <label>Origin type_id</label>
                  <input type="number" value={shipmentForm.originId} onChange={(e) => setShipmentForm({...shipmentForm, originId: e.target.value})} required />
                </div>

                <hr style={{ gridColumn: 'span 2', width: '100%', margin: '10px 0', borderColor: '#444' }} />

                <div className="input-group">
                  <label>Shipping Unit Type</label>
                  <input type="text" placeholder="Truck, Cargo Ship, etc." value={shipmentForm.unitType} onChange={(e) => setShipmentForm({...shipmentForm, unitType: e.target.value})} required />
                </div>

                <div className="input-group">
                  <label>Shipping Unit type_id</label>
                  <input type="number" value={shipmentForm.unitId} onChange={(e) => setShipmentForm({...shipmentForm, unitId: e.target.value})} required />
                </div>

                <div className="input-group">
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