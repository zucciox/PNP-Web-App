import { createPortal } from 'react-dom';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Facility, Settlement, Shipment, Unit, UnitType } from '../../types'; 
import { useGameData } from '../../GameContext';
import { supabase } from '../../supabaseClient';
import { OperatingCostsTable } from './OperatingCostsTable';
import { resourceColors } from '../../styleConstants';
import { stableTextColor } from '../../styleConstants';
import { additiveTextColor } from '../../styleConstants';
import { negativeTextColor } from '../../styleConstants';
  
  // We keep UI keys as PascalCase to avoid breaking your styles and rendering
  const DISPLAY_RESOURCES = [
    'Treasury', 'Energy', 'Steel', 'Aluminum', 'Copper', 'Platinum', 
    'Titanium', 'Gold', 'Diamond', 'Uranium', 'Oxygen', 'Food', 'Water', 'Fuel'
  ];

  // Resources that are refined into other resources
  const RAW_RESOURCES = [
    'Iron Ore', 'Aluminum Ore', 'Copper Ore', 'Platinum Ore', 
    'Titanium Ore', 'Gold Ore', 'Diamond Ore', 'Uranium Ore', 'Oil', 'Gas'
  ];
  
  // Helper mapping function to convert UI display names into the new backend keys
  const getBackendKey = (resourceName: string): string => {
    if (resourceName === 'Treasury') return 'treasury';
    
    // Explicit mappings for special cases
    const explicitMappings: Record<string, string> = {
      NaturalGas: 'natural_gas',
      Gas: 'natural_gas',
      Oil: 'oil',
      CopperOre: 'copper_ore',
      GoldOre: 'gold_ore',
      IronOre: 'iron_ore',
      AluminumOre: 'aluminum_ore',
      TitaniumOre: 'titanium_ore',
      PlatinumOre: 'platinum_ore',
      UraniumOre: 'uranium_ore'
    };
  
    if (explicitMappings[resourceName]) {
      return explicitMappings[resourceName];
    }
  
    // Fallback for names: snake_case formatting + force lowercase
    return resourceName
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  };


  const convertToRaw: Record<string, string> = {
    'Fuel': 'Oil', 
    'Copper': 'Copper Ore',
    'Energy': 'Gas',
    'Titanium': 'Titanium Ore',
    'Platinum': 'Platinum Ore',
    'Gold': 'Gold Ore',
    'Diamond': 'Diamond Ore',
    'Steel': 'Iron Ore',
    'Uranium': 'Uranium Ore',
    'Aluminum': 'Aluminum Ore',

    // Placeholders
    'Oxygen': 'Oxygen',
    'Food': 'Food',
    'Water': 'Water',
    'Treasury': 'Treasury'
  };

  const facilityStored = (facilities: Facility[], resource: string): number => {
    
    let total = 0;
    facilities.forEach(f => {
      total += f[getBackendKey(resource)]
    })

    return total
  }

  const shipmentStored = (shipments: Shipment[],resource: string): number => {
    
    let total = 0;
    shipments.forEach(s => {
      if (s.resource === resource) {
        total += s.amount
      }
    })

    return total
  }

  const allSettlementsMeeting = (settlements: Settlement[], resource: string): boolean => {
    let value = true;

    settlements.forEach(s => {
      if (s[getBackendKey(resource)] < s[getBackendKey(resource)+'_cr']) 
        {
          value = false
        }
      })

    return value
  }

