import { useSyncExternalStore } from 'react';
import './remoteCatalog'; // registers cached admin items before the avatar is loaded
import {
  FREE_ITEM_IDS,
  STARTER,
  getItem,
  isFreeItem,
  priceOf,
  suitsGender,
  type Gender,
  type Look,
  type Slot,
} from './catalog';

/**
 * Avatar + coin wallet (v2). Stored on the device (localStorage) so it works
 * for guests and needs no database. Everything here is cosmetic: nothing
 * affects XP or scores. A later drop can sync this to the student's account.
 */

export interface SavedLook {
  id: string;
  name: string;
  look: Look;
}

export interface AvatarState {
  v: 2;
  coins: number;
  /** null until the student picks their hero. */
  gender: Gender | null;
  owned: string[];
  /** Equipped look per character, so each keeps its own style. */
  looks: Record<Gender, Look>;
  saved: Record<Gender, SavedLook[]>;
}

export const MAX_SAVED_LOOKS = 6;
const KEY_V2 = 'lingobite:avatar:v2';
const KEY_V1 = 'lingobite:blockquest:v1';

const fresh = (): AvatarState => ({
  v: 2,
  coins: 0,
  gender: null,
  owned: [...FREE_ITEM_IDS],
  looks: { boy: { ...STARTER.boy }, girl: { ...STARTER.girl } },
  saved: { boy: [], girl: [] },
});

// ------------------------------------------------------------ migration (v1 -> v2)
const V1_HATS: Record<string, string> = {
  cap: 'hat-cap',
  party: 'hat-party',
  wizard: 'hat-wizard',
  crown: 'hat-crown',
  helmet: 'hat-helmet',
};
const V1_SKINS: Record<string, string> = { tone1: 'skin1', tone2: 'skin3', tone3: 'skin4', tone4: 'skin5' };
const V1_SHIRT_PRICES: Record<string, number> = { red: 15, green: 15, purple: 25, orange: 25, pink: 25 };

