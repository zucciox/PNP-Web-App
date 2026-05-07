import React, { useMemo } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/storeStyles.css';

export function ActiveOrders() {
  const { orders, facilities, gameState } = useGameData();
  const currentInterval = gameState?.interval || 0;

  const processingOrders = useMemo(() => {
    if (!orders || !facilities) return [];

    return orders
      .filter(order => order.target_interval > currentInterval)
      .map(order => {
        const factory = facilities.find(f => f.global_id === order.facility_id);
        
        // Logic: (Current / Target) would be inaccurate if we don't know start_interval.
        // If your DB doesn't track start_interval, we show remaining ticks or a generic active state.
        // Assuming a standard "ticks remaining" approach:
        const ticksLeft = order.target_interval - currentInterval;
        
        return {
          ...order,
          facilityName: factory 
            ? `${factory.facility_type} #${factory.type_id}` 
            : `Unknown Facility`,
          ticksLeft
        };
      })
      .sort((a, b) => a.target_interval - b.target_interval); // Sooner completions first
  }, [orders, facilities, currentInterval]);

  return (
    <div className="store-container sidebar-variant">
      <header className="store-header">
        Active Orders
        <span className="order-count">{processingOrders.length}</span>
      </header>

      <div className="store-body">
        {processingOrders.length === 0 ? (
          <p className="no-items">No orders in production.</p>
        ) : (
          <div className="order-list">
            {processingOrders.map((order) => (
              <div key={order.order_id} className="purchase-card active-order-card">
                <div className="order-header">
                  <span className="card-name">{order.piece_type}</span>
                  <span className="order-status-tag">{order.ticksLeft} Intervals Until Completion</span>
                </div>
                
                <div className="order-facility-sub">
                  At {order.facilityName}
                </div>

                <div className="order-progress-container">
                  {/* Since we only have target_interval, we use a pulsed "active" bar */}
                  <div className="order-progress-bar indeterminate"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}