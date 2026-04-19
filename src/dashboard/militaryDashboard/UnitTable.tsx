import React from 'react';
import { Unit } from '../../types';

// 2. Define the props for the component
interface UnitTableProps {
  units: Unit[];
}

export function UnitTable({ units }: UnitTableProps) {
  return (
    <section>
      <h2>Units</h2>
      <table>
        <thead>q
          <tr>
            <th>Type</th>
            <th>ID</th>
            <th>Health</th>
            <th>Nation ID</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit, index) => (
            <tr key={index}>
              <td>{unit.unit_type}</td>
              <td>{unit.type_id}</td>
              <td>{unit.health}</td>
              <td>{unit.nation_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}