import React from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 
import { EventType, GameFeed } from '../../types';
import { additiveTextColor, negativeTextColor } from '../../styleConstants';

const eventNatName: Record<string, string> = {
  'internal_shipment': 'Internal Shipments',
  'external_shipment': 'External Shipments',
  'unit_lost': 'Units Lost',
  'facility_lost': 'Facilities Lost',
  'settlement_lost': 'Settlements Lost',
  'unit_built': 'Units Built',
  'facility_built': 'Facilities Built',
  'settlement_built': 'Settlements Built',
  'cr_missed': 'Missed Consumption Rates',
  'cr_made': 'Fulfilled Consumption Rates',
  'in_debt': 'Intervals in debt',
  'industrial_index': 'Industrial Index',
  'population_index': 'Population Index',
  'resource_refined': 'Resources Refined',
};

export default function Scoreboard() {
  // Pulling scoreBreakdown straight from context instead of local reduce loops
  const { eventTypes, scoreBreakdown } = useGameData();

  const grandTotal = scoreBreakdown['grand_total'] || 0;

  return (
    <section className='dashboard-root'>
      <div className='summary-container' style={{height: '90vh', padding: '10px', width: '300px'}}>
        <h1 style={{textAlign: 'center'}}>POINTS</h1>
        <div className='score-pill'> Total Points: {grandTotal} </div>
        
        <div style={{paddingTop: '10px', paddingLeft: '20px'}}>
          {eventTypes.map((event: EventType) => {
              // Direct dynamic lookup by event type key
              const score = scoreBreakdown[event.event_type] || 0;
              const displayName = eventNatName[event.event_type] || event.event_type;
              
              // Set conditional styles cleanly using the breakdown numbers
              const textColor = score > 0 
                ? additiveTextColor 
                : (score < 0 ? negativeTextColor : 'white');

              return (
                <div key={event.event_type} style={{color: textColor, paddingBottom: '5px'}}>
                  {score > 0 && '+'}{score} from {displayName}
                </div>
              );
            })}
        </div>
      </div>
      <GameFeedView/>
    </section>
  );
}

// Left intact exactly as requested
function GameFeedView() {
    const { gameFeed, nation } = useGameData();
    const filtered = gameFeed
      .filter((event: GameFeed) => event.nation === nation?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
    return (
      <div className="admin-notification-container" style={{minHeight: '90vh', backgroundColor: '#111'}}>
        <div className="admin-notification-header">
          <span className="admin-notification-title">Game Feed ({filtered.length} events)</span>
        </div>
        <div className="admin-notification-body">
          {filtered.length === 0 ? (
            <div className="admin-notification-empty">No game events</div>
          ) : (
            filtered.map(n => (
              <div 
                key={n.id} style={{display: 'block'}} className="admin-notification-item">
                <div className="admin-notification-item-body">{n.body}</div>
                <div>
                    Interval: {n.interval} | Cycle: {n.cycle} |
                    <span style={{color: n.point_value > 0 ? 'green' : 'red'}}>
                        {' Points: '} 
                        {(n.point_value) > 0 && '+'} 
                        {(n.point_value)}
                    </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
}