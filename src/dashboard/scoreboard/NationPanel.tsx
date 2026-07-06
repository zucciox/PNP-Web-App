import React from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 
import { EventType, GameFeed } from '../../types';
import { additiveTextColor, nationColors, negativeTextColor } from '../../styleConstants';

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
  'admin_decision': 'Admin Decisions',
};

export default function NationPanel() {

  const { eventTypes, scoreBreakdown } = useGameData();
  const { nation } = useGameData();
  const grandTotal = scoreBreakdown['grand_total'] || 0;

  return (
    <section className='dashboard-root'>
      <div style={{minHeight: '90vh', backgroundColor: '#111', zIndex: '600', width: '250px', height: '85vh'}} className="admin-notification-container">
        <div className="admin-notification-header">
          <span className="admin-notification-title">Nation {nation?.id || '?'} Points</span>
          <div className="info-icon">
              ?
              <div className="tooltip" style={{left: '-20px', width: '450px'}}>
                <div style={{marginBottom: '12px'}}>Points are the primary measure of your nation's success. You can earn or lose points in the following ways:</div>
                
                <table className="tooltip-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Description</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Internal Shipment</td>
                      <td>Made & Delivered within your nation</td>
                      <td className="pos-val">+1</td>
                    </tr>
                    <tr>
                      <td>External Shipment</td>
                      <td>Delivered outside your nation</td>
                      <td className="pos-val">+3</td>
                    </tr>
                    <tr>
                      <td>Unit Lost</td>
                      <td>Military or civilian units lost</td>
                      <td className="neg-val">- Unit's Tier</td>
                    </tr>
                    <tr>
                      <td>Facility Lost</td>
                      <td>Facilities destroyed or lost</td>
                      <td className="neg-val">-4 to -10</td>
                    </tr>
                    <tr>
                      <td>Settlement Lost</td>
                      <td>Loss of towns / cities / capital</td>
                      <td className="neg-val">-10 / -20 / -30</td>
                    </tr>
                    <tr>
                      <td>Unit Built</td>
                      <td>Newly constructed units</td>
                      <td className="pos-val">+ Build Time (intervals)</td>
                    </tr>
                    <tr>
                      <td>Facility Built</td>
                      <td>Newly constructed facilities</td>
                      <td className="pos-val">+ Build Time (intervals)</td>
                    </tr>
                    <tr>
                      <td>Settlement Built</td>
                      <td>Newly founded towns / cities</td>
                      <td className="pos-val">+10 / +20</td>
                    </tr>
                    <tr>
                      <td>Missed Consumption Rate</td>
                      <td>Failed to meet settlement consumption rates</td>
                      <td className="neg-val">-3</td>
                    </tr>
                    <tr>
                      <td>Fulfilled Consumption Rate</td>
                      <td>Met settlement consumption rates</td>
                      <td className="pos-val">+1</td>
                    </tr>
                    <tr>
                      <td>Interval in Debt</td>
                      <td>Active intervals spent in treasury debt</td>
                      <td className="neg-val">-2 per interval</td>
                    </tr>
                    <tr>
                      <td>Industrial Index</td>
                      <td>Sum of all active factory tiers. Awarded each cycle.</td>
                      <td className="pos-val">+ Factory Tiers</td>
                    </tr>
                    <tr>
                      <td>Population Index</td>
                      <td>Total number of workers. Awarded each cycle.</td>
                      <td className="pos-val">+ Workers / 2</td>
                    </tr>
                    <tr>
                      <td>Resource Refined</td>
                      <td>Materials successfully refined</td>
                      <td className="pos-val">+1 per resource</td>
                    </tr>
                    <tr>
                      <td>Admin Decision</td>
                      <td>Discretionary adjustments by admin</td>
                      <td className="neutral-val">Variable</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </div>
        <div className='score-pill' style={{borderColor: nationColors[nation?.id || 'A'], margin: '10px'}}> Total Points: {grandTotal} </div>
        
        <div style={{paddingTop: '10px', paddingLeft: '20px'}}>
          {eventTypes.map((event: EventType) => {
              const score = scoreBreakdown[event.event_type] || 0;
              const displayName = eventNatName[event.event_type] || event.event_type;
              
              const textColor = score > 0 
                ? additiveTextColor 
                : (score < 0 ? negativeTextColor : 'white');

              return (
                <div key={event.event_type} style={{color: textColor, paddingBottom: '10px', fontSize: 'normal' }}>
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

function GameFeedView() {
    const { gameFeed, nation } = useGameData();
    const filtered = gameFeed
      .filter((event: GameFeed) => event.nation === nation?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
    return (
      <div className="admin-notification-container" style={{minHeight: '90vh', backgroundColor: '#111', zIndex: '501', height: '85vh'}}>
        <div className="admin-notification-header">
          <span className="admin-notification-title">Nation {nation?.id} Game Feed ({filtered.length} events)</span>
          <div className="info-icon">
              ?
              <div className="tooltip" style={{left: '-20px'}}>
                The game feed shows all recent game events associated with your nation. This is useful for resolving disputes over past events.
              </div>
          </div>
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


