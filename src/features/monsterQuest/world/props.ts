/**
 * Wardrobe props are PNG images listed in public/monster-quest/props/props.json.
 * To add or change props: drop/replace PNGs, edit props.json (or run tools/slice_props.py) and run the generated
 * supabase/monster_quest_props.sql. No code changes. Placement is automatic: each explorer's head position and width
 * (stored in chars.json) place and size every prop.
 */
import { useSyncExternalStore } from 'react';
import type { Facing, HeadBox } from './characters';

export type PropSlot = 'prop_head' | 'prop_face' | 'prop_neck' | 'prop_back';
export type { Facing, HeadBox };
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
  head: { at: 'top', w: 1.1, ay: 0.85, oy: 0.2 },
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

export interface PropPlacement { x: number; y: number; w: number; h: number; behind: boolean }
/** Where to draw a prop, in the frame's own pixel space (x, y = top-left corner). null = hidden from this angle. */
export function placeProp(p: PropDef, m: HeadBox, facing: Facing, left = false): PropPlacement | null {
  if (facing === 'up' && (p.slot === 'prop_face' || p.slot === 'prop_neck')) return null;
  const hw = m.headW, w = p.w * hw;
  const ref = p.at === 'top' ? m.top : p.at === 'eyes' ? m.top + hw * 0.64 : p.at === 'neck' ? m.top + hw * 0.98 : m.top + hw * 1.1;
  const dir = left ? -1 : 1; // side view: the sheet already faces left or right, so shift props towards the facing direction
  let cx = m.cx + p.ox * hw;
  let ww = w;
  if (facing === 'side') {
    if (p.slot === 'prop_face') { cx += dir * hw * 0.2; ww = w * 0.72; }
    else if (p.slot === 'prop_back') { cx -= dir * hw * 0.34; ww = w * 0.76; }
    else if (p.slot === 'prop_head') { cx += dir * hw * 0.02; ww = w * 0.85; } // a front-view hat is narrower seen from the side
    else cx += dir * hw * 0.02;
  }
  return { x: cx - ww / 2, y: ref + p.oy * hw - p.ay * (ww * p.ar), w: ww, h: ww * p.ar, behind: p.slot === 'prop_back' && facing !== 'up' };
}
