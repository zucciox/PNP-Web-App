import React from 'react';
import { resourceStockpileData } from '../../types';

interface ResourceStockpileTableProps {
  resourceStockpileData: resourceStockpileData[];
}

/**
 * Formats large numbers into a readable "K" format.
 */
const formatResourceValue = (value: number): string | number => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value;
};

export function ResourceStockpileTable({ resourceStockpileData }: ResourceStockpileTableProps) {
  const resources = [
    'Food', 'Water', 'Fuel', 'Coal', 'Gas', 'Energy',
    'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 
    'Gold', 'Diamond', 'Uranium', 'Oxygen'
  ];

  return (
    <section className="resource-container">
      <h2 className="section-title">National Resource Stockpiles</h2>
      
      <div className="nation-grid">
        {resourceStockpileData.map((nation, index) => (
          <div key={nation.nation_id || index} className="nation-card">
            <header className="nation-card-header">
              <h3>{nation.nation_id ? `Nation: ${nation.nation_id}` : `Region ${index + 1}`}</h3>
            </header>
            
            <table className="resource-table">
              <thead>
                <tr>
                  <th align="center">Resource</th>
                  <th align="center">Amount</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((res) => {
                  const key = res as keyof resourceStockpileData;
                  const rawValue = (nation[key] as number) ?? 0;
                  console.log(resourceStockpileData)
                  
                  return (
                    <tr key={res}>
                      <td className="stat-label">{res}</td>
                      <td className={`stat-value ${rawValue > 0 ? 'positive' : 'empty'}`} align="center">
                        {formatResourceValue(rawValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}