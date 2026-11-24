import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { Unit, Facility, Settlement, Shipment, gameStateData, FacilityType, UnitType, Nation, Order, Profile, CombatExchange, Notification, GameFeed, EventType, ScoreObject } from './types';
import { RealtimeChannel } from '@supabase/supabase-js';

/* ------------------------------------------------------------------ *
 *  TUNING KNOBS
 *  A change event schedules ONE refetch of ONLY the affected table,
 *  after this delay. Any further events for that table during the
 *  delay are folded into the same refetch (they cost nothing extra).
 *  Lower = snappier UI but more queries. Raise if you still see lag.
 * ------------------------------------------------------------------ */
const DELAY_MS = {
  units: 250,
  facilities: 250,
  settlements: 250,
  shipments: 250,
  nation: 250,
  orders: 250,
  combat: 250,
  notifications: 500,
  gameState: 100,
  scores: 3000,        // game_feed + leaderboard + score breakdown (the expensive ones)
};
const SCORES_POLL_MS = 20_000;   // game_feed is no longer realtime; refreshed on this cadence
const SAFETY_RESYNC_MS = 60_000; // full resync in case a realtime event was ever dropped

type ResourceKey = keyof typeof DELAY_MS;

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
  scoreBreakdown: Record<string, number>;
  nationScores: ScoreObject[];
  nation: Nation | null;
  nationId: string | null;
  profile: Profile | null;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Cheap deep-equality so an unchanged refetch doesn't trigger a re-render.