export function NationalResourceFlowTable() {
  const { facilities, facilityTypes, settlements, nation, shipments } = useGameData();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {

    const totals = {
      stockpiles: {} as Record<string, number>,
      production: {} as Record<string, number>,
      rawProduction: {} as Record<string, number>,
      consumption: {} as Record<string, number>
    };

    DISPLAY_RESOURCES.forEach(r => {
      totals.stockpiles[r] = 0;
      totals.production[r] = 0;
      totals.rawProduction[r] = 0;
      totals.consumption[r] = 0;
    });

    RAW_RESOURCES.forEach(r => {
      totals.rawProduction[r] = 0;
    });

    // 1. Stockpiles
    totals.stockpiles['Treasury'] = nation?.treasury || 0;
    
    settlements.forEach(s => {
      DISPLAY_RESOURCES.forEach(r => { 
        if (r !== 'Treasury') {
          const backendKey = getBackendKey(r);
          totals.stockpiles[r] += (Number(s[backendKey]) || 0); 
        }
      });
    });
    
    facilities.forEach(f => {
      DISPLAY_RESOURCES.forEach(r => { 
        if (r !== 'Treasury') {
          const backendKey = getBackendKey(r);
          totals.stockpiles[r] += (Number(f[backendKey]) || 0); 
        }
      });
    });

    shipments.forEach(s => {
      DISPLAY_RESOURCES.forEach(r => { 
        if (r !== 'Treasury') {
          if (s.resource === r) {
            totals.stockpiles[r] += (Number(s.amount) || 0);
          }
        }
      });
    });

    // 2. Production & Raw Production
    totals.production['Treasury'] = Number(nation?.interval_income) || 0;
    facilities.forEach(f => {
      if (!f.is_active) return;
      const typeDef = facilityTypes.find(t => t.facility_type === f.facility_type);
      if (typeDef && typeDef.output_type) {
        // Formats "Natural Gas" or "NaturalGas" into "natural_gas" / single words to "lowercase"
        const normalizedOutputType = typeDef.output_type
          .trim()
          .replace(/([a-z])([A-Z])/g, '$1_$2') // Add underscore between camelCase/PascalCase words
          .replace(/\s+/g, '_')               // Replace spaces with underscores
          .toLowerCase();

        // Match normalized type against backend key schemas
        const matchedRes = DISPLAY_RESOURCES.find(r => getBackendKey(r) === normalizedOutputType);
        const matchedRawRes = RAW_RESOURCES.find(r => getBackendKey(r) === normalizedOutputType);
        
        if (matchedRes) {
          let amount = Number(typeDef.output_amount_interval) || 0;
          if (typeDef.is_variable_output) amount *= (Number(f.workers_assigned) || 0);
          totals.production[matchedRes] += amount;
          //console.log("Found primary resource producer:", typeDef.facility_type, " which produces this much output: ", typeDef.output_amount_interval)
        }
        else if (matchedRawRes) {
          totals.rawProduction[matchedRawRes] += Number(typeDef.output_amount_interval)
          //console.log("Found raw resource producer:", typeDef.facility_type, " which produces this much " + typeDef.output_type + ": " + typeDef.output_amount_interval)
          //totals.rawProduction[matchedRawRes] += typeDef.is_variable_output ?  : Number(typeDef.output_amount_interval)
        }
      }
    });

    // 3. Consumption
    settlements.forEach(s => {
      // Direct mappings using the safe key converter rules + original '_cr' suffixes
      totals.consumption['Treasury'] += (Number(s.treasury_cr) || 0);
      totals.consumption['Energy'] += (Number(s.energy_cr) || 0); // energy_cr
      totals.consumption['Steel'] += (Number(s.steel_cr) || 0);   // steel_cr
      totals.consumption['Aluminum'] += (Number(s.aluminum_cr) || 0);
      totals.consumption['Copper'] += (Number(s.copper_cr) || 0);
      totals.consumption['Platinum'] += (Number(s.platinum_cr) || 0);
      totals.consumption['Titanium'] += (Number(s.titanium_cr) || 0);
      totals.consumption['Gold'] += (Number(s.gold_cr) || 0);
      totals.consumption['Diamond'] += (Number(s.diamond_cr) || 0);
      totals.consumption['Uranium'] += (Number(s.uranium_cr) || 0);
      totals.consumption['Oxygen'] += (Number(s.oxygen_cr) || 0);
      totals.consumption['Food'] += (Number(s.food_cr) || 0);
      totals.consumption['Water'] += (Number(s.water_cr) || 0);
      totals.consumption['Fuel'] += (Number(s.fuel_cr) || 0);
    });

    //console.log("Raw Production Data:", totals.rawProduction);
    //console.log("Final Treasury:", totals.stockpiles['Treasury']);
    return totals;
  }, [facilities, facilityTypes, settlements, nation]);

  return (
    <section style={s.container}>
      <style>{`
        .info-wrap { position: relative; cursor: help; display: flex; align-items: center; }
        .info-wrap:hover .tooltip { visibility: visible; opacity: 1; }
        .search-input::placeholder { color: #555; }
      `}</style>
      
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
          <div style={s.title}>National Resource Balance</div>
          <div className="info-icon">
              ?
              <div className="tooltip" style={{right: '30px'}}>
                <div>
                  This table summarizes the flow of resources across your nation. Check here to see if you are on track to meet your <span style={{color: negativeTextColor}}>Consumption Rates,</span> and hover over numbers for in depth explanations.
                </div>
                <p style={{color: stableTextColor}}>
                  Stockpile: how much of this resource you have stored across all facilities and settlements.
                </p>
                <p style={{color: negativeTextColor}}>
                  Consumption: how much of this resource is required by all of your settlements each cycle (10 intervals). Every settlement has its own consumption rate.
                </p>
                <div style={{color: additiveTextColor}}>
                  Production: how much of this resource you produce every cycle. (Note that for some resources, this only counts your raw production, and you still have to refine that resource to meet consumption rates).
                </div>
              </div>
          </div>
        </div>
      </div>

      <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Resource', 'Stockpiles', 'Consumption', "Production"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISPLAY_RESOURCES.map((r) => {

                const finalStockpileValue = stats.stockpiles[r];
                const finalConsumptionValue = stats.consumption[r];
                const finalProductionValue = (stats.production[r]+stats.rawProduction[convertToRaw[r]])*10;

                return (
                  <tr 
                    key={r}
                  >
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: resourceColors[r] || '#bb86fc' }}>
                        {r}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{display: 'flex', gap: '5px', alignItems: 'flex-end'}}> 
                        <StockpileFeedbackIcon resource={r} stockpileAmount={finalStockpileValue} consumptionAmount={finalConsumptionValue} /> 
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ color: negativeTextColor }}>
                        { (finalConsumptionValue > 0) ?
                          <div>-{finalConsumptionValue.toLocaleString()}/c</div>
                          :
                          "--"
                        }
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={{display: 'flex', gap: '5px', alignItems: 'flex-end'}}> 
                        <ProductionFeedbackIcon resource={r} productionAmount={finalProductionValue} consumptionAmount={finalConsumptionValue} /> 
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>
      <OperatingCostsTable/>
    </section>
  );

}

