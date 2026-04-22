import React from 'react';
import { resourceStockpileData } from '../../types';

interface ResourceStockpileTableProps {
  resourceStockpileData: resourceStockpileData;
}

const formatResourceValue = (value: number): string | number => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value;
};

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520'
};

const RESOURCES = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy'
];

export function ResourceStockpileTable({ resourceStockpileData }: ResourceStockpileTableProps) {
  return (
    <section className="max-w-4xl mx-auto p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <header className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
          National Inventory
        </h2>
        <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">
          Real-time Stockpile Management
        </p>
      </header>

      <div className="grid grid-cols-3 gap-y-6 gap-x-4">
        {RESOURCES.map((res) => {
          // Ensure these keys match your database/interface exactly
          const dbKey = res as keyof resourceStockpileData;
          const rawValue = (resourceStockpileData[dbKey] as number) ?? 0;
          const labelColor = resourceColors[res] || '#333';

          return (
            <div 
              key={res} 
              className="flex flex-col border-l-2 pl-3 transition-all hover:bg-gray-50 py-1"
              style={{ borderLeftColor: labelColor }}
            >
              <span className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: labelColor }}>
                {res}
              </span>
              <span className={`text-2xl font-mono font-bold leading-none ${rawValue > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {formatResourceValue(rawValue)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}