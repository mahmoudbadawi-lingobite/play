import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from './api';
import { DEFAULT_LOOK } from './art/Trainer';
import type { Cosmetic, Item, Look, OwnedMonster, PlayerState, Species, Zone } from './types';

interface MqCtx {
  userId: string; name: string; isStaff: boolean;
  zones: Zone[]; species: Species[]; speciesById: Map<string, Species>; items: Item[]; itemsByKey: Map<string, Item>;
  state: PlayerState; monsters: OwnedMonster[];
  cosmetics: Cosmetic[]; ownedCosmetics: Set<string>; look: Look;
  /** explorer id being played (null until the first explorer is chosen) */ character: string | null;
  /** explorer ids this player owns */ ownedCharacters: string[];
  /** true once the explorers/props SQL patch is installed */ hasExplorers: boolean;
  /** prop ids currently worn */ props: string[];
  setState: (s: PlayerState) => void;
  refresh: () => Promise<void>;
}
const Ctx = createContext<MqCtx | null>(null);
export const useMq = () => { const c = useContext(Ctx); if (!c) throw new Error('useMq outside MqProvider'); return c; };

export function MqProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [defs, setDefs] = useState<{ zones: Zone[]; species: Species[]; items: Item[] } | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [monsters, setMonsters] = useState<OwnedMonster[]>([]);
  const [cos, setCos] = useState<{ cosmetics: Cosmetic[]; owned: string[] }>({ cosmetics: [], owned: [] });
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const userIdRef = useRef<string | null>(null); userIdRef.current = profile?.uid ?? null;

  const refresh = useCallback(async () => {
    const [s, m] = await Promise.all([api.getState(), api.loadMonsters()]);
    setState(s); setMonsters(m);
    if (userIdRef.current) api.loadCosmetics(userIdRef.current).then(setCos).catch(() => undefined);
  }, []);

  useEffect(() => {
    let alive = true;
    setError(null);
    Promise.all([api.loadDefinitions(), api.getState(), api.loadMonsters(), profile ? api.loadCosmetics(profile.uid) : Promise.resolve({ cosmetics: [], owned: [] })])
      .then(([d, s, m, c]) => { if (!alive) return; setDefs(d); setState(s); setMonsters(m); setCos(c); })
      .catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [attempt, profile?.uid]);

  const value = useMemo<MqCtx | null>(() => {
    if (!defs || !state || !profile) return null;
    const byKey = new Map(cos.cosmetics.map((c) => [c.key, c]));
    const look: Look = { ...DEFAULT_LOOK };
    const props: string[] = [];
    for (const [slot, key] of Object.entries(state.outfit ?? {})) {
      const c = byKey.get(key); if (!c) continue;
      if (c.slot === 'character') continue;
      if (c.slot.startsWith('prop_')) { if (c.data.prop && slot === c.slot) props.push(c.data.prop); continue; }
      Object.assign(look, c.data);
    }
    const owned = new Set(cos.owned);
    const character = byKey.get(state.outfit?.character ?? '')?.data.char ?? null;
    const ownedCharacters = cos.cosmetics.filter((c) => c.slot === 'character' && owned.has(c.key)).map((c) => c.data.char!).filter(Boolean);
    return {
      cosmetics: cos.cosmetics, ownedCosmetics: owned, look, character, ownedCharacters, props, hasExplorers: cos.cosmetics.some((c) => c.slot === 'character'),
      userId: profile.uid, name: profile.displayName ?? 'Trainer', isStaff: profile.role === 'teacher' || profile.role === 'admin',
      ...defs, speciesById: new Map(defs.species.map((s) => [s.id, s])), itemsByKey: new Map(defs.items.map((i) => [i.key, i])),
      state, monsters, setState, refresh,
    };
  }, [defs, state, monsters, profile, refresh, cos]);

  if (error) {
    const missing = /mq_|relation|function|schema cache/i.test(error);
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-4xl">🛠️</p>
        <h2 className="mt-2 font-display text-xl font-bold text-primary">Monster Quest can't load yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {missing ? 'The Monster Quest database tables are not installed in Supabase yet. Run supabase/monster_quest_patch.sql in the SQL editor, then try again.' : error}
        </p>
        <button onClick={() => setAttempt((a) => a + 1)} className="mt-4 rounded-xl bg-secondary px-5 py-2 font-bold text-secondary-foreground">Try again</button>
      </div>
    );
  }
  if (!value) return <p className="p-10 text-center text-muted-foreground">Loading Monster Quest…</p>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