const s: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#121212', color: '#e0e0e0', padding: '1.25rem', borderRadius: '8px', border: '1px solid #333', minWidth: '520px', height: '91vh', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'left', alignItems: 'center', paddingBottom: '1rem' },
  searchField: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '6px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none', width: '180px' },
  title: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableWrap: {borderRadius: '5px 5px 0px 0px', overflow: 'visible', width: '100%', overflowX: 'auto', },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', },
  th: { textAlign: 'left', padding: '0.6rem .5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #333' },
  td: {textAlign: 'left', justifyContent: 'left', fontFamily: 'monospace', padding: '0.8rem 0.5rem', borderBottom: '1px solid #222', fontSize: '0.7rem', verticalAlign: 'middle' },
  badge: { backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', padding: '3px 8px', fontWeight: 600, fontSize: '0.8rem' },
  barBg: { height: '4px', background: '#222', borderRadius: '2px', overflow: 'hidden' },
  barFill: { height: '100%', transition: 'width .3s' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bbb', margin: '2px 0' },
  empty: { padding: '2rem', color: '#555', textAlign: 'left' },
  actionBtn: { background: '#222', border: '1px solid #444', color: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' },
  popover: { position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '4px', zIndex: 110, width: '150px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
  menuItem: { padding: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#bbb' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { background: '#1e1e1e', padding: '24px', borderRadius: '8px', border: '1px solid #444', width: '320px' },
  input: { width: '100%', padding: '12px', marginTop: '12px', background: '#121212', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', outline: 'none' },
  error: { color: '#ff5252', fontSize: '0.75rem', marginTop: '12px', background: 'rgba(255,82,82,0.1)', padding: '8px', borderRadius: '4px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { background: 'transparent', border: 'none', color: '#777', cursor: 'pointer' },
  confirmBtn: { background: '#4caf50', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

function StockpileFeedbackIcon({ resource: r, stockpileAmount: rA, consumptionAmount: cA }: { resource: string, stockpileAmount: number, consumptionAmount: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const { facilities, settlements, shipments} = useGameData();
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const iconRef = useRef<HTMLDivElement>(null);
  
    // Cross-reference: Find the unit where global_id matches the shipment's unit_id
    const hasCR = cA > 0
    const isMeetingCR = rA >= cA
    const AllSettlementsMeeting = allSettlementsMeeting(settlements, r);
    const rawResourceText = <span style={{color: resourceColors[convertToRaw[r] ?? 'white']}}>{convertToRaw[r]}</span>
    const resourceText = <span style={{color: resourceColors[r]}}>{r}</span>

    const handleMouseEnter = () => {
      setIsHovered(true);
      if (iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        
        const estimatedTooltipHeight = 450; 
        const spaceBelow = window.innerHeight - rect.bottom;
    
        if (spaceBelow < estimatedTooltipHeight) {
          // FLIP UP: Not enough space below, so render it ABOVE the icon
          setTooltipStyle({
            position: 'fixed',
            // Pin the bottom of the tooltip to the top of the icon (plus a 4px gap)
            bottom: window.innerHeight - rect.top + 4, 
            left: rect.left,
            zIndex: 9999,
          });
        } else {
          // RENDER DOWN: Plenty of space, render it BELOW the icon normally
          setTooltipStyle({
            position: 'fixed',
            top: rect.bottom + 4, 
            left: rect.left,
            zIndex: 9999,
          });
        }
      }
    };
  
    return (
      <div 
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '5px'}}>
          <span> {rA.toLocaleString()} </span>
          { hasCR ?
            isMeetingCR ? 
              AllSettlementsMeeting ? '✅' : '⚠️'
              : 
              '⛔️'
            :
            ""
          }
        </div>
  
        {isHovered && hasCR && createPortal (
          <div 
            className="resource-feedback-overlay" 
            style={tooltipStyle}
          >

            <span style={{color: isMeetingCR ? '#44ff44' : '#ff4444'}}>
              {isMeetingCR ? 
                (!AllSettlementsMeeting && isMeetingCR) ?
                <div style={{color: 'yellow'}}>
                  ⚠️ One or more of your settlements does not have enough {resourceText} to meet its consumption rate, but you have enough total {resourceText}. Create shipments to move {resourceText} into these settlements:
                </div>
                :
                '✅ You have enough ' + r + ' to meet your upcoming consumption rates.' 
              : 
              '⛔️ You DO NOT have enough ' + r + ' to meet your upcoming consumption rates!'}
            </span>
        
            <p style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              {r !== 'Treasury' && 
                settlements
                  .map(s => (
                  <div key={s.global_id} className='storage-pill' style={{fontSize: 'small', fontFamily: 'inherit', gap: '5px'}}> 
                      <div style={{color: stableTextColor}}>{s.name}: </div>
                      {
                        (s[getBackendKey(r)] >= s[getBackendKey(r)+'_cr']) ? 
                        <div style={{color: additiveTextColor}}> {s[getBackendKey(r)].toLocaleString()}/{s[getBackendKey(r)+'_cr'].toLocaleString()} {r} ✅ </div> 
                        : 
                        <div style={{color: negativeTextColor}}> {s[getBackendKey(r)].toLocaleString()}/{s[getBackendKey(r)+'_cr'].toLocaleString()} {r} ⚠️ </div> 
                      }
                  </div>
                ))
                }
           </p>

          {r !== 'Treasury' ?  
            <div>
              You have <span style={{fontWeight: 'bold', color: resourceColors[r]}}>{facilityStored(facilities,  r).toLocaleString()} { r }</span> stored in facilities and <span style={{fontWeight: 'bold', color: resourceColors[r]}}>{shipmentStored(shipments,  r).toLocaleString()} { r } </span> moving on active shipments.
            </div> 
           : null}  

            {rA < cA && 
              <div>  <br />To meet your consumption rates this cycle, acquire <span style={{color: additiveTextColor}}> {cA-rA} </span> more {resourceText} from outside sources <div/>
              <br />
              <div style={{textAlign: 'center'}}>OR</div>
              <p>produce {r !== convertToRaw[r] ? 'and refine' : ''} <span style={{color: additiveTextColor}}> {cA-rA}</span> more {rawResourceText} by the end of this cycle.</p>
              </div>       
            }   
          </div>,
          document.body
        )}
      </div>
    );
  }

  function ProductionFeedbackIcon({ resource: r, productionAmount: pA, consumptionAmount: cA }: { resource: string, productionAmount: number, consumptionAmount: number }) {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const iconRef = useRef<HTMLDivElement>(null);
  
    const isMeetingCR = pA >= cA;
    const hasCR = cA > 0;
    const rawResourceText = <span style={{color: resourceColors[convertToRaw[r] ?? 'white']}}>{convertToRaw[r]}</span>;
    const resourceText = <span style={{color: resourceColors[r]}}>{r}</span>;
  
    const handleMouseEnter = () => {
      setIsHovered(true);
      if (iconRef.current) {
        const rect = iconRef.current.getBoundingClientRect();
        
        const estimatedTooltipHeight = 450; 
        const spaceBelow = window.innerHeight - rect.bottom;
    
        if (spaceBelow < estimatedTooltipHeight) {
          // FLIP UP: Not enough space below, so render it ABOVE the icon
          setTooltipStyle({
            position: 'fixed',
            // Pin the bottom of the tooltip to the top of the icon (plus a 4px gap)
            bottom: window.innerHeight - rect.top + 4, 
            left: rect.left,
            zIndex: 9999,
          });
        } else {
          // RENDER DOWN: Plenty of space, render it BELOW the icon normally
          setTooltipStyle({
            position: 'fixed',
            top: rect.bottom + 4, 
            left: rect.left,
            zIndex: 9999,
          });
        }
      }
    };
  
    return (
      <div 
        ref={iconRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{display: 'flex', alignItems: 'flex-end', gap: '5px'}}>
          <span style={{ color: additiveTextColor }}> +{pA.toLocaleString()}/c</span>
          {
            hasCR ?
            isMeetingCR ? '✅' : '⚠️'
            :
            ""
          }
        </div>
  
        {/* RENDER THE PORTAL */}
        {isHovered && hasCR && createPortal(
          <div 
            className="resource-feedback-overlay" 
            style={tooltipStyle} /* Apply the calculated fixed coordinates here */
          >
            {isMeetingCR ? (
              <div>
                <div style={{color: additiveTextColor}}>✅ You are self-sufficient in <span style={{color: resourceColors[r]}}>{r}.</span></div>
                <br />
                <div style={{color: additiveTextColor}}>
                  This means you produce enough <span style={{color: resourceColors[convertToRaw[r]] ?? 'white'}}>{convertToRaw[r]} </span> 
                  each cycle to meet your <span style={{color: resourceColors[r]}}>{r} </span>  
                  consumption rates without relying on outside sources.
                </div>
                {r !== convertToRaw[r] && r !== 'Treasury' ? (
                  <div style={{color: 'orange'}}>
                    <br />
                    ⚠️ Note that you must refine your  
                    <span style={{color: resourceColors[convertToRaw[r]] ?? 'white'}}> {convertToRaw[r]} </span>
                    into 
                    <span style={{color: resourceColors[r]}}> {r} </span>
                    and move it into settlements before it counts towards consumption rates.
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <div style={{color: 'yellow'}}> ⚠️ You DO NOT produce enough <span style={{color: resourceColors[convertToRaw[r]] ?? 'white'}}>{convertToRaw[r]}</span> to meet your <span style={{color: resourceColors[r]}}>{r}</span> consumption rates each cycle.</div>
                <p>
                  <div className='storage-pill' style={{marginBottom: '5px', fontSize: 'small', fontFamily: 'inherit', gap: '5px'}}>
                  <span style={{color: resourceColors[r]}}>{r}</span> needed per cycle: <span style={{color: negativeTextColor}}>{cA.toLocaleString()}</span>
                  </div>
                  <div className='storage-pill' style={{fontSize: 'small', fontFamily: 'inherit', gap: '5px'}}>
                   <span style={{color: resourceColors[convertToRaw[r]]}}>{convertToRaw[r]}</span> produced per cycle:  <span style={{color: additiveTextColor}}>{pA.toLocaleString()}</span>
                  </div>
                </p>
                <div>To meet your consumption rates, you need to acquire <span style={{color: additiveTextColor}}> {(cA-pA).toLocaleString()} </span> more {resourceText} per cycle from outside sources <div/>
                <div style={{textAlign: 'center'}}>OR</div>
                <p>Produce {r !== convertToRaw[r] ? 'and refine' : ''} <span style={{color: additiveTextColor}}> {(cA-pA).toLocaleString()}</span> more {rawResourceText} per cycle.</p>
                </div>  
                <div style={{color: additiveTextColor}}> Consider building new facilities or trading with other nations. </div>
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }