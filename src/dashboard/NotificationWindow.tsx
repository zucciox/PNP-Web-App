import React from 'react';
import { useGameData } from '../GameContext';
import { supabase } from '../supabaseClient'; // Adjust path to your client

export function NotificationWindow({ onClose }: { onClose: () => void }) {
  const { notifications, profile, nationId } = useGameData();
  const isAdmin = profile?.role === 'Admin';

  const filtered = notifications
    .filter(n => {
      if (n.is_resolved) return false;
      const isForMyNation = n.receiving_nation === nationId;
      const isAdminNotif = isAdmin && n.is_admin === true;
      return isForMyNation || isAdminNotif;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleResolve = async (id: number) => {
    try {
      // Direct update instead of RPC
      const { error } = await supabase
        .from('Notifications')
        .update({ is_resolved: true })
        .eq('id', id);

      if (error) throw error;
      
      console.log(`Notification ${id} resolved successfully`);
    } catch (err) {
      console.error("Error resolving notification:", err);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: '60px', right: '20px', width: '350px', maxHeight: '500px',
      backgroundColor: '#262626', border: '1px solid #444', borderRadius: '8px',
      boxShadow: '0px 4px 15px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column',
      color: 'white'
    }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #444', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications ({filtered.length})</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>
      <div style={{ overflowY: 'auto', padding: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No new notifications</div>
        ) : (
          filtered.map(n => (
            <div key={n.id} style={{ 
              backgroundColor: '#333', padding: '10px', borderRadius: '4px', marginBottom: '8px', 
              borderLeft: `4px solid ${n.is_admin ? '#d97706' : '#00ff88'}` 
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{n.header}</div>
              <div style={{ color: '#bbb', fontSize: '13px', margin: '4px 0' }}>{n.body}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleResolve(n.id)}
                  style={{ 
                    backgroundColor: '#444', color: '#fff', border: '1px solid #555', 
                    padding: '4px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' 
                  }}
                >
                  Mark as Read
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}