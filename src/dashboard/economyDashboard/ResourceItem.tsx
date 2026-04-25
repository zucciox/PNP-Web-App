import React from 'react';
import '../../styles/ResourceStyles.css';


interface ResourceItem {
  label: string;
  value: string | number;
  color?: string;
}

interface ResourceDisplayProps {
  items: ResourceItem[];
  valueColor?: string;
}

export function ResourceStatGrid({ items }: ResourceDisplayProps) {
  return (
    <div className="stats-container">
      {items.map((item) => (
        <div key={item.label} className="stat-row">
          <span className="stat-label" style={{ color: item.color }}>
            {item.label}
          </span>
          <span className="stat-value" style={{ color: '#d11515'|| '#03da3c' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}