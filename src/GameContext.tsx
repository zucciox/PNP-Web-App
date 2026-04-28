import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { Unit, Facility, resourceStockpileData, Settlement, Shipment, gameStateData } from './types';

interface GameContextType {
  units: Unit[];
  facilities: Facility[];
  resources: resourceStockpileData | null;
  gameState: gameStateData | null;
  settlements: Settlement[];
  shipments: Shipment[];
  nationId: string | null;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [resources, setResources] = useState<resourceStockpileData | null>(null);
    const [gameState, setGameState] = useState<gameStateData | null>(null);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [nationId, setNationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    // Helper to refresh data
    const fetchData = async (id: string) => {
      // Note: Using .single() on GameState assumes there is only one row for the whole game
      const [u, f, r, g, set, ship] = await Promise.all([
        supabase.from('Units').select('*').eq('nation_id', id),
        supabase.from('Facilities').select('*').eq('owner_nation', id),
        supabase.from('ResourceStockpiles').select('*').eq('nation_id', id).maybeSingle(),
        supabase.from('GameState').select('*').maybeSingle(), // Use maybeSingle to prevent errors if empty
        supabase.from('Settlements').select('*').eq('owner_nation', id),
        supabase.from('Shipments').select('*').eq('origin_nation', id),
      ]);
  
      setUnits(u.data || []);
      setFacilities(f.data || []);
      setResources(r.data as resourceStockpileData);
      setGameState(g.data as gameStateData); 
      setSettlements(set.data || []);
      setShipments(ship.data || []);
    };
  
    useEffect(() => {
      let channel: any;
  
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        const { data: profile } = await supabase.from('Profiles').select('nation_id').eq('id', user.id).single();
        if (!profile || !profile.nation_id) return;
  
        const id = profile.nation_id;
        setNationId(id);
        await fetchData(id);
        setLoading(false);
  
        channel = supabase.channel(`game-updates-${id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Units', filter: `nation_id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Facilities', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ResourceStockpiles', filter: `nation_id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Settlements', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Shipments', filter: `origin_nation=eq.${id}` }, () => fetchData(id))
          // GLOBAL TABLE: No filter applied here
          .on('postgres_changes', { event: '*', schema: 'public', table: 'GameState' }, () => fetchData(id))
          .subscribe();
      };
  
      init();
      return () => { if (channel) supabase.removeChannel(channel); };
    }, []);
  
    useEffect(() => {
      let channel: any;
  
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        const { data: profile } = await supabase.from('Profiles').select('nation_id').eq('id', user.id).single();
        if (!profile) return;
  
        const id = profile.nation_id;
        setNationId(id);
        await fetchData(id); // Initial Load
        setLoading(false);
  
        // --- REALTIME SUBSCRIPTION ---
        channel = supabase.channel(`nation-updates-${id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Units', filter: `nation_id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Facilities', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ResourceStockpiles', filter: `nation_id=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'GameState'}, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Settlements', filter: `owner_nation=eq.${id}` }, () => fetchData(id))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Shipments', filter: `origin_nation=eq.${id}` }, () => fetchData(id))
          .subscribe();
      };
  
      init();
  
      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }, []);
  
    return (
      <GameContext.Provider value={{ units, facilities, resources, settlements, shipments, nationId, gameState, loading }}>
        {children}
      </GameContext.Provider>
    );
  };

// Custom hook for easy access
export const useGameData = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameData must be used within GameProvider");
  return context;
};