/**
 * Storybook look for a location: ground textures, dirt paths, water, bridges and every object drawn from the
 * painted sprites in public/monster-quest/world/. A location opts in with `style: 'storybook'`.
 * To change how big or where an object sits, edit SCALE and km() below. New pictures: tools/build_world_assets.py.
 */
import type { Field } from '../collision';
import type { Sprite, StoryHook } from '../paintProps';
import type { LiquidDef, LocationDef, PathDef, PropDef, Pt, ZoneDef } from '../types';
import { pointInPoly, rng } from '../util';
import { aAsset, aImg, gImg, loadStoryAssets, sImg } from './assets';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const mkcv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

export interface AnimFrames { img: HTMLImageElement; n: number; fps: number; fw: number; fh: number }
type Fp = { t: 'e'; rx: number; ry: number; dy: number } | { t: 'r'; hw: number; hh: number; dy: number };
export interface StoryPlaced { sp: Sprite; canopy: boolean; fx?: (c: C, d: PropDef, t: number) => void; sway?: number; frames?: AnimFrames; fp: Fp[]; shadow: [number, number] }
export interface Peek { x: number; y: number; id: string; ph: number }

// ------------------------------------------------------------------ how big each picture is drawn (1 = as cut from the sheet)
const SCALE: Record<string, number> = {
  'tree-green': 1.0, 'tree-pink': 1.0, 'tree-orange': 1.0, pine: 1.0, palm: 1.0, cypress: 1.0,
  'house-red': 0.82, 'house-purple': 0.82, 'house-blue': 0.82, 'house-orange': 0.82, 'house-pink': 0.82, 'house-green': 0.82, 'cottage-blue': 0.8, 'hut-wood': 0.74, 'shop-house': 0.74,
  'bush-big': 0.32, 'bush-mid': 0.33, 'bush-berry': 0.38, 'bush-flowers': 0.9, 'bush-flowers2': 0.9,
  'rock-moss': 0.85, 'rock-block': 0.85, 'rocks-small': 0.7, 'rock-mossy': 0.36,
  'mush-red': 0.42, 'mush-purple': 0.45,
  'crystal-pillar': 1, 'crystal-shard': 1, 'gem-big': 1, 'gem-small': 1, 'crystal-pedestal': 1.1,
  'lamp-a': 1, 'lamp-b': 1, 'lamp-c': 1.1, 'lamp-hanging': 1,
  'stall-potions': 1.05, 'stall-blue': 1.15, 'stall-fruit': 1.15, 'notice-board': 0.8, chest: 0.65, 'sign-green': 0.7, 'sign-blue': 0.7,
  'fence-wood': 0.8, 'fence-picket': 0.8, 'banner-post': 1.3, well: 1, bench: 0.9, barrel: 0.9, barrel2: 0.9, crate: 0.9, planter: 0.9, log: 1, stump: 1, 'stump-roots': 0.3, 'log-hollow': 0.3,
  'flowers-white': 0.8, 'flowers-purple': 1, 'flowers-yellow': 1, tulips: 1, 'flowers-big': 0.3, 'flowers-mid': 0.4, 'flowers-small': 0.5,
  'grass-big': 0.3, 'grass-mid': 0.3, 'grass-small': 0.3, fern: 0.35, 'plant-a': 1, 'plant-b': 1, 'leaf-small': 1, wheat: 0.3, cattail: 0.3, 'lilypad-a': 0.4, 'lilypad-b': 0.4,
  'bridge-wood': 1, 'pillar': 1, 'pillar-broken': 1,
};
const ANIM_K: Record<string, number> = { fountain: 0.86, portal: 0.75, campfire: 0.3, brazier: 0.32, torch: 0.36 };
const GROUND = ['grass1', 'grass2', 'grass3', 'dirt', 'cobble', 'forest', 'sand'];
const pick = (a: string[], d: PropDef) => a[Math.abs(d.v ?? 0) % a.length];

