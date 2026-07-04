import React, { useState, useEffect } from 'react';
import { Shipment } from '../../types'; 
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 
import { supabase } from '../../supabaseClient';
import { ManagementActions } from './ManagementActions';

export function ShipmentsTable() {
  const { shipments, units, facilityTypes, unitTypes } = useGameData();
  
  const [showDeliver, setShowDeliver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completeForm, setCompleteForm] = useState({ shipmentId: '', amount: '', destinationId: '', destinationType: '', destinationNation: ''});
  const selectedShipment = shipments?.find(s => s.shipment_id === parseInt(completeForm.shipmentId));

  const [settlementTypes, setSettlementTypes] = useState<any[]>([]);
  useEffect(() => {
    if (!showDeliver) return;
    supabase.from('settlement_types').select('*').then(({ data }) => setSettlementTypes(data ?? []));
  }, [showDeliver]);

  const availableForNation = (t: any) => !t.proprietary_nation || t.proprietary_nation === completeForm.destinationNation;

  const closeModal = () => {
  setShowDeliver(false);
  setErrorMessage('');
  setCompleteForm({ shipmentId: '', amount: '', destinationId: '', destinationType: '', destinationNation: '' });
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

  return (
    <section className="summary-container" style={{height: '87vh'}}>
      <ManagementActions/>
        <header
        className="consumption-header" style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
        <h3 className="settlement-title" style={{ margin: 0 }}>Active Shipments</h3>
        <span className="sub-text">{shipments.length} Total</span>
        <button className="btn-primary" onClick={() => setShowDeliver(true)}>
          Deliver International Shipment
        </button>
      </header>

      <div className="facility-grid" style={{ marginTop: '1rem' }}>
        {shipments.map((s) => (
          <ShipmentCard key={s.shipment_id} shipment={s} />
        ))}
      </div>
      
      {showDeliver && (
  <div className="modal-overlay">
    <div className="modal-content modal-large">
      <h4>Deliver International Shipment</h4>
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
              onChange={(e) => setCompleteForm({...completeForm, destinationNation: e.target.value.toUpperCase(), destinationType: ''})}
              required 
            />
          </div>

          {/* BACK TO TEXT INPUT */}
          <div className="input-group">
            <label>Destination Piece Type</label>
            <select
              className="modal-select"
              required
              disabled={!completeForm.destinationNation}
              value={completeForm.destinationType}
              onChange={(e) => setCompleteForm({ ...completeForm, destinationType: e.target.value })}
            >
              <option value="" disabled>
                {completeForm.destinationNation ? 'Select a type…' : 'Choose destination nation first'}
              </option>
              <optgroup label="Facilities">
                {facilityTypes.filter(availableForNation).map((f) => (
                  <option key={`f-${f.facility_type}`} value={f.facility_type}>{f.facility_type}</option>
                ))}
              </optgroup>
              <optgroup label="Settlements">
                {settlementTypes.filter(availableForNation).map((s) => (
                  <option key={`s-${s.settlement_type}`} value={s.settlement_type}>{s.settlement_type}</option>
                ))}
              </optgroup>
              <optgroup label="Units">
                {unitTypes.filter(availableForNation).map((u) => (
                  <option key={`u-${u.unit_type}`} value={u.unit_type}>{u.unit_type}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="input-group">
            <label>Destination Piece Number (their type_id)</label>
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
      

    </section>
  );
}

function ShipmentCard({ shipment: s }: { shipment: Shipment }) {
  const { units } = useGameData(); // Access units to perform the lookup
  const [isHovered, setIsHovered] = useState(false);

  // Cross-reference: Find the unit where global_id matches the shipment's unit_id
  const matchingUnit = units?.find(u => u.global_id === s.unit_id);
  
  // Use the type_id if found, otherwise fallback to the global_id (s.unit_id)
  const displayId = matchingUnit ? matchingUnit.type_id : s.unit_id;

  return (
    <article 
      className="settlement-card shipment-card-root"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', minHeight: '64px', padding: '6px 8px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div className="facility-card-header" style={{ border: 'none', marginBottom: 0 }}>
          <strong className="settlement-title" style={{ fontSize: '12px', margin: 0 }}>
            {s.amount} {s.resource}
          </strong>
          <span className="settlement-id" style={{ fontFamily: 'monospace' }}>#{s.shipment_id}</span>
        </div>

        <div className="sub-text" style={{ display: 'flex', gap: '4px', alignItems: 'center', color: '#ccc' }}>
          <span className="shipment-truncate" title={s.origin_nation}>{s.origin_nation}</span>
          <span style={{ opacity: 0.3 }}>&rarr;</span>
          <span className="shipment-truncate" title={s.destination}>{s.destination}</span>
        </div>

        {/* Now displaying the cross-referenced type_id */}
        <div className="sub-text" style={{ marginTop: '2px', textTransform: 'uppercase' }}>
          {s.unit_type} {displayId}
        </div>
      </div>

      {s.notes && isHovered && (
        <div className="shipment-notes-overlay">
          <small style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>Notes:</small>
          {s.notes}
        </div>
      )}
    </article>
  );
}