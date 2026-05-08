import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/economyStyles.css'; 

export function ManagementActions() {
  const { shipments } = useGameData();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  
  const [activeModal, setActiveModal] = useState<'payment' | 'shipment' | 'complete' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [payNationInput, setPayNationInput] = useState('');
  const [payAmountInput, setPayAmountInput] = useState('');

  const initialShipmentState = {
    resource: '',
    amount: '', 
    originId: '',
    originType: 'facility',
    originFacilityType: '',
    originNation: '', 
    unitId: '',        // This maps to the unit's type_id
    unitType: '',      // Added: The specific type of unit (e.g., Truck)
    destination: '', 
    notes: ''
  };

  const [shipmentForm, setShipmentForm] = useState(initialShipmentState);

  const [completeForm, setCompleteForm] = useState({
    shipmentId: '',
    destinationId: '',
    destinationType: 'facility',
    destinationFacilityType: '',
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
      destinationId: '', 
      destinationType: 'facility',
      destinationFacilityType: '',
      destinationNation: ''
    });
  };

  const handleCompleteShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const { error } = await supabase.rpc('complete_shipment', { 
      p_shipment_id: parseInt(completeForm.shipmentId),
      p_destination_id: parseInt(completeForm.destinationId),
      p_destination_type: completeForm.destinationType,
      p_destination_facility_type: completeForm.destinationType === 'facility' ? completeForm.destinationFacilityType : null,
      p_destination_nation: completeForm.destinationType === 'facility' ? completeForm.destinationNation : null
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
    const nationRegex = /^[A-Z]$/;
    if (!nationRegex.test(shipmentForm.originNation)) {
      setErrorMessage('Error: Origin Nation must be a single capital letter (A-Z).');
      return;
    }

    const { error } = await supabase.rpc('create_shipment', { 
      p_resource: shipmentForm.resource,
      p_amount: parseInt(shipmentForm.amount), 
      p_origin_id: parseInt(shipmentForm.originId), 
      p_origin_type: shipmentForm.originType,
      p_origin_nation: shipmentForm.originNation, 
      p_unit_id: parseInt(shipmentForm.unitId),       // Passes type_id
      p_unit_type: shipmentForm.unitType,             // Passes unit_type
      p_destination: shipmentForm.destination, 
      p_notes: shipmentForm.notes,
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

      {/* Complete Shipment Modal */}
      {activeModal === 'complete' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Complete Shipment</h4>
            <form onSubmit={handleCompleteShipment}>
              <div className="input-group">
                <label>Shipment ID</label>
                <input type="number" value={completeForm.shipmentId} onChange={(e) => setCompleteForm({...completeForm, shipmentId: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Destination Type</label>
                <select 
                  className="modal-select"
                  value={completeForm.destinationType} 
                  onChange={(e) => setCompleteForm({...completeForm, destinationType: e.target.value})}
                >
                  <option value="facility">Facility</option>
                  <option value="settlement">Settlement</option>
                </select>
              </div>

              {completeForm.destinationType === 'facility' && (
                <>
                  <div className="input-group">
                    <label>Destination Nation (A-Z)</label>
                    <input 
                      type="text" 
                      maxLength={1} 
                      value={completeForm.destinationNation} 
                      onChange={(e) => setCompleteForm({...completeForm, destinationNation: e.target.value.toUpperCase()})} 
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <label>Facility Type (e.g. Mine)</label>
                    <input 
                      type="text" 
                      value={completeForm.destinationFacilityType} 
                      onChange={(e) => setCompleteForm({...completeForm, destinationFacilityType: e.target.value})} 
                      required 
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <label>{completeForm.destinationType === 'facility' ? 'Target type_id' : 'Target global_id'}</label>
                <input type="number" value={completeForm.destinationId} onChange={(e) => setCompleteForm({...completeForm, destinationId: e.target.value})} required />
              </div>

              {errorMessage && <p className="error-text">{errorMessage}</p>}
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Finalize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
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

      {/* Create Shipment Modal (Updated) */}
      {activeModal === 'shipment' && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <h4>Logistics Shipment</h4>
            <form onSubmit={handleCreateShipment}>
              <div className="form-grid">
                <div className="input-group">
                  <label>Resource Column (e.g. Steel)</label>
                  <input type="text" placeholder="Casing must match DB" value={shipmentForm.resource} onChange={(e) => setShipmentForm({...shipmentForm, resource: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Origin Nation (A-Z)</label>
                  <input type="text" maxLength={1} value={shipmentForm.originNation} onChange={(e) => setShipmentForm({...shipmentForm, originNation: e.target.value.toUpperCase()})} required />
                </div>
                <div className="input-group">
                  <label>Amount</label>
                  <input type="number" value={shipmentForm.amount} onChange={(e) => setShipmentForm({...shipmentForm, amount: e.target.value})} required />
                </div>
                
                <div className="input-group">
                  <label>Origin Type</label>
                  <select 
                    className="modal-select"
                    value={shipmentForm.originType} 
                    onChange={(e) => setShipmentForm({...shipmentForm, originType: e.target.value})}
                  >
                    <option value="facility">Facility</option>
                    <option value="settlement">Settlement</option>
                  </select>
                </div>

                {shipmentForm.originType === 'facility' && (
                  <div className="input-group">
                    <label>Facility Type</label>
                    <input type="text" placeholder="Mine, Factory, etc." value={shipmentForm.originFacilityType} onChange={(e) => setShipmentForm({...shipmentForm, originFacilityType: e.target.value})} required />
                  </div>
                )}

                <div className="input-group">
                  <label>{shipmentForm.originType === 'facility' ? 'Origin type_id' : 'Origin global_id'}</label>
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