function migrateV1(): AvatarState | null {
  try {
    const raw = window.localStorage.getItem(KEY_V1);
    if (!raw) return null;
    const old = JSON.parse(raw) as { coins?: number; owned?: string[]; hat?: string; skin?: string };
    const next = fresh();
    let coins = typeof old.coins === 'number' && old.coins > 0 ? Math.floor(old.coins) : 0;
    const ownedOld = Array.isArray(old.owned) ? old.owned.filter((x) => typeof x === 'string') : [];
    for (const id of ownedOld) {
      const [slot, value] = id.split(':');
      if (slot === 'hat' && V1_HATS[value]) next.owned.push(V1_HATS[value]);
      // Old shirts no longer exist: refund what they cost so nothing is lost.
      if (slot === 'shirt' && V1_SHIRT_PRICES[value]) coins += V1_SHIRT_PRICES[value];
    }
    next.coins = coins;
    const hat = old.hat ? V1_HATS[old.hat] : undefined;
    const skin = old.skin ? V1_SKINS[old.skin] : undefined;
    for (const g of ['boy', 'girl'] as Gender[]) {
      if (hat && next.owned.includes(hat)) next.looks[g].hat = hat;
      if (skin) next.looks[g].skin = skin;
    }
    return next;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------ load / validate
function cleanLook(raw: unknown, g: Gender, owned: Set<string>): Look {
  const base = STARTER[g];
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Look>;
  const pick = (id: unknown, slot: Slot, fallback: string | null): string | null => {
    if (typeof id !== 'string') return fallback;
    const item = getItem(id);
    return item && item.slot === slot && (owned.has(id) || isFreeItem(item)) && suitsGender(item, g) ? id : fallback;
  };
  return {
    hair: pick(r.hair, 'hair', base.hair) as string,
    outfit: pick(r.outfit, 'outfit', base.outfit) as string,
    shoes: pick(r.shoes, 'shoes', base.shoes) as string,
    hat: pick(r.hat, 'hat', null),
    accessory: pick(r.accessory, 'accessory', null),
    backpack: pick(r.backpack, 'backpack', null),
    pet: pick(r.pet, 'pet', null),
    character: pick(r.character, 'character', null),
    skin: typeof r.skin === 'string' ? r.skin : base.skin,
    hairColor: typeof r.hairColor === 'string' ? r.hairColor : base.hairColor,
  };
}

function load(): AvatarState {
  try {
    const raw = window.localStorage.getItem(KEY_V2);
    if (!raw) return migrateV1() ?? fresh();
    const p = JSON.parse(raw) as Partial<AvatarState>;
    const owned = new Set<string>(FREE_ITEM_IDS);
    if (Array.isArray(p.owned)) for (const id of p.owned) if (typeof id === 'string' && getItem(id)) owned.add(id);
    const gender = p.gender === 'boy' || p.gender === 'girl' ? p.gender : null;
    const saved = (g: Gender): SavedLook[] =>
      (Array.isArray(p.saved?.[g]) ? p.saved![g] : [])
        .filter((s) => s && typeof s.id === 'string' && typeof s.name === 'string')
        .slice(0, MAX_SAVED_LOOKS)
        .map((s) => ({ id: s.id, name: s.name.slice(0, 20), look: cleanLook(s.look, g, owned) }));
    return {
      v: 2,
      coins: typeof p.coins === 'number' && Number.isFinite(p.coins) && p.coins > 0 ? Math.floor(p.coins) : 0,
      gender,
      owned: [...owned],
      looks: { boy: cleanLook(p.looks?.boy, 'boy', owned), girl: cleanLook(p.looks?.girl, 'girl', owned) },
      saved: { boy: saved('boy'), girl: saved('girl') },
    };
  } catch {
    return fresh();
  }
}

let state: AvatarState = load();
const listeners = new Set<() => void>();

function commit(next: AvatarState) {
  state = next;
  try {
    window.localStorage.setItem(KEY_V2, JSON.stringify(next));
  } catch {
    // Storage can be blocked (private mode) - the avatar just won't persist.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getAvatarState = () => state;

/** Owned = bought, or free (price 0, e.g. starter items and free admin-made items). */
export function isOwned(s: AvatarState, id: string): boolean {
  if (s.owned.includes(id)) return true;
  const item = getItem(id);
  return !!item && isFreeItem(item);
}

export function useAvatarState(): AvatarState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

// ------------------------------------------------------------ actions
export function addCoins(amount: number) {
  if (!(amount > 0)) return;
  commit({ ...state, coins: state.coins + Math.round(amount) });
}

export function chooseGender(g: Gender) {
  if (state.gender === g) return;
  commit({ ...state, gender: g });
}

function withLook(g: Gender, patch: Partial<Look>): AvatarState {
  return { ...state, looks: { ...state.looks, [g]: { ...state.looks[g], ...patch } } };
}

/** Puts an owned item (or every piece of an owned set) on the current character. */
export function equipItem(id: string) {
  const g = state.gender;
  const item = getItem(id);
  if (!g || !item || !suitsGender(item, g)) return;
  if (item.slot === 'set') {
    const pieces = (item.pieces ?? []).filter((p) => isOwned(state, p));
    if (pieces.length === 0) return;
    const patch: Partial<Look> = {};
    for (const pid of pieces) {
      const piece = getItem(pid);
      if (piece && piece.slot !== 'set') (patch as Record<string, string>)[piece.slot] = pid;
    }
    commit(withLook(g, patch));
    return;
  }
  if (!isOwned(state, id)) return;
  commit(withLook(g, { [item.slot]: id }));
}

export function unequipSlot(slot: Slot) {
  const g = state.gender;
  if (!g || slot === 'hair' || slot === 'outfit' || slot === 'shoes') return;
  commit(withLook(g, { [slot]: null }));
}

export function setSkin(id: string) {
  if (state.gender) commit(withLook(state.gender, { skin: id }));
}

export function setHairColor(id: string) {
  if (state.gender) commit(withLook(state.gender, { hairColor: id }));
}

/** Buys an item (or a set), then wears it. Returns what happened. */
export function buyItem(id: string): 'ok' | 'poor' | 'owned' | 'invalid' {
  const g = state.gender;
  const item = getItem(id);
  if (!g || !item || !suitsGender(item, g)) return 'invalid';
  const ownedAll = item.slot === 'set' ? (item.pieces ?? []).every((p) => isOwned(state, p)) : isOwned(state, id);
  if (ownedAll) return 'owned';
  const price = priceOf(item, state.owned);
  if (state.coins < price) return 'poor';
  const owned = new Set(state.owned);
  if (item.slot === 'set') (item.pieces ?? []).forEach((p) => owned.add(p));
  else owned.add(id);
  commit({ ...state, coins: state.coins - price, owned: [...owned] });
  equipItem(id);
  return 'ok';
}

export function saveLook(name: string, replaceId?: string): boolean {
  const g = state.gender;
  if (!g) return false;
  const list = state.saved[g];
  const clean = name.trim().slice(0, 20) || `Look ${list.length + 1}`;
  const entry: SavedLook = { id: replaceId ?? `look-${Date.now()}`, name: clean, look: { ...state.looks[g] } };
  let next: SavedLook[];
  if (replaceId && list.some((s) => s.id === replaceId)) next = list.map((s) => (s.id === replaceId ? entry : s));
  else if (list.length < MAX_SAVED_LOOKS) next = [...list, entry];
  else return false;
  commit({ ...state, saved: { ...state.saved, [g]: next } });
  return true;
}

export function wearSavedLook(id: string) {
  const g = state.gender;
  const found = g ? state.saved[g].find((s) => s.id === id) : undefined;
  if (g && found) commit({ ...state, looks: { ...state.looks, [g]: { ...found.look } } });
}

export function deleteSavedLook(id: string) {
  const g = state.gender;
  if (!g) return;
  commit({ ...state, saved: { ...state.saved, [g]: state.saved[g].filter((s) => s.id !== id) } });
}

/** The look of the chosen character (null until a hero has been picked). */
export function useCurrentLook(): { gender: Gender | null; look: Look | null; coins: number } {
  const s = useAvatarState();
  return { gender: s.gender, look: s.gender ? s.looks[s.gender] : null, coins: s.coins };
}
