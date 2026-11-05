/**
 * Explorers. Each one is a sprite sheet public/monster-quest/chars/<id>.png made by tools/build_character.py:
 * 4 rows (toward camera, left, right, away) x 7 columns (1 = standing, 2-7 = the six walk frames), 256x256 per frame.
 * The list (names, prices, head size for props) is public/monster-quest/chars/chars.json, so adding a character needs no code change.
 * The first explorer is free; the others cost coins (prices live in the mq_cosmetics rows `char_<id>`).
 */
import { useSyncExternalStore } from 'react';

export type Facing = 'down' | 'up' | 'side';
export type Row = 'down' | 'left' | 'right' | 'up';
export interface HeadInfo { top: number; w: number }
export interface Character { id: string; name: string; blurb: string; price: number; head: Record<Row, HeadInfo> }
export interface HeadBox { top: number; bottom: number; cx: number; headW: number; w: number; h: number }
export interface FrameRect { sx: number; sy: number; sw: number; sh: number }

/** Sheet geometry. `feet` = y of the soles in a frame, `cx` = x of the head centre. */
export const SHEET = { w: 256, h: 256, cols: 7, rows: 4, feet: 248, cx: 128, walkFrames: 6 } as const;
export const DEFAULT_CHARACTER = 'adam';
export const characterKey = (id: string) => `char_${id}`;
export const sheetUrl = (id: string) => `${import.meta.env.BASE_URL}monster-quest/chars/${id}.png`;

const FALLBACK_HEAD: HeadInfo = { top: 28, w: 118 };
const fallback: Character = { id: DEFAULT_CHARACTER, name: 'Explorer', blurb: '', price: 0, head: { down: FALLBACK_HEAD, left: FALLBACK_HEAD, right: FALLBACK_HEAD, up: FALLBACK_HEAD } };

let list: Character[] = [];
let started = false;
const subs = new Set<() => void>();
export async function loadCharacters(force = false): Promise<Character[]> {
  if (started && !force) return list;
  started = true;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}monster-quest/chars/chars.json`, { cache: 'no-cache' });
    if (res.ok) { const j = await res.json() as { characters?: Character[] }; list = j.characters ?? []; subs.forEach((f) => f()); }
  } catch { /* no list yet */ }
  return list;
}
/** Live list of explorers from chars.json (loads on first use). */
export function useCharacters(): Character[] {
  void loadCharacters();
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => list);
}
export const characterById = (id: string): Character => list.find((c) => c.id === id) ?? list[0] ?? fallback;

/** Source rectangle of a frame. col 0 = standing, 1-6 = walk. Side view uses the real "right" or "left" row. */
export const frameRect = (facing: Facing, col: number, left = false): FrameRect => ({
  sx: col * SHEET.w, sy: (facing === 'down' ? 0 : facing === 'up' ? 3 : left ? 1 : 2) * SHEET.h, sw: SHEET.w, sh: SHEET.h,
});
/** Head position of an explorer in a frame, used to fit props. */
export function headBox(c: Character | undefined, facing: Facing, left = false): HeadBox {
  const h = c?.head[facing === 'side' ? (left ? 'left' : 'right') : facing] ?? FALLBACK_HEAD;
  return { top: h.top, bottom: SHEET.feet, cx: SHEET.cx, headW: h.w, w: SHEET.w, h: SHEET.h };
}
