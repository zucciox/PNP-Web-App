import React, { useMemo } from 'react';
import { useState } from 'react';
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
  const { nation, eventTypes, gameFeed } = useGameData();

  const filteredFeed = gameFeed.filter((event: GameFeed) => event.nation === nation?.id)

  const pointTotals = useMemo(() => {

    const totals: Record<string, number> = {
      grand_total: 0,
      internal_shipment: 0,
      external_shipment: 0,
      unit_lost: 0,
      facility_lost: 0,
      settlement_lost: 0,
      facility_built: 0,
      unit_built: 0,
      settlement_built: 0,
      cr_missed: 0,
      cr_made:0,
      in_debt: 0,
      industrial_index: 0,
      population_index: 0,
      resource_refined: 0
    };

    filteredFeed.forEach(e => { 
      totals[e.event_type] += e.point_value ?? 0;
      totals.grand_total += e.point_value ?? 0;
      console.log('grand total' + totals.grand_total);
    })
    
    return totals;
  }, [filteredFeed, nation]);

  return (
    <section className='dashboard-root'>
      <div className='summary-container' style={{height: '90vh', padding: '10px', width: '300px'}}>
        <h1 style={{textAlign: 'center'}}>POINTS</h1>
        <div className='score-pill'> Total Points: {pointTotals.grand_total} </div>
        <div style={{paddingTop: '10px', paddingLeft: '20px'}}>
          {eventTypes.map((event: EventType) => {
              
              return (
                <div key={event.event_type} style={{color: pointTotals[event.event_type] > 0 ? additiveTextColor : (pointTotals[event.event_type] !== 0 ? negativeTextColor : 'white'), paddingBottom: '5px'}}>
                  {pointTotals[event.event_type] > 0 && '+'}{pointTotals[event.event_type] ?? 0} from {eventNatName[event.event_type]}
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
    const { gameFeed, eventTypes, nation } = useGameData();
    const filtered = gameFeed
      .filter((event: GameFeed) => event.nation === nation?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
    return (
      <div className="admin-notification-container" style={{minHeight: '90vh'}}>
        <div className="admin-notification-header">
          <span className="admin-notification-title">Game Feed ({filtered.length})</span>
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