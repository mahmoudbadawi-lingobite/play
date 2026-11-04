/**
 * Wardrobe props are PNG images listed in public/monster-quest/props/props.json.
 * To add or change props: drop/replace PNGs, edit props.json (or run tools/slice_props.py) and run the generated
 * supabase/monster_quest_props.sql. No code changes. Placement is automatic: for every explorer frame the head is
 * measured from the artwork (top, centre, width) and each prop is sized and placed from that.
 */
import { useSyncExternalStore } from 'react';
import type { Facing, FrameRect } from './characters';

export type PropSlot = 'prop_head' | 'prop_face' | 'prop_neck' | 'prop_back';
export type { Facing };
export interface PropDef {
  id: string; slot: PropSlot; name: string; file: string;
  /** image height / width (written by tools/slice_props.py) */ ar: number;
  /** prop width as a multiple of the explorer's head width */ w: number;
  /** anchor line on the explorer: top of head, eyes, neck, shoulders */ at: 'top' | 'eyes' | 'neck' | 'back';
  /** fraction of the prop's height that sits on the anchor line (0 = its top edge, 1 = its bottom edge) */ ay: number;
  /** nudges, in head widths (x to the right, y downwards) */ ox: number; oy: number;
}
interface RawProp { id: string; name?: string; slot: string; file?: string; price?: number; ar?: number; w?: number; ay?: number; ox?: number; oy?: number; at?: PropDef['at'] }

// Defaults per slot: tune a single prop with w/ay/ox/oy in props.json
const SLOT_DEFAULTS: Record<string, { at: PropDef['at']; w: number; ay: number; oy: number }> = {
  head: { at: 'top', w: 1.1, ay: 0.85, oy: 0.06 },
  face: { at: 'eyes', w: 0.85, ay: 0.5, oy: 0 },
  neck: { at: 'neck', w: 0.7, ay: 0.4, oy: 0 },
  back: { at: 'back', w: 1.5, ay: 0.3, oy: 0.1 },
};
const norm = (r: RawProp): PropDef | null => {
  const d = SLOT_DEFAULTS[r.slot]; if (!d || !r.id) return null;
  return { id: r.id, slot: `prop_${r.slot}` as PropSlot, name: r.name ?? r.id, file: r.file ?? `${r.id}.png`, ar: r.ar ?? 1, w: r.w ?? d.w, at: r.at ?? d.at, ay: r.ay ?? d.ay, ox: r.ox ?? 0, oy: r.oy ?? d.oy };
};

let catalog: PropDef[] = [];
let started = false;
const subs = new Set<() => void>();
const base = () => `${import.meta.env.BASE_URL}monster-quest/props/`;
export async function loadPropCatalog(force = false): Promise<PropDef[]> {
  if (started && !force) return catalog;
  started = true;
  try {
    const res = await fetch(`${base()}props.json`, { cache: 'no-cache' });
    if (res.ok) { const j = await res.json() as { props?: RawProp[] }; catalog = (j.props ?? []).map(norm).filter((p): p is PropDef => !!p); subs.forEach((f) => f()); }
  } catch { /* no catalog yet: no props */ }
  return catalog;
}
/** Live list of props from props.json (loads on first use). */
export function usePropCatalog(): PropDef[] {
  void loadPropCatalog();
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => catalog);
}
export const propUrl = (p: PropDef) => `${base()}${p.file}`;

// ------------------------------------------------------------------ measuring explorer frames
export interface HeadBox { top: number; bottom: number; cx: number; headW: number; w: number; h: number }
const cache = new Map<string, HeadBox | null>();

/** Finds the head inside one frame of a sprite sheet from its transparent pixels (null until the image has loaded). */
export function measureFrame(img: HTMLImageElement, r?: FrameRect): HeadBox | null {
  const sx = r?.sx ?? 0, sy = r?.sy ?? 0, w = r?.sw ?? img.naturalWidth, h = r?.sh ?? img.naturalHeight;
  const key = `${img.currentSrc || img.src}#${sx},${sy}`;
  if (cache.has(key)) return cache.get(key)!;
  if (!img.complete || !img.naturalWidth) return null;
  let res: HeadBox | null = null;
  try {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true })!; c.drawImage(img, sx, sy, w, h, 0, 0, w, h);
    const d = c.getImageData(0, 0, w, h).data;
    const rowExtent = (y: number): [number, number] | null => { let a = -1, b = -1; for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (a < 0) a = x; b = x; } return a < 0 ? null : [a, b]; };
    let top = -1, bottom = -1;
    for (let y = 0; y < h; y++) { if (rowExtent(y)) { if (top < 0) top = y; bottom = y; } }
    if (top >= 0) {
      const H = bottom - top; let lo = Infinity, hi = -Infinity;
      for (let y = Math.round(top + H * 0.12); y <= Math.round(top + H * 0.30); y++) { const e = rowExtent(y); if (e) { lo = Math.min(lo, e[0]); hi = Math.max(hi, e[1]); } }
      if (isFinite(lo)) res = { top, bottom, cx: (lo + hi) / 2, headW: Math.max(20, hi - lo), w, h };
    }
  } catch { res = null; }
  cache.set(key, res);
  return res;
}

export interface PropPlacement { x: number; y: number; w: number; h: number; behind: boolean }
/** Where to draw a prop, in the frame's own pixel space (x, y = top-left corner). null = hidden from this angle. */
export function placeProp(p: PropDef, m: HeadBox, facing: Facing, left = false): PropPlacement | null {
  if (facing === 'up' && (p.slot === 'prop_face' || p.slot === 'prop_neck')) return null;
  const hw = m.headW, w = p.w * hw, h = w * p.ar;
  const ref = p.at === 'top' ? m.top : p.at === 'eyes' ? m.top + hw * 0.64 : p.at === 'neck' ? m.top + hw * 0.98 : m.top + hw * 1.1;
  const dir = left ? -1 : 1; // side view: the sheet already faces left or right, so shift props towards the facing direction
  let cx = m.cx + p.ox * hw;
  let ww = w;
  if (facing === 'side') {
    if (p.slot === 'prop_face') { cx += dir * hw * 0.2; ww = w * 0.72; }
    else if (p.slot === 'prop_back') { cx -= dir * hw * 0.34; ww = w * 0.76; }
    else cx += dir * hw * 0.02;
  }
  return { x: cx - ww / 2, y: ref + p.oy * hw - p.ay * (ww * p.ar), w: ww, h: ww * p.ar, behind: p.slot === 'prop_back' && facing !== 'up' };
}
