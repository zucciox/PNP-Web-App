import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
// Ensure Order is exported from your types file
import { Unit, Facility, Settlement, Shipment, gameStateData, FacilityType, UnitType, Nation, Order } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface GameContextType {
  units: Unit[];
  facilities: Facility[];
  facilityTypes: FacilityType[];
  unitTypes: UnitType[];
  gameState: gameStateData | null;
  settlements: Settlement[];
  shipments: Shipment[];
  orders: Order[]; // Added orders to interface
  nation: Nation | null;
  nationId: string | null;
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
  const [orders, setOrders] = useState<Order[]>([]); // Added orders state
  const [nation, setNation] = useState<Nation | null>(null);
  const [nationId, setNationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (id: string) => {
    const [u, f, ft, ut, g, set, ship, n, ord] = await Promise.all([
      supabase.from('Units').select('*').eq('nation_id', id),
      supabase.from('Facilities').select('*').eq('owner_nation', id),
      supabase.from('FacilityTypes').select('*'),
      supabase.from('UnitTypes').select('*'),
      supabase.from('GameState').select('*').maybeSingle(),
      supabase.from('Settlements').select('*').eq('owner_nation', id),
      supabase.from('Shipments').select('*').eq('origin_nation', id),
      supabase.from('Nation').select('*').eq('id', id).maybeSingle(),
      supabase.from('StoreOrders').select('*').eq('nation_id', id), // Fetching StoreOrders
    ]);
  
    setUnits(u.data || []);
    setFacilities(f.data || []);
    setFacilityTypes(ft.data || []);
    setUnitTypes(ut.data || []);
    setGameState(g.data || null);
    setSettlements(set.data || []);
    setShipments(ship.data || []);
    setNation(n.data || null);
    setOrders(ord.data || []); // Setting orders state
  };
  
  useEffect(() => {
    let channel: RealtimeChannel;
    let isMounted = true;
  
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
  
      const { data: profile } = await supabase.from('Profiles')
        .select('nation_id')
        .eq('id', user.id)
        .single();
  
      if (!isMounted || !profile?.nation_id) {
        setLoading(false);
        return;
      }
  
      const id = profile.nation_id;
      setNationId(id);
      await fetchData(id);
      setLoading(false);
  
      if (isMounted) {
        channel = supabase.channel(`game-room-${id}`);
  
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Units', filter: `nation_id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Facilities', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Settlements', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Shipments', filter: `origin_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Nation', filter: `id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'StoreOrders', filter: `nation_id=eq.${id}` }, () => fetchData(id)) // Realtime for orders
          .on('postgres_changes', { event: '*', schema: 'public', table: 'GameState' }, () => fetchData(id))
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
        orders, // Provided in context
        nation,
        nationId, 
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