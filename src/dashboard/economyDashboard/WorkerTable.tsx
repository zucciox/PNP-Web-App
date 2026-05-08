import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import { Unit, Facility } from '../../types'; 
import '../../styles/economyStyles.css';

export function WorkersTable() {
  const { units, facilities } = useGameData();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  const [newFacilityType, setNewFacilityType] = useState('');
  const [newFacilityId, setNewFacilityId] = useState<number | ''>('');
  const [modalError, setModalError] = useState<string | null>(null);

  /**
   * Look up the facility name from the Facilities table
   * Format: <facility_type> #<type_id>
   */
  const getFacilityDisplay = (workedFacilityId: number) => {
    if (!workedFacilityId) return "Unassigned";
    
    const facility = facilities.find((f: Facility) => f.global_id === workedFacilityId);
    
    if (!facility) return `Facility #${workedFacilityId}`;
    
    return `${facility.facility_type} #${facility.type_id}`;
  };

  const handleReassign = async () => {
    if (!activeUnit || newFacilityId === '') return;
    setModalError(null);

    const { error } = await supabase.rpc('reassign_workers', {
      p_worker_id: activeUnit.type_id,
      p_nation_id: activeUnit.nation_id, 
      p_new_facility_type: newFacilityType,
      p_new_facility_id: Number(newFacilityId)
    });

    if (error) {
      setModalError(`Reassignment failed: ${error.message}`);
    } else {
      closeModal();
    }
  };

  const openModal = (unit: Unit) => {
    setActiveUnit(unit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveUnit(null);
    setNewFacilityType('');
    setNewFacilityId('');
    setModalError(null);
  };

  return (
    <div className="summary-container" style={{ padding: '1rem' }}>
      <h2 className="consumption-header">Worker Management</h2>

      <div className="scroll-area">
        <div className="facility-grid">
          {units
            .filter((unit: Unit) => unit.unit_type === "Worker")
            .map((unit: Unit) => (
              <div key={`${unit.nation_id}-${unit.type_id}`} className="facility-card-wrapper">
                <div className="facility-card">
                  <div className="facility-card-header">
                    <span style={{ color: '#bb86fc', fontWeight: 'bold' }}>
                      {unit.unit_type}
                    </span>
                    <span className="settlement-id">ID: {unit.type_id}</span>
                  </div>

                  <div className="card-body" style={{ padding: '1rem 0' }}>
                    <div className="production-info">
                      <span className="sub-text">working facility</span>
                      <div style={{ color: '#58b7e6', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {getFacilityDisplay(unit.worked_facility)}
                      </div>
                    </div>
                  </div>

                  <div className="card-overlay">
                    <button 
                      onClick={() => openModal(unit)}
                      className="btn-enable"
                      style={{ backgroundColor: '#bb86fc' }}
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Reassignment Dialogue */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Reassign {activeUnit?.unit_type} #{activeUnit?.type_id}</h4>
            
            {/* Dialogue Error Display */}
            {modalError && (
              <div className="error-text" style={{ marginBottom: '1rem', borderLeft: '2px solid #ff4444', paddingLeft: '8px' }}>
                {modalError}
              </div>
            )}

            <div className="input-group">
              <label>Facility Type</label>
              <input 
                type="text" 
                placeholder="e.g. Fishing Boat"
                value={newFacilityType}
                onChange={(e) => setNewFacilityType(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Facility ID</label>
              <input 
                type="number" 
                placeholder="Enter ID"
                value={newFacilityId}
                onChange={(e) => setNewFacilityId(e.target.value === '' ? '' : parseInt(e.target.value))}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={handleReassign}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}