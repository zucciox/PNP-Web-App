import React from 'react';
import { Settlement } from '../../types';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

const formatResourceValue = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export function ConsumptionRatesTable() {
  const { settlements } = useGameData();

  /**
   * By using 'keyof Settlement', we ensure the keys exist.
   * We use an explicit type assertion 'as number' in the map below 
   * to handle the Index Signature conflict.
   */
  const resourceMap: { key: keyof Settlement; label: string }[] = [
    { key: 'treasury_cr', label: 'Money' },
    { key: 'energy_cr', label: 'Energy' },
    { key: 'gas_cr', label: 'Gas' },
    { key: 'coal_cr', label: 'Coal' },
    { key: 'fuel_cr', label: 'Fuel' },
    { key: 'water_cr', label: 'Water' },
    { key: 'food_cr', label: 'Food' },
    { key: 'oxygen_cr', label: 'Oxygen' },
    { key: 'steel_cr', label: 'Steel' },
    { key: 'aluminum_cr', label: 'Aluminum' },
    { key: 'copper_cr', label: 'Copper' },
    { key: 'platinum_cr', label: 'Platinum' },
    { key: 'titanium_cr', label: 'Titanium' },
    { key: 'gold_cr', label: 'Gold' },
    { key: 'diamond_cr', label: 'Diamond' },
    { key: 'uranium_cr', label: 'Uranium' },
  ];

  return (
    <section className="summary-container">
      <h3>
        Settlement Consumption Rates
      </h3>
      
      <div className="settlement-grid">
        {settlements.map((s, index) => (
          <div key={index} className="settlement-card">
            <div className="settlement-title">
              <span>{s.name}</span>
              <span className="settlement-id">ID: {index}</span>
            </div>

            <div className="resource-grid">
              {resourceMap.map((res) => (
                <div key={res.key} className="resource-item">
                  <span className="resource-label">{res.label}</span>
                  <span className="resource-value">
                    {/* Casting to number here because the Settlement interface 
                        allows both string | number via its index signature.
                    */}
                    -{formatResourceValue(s[res.key] as number)} 
                    <small className="resource-unit"> /cycle</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}