import React, { useState } from 'react';
import { useGameData } from '../GameContext';
import { supabase } from '../supabaseClient';

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center',
  alignItems: 'center', zIndex: 9999, padding: '20px'
};

const MODAL_STYLE: React.CSSProperties = {
  backgroundColor: '#1a1a1a', border: '2px solid #ff4d4d', padding: '30px',
  borderRadius: '8px', maxWidth: '600px', width: '100%', textAlign: 'center', 
  boxShadow: '0 0 20px rgba(255, 77, 77, 0.3)'
};

const BUTTON_CONTAINER: React.CSSProperties = { 
  display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' 
};

const ACCEPT_BTN: React.CSSProperties = { 
  backgroundColor: '#00ff88', color: 'black', border: 'none', padding: '12px 24px', 
  fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' 
};

const DISPUTE_BTN: React.CSSProperties = { 
  backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '12px 24px', 
  fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' 
};

const DISABLED_STYLE: React.CSSProperties = {
  opacity: 0.5, cursor: 'not-allowed'
};

export default function CombatAlert() {
  const { combat, nationId, units, settlements, facilities } = useGameData();
  const [loading, setLoading] = useState(false);

  // Find the first unresolved and non-disputed exchange where the user is the victim
  const activeConflict = combat?.find(c => 
    !c.is_resolved && 
    !c.is_disputed && 
    c.victim_nation === nationId
  );

  if (!activeConflict) return null;

  // 1. Resolve Victim Label using correct schema keys
  const victimUnit = units.find(u => u.global_id === activeConflict.victim_piece);
  const victimFacility = facilities.find(f => f.global_id === activeConflict.victim_piece);
  const victimSettlement = settlements.find(s => s.global_id === activeConflict.victim_piece);

  let victimLabel = "Unknown Target";
  if (victimUnit) {
    victimLabel = `${victimUnit.unit_type} (ID: ${victimUnit.type_id})`;
  } else if (victimFacility) {
    victimLabel = `${victimFacility.facility_type} (ID: ${victimFacility.type_id})`;
  } else if (victimSettlement) {
    victimLabel = `${victimSettlement.settlement_type} (ID: ${victimSettlement.type_id})`;
  }

  // 2. Logic to call the RPC
  const handleResponse = async (isDisputing: boolean) => {
    if (loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('respond_exchange', {
        p_exchange_id: activeConflict.id,
        p_is_disputing: isDisputing
      });

      if (error) {
        console.error("Combat Response Error:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.log("Combat Response Success:", data);
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={OVERLAY_STYLE}>
      <div style={MODAL_STYLE}>
        <h2 style={{ color: '#ff4d4d', marginTop: 0 }}>INCOMING ATTACK!</h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#fff' }}>
          Your <strong style={{ color: '#00ff88' }}>{victimLabel}</strong> was attacked by 
          an enemy <strong style={{ color: '#ff4d4d' }}>{activeConflict.aggressor_label}</strong> from 
          Nation <strong>{activeConflict.aggressor_nation}</strong> for 
          <strong style={{ fontSize: '22px' }}> {activeConflict.damage} </strong> damage.
        </p>

        <div style={BUTTON_CONTAINER}>
          <button 
            style={loading ? { ...ACCEPT_BTN, ...DISABLED_STYLE } : ACCEPT_BTN} 
            onClick={() => handleResponse(false)}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "ACCEPT EXCHANGE"}
          </button>
          <button 
            style={loading ? { ...DISPUTE_BTN, ...DISABLED_STYLE } : DISPUTE_BTN} 
            onClick={() => handleResponse(true)}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "DISPUTE EXCHANGE"}
          </button>
        </div>
        
        <p style={{ fontSize: '12px', color: '#888', marginTop: '20px' }}>
          {activeConflict.is_disputed 
            ? "This exchange is currently under review." 
            : "Disputing will freeze this exchange and notify a moderator for manual review."}
        </p>
      </div>
    </div>
  );
}