import React, { useMemo } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/storeStyles.css';

export function ActiveOrders() {
  const { orders, facilities } = useGameData();

  const processingOrders = useMemo(() => {
    if (!orders || !facilities) return [];

    return orders
      // Filter for orders that still have time remaining
      .filter(order => order.intervals_remaining > 0)
      .map(order => {
        const factory = facilities.find(f => f.global_id === order.facility_id);
        
        return {
          ...order,
          facilityName: factory 
            ? `${factory.facility_type} #${factory.type_id}` 
            : `Unknown Facility`,
          // We map the value directly now
          ticksLeft: order.intervals_remaining
        };
      })
      // Sort by smallest intervals_remaining first (soonest to finish)
      .sort((a, b) => a.intervals_remaining - b.intervals_remaining);
  }, [orders, facilities]);

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
                  <span className="order-status-tag">
                    {order.ticksLeft} {order.ticksLeft === 1 ? 'Interval' : 'Intervals'} Remaining
                  </span>
                </div>
                
                <div className="order-facility-sub">
                  At {order.facilityName}
                </div>

                <div className="order-progress-container">
                  {/* Indeterminate bar used since we lack the original start_interval for a % calculation */}
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