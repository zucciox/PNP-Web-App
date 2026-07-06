import React, { useState, useMemo, useEffect } from 'react';
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import '../../styles/storeStyles.css';
import { resourceColors } from '../../styleConstants';

const COST_KEYS = [
  'treasury_cost', 'steel_cost', 'aluminum_cost', 'copper_cost', 
  'platinum_cost', 'titanium_cost', 'gold_cost', 'diamond_cost', 'uranium_cost'
];

// Updated keys to map from underscore case cost keys
const RESOURCE_MAP: Record<string, string> = {
  treasury_cost: 'Treasury',
  steel_cost: 'Steel',
  aluminum_cost: 'Aluminum',
  copper_cost: 'Copper',
  platinum_cost: 'Platinum',
  titanium_cost: 'Titanium',
  gold_cost: 'Gold',
  diamond_cost: 'Diamond', 
  uranium_cost: 'Uranium'
};

export function FactoryStore() {
  const { facilities, facilityTypes, unitTypes, nation } = useGameData();
  
  const [selectedType, setSelectedType] = useState<'unit' | 'facility'>('unit');
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [confirmItem, setConfirmItem] = useState<any>(null);

  const availableFactories = useMemo(() => {
    return facilities.filter(f => 
      f.facility_type?.toLowerCase().includes('factory') && 
      f.is_active
    );
  }, [facilities]);

  useEffect(() => {
    if (selectedFactoryId === null && availableFactories.length > 0) {
      setSelectedFactoryId(Number(availableFactories[0].global_id));
    }
  }, [availableFactories, selectedFactoryId]);

  const activeFactory = useMemo(() => {
    return availableFactories.find(f => Number(f.global_id) === Number(selectedFactoryId));
  }, [availableFactories, selectedFactoryId]);

  const activeFactoryType = useMemo(() => {
    return facilityTypes.find(ft => ft.facility_type === activeFactory?.facility_type);
  }, [facilityTypes, activeFactory]);

  const purchasableItems = useMemo(() => {
    if (!activeFactoryType || !nation) return [];
    
    const isUnit = selectedType === 'unit';
    const source = isUnit ? unitTypes : facilityTypes;

    return source.filter(item => {
      const meetLevel = item.factory_lvl <= activeFactoryType.mfg_level;
      const canBePurchased = isUnit || item.is_purchasable !== false;
      const isNationAuthorized = !item.proprietary_nation || String(item.proprietary_nation) === String(nation.id);

      return meetLevel && canBePurchased && isNationAuthorized && item.unit_type !== 'Worker';
    });
  }, [selectedType, activeFactoryType, unitTypes, facilityTypes, nation]);

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
      
      // Fixed: Checked against consistent lowercase factory keys
      const balance = resourceName === 'Treasury' 
        ? (nation.treasury || 0) 
        : (activeFactory[resourceName.toLowerCase()] || 0);
        
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
          onChange={(e) => setSelectedFactoryId(Number(e.target.value))}
        >
          {availableFactories.map(f => (
            <option key={f.global_id} value={f.global_id}>
              {`${f.facility_type} #${f.type_id}`}
            </option>
          ))}
        </select>
        <div className="info-icon">
            ?
            <div className="tooltip" style={{left: '-20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div>
                Manufacturing is a critical aspect of your nation's economy. Factories are the only facilities 
                that can manufacture - if this screen is empty, you need to build or enable a factory.
              </div>
              <div>
                Switch between units and facilities, and which factory you're using, with the dropdowns at the top of the screen.
              </div>
              <div>
                Pieces you can manufacture are green, while those you don't have enough resources for are red.
              </div>
              <div>
                The build time, in intervals, is displayed in the upper right of each piece card.
              </div>
              <div>
                If your factory is destroyed or disabled, active orders will no longer progress.
              </div>
            </div>
        </div>
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
                    style={{backgroundColor: canAfford ? '#042415'  : '#240404' }}
                    onClick={() => canAfford && setConfirmItem(item)}
                  >
                    <span className="card-name" style={{display: 'flex', justifyContent: 'space-between'}}>
                      <div> {name} </div>
                      <div style={{fontSize: '.7rem', border: '1px solid', borderRadius: '7px', paddingInline: '5px', fontWeight: 'normal', marginLeft: '10px', textAlign: 'center'}}> {item.build_time} intervals </div>
                    </span>
                    <div className="cost-container">
                      {COST_KEYS.map(key => {
                        const cost = item[key];
                        if (!cost) return null;
                        
                        const resName = RESOURCE_MAP[key];
                        const tagColor = resourceColors[resName] || '#000000';
                        
                        // Fixed: Standardized balance/stock calculations to match checkAffordability logic
                        const stock = resName === 'Treasury' 
                          ? (nation?.treasury || 0) 
                          : (activeFactory?.[resName.toLowerCase()] || 0);
        
                        return (
                          <div 
                            key={key} 
                            className={`cost-tag ${stock < cost ? 'insufficient' : ''}`}
                            style={{ borderLeft: `3px solid ${tagColor}` }}
                          >
                            <span style={{ color: tagColor, fontWeight: 'bold' }}>{resName}</span>
                            <span style={{ color: stock < cost ? 'red' : 'lime' }}> 
                              {stock.toLocaleString()} / {cost.toLocaleString()}
                            </span>
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