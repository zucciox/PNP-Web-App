import React from 'react';
import { resourceStockpileData } from '../../types';

interface ResourceStockpileTableProps {
  resourceStockpileData: resourceStockpileData[];
}

export function ResourceStockpileTable({ resourceStockpileData }: ResourceStockpileTableProps) {
  // Organized list of new resource columns
  const resources = [
    'Food', 'Water', 'Fuel', 'Coal', 'Gas', 'Energy',
    'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 
    'Gold', 'Diamond', 'Uranium', 'Oxygen'
  ];

  return (
    <section>
      <h2>National Resource Stockpiles</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {/* Keeping a primary identifier column is usually helpful */}
              <th>Nation ID</th> 
              {resources.map((res) => (
                <th key={res}>{res}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resourceStockpileData.map((f, index) => (
              <tr key={index}>
                {/* Adjust 'f.owner_nation' to whatever your primary row ID is */}
                <td>{f.nation_id || `Row ${index + 1}`}</td>
                {resources.map((res) => (
                  <td key={res}>
                    {/* Dynamically accessing the property. 
                      Note: You may need to ensure your 'NationData' type 
                      supports these keys (e.g., f['Steel']) 
                    */}
                    {f[res.toLowerCase().replace(/ /g, '_') as keyof resourceStockpileData] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}