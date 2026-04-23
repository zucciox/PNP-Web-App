import React from 'react';
import { Settlement } from '../../types';

interface ConsumptionRatesTableProps {
  settlements: Settlement[];
}

export function ConsumptionRatesTable({ settlements }: ConsumptionRatesTableProps) {
  const resourceMap: { key: keyof Settlement; label: string }[] = [
    { key: 'treasury_cr', label: 'Money' },
    { key: 'energy_cr', label: 'Energy' },
    { key: 'gas_cr', label: 'Gas' },
    { key: 'coal_cr', label: 'Coal' },
    { key: 'fuel_cr', label: 'Fuel' },
    { key: 'water_cr', label: 'Water' },
    { key: 'food_cr', label: 'Food' },
    { key: 'steel_cr', label: 'Steel' },
    { key: 'aluminum_cr', label: 'Aluminum' },
    { key: 'copper_cr', label: 'Copper' },
    { key: 'platinum_cr', label: 'Platinum' },
    { key: 'titanium_cr', label: 'Titatnium' },
    { key: 'gold_cr', label: 'Gold' },
    { key: 'diamond_cr', label: 'Diamond' },
    { key: 'uranium_cr', label: 'Uranium' },
  ];

  return (
    <section style={{ 
      backgroundColor: '#121212', 
      color: '#e0e0e0', 
      padding: '1.5rem',
      borderRadius: '8px',
      fontFamily: 'sans-serif',

      maxHeight: '80vh',      // Limits height so it actually scrolls
      overflowY: 'scroll',    // Forces the vertical scroll track
      overflowX: 'hidden',    // Prevents accidental side-scrolling
      scrollbarWidth: 'thin', // For Firefox
      scrollbarColor: '#444 #1e1e1e' // Thumb and Track for Firefox
    }}>
      <h3 style={{ marginTop: 0, color: '#ffffff', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
        Settlement Consumption Rates
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gap: '1rem', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' 
      }}>
        {settlements.map((s, index) => (
          <div key={index} style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '0.75rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#bb86fc', 
              marginBottom: '0.75rem',
              fontSize: '1.1rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{s.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#666', alignSelf: 'center' }}>ID: {index}</span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '6px' 
            }}>
              {resourceMap.map((res) => (
                <div key={res.key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor: '#252525',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  fontSize: '0.8rem',
                  border: '1px solid #2a2a2a'
                }}>
                  <span style={{ color: '#999', marginRight: '4px' }}>{res.label}</span>
                  <span style={{ color: '#03dac6', fontWeight: '500' }}>{String(s[res.key])}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}