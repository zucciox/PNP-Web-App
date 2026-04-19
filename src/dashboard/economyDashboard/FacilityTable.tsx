import React from 'react';
import { Facility } from '../../types';

// 2. Define the props for the component
interface FacilityTableProps {
  facilities: Facility[];
}

export function FacilityTable({ facilities }: FacilityTableProps) {
  return (
    <section>
      <h2>All Facilities</h2>
      <table>
        <thead>
          <tr>
            <th>Facility Type</th>
            <th>Owner Nation</th>
            <th>Input Type</th>
            <th>Output Type</th>
            <th>Output/Interval</th>
            <th>Needs Workers?</th>
            <th>Workers Assigned</th>
            <th>Mine Level</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map((f, index) => (
            <tr key={index}>
              <td>{f.facility_type}</td>
              <td>{f.owner_nation}</td>
              <td>{f.input_type}</td>
              <td>{f.output_type}</td>
              <td>{f.output_amount_interval}</td>
              <td>{f.needs_workers}</td>
              <td>{f.workers_assigned}</td>
              <td>{f.mine_level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}