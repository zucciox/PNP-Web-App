import React from 'react';
import { Facility } from '../../types';

interface FacilitySummaryTableProps {
  facilities: Facility[];
}

export function FacilitySummaryTable({ facilities }: FacilitySummaryTableProps) {
  // Aggregate data by Nation AND Facility Type
  const summaryMap = facilities.reduce((acc, f) => {
    // Create a unique key for the combination of Nation and Type
    const key = `${f.owner_nation}_${f.facility_type}`;
    
    if (!acc[key]) {
      acc[key] = {
        nation: f.owner_nation,
        type: f.facility_type,
        count: 0,
        totalOutput: 0,
        outputType: f.output_type || 'N/A'
      };
    }

    acc[key].count += 1;
    acc[key].totalOutput += (f.output_amount_interval || 0);
    
    return acc;
  }, {} as Record<string, { nation: string; type: string; count: number; totalOutput: number; outputType: string }>);

  // Convert the object back into an array and sort by Nation for better readability
  const summaryRows = Object.values(summaryMap).sort((a, b) => 
    a.nation.localeCompare(b.nation)
  );

  return (
    <section>
      <h2>Facility Totals by Nation</h2>
      <table>
        <thead>
          <tr>
            <th>Nation</th>
            <th>Facility Type</th>
            <th>Total Facilities</th>
            <th>Total Output</th>
            <th>Output Type</th>
          </tr>
        </thead>
        <tbody>
          {summaryRows.map((row) => (
            <tr key={`${row.nation}-${row.type}`}>
              <td><strong>{row.nation}</strong></td>
              <td>{row.type}</td>
              <td>{row.count}</td>
              <td>{row.totalOutput.toLocaleString()}</td>
              <td>{row.outputType}</td>
            </tr>
          ))}
          {summaryRows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}