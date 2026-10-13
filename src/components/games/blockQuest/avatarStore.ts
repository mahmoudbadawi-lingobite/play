import { useSyncExternalStore } from 'react';

/**
 * Block Quest avatar + coin wallet.
 * Stored on the device (localStorage) so it works for guests too and needs no
 * database changes. Cosmetic only - nothing here affects XP or scores.
 */

export type ShopSlot = 'hat' | 'shirt' | 'skin';

export interface ShopItem {
  id: string;
  slot: ShopSlot;
  value: string;
  name: string;
  price: number;
}

export interface AvatarLook {
  hat: string;
  shirt: string;
  skin: string;
}

interface StoreState extends AvatarLook {
  coins: number;
  owned: string[];
}

export const SHIRT_COLORS: Record<string, string> = {
  blue: '#3D7BFF',
  red: '#E8453C',
  green: '#2DB36B',
  purple: '#7B61FF',
  orange: '#FF9A1F',
  pink: '#FF5FA2',
};

export const SKIN_COLORS: Record<string, string> = {
  tone1: '#FFD7B5',
  tone2: '#F0B48A',
  tone3: '#C68642',
  tone4: '#8D5524',
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'hat:none', slot: 'hat', value: 'none', name: 'No hat', price: 0 },
  { id: 'hat:cap', slot: 'hat', value: 'cap', name: 'Red cap', price: 0 },
  { id: 'hat:party', slot: 'hat', value: 'party', name: 'Party hat', price: 25 },
  { id: 'hat:helmet', slot: 'hat', value: 'helmet', name: 'Space helmet', price: 40 },
  { id: 'hat:wizard', slot: 'hat', value: 'wizard', name: 'Wizard hat', price: 40 },
  { id: 'hat:crown', slot: 'hat', value: 'crown', name: 'Gold crown', price: 60 },

  { id: 'shirt:blue', slot: 'shirt', value: 'blue', name: 'Blue shirt', price: 0 },
  { id: 'shirt:red', slot: 'shirt', value: 'red', name: 'Red shirt', price: 15 },
  { id: 'shirt:green', slot: 'shirt', value: 'green', name: 'Green shirt', price: 15 },
  { id: 'shirt:purple', slot: 'shirt', value: 'purple', name: 'Purple shirt', price: 25 },
  { id: 'shirt:orange', slot: 'shirt', value: 'orange', name: 'Orange shirt', price: 25 },
  { id: 'shirt:pink', slot: 'shirt', value: 'pink', name: 'Pink shirt', price: 25 },

  { id: 'skin:tone1', slot: 'skin', value: 'tone1', name: 'Skin 1', price: 0 },
  { id: 'skin:tone2', slot: 'skin', value: 'tone2', name: 'Skin 2', price: 0 },
  { id: 'skin:tone3', slot: 'skin', value: 'tone3', name: 'Skin 3', price: 0 },
  { id: 'skin:tone4', slot: 'skin', value: 'tone4', name: 'Skin 4', price: 0 },
];

const STORAGE_KEY = 'lingobite:blockquest:v1';
const FREE_IDS = SHOP_ITEMS.filter((i) => i.price === 0).map((i) => i.id);
const ALL_IDS = new Set(SHOP_ITEMS.map((i) => i.id));

const DEFAULTS: StoreState = {
  coins: 0,
  owned: FREE_IDS,
  hat: 'cap',
  shirt: 'blue',
  skin: 'tone1',
};

function load(): StoreState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    const owned = new Set<string>(FREE_IDS);
    if (Array.isArray(parsed.owned)) {
      for (const id of parsed.owned) if (typeof id === 'string' && ALL_IDS.has(id)) owned.add(id);
    }
    const pick = (slot: ShopSlot, value: unknown, fallback: string) =>
      typeof value === 'string' && owned.has(`${slot}:${value}`) ? value : fallback;
    return {
      coins: typeof parsed.coins === 'number' && Number.isFinite(parsed.coins) && parsed.coins > 0 ? Math.floor(parsed.coins) : 0,
      owned: [...owned],
      hat: pick('hat', parsed.hat, DEFAULTS.hat),
      shirt: pick('shirt', parsed.shirt, DEFAULTS.shirt),
      skin: pick('skin', parsed.skin, DEFAULTS.skin),
    };
  } catch {
    return DEFAULTS;
  }
}

let state: StoreState = load();
const listeners = new Set<() => void>();

function commit(next: StoreState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

export function addCoins(amount: number) {
  if (!(amount > 0)) return;
  commit({ ...state, coins: state.coins + Math.round(amount) });
}

export function equipItem(item: ShopItem) {
  if (!state.owned.includes(item.id)) return;
  const next: StoreState = { ...state };
  next[item.slot] = item.value;
  commit(next);
}

export function buyItem(item: ShopItem): 'owned' | 'ok' | 'poor' {
  if (state.owned.includes(item.id)) return 'owned';
  if (state.coins < item.price) return 'poor';
  const next: StoreState = { ...state, coins: state.coins - item.price, owned: [...state.owned, item.id] };
  next[item.slot] = item.value;
  commit(next);
  return 'ok';
}

export function useAvatarStore(): StoreState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
