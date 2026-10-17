import { supabase } from '../../lib/supabase';
import { STYLE_OPTIONS, registerCustomItems, type Category, type Item, type ItemGender, type Rarity, type Slot } from './catalog';

/**
 * Items created in the Style Store admin page live in the `store_items` table.
 * They are cached on the device so the store works offline and loads instantly.
 */

const CACHE_KEY = 'lingobite:storeitems:v1';
const SLOTS: Slot[] = ['hair', 'outfit', 'shoes', 'hat', 'accessory', 'backpack', 'pet', 'character'];
const CATEGORIES: Category[] = ['outfits', 'hats', 'hair', 'accessories', 'shoes', 'backpacks', 'pets', 'sets'];
const SLOT_CATEGORY: Record<string, Category> = {
  outfit: 'outfits',
  hat: 'hats',
  hair: 'hair',
  accessory: 'accessories',
  shoes: 'shoes',
  backpack: 'backpacks',
  pet: 'pets',
  character: 'sets',
  set: 'sets',
};

export interface StoreItemRow {
  id: string;
  name: string;
  slot: string;
  category?: string | null;
  gender: string;
  price: number;
  rarity: string;
  blurb?: string | null;
  spec?: Record<string, string | number | boolean> | null;
  hidden?: boolean | null;
  pieces?: string[] | null;
  active?: boolean | null;
}

/** Turns a database row into a catalog item; returns null if it isn't valid. */
export function rowToItem(row: StoreItemRow): Item | null {
  const isSet = row.slot === 'set';
  if (!row.id || !row.name || (!isSet && !SLOTS.includes(row.slot as Slot))) return null;
  const gender: ItemGender = row.gender === 'boy' || row.gender === 'girl' ? row.gender : 'unisex';
  const rarity: Rarity = row.rarity === 'rare' || row.rarity === 'epic' ? row.rarity : 'common';
  const category = (CATEGORIES.includes(row.category as Category) ? row.category : SLOT_CATEGORY[row.slot]) as Category;
  const spec: Record<string, string | number | boolean> = row.spec && typeof row.spec === 'object' ? { ...row.spec } : {};
  if (spec.modelUrl && !/^(https:\/\/|\/)/.test(String(spec.modelUrl))) delete spec.modelUrl; // only https or same-site models
  // an item needs either a known built-in shape or a (safe) 3D model link, otherwise it would silently look like a default item
  const style = String(spec.style ?? spec.model ?? spec.kind ?? '');
  const hasShape = (STYLE_OPTIONS[row.slot] ?? []).includes(style);
  if (!isSet && !hasShape && !spec.modelUrl) return null;
  return {
    id: row.id.startsWith('x-') ? row.id : `x-${row.id}`,
    name: String(row.name).slice(0, 40),
    slot: row.slot as Item['slot'],
    category,
    gender,
    price: Math.max(0, Math.min(99999, Math.round(Number(row.price) || 0))),
    rarity,
    blurb: String(row.blurb ?? '').slice(0, 140),
    spec,
    hidden: !!row.hidden,
    pieces: isSet ? (row.pieces ?? []) : undefined,
    custom: true,
  };
}

function applyRows(rows: StoreItemRow[]) {
  const items = rows.filter((r) => r.active !== false).map(rowToItem).filter((i): i is Item => !!i);
  registerCustomItems(items);
  return items;
}

// 1) cached items are registered immediately (synchronously) at import time
try {
  const cached = window.localStorage.getItem(CACHE_KEY);
  if (cached) applyRows(JSON.parse(cached) as StoreItemRow[]);
} catch {
  // ignore a broken cache
}

/** 2) fresh items are fetched once per page load. Fails silently if the table doesn't exist yet. */
let started = false;
export async function loadRemoteStoreItems(force = false) {
  if (started && !force) return;
  started = true;
  try {
    const { data, error } = await supabase.from('store_items').select('*').eq('active', true).order('created_at', { ascending: true });
    if (error || !data) return;
    applyRows(data as StoreItemRow[]);
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      // storage full / blocked
    }
  } catch {
    // offline - cached items stay in place
  }
}
