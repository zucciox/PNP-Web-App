import React, { useState } from 'react';
import { useGameData } from '../../GameContext';
import '../../styles/economyStyles.css'; 

const PRIMARY_RESOURCES = [
  'Treasury', 'Steel', 'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 
  'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel', 
  'Coal', 'Gas', 'Energy'
];

const ALL_STORAGE_RESOURCES = [
  'Energy', 'Gas', 'Coal', 'Fuel', 'Water', 'Food', 'Oxygen', 'Steel', 
  'Aluminum', 'Copper', 'Platinum', 'Titanium', 'Gold', 'Diamond', 
  'Uranium', 'Oil', 'Methane', 'NaturalGas', 'CopperOre', 'GoldOre', 
  'IronOre', 'AluminumOre', 'TitaniumOre', 'PlatinumOre', 'UraniumOre'
];

const RAW_RESOURCES = ALL_STORAGE_RESOURCES.filter(res => !PRIMARY_RESOURCES.includes(res));

const resourceColors: Record<string, string> = {
  Energy: '#ffea00', Gas: '#000000', Coal: '#444444', Fuel: '#e3242b',
  Water: '#3d5a99', Food: '#a0522d', Oxygen: '#4a7c36', Steel: '#7a5a30',
  Aluminum: '#7b409e', Copper: '#8b4513', Platinum: '#2d74b3', Titanium: '#58b7e6',
  Gold: '#daa520', Diamond: '#74a1d3', Uranium: '#76a34d', Oil: '#1a1a1a',
  Methane: '#ff5722', NaturalGas: '#4db6ac', CopperOre: '#cd7f32', GoldOre: '#ffd700',
  IronOre: '#8b0000', AluminumOre: '#c0c0c0', TitaniumOre: '#4682b4', PlatinumOre: '#e5e4e2',
  UraniumOre: '#32cd32', Treasury: '#daa520'
};

type TabType = 'primary' | 'raw';

export function ProductionSummaryTable() {
  // Destructure nation from useGameData
  const { facilities, facilityTypes, nation } = useGameData();
  const [activeTab, setActiveTab] = useState<TabType>('primary');

  let activeCount = 0;

  const productionTotals = facilities.reduce((acc, f) => {
    const isActive = f.is_active === true;
  
    if (isActive) {
      activeCount++;
      const typeDef = facilityTypes.find(t => t.facility_type === f.facility_type);
      
      if (typeDef) {
        const rawType = typeDef.output_type || 'None';
        const sanitizedType = rawType.replace(/\s+/g, ''); 
        
        let amount = Number(typeDef.output_amount_interval) || 0; 

        if (typeDef.is_variable_output) {
          const workers = Number(f.workers_assigned) || 0;
          amount = amount * workers;
        }
        
        acc[sanitizedType] = (acc[sanitizedType] || 0) + amount;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  // Inject the Global National Interval Income into the Treasury key
  productionTotals['Treasury'] = (productionTotals['Treasury'] || 0) + (Number(nation?.interval_income) || 0);

  const currentResourceList = activeTab === 'primary' ? PRIMARY_RESOURCES : RAW_RESOURCES;

  return (
    <section className="summary-container">
      <div className="tab-nav">
        <button 
          className={`tab-button ${activeTab === 'primary' ? 'active' : ''}`}
          onClick={() => setActiveTab('primary')}
        >
          Primary Production
        </button>
        <button 
          className={`tab-button ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Raw Materials
        </button>
        
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.6, paddingRight: '10px' }}>
          Active: {activeCount}/{facilities.length}
        </div>
      </div>
      
      <div className="scroll-area">
        <div className="resource-grid">
          {currentResourceList.map((res) => {
            const amount = productionTotals[res] || 0;
            const labelColor = resourceColors[res] || '#bb86fc';

            return (
              <div key={res} className="resource-item">
                <span style={{ color: labelColor, fontWeight: 'bold' }}>{res}</span>
                <div style={{ textAlign: 'right' }}>
                  <div className={amount > 0 ? "pos-value" : "neutral-value"}>
                    {amount > 0 ? '+' : ''}{amount.toLocaleString()} 
                    <small className="resource-unit"> /int</small>
                  </div>
                  <div className="sub-text">Cycle: {(amount * 10).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>

        {facilities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No facilities registered.
          </div>
        )}
      </div>
    </section>
  );
}