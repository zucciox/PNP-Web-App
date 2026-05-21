import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
// Added Notification to types
import { Unit, Facility, Settlement, Shipment, gameStateData, FacilityType, UnitType, Nation, Order, Profile, CombatExchange, Notification } from './types';
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
  notifications: Notification[]; // Added notifications
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
  const [notifications, setNotifications] = useState<Notification[]>([]); // Added state
  const [nation, setNation] = useState<Nation | null>(null);
  const [nationId, setNationId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (id: string, role: string) => {
    // Logic for notifications: Admins get all, players get filtered
    const notificationQuery = role === 'Admin' 
      ? supabase.from('notifications').select('*')
      : supabase.from('notifications').select('*').eq('receiving_nation', id);

    const [u, f, ft, ut, g, set, ship, n, ord, comb, notificationsData] = await Promise.all([
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
      notificationQuery // Dynamic query based on role
    ]);
  
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
    setNotifications(notificationsData.data || []); // Update state
  };
  
  useEffect(() => {
    let channel: RealtimeChannel;
    let isMounted = true;
  
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
  
      const { data: profileData } = await supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
  
      if (!isMounted || !profileData?.nation_id) {
        setLoading(false);
        return;
      }

      const id = profileData.nation_id;
      const role = profileData.role; // Use role to determine data fetching
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
          // Realtime Notifications
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData(id, role))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
             setProfile(payload.new as Profile);
          })
          .subscribe();
      }
    };
  
    init();
  
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <GameContext.Provider value={{ 
        units, 
        facilities, 
        facilityTypes, 
        unitTypes, 
        settlements, 
        shipments, 
        orders, 
        combat,
        notifications, // Provide state
        nation,
        nationId, 
        profile, 
        gameState, 
        loading 
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