interface Km { id?: string; anim?: string; fp?: 'tree' | 'house' | 'bush' | 'rock' | 'small' | 'stall' | 'lamp' | 'crystal' | 'round' | 'post' | 'none'; canopy?: boolean; sway?: number; foot?: number; shadow?: [number, number]; glow?: { y: number; r: number; c: string; a: number }; len?: boolean; kScale?: number }
function km(d: PropDef): Km | null {
  switch (d.kind) {
    case 'ashTree': return { id: pick(['tree-green', 'tree-green', 'pine', 'tree-orange', 'tree-pink', 'tree-green'], d), fp: 'tree', canopy: true, sway: 0.012, foot: 0.92, shadow: [0.36, 0.1] };
    case 'mushroom': return { id: pick(['mush-red', 'mush-purple', 'mush-red', 'mush-purple', 'mush-red'], d), fp: 'small', foot: 0.95, shadow: [0.4, 0.1] };
    case 'rock': case 'boulder': return { id: pick(['rock-moss', 'rock-block', 'rocks-small'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1] };
    case 'bush': return { id: pick(['bush-big', 'bush-mid', 'bush-berry'], d), fp: 'bush', sway: 0.02, foot: 0.93, shadow: [0.42, 0.09] };
    case 'fireCrystal': case 'iceCrystal': return { id: pick(['crystal-pillar', 'crystal-shard', 'gem-big', 'crystal-pedestal'], d), fp: 'crystal', foot: 0.94, shadow: [0.4, 0.1], glow: { y: 0.55, r: 60, c: '#7fe0ff', a: 0.4 } };
    case 'house': return { id: pick(['house-red', 'house-purple', 'house-blue', 'house-orange', 'house-pink', 'house-green', 'cottage-blue', 'hut-wood'], d), fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'stall': return { id: pick(['stall-potions', 'stall-blue', 'stall-fruit'], d), fp: 'stall', canopy: true, foot: 0.95, shadow: [0.46, 0.08] };
    case 'lantern': return { id: pick(['lamp-a', 'lamp-b', 'lamp-c'], d), fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.8, r: 78, c: '#ffcf6a', a: 0.5 } };
    case 'fence': return { id: 'fence-wood', fp: 'none', foot: 0.9, len: true };
    case 'fountain': return { anim: 'fountain', fp: 'round', foot: 0.92, shadow: [0.5, 0.1] };
    case 'portal': return { anim: 'portal', fp: 'round', foot: 0.9, shadow: [0.48, 0.1], glow: { y: 0.4, r: 140, c: '#59c8ff', a: 0.35 } };
    case 'campfire': return { anim: 'campfire', fp: 'round', foot: 0.9, shadow: [0.45, 0.1], glow: { y: 0.4, r: 120, c: '#ff9a3a', a: 0.5 } };
    case 'brazier': case 'torch': return { anim: d.kind, fp: 'post', foot: 0.96, shadow: [0.4, 0.1], glow: { y: 0.8, r: 100, c: '#ff9a3a', a: 0.5 } };
    case 'archPost': return { id: 'banner-post', fp: 'post', foot: 0.97, shadow: [0.5, 0.1] };
    case 'chest': return { id: 'chest', fp: 'none', foot: 0.95 };
    case 'sign': return { id: d.dir === 'left' ? 'sign-blue' : 'sign-green', fp: 'none', foot: 0.97 };
    case 'runeStone': return { id: 'crystal-pedestal', fp: 'none', foot: 0.95, glow: { y: 0.7, r: 80, c: '#7fe0ff', a: 0.45 } };
    case 'flowers': return { id: pick(['flowers-white', 'flowers-purple', 'tulips', 'flowers-yellow', 'bush-flowers', 'flowers-mid', 'flowers-big', 'flowers-small'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'plant': return { id: pick(['fern', 'plant-a', 'plant-b', 'leaf-small'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'grassClump': return { id: pick(['grass-big', 'grass-mid', 'grass-small'], d), fp: 'none', sway: 0.06, foot: 0.95 };
    case 'reeds': return { id: pick(['cattail', 'wheat'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'well': return { id: 'well', fp: 'round', canopy: true, foot: 0.94, shadow: [0.42, 0.09] };
    case 'bench': return { id: 'bench', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'noticeBoard': return { id: 'notice-board', fp: 'stall', canopy: true, foot: 0.95, shadow: [0.4, 0.08] };
    case 'crate': return { id: 'crate', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'barrel': return { id: pick(['barrel', 'barrel2'], d), fp: 'small', foot: 0.92, shadow: [0.42, 0.1] };
    case 'planter': return { id: 'planter', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'log': return { id: 'log', fp: 'small', foot: 0.85, shadow: [0.42, 0.1] };
    case 'stump': return { id: 'stump', fp: 'small', foot: 0.88, shadow: [0.42, 0.1] };
    case 'banner': return { id: 'banner-post', fp: 'post', foot: 0.97, shadow: [0.5, 0.1] };
    case 'pillar': return { id: 'pillar', fp: 'post', foot: 0.95, shadow: [0.45, 0.1] };
    case 'brokenPillar': return { id: 'pillar-broken', fp: 'post', foot: 0.95, shadow: [0.45, 0.1] };
    default: return null;                                   // archLintel, lighthouse ... : not drawn in the storybook style
  }
}

// ------------------------------------------------------------------ sprites
const spriteCache = new Map<string, Sprite>();
function scaled(id: string, k: number, foot: number): Sprite | null {
  const img = sImg(id); if (!img || !img.naturalWidth) return null;
  const key = `${id}|${k.toFixed(3)}|${foot}`; const hit = spriteCache.get(key); if (hit) return hit;
  const w = Math.max(2, Math.round(img.naturalWidth * k)), h = Math.max(2, Math.round(img.naturalHeight * k));
  const c = mkcv(w, h), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
  const sp = { cv: c, ox: w / 2, oy: h * foot, w, h }; spriteCache.set(key, sp); return sp;
}
const FP: Record<string, (w: number, h: number) => Fp[]> = {
  tree: (w, h) => [{ t: 'e', rx: w * 0.1, ry: w * 0.045, dy: -h * 0.03 }],
  house: (w, h) => [{ t: 'r', hw: w * 0.4, hh: h * 0.1, dy: -h * 0.1 }],
  bush: (w, h) => [{ t: 'e', rx: w * 0.32, ry: w * 0.12, dy: -h * 0.08 }],
  rock: (w, h) => [{ t: 'e', rx: w * 0.34, ry: w * 0.12, dy: -h * 0.08 }],
  small: (w, h) => [{ t: 'e', rx: w * 0.26, ry: w * 0.1, dy: -h * 0.06 }],
  stall: (w, h) => [{ t: 'r', hw: w * 0.42, hh: h * 0.08, dy: -h * 0.08 }],
  lamp: () => [{ t: 'e', rx: 7, ry: 5, dy: -2 }],
  post: () => [{ t: 'e', rx: 9, ry: 5, dy: -2 }],
  crystal: (w, h) => [{ t: 'e', rx: Math.max(10, w * 0.22), ry: Math.max(6, w * 0.09), dy: -h * 0.05 }],
  round: (w, h) => [{ t: 'e', rx: w * 0.38, ry: w * 0.15, dy: -h * 0.16 }],
  none: () => [],
};
const glowFx = (g: NonNullable<Km['glow']>, h: number) => (c: C, d: PropDef, t: number) => {
  const r = g.r * (1 + 0.07 * Math.sin(t * 6 + d.x * 0.13)), y = -h * g.y;
  c.globalCompositeOperation = 'lighter';
  const gr = c.createRadialGradient(0, y, 0, 0, y, r); gr.addColorStop(0, g.c + 'cc'); gr.addColorStop(1, g.c + '00');
  c.globalAlpha = g.a * (0.85 + 0.15 * Math.sin(t * 5 + d.y)); c.fillStyle = gr; c.fillRect(-r, y - r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
};
const placedCache = new Map<string, StoryPlaced | null>();
function place(d: PropDef): StoryPlaced | null {
  const key = `${d.kind}|${d.v ?? 0}|${d.s ?? 1}|${d.len ?? ''}|${d.dir ?? ''}`;
  if (placedCache.has(key)) return placedCache.get(key)!;
  const m = km(d), s = d.s ?? 1; let out: StoryPlaced | null = null;
  if (m?.anim) {
    const img = aImg(m.anim), a = aAsset(m.anim), k = (ANIM_K[m.anim] ?? 0.5) * s;
    if (img && a) {
      const w = Math.round(a.fw * k), h = Math.round(a.fh * k), foot = m.foot ?? 0.92;
      const sp: Sprite = { cv: mkcv(w, h), ox: w / 2, oy: h * foot, w, h };
      out = { sp, canopy: !!m.canopy, fx: m.glow ? glowFx(m.glow, h * foot) : undefined, frames: { img, n: a.n, fps: a.fps, fw: a.fw, fh: a.fh }, fp: (FP[m.fp ?? 'none'] ?? FP.none)(w, h), shadow: m.shadow ?? [0, 0] };
    }
  } else if (m?.id && m.len && d.len) {
    const img = sImg(m.id);
    if (img) {
      const k = (SCALE[m.id] ?? 1) * s, sw = img.naturalWidth * k, len = Math.abs(d.len), step = sw * 0.9, n = Math.max(1, Math.round((len - sw) / step) + 1);
      const h = Math.round(img.naturalHeight * k), w = Math.round((n - 1) * step + sw), c = mkcv(w, h), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high';
      for (let i = 0; i < n; i++) g.drawImage(img, i * step, 0, sw, h);
      out = { sp: { cv: c, ox: w / 2, oy: h * (m.foot ?? 0.9), w, h }, canopy: false, fp: [{ t: 'r', hw: w / 2, hh: 6, dy: -h * 0.1 }], shadow: [0, 0] };
    }
  } else if (m?.id) {
    const sp = scaled(m.id, (SCALE[m.id] ?? 1) * s, m.foot ?? 0.94);
    if (sp) out = { sp, canopy: !!m.canopy, sway: m.sway, fx: m.glow ? glowFx(m.glow, sp.oy) : undefined, fp: (FP[m.fp ?? 'none'] ?? FP.none)(sp.w, sp.h), shadow: m.shadow ?? [0, 0] };
  }
  placedCache.set(key, out); return out;
}
function shadow(c: C, d: PropDef, p: StoryPlaced) {
  const [rx0, ry0] = p.shadow; if (!rx0) return;
  const rx = p.sp.w * rx0, ry = Math.max(4, p.sp.w * ry0);
  c.save(); c.translate(d.x, d.y - 2); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(20,45,20,.38)'); g.addColorStop(0.7, 'rgba(20,45,20,.2)'); g.addColorStop(1, 'rgba(20,45,20,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
const hook: StoryHook = {
  sprite: (d) => place(d)?.sp ?? null,
  footprints: (d) => (place(d)?.fp ?? []).map((f) => f.t === 'e' ? { t: 'e' as const, rx: f.rx, ry: f.ry, x: d.x, y: d.y + f.dy } : { t: 'r' as const, hw: f.hw, hh: f.hh, x: d.x, y: d.y + f.dy }) as never,
};

// ------------------------------------------------------------------ ground
const tileCache = new Map<string, HTMLCanvasElement>();
function tile(id: string, k: number): HTMLCanvasElement | null {
  const img = gImg(id); if (!img || !img.naturalWidth) return null;
  const key = `${id}|${k}`; const hit = tileCache.get(key); if (hit) return hit;
  const c = mkcv(img.naturalWidth * k, img.naturalHeight * k), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); tileCache.set(key, c); return c;
}
const pattern = (c: C, id: string, k: number) => { const t = tile(id, k); return t ? c.createPattern(t, 'repeat') : null; };
function softMask(size: number) {
  const m = mkcv(size, size), g = m.getContext('2d')!, gr = g.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, size, size); return m;
}
function patches(c: C, ids: string[], k: number, n: number, area: [number, number, number, number], r: () => number, size = 380) {
  const mask = softMask(size), tmp = mkcv(size, size), t = tmp.getContext('2d')!;
  for (let i = 0; i < n; i++) {
    const pat = pattern(c, ids[Math.floor(r() * ids.length)], k); if (!pat) continue;
    t.save(); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, size, size); t.translate(-Math.floor(r() * 900), -Math.floor(r() * 900)); t.fillStyle = pat; t.fillRect(0, 0, 1800, 1800); t.restore();
    t.globalCompositeOperation = 'destination-in'; t.drawImage(mask, 0, 0); t.globalCompositeOperation = 'source-over';
    c.drawImage(tmp, area[0] + r() * area[2] - size / 2, area[1] + r() * area[3] - size / 2);
  }
}
function ground(c: C, def: LocationDef, r: () => number) {
  const { w, h } = def;
  c.fillStyle = '#58b84a'; c.fillRect(0, 0, w, h);
  const base = pattern(c, 'grass1', 0.6); if (base) { c.fillStyle = base; c.fillRect(0, 0, w, h); }
  patches(c, ['grass2', 'grass3', 'grass1'], 0.6, Math.ceil((w * h) / (190 * 190)), [0, 0, w, h], r);
  if (def.forestY) {
    patches(c, ['forest'], 0.6, Math.ceil((w * (def.forestY + 120)) / (170 * 170)), [0, -60, w, def.forestY + 110], r, 340);
    const g = c.createLinearGradient(0, 0, 0, def.forestY + 120); g.addColorStop(0, 'rgba(8,40,18,.5)'); g.addColorStop(1, 'rgba(8,40,18,0)'); c.fillStyle = g; c.fillRect(0, 0, w, def.forestY + 120);
  }
}
function ellipse(c: C, x: number, y: number, rx: number, ry: number) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); }
function plaza(c: C, pz: { x: number; y: number; rx: number; ry: number }) {
  c.save(); c.fillStyle = 'rgba(30,55,25,.3)'; ellipse(c, pz.x + 3, pz.y + 12, pz.rx + 18, pz.ry + 16); c.fill();
  c.fillStyle = '#8f877d'; ellipse(c, pz.x, pz.y + 3, pz.rx + 12, pz.ry + 12); c.fill();
  c.fillStyle = '#c9c0b3'; ellipse(c, pz.x, pz.y, pz.rx + 8, pz.ry + 8); c.fill();
  const t = gImg('cobble');
  if (t) { c.save(); ellipse(c, pz.x, pz.y, pz.rx, pz.ry); c.clip(); const k = Math.max((2 * pz.rx) / t.naturalWidth, (2 * pz.ry) / t.naturalHeight) * 1.06; c.drawImage(t, pz.x - (t.naturalWidth * k) / 2, pz.y - (t.naturalHeight * k) / 2, t.naturalWidth * k, t.naturalHeight * k); c.restore(); }
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 3; ellipse(c, pz.x, pz.y, pz.rx - 12, pz.ry - 12); c.stroke(); c.restore();
}
function strokePts(c: C, pts: Pt[]) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); }
/** walk a polyline, calling fn every `step` px with the point and its left normal */
function along(pts: Pt[], step: number, fn: (x: number, y: number, nx: number, ny: number) => void) {
  let carry = step * 0.5;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay); if (!len) continue;
    const dx = (bx - ax) / len, dy = (by - ay) / len;
    for (let d = carry; d < len; d += step) fn(ax + dx * d, ay + dy * d, -dy, dx);
    carry = ((carry - len) % step + step) % step; if (carry === 0) carry = step;
  }
}
function drawSprite(c: C, id: string, x: number, y: number, k: number, flip = false, alpha = 1) {
  const img = sImg(id); if (!img || !img.naturalWidth) return; const w = img.naturalWidth * k, h = img.naturalHeight * k;
  c.save(); c.globalAlpha = alpha; c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(img, -w / 2, -h * 0.94, w, h); c.restore();
}
function path(c: C, def: LocationDef, p: PathDef, r: () => number, pts: Pt[]) {
  const dirt = pattern(c, 'dirt', 0.6), w = p.width;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  strokePts(c, pts); c.strokeStyle = 'rgba(86,58,24,.22)'; c.lineWidth = w + 22; c.stroke();
  for (const [grow, a] of [[10, 0.35], [5, 0.7], [0, 1]] as const) { strokePts(c, pts); c.strokeStyle = dirt ?? '#d9a35a'; c.globalAlpha = a; c.lineWidth = w + grow; c.stroke(); }
  c.globalAlpha = 1; strokePts(c, pts); c.strokeStyle = 'rgba(255,236,190,.1)'; c.lineWidth = w * 0.45; c.stroke();
  c.restore();
  // grass and flowers creeping over the edges
  const ids = ['grass-small', 'plant-a', 'flowers-small', 'plant-b', 'leaf-small', 'flowers-white', 'tulips'];
  along(pts, 34, (x, y, nx, ny) => {
    for (const side of [-1, 1]) {
      if (r() < 0.35) continue;
      const off = w / 2 + 2 + (r() - 0.4) * 14, id = ids[Math.floor(r() * ids.length)], k = (SCALE[id] ?? 1) * (id === 'grass-small' ? 0.8 : id === 'flowers-small' ? 0.6 : 0.85) * (0.8 + r() * 0.4);
      drawSprite(c, id, x + nx * off * side + (r() - 0.5) * 8, y + ny * off * side + 6, k, r() < 0.5);
    }
  });
  along(pts, 120, (x, y, nx, ny) => { if (r() < 0.5) drawSprite(c, 'rocks-small', x + nx * (r() - 0.5) * w * 0.5, y + ny * (r() - 0.5) * w * 0.5, 0.18, r() < 0.5, 0.95); });
  void def;
}
function liquid(c: C, def: LocationDef, L: LiquidDef, r: () => number, sm: (p: Pt[]) => Pt[]) {
  const w = L.width ?? 80, pts = sm(L.pts);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [grow, col] of [[44, 'rgba(78,58,30,.25)'], [30, '#8b6a3f'], [20, '#b08a55']] as const) { strokePts(c, pts); c.strokeStyle = col; c.lineWidth = w + grow; c.stroke(); }
  for (const [mul, col] of [[1, '#2186d6'], [0.78, '#3aa9ec'], [0.5, 'rgba(140,226,255,.7)'], [0.22, 'rgba(230,252,255,.55)']] as const) { strokePts(c, pts); c.strokeStyle = col; c.lineWidth = w * mul; c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2.2;
  along(pts, 30, (x, y, nx, ny) => { if (r() < 0.55) return; const o = (r() - 0.5) * w * 0.7, ang = Math.atan2(nx, -ny); c.beginPath(); c.ellipse(x + nx * o, y + ny * o, 11 + r() * 8, 3.2, ang + Math.PI / 2, 0, Math.PI); c.stroke(); });
  c.restore();
  const bank = ['rocks-small', 'rock-moss', 'cattail', 'fern', 'rocks-small', 'wheat', 'flowers-white'];
  along(pts, 46, (x, y, nx, ny) => {
    for (const side of [-1, 1]) {
      if (r() < 0.25) continue;
      const id = bank[Math.floor(r() * bank.length)], off = w / 2 + 14 + (r() - 0.3) * 16, k = (SCALE[id] ?? 1) * (id === 'rock-moss' ? 0.55 : id === 'rocks-small' ? 0.6 : 0.85) * (0.8 + r() * 0.4);
      drawSprite(c, id, x + nx * off * side, y + ny * off * side + 8, k, r() < 0.5);
    }
  });
  void def;
}
function bridge(c: C, b: { a: Pt; b: Pt; width: number }) {
  const img = sImg('bridge-wood'); if (!img) return;
  const [ax, ay] = b.a, [bx, by] = b.b, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax), sx = (len + 90) / img.naturalWidth, sy = sx * 1.1;
  c.save(); c.translate((ax + bx) / 2, (ay + by) / 2 + 4); c.rotate(ang);
  c.fillStyle = 'rgba(20,45,20,.22)'; ellipse(c, 0, 24, len / 2 + 30, 18); c.fill();
  c.drawImage(img, (-img.naturalWidth * sx) / 2, (-img.naturalHeight * sy) / 2, img.naturalWidth * sx, img.naturalHeight * sy); c.restore();
}
function zone(c: C, poly: Pt[], z: ZoneDef, r: () => number) {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const g = pattern(c, 'grass3', 0.6);
  for (const [sc, a] of [[1.12, 0.07], [1.06, 0.1], [1, 0.16], [0.9, 0.12]] as const) {
    c.save(); c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy); c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = `rgba(20,120,45,${a})`; c.fill(); if (g) { c.globalAlpha = a * 2.2; c.fillStyle = g; c.fill(); } c.restore();
  }
  if (z.rare) { c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(cx, cy, 4, cx, cy, 70); gr.addColorStop(0, 'rgba(255,240,160,.55)'); gr.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = gr; c.fillRect(cx - 70, cy - 70, 140, 140); c.restore(); }
  void r;
}
function tuftSprites() {
  const mk = (ids: string[]) => ids.map((id) => scaled(id, (SCALE[id] ?? 0.3) * 1.15, 0.96)?.cv ?? mkcv(48, 54));
  const set = mk(['grass-big', 'grass-mid', 'grass-small']);
  return { ash: set, moss: set };
}
function peeks(def: LocationDef, field: Field): Peek[] {
  const out: Peek[] = [], r = rng(`peek:${def.id}`);
  def.zones.forEach((z, zi) => {
    const poly = z.poly; if (!z.pool.length) return;
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), n = z.rare ? 1 : 2;
    for (let i = 0, tries = 0; i < n && tries < 60; tries++) {
      const x = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys));
      if (!pointInPoly(x, y, poly) || field.isBlocked(x, y)) continue;
      out.push({ x, y, id: z.pool[(i + zi) % z.pool.length], ph: r() * 20 }); i++;
    }
  });
  return out;
}

export async function loadStory(): Promise<void> {
  const sprites = new Set<string>(Object.keys(SCALE));
  await loadStoryAssets({ ground: GROUND, sprites: [...sprites], anims: Object.keys(ANIM_K) });
  placedCache.clear(); spriteCache.clear(); tileCache.clear();
}
export const story = { hook, place, shadow, ground, plaza, path, liquid, bridge, zone, tuftSprites, peeks };