const sameData = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Returns a function that stores `data` only if it actually differs from current state.
const put = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, fallback: T) =>
  (data: T | null) => {
    const next = data ?? fallback;
    setter(prev => (sameData(prev, next) ? prev : next));
  };

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
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({});
  const [nation, setNation] = useState<Nation | null>(null);
  const [nationId, setNationId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationScores, setNationScores] = useState<ScoreObject[]>([]);

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    let isMounted = true;
    const timers: Partial<Record<ResourceKey, ReturnType<typeof setTimeout>>> = {};
    const intervals: ReturnType<typeof setInterval>[] = [];

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (!isMounted || !profileData?.nation_id) {
        setLoading(false);
        return;
      }

      const id: string = profileData.nation_id;
      const role: string = profileData.role;
      setProfile(profileData as Profile);
      setNationId(id);

      /* ---------- generic loader ----------
       * - drops responses that arrive out of order (older request finishing last)
       * - on error, KEEPS the existing data instead of blanking the UI
       */
      const seq: Record<string, number> = {};
      const load = async (
        key: string,
        query: PromiseLike<{ data: any; error: any }>,
        apply: (data: any) => void
      ) => {
        const mine = (seq[key] = (seq[key] ?? 0) + 1);
        try {
          const { data, error } = await query;
          if (!isMounted || mine !== seq[key]) return;
          if (error) {
            console.warn(`[GameContext] "${key}" fetch failed; keeping previous data.`, error.message ?? error);
            return;
          }
          apply(data);
        } catch (e) {
          console.warn(`[GameContext] "${key}" fetch threw; keeping previous data.`, e);
        }
      };

      /* ---------- one fetcher per resource ---------- */
      const fetchers: Record<ResourceKey, () => Promise<unknown>> = {
        units: () => load('units', supabase.from('units').select('*').eq('nation_id', id), put<Unit[]>(setUnits, [])),
        facilities: () => load('facilities', supabase.from('facilities').select('*').eq('owner_nation', id), put<Facility[]>(setFacilities, [])),
        settlements: () => load('settlements', supabase.from('settlements').select('*').eq('owner_nation', id), put<Settlement[]>(setSettlements, [])),
        shipments: () => load('shipments', supabase.from('shipments').select('*').eq('origin_nation', id), put<Shipment[]>(setShipments, [])),
        nation: () => load('nation', supabase.from('nation').select('*').eq('id', id).maybeSingle(), put<Nation | null>(setNation, null)),
        orders: () => load('orders', supabase.from('factory_orders').select('*').eq('nation_id', id), put<Order[]>(setOrders, [])),
        combat: () => load('combat', supabase.from('combat_exchanges').select('*').or(`aggressor_nation.eq.${id},victim_nation.eq.${id}`), put<CombatExchange[]>(setCombat, [])),
        notifications: () => load(
          'notifications',
          role === 'Admin'
            ? supabase.from('notifications').select('*')
            : supabase.from('notifications').select('*').eq('receiving_nation', id),
          put<Notification[]>(setNotifications, [])
        ),
        gameState: () => load('gameState', supabase.from('game_state').select('*').maybeSingle(), put<gameStateData | null>(setGameState, null)),
        scores: () => Promise.all([
          load('feed', supabase.from('game_feed').select('*').order('created_at', { ascending: false }).limit(999), put<GameFeed[]>(setGameFeed, [])),
          load('nationScores', supabase.from('nation_scores').select('*'), put<ScoreObject[]>(setNationScores, [])),
          load('breakdown', supabase.rpc('get_nation_score_breakdown', { target_nation_id: id }), (rows: { event_type: string; total_points: number | string }[] | null) => {
            const obj: Record<string, number> = {};
            let grandTotal = 0;
            (rows ?? []).forEach(row => {
              const points = Number(row.total_points) || 0;
              obj[row.event_type] = points;
              grandTotal += points;
            });
            obj['grand_total'] = grandTotal;
            setScoreBreakdown(prev => (sameData(prev, obj) ? prev : obj));
          }),
        ]),
      };

      const refreshAll = () => Promise.all((Object.keys(fetchers) as ResourceKey[]).map(k => fetchers[k]()));

      // Static lookup tables: fetched once, never subscribed to.
      const loadStatic = () => Promise.all([
        load('facility_types', supabase.from('facility_types').select('*'), put<FacilityType[]>(setFacilityTypes, [])),
        load('unit_types', supabase.from('unit_types').select('*'), put<UnitType[]>(setUnitTypes, [])),
        load('event_types', supabase.from('event_types').select('*'), put<EventType[]>(setEventTypes, [])),
      ]);

      /* ---------- coalescing scheduler ----------
       * First event for a table starts a timer; events that arrive while the
       * timer is pending are ignored (the refetch will already include them).
       * Guarantees an update at most DELAY_MS after the first event, never starved.
       */
      const schedule = (key: ResourceKey) => {
        if (timers[key]) return;
        const jitter = key === 'scores' ? Math.random() * 3000 : 0; // de-sync the 35 clients at interval boundaries
        timers[key] = setTimeout(() => {
          delete timers[key];
          if (isMounted) fetchers[key]();
        }, DELAY_MS[key] + jitter);
      };

      await Promise.all([loadStatic(), refreshAll()]);
      if (!isMounted) return;
      setLoading(false);

      channel = supabase.channel(`game-room-${id}`);

      channel
        // Your own pieces / resources: already filtered server-side.
        .on('postgres_changes', { event: '*', schema: 'public', table: 'units', filter: `nation_id=eq.${id}` }, () => schedule('units'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'facilities', filter: `owner_nation=eq.${id}` }, () => schedule('facilities'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `owner_nation=eq.${id}` }, () => schedule('settlements'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `origin_nation=eq.${id}` }, () => schedule('shipments'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nation', filter: `id=eq.${id}` }, () => schedule('nation'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'factory_orders', filter: `nation_id=eq.${id}` }, () => schedule('orders'))
        // combat_exchanges was UNFILTERED (every player got every combat event). Filter server-side.
        // Two subscriptions because a filter can only target one column.
        .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_exchanges', filter: `aggressor_nation=eq.${id}` }, () => schedule('combat'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_exchanges', filter: `victim_nation=eq.${id}` }, () => schedule('combat'))
        // One row, changes once per interval. Also a good moment to refresh scores.
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => { schedule('gameState'); schedule('scores'); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new as Profile);
        });

      // notifications was UNFILTERED. Admins still see everything; players only theirs.
      if (role === 'Admin') {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => schedule('notifications'));
      } else {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `receiving_nation=eq.${id}` }, () => schedule('notifications'));
      }

      // NOT subscribed anymore: game_feed (13k rows, every insert went to all 35 clients)
      // and event_types (static). game_feed/leaderboard refresh via game_state + polling below.

      let hasSubscribed = false;
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          if (hasSubscribed) refreshAll(); // reconnected: catch up on anything missed
          hasSubscribed = true;
          console.log('%c⚡ Supabase Realtime: Successfully connected!', 'color: #00ff00; font-weight: bold;');
        }
        if (status === 'TIMED_OUT') {
          console.error('❌ Supabase Realtime: Connection timed out. Check network or table filters.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Supabase Realtime: Channel error occurred:', err?.message || 'Unknown error');
        }
      });

      intervals.push(setInterval(() => schedule('scores'), SCORES_POLL_MS));
      intervals.push(setInterval(() => { refreshAll(); }, SAFETY_RESYNC_MS));
    };

    init();

    return () => {
      isMounted = false;
      (Object.values(timers) as ReturnType<typeof setTimeout>[]).forEach(clearTimeout);
      intervals.forEach(clearInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo(() => ({
    units, facilities, facilityTypes, unitTypes, settlements, shipments,
    orders, combat, notifications, gameFeed, eventTypes, scoreBreakdown, nationScores, nation,
    nationId, profile, gameState, loading,
  }), [
    units, facilities, facilityTypes, unitTypes, settlements, shipments,
    orders, combat, notifications, gameFeed, eventTypes, scoreBreakdown, nationScores, nation,
    nationId, profile, gameState, loading,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameData = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameData must be used within GameProvider");
  return context;
};