import React, { useState, useMemo, useEffect } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/storeStyles.css';

const resourceColors: Record<string, string> = {
  Steel: '#7a5a30', Aluminum: '#7b409e', Copper: '#8b4513',
  Platinum: '#2d74b3', Titanium: '#58b7e6', Gold: '#daa520',
  Diamond: '#74a1d3', Uranium: '#76a34d', Oxygen: '#4a7c36',
  Food: '#a0522d', Water: '#3d5a99', Fuel: '#e3242b',
  Coal: '#444444', Gas: '#000000', Energy: '#000000', Treasury: '#daa520'
};

const COST_KEYS = [
  'TreasuryCost', 'SteelCost', 'AluminumCost', 'CopperCost', 
  'PlatinumCost', 'TitaniumCost', 'GoldCost', 'DiamondCost', 'UraniumCost'
];

const RESOURCE_MAP: Record<string, string> = {
  TreasuryCost: 'Treasury',
  SteelCost: 'Steel',
  AluminumCost: 'Aluminum',
  CopperCost: 'Copper',
  PlatinumCost: 'Platinum',
  TitaniumCost: 'Titanium',
  GoldCost: 'Gold',
  DiamondCost: 'Diamond',
  UraniumCost: 'Uranium'
};

export function FactoryStore() {
  const { facilities, facilityTypes, unitTypes, nation } = useGameData();
  
  const [selectedType, setSelectedType] = useState<'unit' | 'facility'>('unit');
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | string | null>(null);
  const [confirmItem, setConfirmItem] = useState<any>(null);

  const availableFactories = useMemo(() => {
    return facilities.filter(f => 
      f.facility_type?.includes('Factory') && 
      f.is_active
    );
  }, [facilities]);

  useEffect(() => {
    if (selectedFactoryId === null && availableFactories.length > 0) {
      setSelectedFactoryId(availableFactories[0].global_id);
    }
  }, [availableFactories, selectedFactoryId]);

  const activeFactory = availableFactories.find(f => f.global_id === selectedFactoryId);
  const activeFactoryType = facilityTypes.find(ft => ft.facility_type === activeFactory?.facility_type);

  const purchasableItems = useMemo(() => {
    if (!activeFactoryType) return [];
    
    const isUnit = selectedType === 'unit';
    const source = isUnit ? unitTypes : facilityTypes;

    return source.filter(item => {
      // 1. Check Factory Level Requirement
      const meetLevel = item.factory_lvl <= activeFactoryType.mfg_level;
      
      // 2. Check Purchasable Flag (Only for facilities)
      // We check if it's NOT a unit, then ensure is_purchasable isn't explicitly false
      const canBePurchased = isUnit || item.is_purchasable !== false;

      return meetLevel && canBePurchased;
    });
  }, [selectedType, activeFactoryType, unitTypes, facilityTypes]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const groupKey = selectedType === 'unit' ? 'class' : 'output_type';
    
    purchasableItems.forEach(item => {
      const val = item[groupKey] || 'Other';
      if (!groups[val]) groups[val] = [];
      groups[val].push(item);
    });
    return groups;
  }, [purchasableItems, selectedType]);

  const checkAffordability = (item: any) => {
    if (!activeFactory || !nation) return false;
    for (const key of COST_KEYS) {
      const cost = item[key] || 0;
      if (cost === 0) continue;
      const resourceName = RESOURCE_MAP[key];
      const balance = resourceName === 'Treasury' ? (nation.Treasury || 0) : (activeFactory[resourceName] || 0);
      if (balance < cost) return false;
    }
    return true;
  };

  const handlePurchase = async () => {
    if (!confirmItem || !activeFactory || !nation) return;
    const pieceType = selectedType === 'unit' ? confirmItem.unit_type : confirmItem.facility_type;
    const { error } = await supabase.rpc('create_order', {
      p_piece_type: pieceType,
      p_nation_id: nation.id,
      p_factory_global_id: activeFactory.global_id
    });

    if (error) {
      alert(`Purchase failed: ${error.message}`);
    } else {
      setConfirmItem(null);
    }
  };

  return (
    <div className="store-container">
      <header className="store-header">
        Build a 
        <select 
          className="store-select" 
          value={selectedType} 
          onChange={(e) => setSelectedType(e.target.value as any)}
        >
          <option value="unit">unit</option>
          <option value="facility">facility</option>
        </select>
        at
        <select 
          className="store-select"
          value={selectedFactoryId || ''}
          onChange={(e) => setSelectedFactoryId(e.target.value)}
        >
          {availableFactories.map(f => (
            <option key={f.global_id} value={f.global_id}>
              {`${f.facility_type} #${f.type_id}`}
            </option>
          ))}
        </select>
      </header>

      <div className="store-body">
        {Object.entries(groupedItems).length === 0 && (
          <p className="no-items">No items available for this factory level.</p>
        )}
        
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <div key={groupName} className="store-row-group">
            <h4 className="row-title">{groupName}</h4>
            <div className="card-grid">
              {items.map((item, idx) => {
                const canAfford = checkAffordability(item);
                const name = selectedType === 'unit' ? item.unit_type : item.facility_type;
                
                return (
                  <div 
                    key={`${name}-${idx}`} 
                    className={`purchase-card ${!canAfford ? 'disabled' : ''}`}
                    onClick={() => canAfford && setConfirmItem(item)}
                  >
                    <span className="card-name">{name}</span>
                    <div className="cost-container">
                      {COST_KEYS.map(key => {
                        const cost = item[key];
                        if (!cost) return null;
                        
                        const resName = RESOURCE_MAP[key];
                        const balance = resName === 'Treasury' ? nation?.Treasury : activeFactory?.[resName];
                        // Get color from the resourceColors record
                        const tagColor = resourceColors[resName] || '#000000';

                        return (
                          <div 
                            key={key} 
                            className={`cost-tag ${balance < cost ? 'insufficient' : ''}`}
                            style={{ borderLeft: `3px solid ${tagColor}` }}
                          >
                            <span style={{ color: tagColor, fontWeight: 'bold' }}>{resName}</span>
                            <span> {cost.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {confirmItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Construction</h3>
            <p>Order 1x <strong>{selectedType === 'unit' ? confirmItem.unit_type : confirmItem.facility_type}</strong>?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmItem(null)}>Cancel</button>
              <button className="btn-confirm" onClick={handlePurchase}>Authorize Production</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}