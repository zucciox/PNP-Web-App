import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { Unit, Facility, Settlement, Shipment, gameStateData, FacilityType, UnitType, Nation, Order, Profile, CombatExchange, Notification, GameFeed, EventType, ScoreObject } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GameContextType {
  units: Unit[];
  facilities: Facility[];
  facilityTypes: FacilityType[];
  unitTypes: UnitType[];
  gameState: gameStateData | null;
  settlements: Settlement[];
  shipments: Shipment[];
  orders: Order[]; 
  combat: CombatExchange[];
  notifications: Notification[];
  gameFeed: GameFeed[];    
  eventTypes: EventType[]; 
  scoreBreakdown: Record<string, number>; // Added tracking type for breakdown
  nationScores: ScoreObject[];
  nation: Nation | null;
  nationId: string | null;
  profile: Profile | null;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [gameState, setGameState] = useState<gameStateData | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); 
  const [combat, setCombat] = useState<CombatExchange[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gameFeed, setGameFeed] = useState<GameFeed[]>([]);    
  const [eventTypes, setEventTypes] = useState<EventType[]>([]); 
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({}); // Added state
  const [nation, setNation] = useState<Nation | null>(null);
  const [nationId, setNationId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationScores, setNationScores] = useState<ScoreObject[]>([]); 

  const fetchData = async (id: string, role: string) => {
    const notificationQuery = role === 'Admin' 
      ? supabase.from('notifications').select('*')
      : supabase.from('notifications').select('*').eq('receiving_nation', id);

    const [u, f, ft, ut, g, set, ship, n, ord, comb, notifs, feed, et, breakdownResult, nationScores] = await Promise.all([
      supabase.from('units').select('*').eq('nation_id', id),
      supabase.from('facilities').select('*').eq('owner_nation', id),
      supabase.from('facility_types').select('*'),
      supabase.from('unit_types').select('*'),
      supabase.from('game_state').select('*').maybeSingle(),
      supabase.from('settlements').select('*').eq('owner_nation', id),
      supabase.from('shipments').select('*').eq('origin_nation', id),
      supabase.from('nation').select('*').eq('id', id).maybeSingle(),
      supabase.from('factory_orders').select('*').eq('nation_id', id),
      supabase.from('combat_exchanges').select('*').or(`aggressor_nation.eq.${id},victim_nation.eq.${id}`),
      notificationQuery,
      supabase.from('game_feed').select('*').order('created_at', { ascending: false }).limit(999),
      supabase.from('event_types').select('*'), 
      supabase.rpc('get_nation_score_breakdown', { target_nation_id: id }),
      supabase.from('nation_scores').select('*')
    ]);

    // Map the RPC row returns into a dynamic key-value lookup map
    const breakdownObj: Record<string, number> = {};
    let grandTotal = 0;
    
    if (breakdownResult.data) {
      breakdownResult.data.forEach((row: { event_type: string; total_points: number | string }) => {
        const points = Number(row.total_points) || 0;
        breakdownObj[row.event_type] = points;
        grandTotal += points;
      });
    }
    breakdownObj['grand_total'] = grandTotal;

    setUnits(u.data || []);
    setFacilities(f.data || []);
    setFacilityTypes(ft.data || []);
    setUnitTypes(ut.data || []);
    setGameState(g.data || null);
    setSettlements(set.data || []);
    setShipments(ship.data || []);
    setNation(n.data || null);
    setOrders(ord.data || []); 
    setCombat(comb.data || []);
    setNotifications(notifs.data || []);
    setGameFeed(feed.data || []);
    setEventTypes(et.data || []);
    setScoreBreakdown(breakdownObj);
    setNationScores(nationScores.data || []);
  };
  
  useEffect(() => {
    let channel: RealtimeChannel;
    let isMounted = true;
  
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
  
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
      if (!isMounted || !profileData?.nation_id) {
        setLoading(false);
        return;
      }

      const id = profileData.nation_id;
      const role = profileData.role;
      setProfile(profileData as Profile);
      setNationId(id);
      await fetchData(id, role);
      setLoading(false);
  
      if (isMounted) {
        channel = supabase.channel(`game-room-${id}`);
  
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'units', filter: `nation_id=eq.${id}` }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities', filter: `owner_nation=eq.${id}` }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `owner_nation=eq.${id}` }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `origin_nation=eq.${id}` }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'nation', filter: `id=eq.${id}` }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'factory_orders', filter: `nation_id=eq.${id}` }, () => fetchData(id, role)) 
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_exchanges' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_feed' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'event_types' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
             setProfile(payload.new as Profile);
          })
          
          channel.subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              console.log('%c⚡ Supabase Realtime: Successfully connected!', 'color: #00ff00; font-weight: bold;');
            }
            if (status === 'TIMED_OUT') {
              console.error('❌ Supabase Realtime: Connection timed out. Check network or table filters.');
            }
            if (status === 'CHANNEL_ERROR') {
              console.error('❌ Supabase Realtime: Channel error occurred:', err?.message || 'Unknown error');
            }
          });
      }
    };
  
    init();
    return () => { isMounted = false; if (channel) supabase.removeChannel(channel); };
  }, []);

  return (
    <GameContext.Provider value={{ 
        units, facilities, facilityTypes, unitTypes, settlements, shipments, 
        orders, combat, notifications, gameFeed, eventTypes, scoreBreakdown, nationScores, nation, 
        nationId, profile, gameState, loading 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameData = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameData must be used within GameProvider");
  return context;
};