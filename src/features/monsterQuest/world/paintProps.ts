/**
 * Procedural storybook painters. Every prop is drawn with its anchor (the point on the ground the player
 * walks around) at (0,0) and extends upwards. Shapes are chunky and rounded, outlines are a darker tone of
 * the fill, light comes from the upper left, shadows are cool and sit to the lower right.
 */
import { darken, lighten, mix, outline, rgba, rng } from './util';
import type { PropDef, PropKind } from './types';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ primitives
function shadowEll(c: C, rx: number, ry: number, a = 0.3, ox = 8, oy = 3) {
  c.save(); c.fillStyle = `rgba(36,20,40,${a})`; c.beginPath(); c.ellipse(ox, oy, rx, ry, 0, 0, TAU); c.fill(); c.restore();
}
/** A shaded, outlined blob with an inner shadow crescent (lower right) and a thin rim light (upper left). */
function ball(c: C, cx: number, cy: number, rx: number, ry: number, col: string, lw = 2.5, rot = 0) {
  const g = c.createRadialGradient(cx - rx * 0.38, cy - ry * 0.5, Math.min(rx, ry) * 0.08, cx, cy, Math.max(rx, ry) * 1.1);
  g.addColorStop(0, lighten(col, 0.42)); g.addColorStop(0.42, col); g.addColorStop(1, darken(col, 0.4));
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fill();
  if (Math.min(rx, ry) > 7) {
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.clip();
    c.strokeStyle = rgba(darken(col, 0.55), 0.38); c.lineWidth = Math.min(rx, ry) * 0.42; c.beginPath(); c.ellipse(cx - rx * 0.16, cy - ry * 0.18, rx * 1.02, ry * 1.02, rot, 0, TAU); c.stroke();
    c.strokeStyle = rgba(lighten(col, 0.7), 0.5); c.lineWidth = Math.max(1.6, Math.min(rx, ry) * 0.08); c.beginPath(); c.ellipse(cx + rx * 0.05, cy + ry * 0.06, rx * 0.93, ry * 0.93, rot, Math.PI * 0.95, Math.PI * 1.65); c.stroke();
    c.restore();
  }
  c.lineWidth = lw; c.strokeStyle = outline(col); c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.stroke();
}
function gloss(c: C, cx: number, cy: number, rx: number, ry: number, a = 0.5, rot = -0.55) {
  c.save(); c.fillStyle = `rgba(255,252,235,${a})`; c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fill(); c.restore();
}
function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath();
}
/** Rounded slab shaded left-to-right (light on the left). */
function slab(c: C, x: number, y: number, w: number, h: number, r: number, col: string, lw = 2.5) {
  const g = c.createLinearGradient(x, y, x + w, y + h * 0.4);
  g.addColorStop(0, lighten(col, 0.34)); g.addColorStop(0.5, col); g.addColorStop(1, darken(col, 0.36));
  rr(c, x, y, w, h, r); c.fillStyle = g; c.fill(); c.lineWidth = lw; c.strokeStyle = outline(col); c.stroke();
}
function glow(c: C, x: number, y: number, r: number, col: string, a = 0.6) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function poly(c: C, pts: number[][], fill: string, lw = 2.2, stroke?: string) {
  c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  c.fillStyle = fill; c.fill(); c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = stroke ?? outline(fill); c.stroke();
}


// ------------------------------------------------------------------ painterly helpers
/** Foliage as many small outlined leaf clumps (back to front), like hand-painted tree crowns. */
function leafMass(c: C, col: string, seed: string, cx: number, cy: number, rx: number, ry: number, n: number) {
  const r = rng(seed), pts: [number, number, number][] = [];
  // solid dark base so no gaps show between clumps
  c.beginPath(); c.ellipse(cx, cy + 4, rx * 0.95, ry * 0.95, 0, 0, TAU); c.fillStyle = darken(col, 0.42); c.fill();
  const ring = 15;
  for (let i = 0; i < ring; i++) { const a = (i / ring) * TAU + r() * 0.2; pts.push([cx + Math.cos(a) * rx * 0.88, cy + Math.sin(a) * ry * 0.88, 17 + r() * 8]); }
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.78; pts.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 15 + r() * 9]); }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [x, y, rad] of pts) {
    const t = (y - (cy - ry)) / (ry * 2), tone = mix(lighten(col, 0.2), darken(col, 0.28), Math.min(1, Math.max(0, t * 0.9 + (r() - 0.5) * 0.25)));
    ball(c, x, y, rad, rad * 0.86, tone, 2.2);
    c.strokeStyle = rgba(lighten(col, 0.55), 0.65); c.lineWidth = 1.6; c.beginPath(); c.arc(x - rad * 0.1, y - rad * 0.1, rad * 0.62, Math.PI * 1.05, Math.PI * 1.55); c.stroke();
  }
}
type Fringe = 'grass' | 'stone' | 'none';
let fringeStyle: Fringe = 'grass';
export const setFringeStyle = (f: Fringe) => { fringeStyle = f; };
const BLADE = ['#52702c', '#76993f', '#93b552', '#5f8034'];
/** A ring of grass blades (and the odd flower) hugging the foot of a prop, so objects sit in the ground rather than on it. */
function fringe(c: C, rx: number, seed: string) {
  if (fringeStyle === 'none' || rx <= 0) return;
  const r = rng(`fr:${seed}`), n = Math.round(rx / 2.6);
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, x = Math.cos(a) * rx * (0.85 + r() * 0.3), y = Math.sin(a) * rx * 0.34 * (0.85 + r() * 0.3) + 2;
    if (fringeStyle === 'stone') {
      if (r() < 0.55) { c.fillStyle = ['#8d7d76', '#6e5f66', '#a08f84'][i % 3]; c.strokeStyle = '#3a2830'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, 3 + r() * 4, 2 + r() * 2.4, 0, 0, TAU); c.fill(); c.stroke(); }
      continue;
    }
    const l = 7 + r() * 10, lean = (r() - 0.5) * 8, col = BLADE[Math.floor(r() * BLADE.length)];
    c.strokeStyle = '#2d3f1c'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.4, y - l * 0.6, x + lean, y - l); c.stroke();
    c.strokeStyle = col; c.lineWidth = 1.9; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.4, y - l * 0.6, x + lean, y - l); c.stroke();
    if (r() < 0.06) { c.fillStyle = ['#ff8fb8', '#ffe27a', '#fff6e0'][i % 3]; c.strokeStyle = '#4a2a3a'; c.lineWidth = 1; c.beginPath(); c.arc(x + lean, y - l, 2.6, 0, TAU); c.fill(); c.stroke(); }
  }
  c.restore();
}
/** Painted grain: short brush fibres, tiled, composited only where the sprite already has pixels. */
let grainTile: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const g = document.createElement('canvas'); g.width = g.height = 160; const c = g.getContext('2d')!, r = rng('grain'); c.lineCap = 'round';
  for (let i = 0; i < 380; i++) { const x = r() * 160, y = r() * 160, a = r() * TAU, l = 3 + r() * 8; c.strokeStyle = r() < 0.5 ? 'rgba(255,246,220,.055)' : 'rgba(40,20,40,.06)'; c.lineWidth = 1.2 + r() * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.6); c.stroke(); }
  grainTile = g; return g;
}
export function applyGrain(c: C, w: number, h: number) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = c.createPattern(grain(), 'repeat')!; c.fillRect(0, 0, w, h); c.restore(); }

// ------------------------------------------------------------------ painters
type Painter = (c: C, d: PropDef) => void;
interface Spec {
  /** sprite bounds relative to the anchor, at scale 1 */
  b: [number, number, number, number]; // l, t, r, b
  draw: Painter;
  /** collision footprints relative to anchor, at scale 1 (ellipses or rectangles) */
  fp?: (d: PropDef) => ({ t: 'e'; rx: number; ry: number; dy: number } | { t: 'r'; hw: number; hh: number; dy: number })[];
  /** player fades the sprite when standing behind it */
  canopy?: boolean;
  /** radius of the grass fringe at the foot (0 / undefined = none) */
  fr?: number;
  /** drawn above everything (arch lintels) */
  overhead?: boolean;
  /** animated overlay, drawn each frame at the anchor */
  fx?: (c: C, d: PropDef, t: number) => void;
}

const MUSH = ['#e5432f', '#3aa3d9', '#a255d6', '#f28a2a', '#ea6aa8'];
const SPOT = ['#fff4e0', '#e8fbff', '#ffe3f4', '#fff2c8', '#fff4e0'];

function mushroom(c: C, d: PropDef) {
  const v = (d.v ?? 0) % MUSH.length, cap = MUSH[v], rim = darken(cap, 0.42);
  shadowEll(c, 52, 13, 0.28, 12, 4);
  // stem
  const stem = '#f4e3bd';
  c.beginPath(); c.moveTo(-17, 0); c.bezierCurveTo(-22, -26, -16, -50, -18, -68); c.lineTo(18, -68); c.bezierCurveTo(16, -50, 22, -26, 17, 0); c.bezierCurveTo(8, 7, -8, 7, -17, 0); c.closePath();
  const sg = c.createLinearGradient(-20, 0, 20, 0); sg.addColorStop(0, lighten(stem, 0.3)); sg.addColorStop(0.55, stem); sg.addColorStop(1, darken(stem, 0.28));
  c.fillStyle = sg; c.fill(); c.lineWidth = 2.4; c.strokeStyle = outline('#c9a877'); c.stroke();
  // cap shadow on stem
  c.fillStyle = 'rgba(60,24,40,.22)'; c.beginPath(); c.ellipse(0, -66, 20, 7, 0, 0, TAU); c.fill();
  // cap dome with a rounded lip
  c.beginPath(); c.moveTo(-60, -64); c.bezierCurveTo(-66, -136, 66, -136, 60, -64); c.bezierCurveTo(44, -48, -44, -48, -60, -64); c.closePath();
  const g = c.createRadialGradient(-26, -108, 6, 0, -80, 80);
  g.addColorStop(0, lighten(cap, 0.45)); g.addColorStop(0.4, cap); g.addColorStop(1, darken(cap, 0.42));
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  const spots: [number, number, number][] = [[-30, -96, 11], [8, -112, 13], [34, -90, 10], [-8, -80, 8], [-46, -74, 6], [46, -72, 6], [20, -70, 5]];
  for (const [x, y, r] of spots) {
    c.fillStyle = SPOT[v]; c.beginPath(); c.ellipse(x, y, r, r * 0.72, 0, 0, TAU); c.fill();
    c.strokeStyle = rgba(darken(cap, 0.3), 0.55); c.lineWidth = 1.5; c.stroke();
  }
  gloss(c, -28, -112, 18, 6, 0.5);
  c.restore();
  c.beginPath(); c.moveTo(-60, -64); c.bezierCurveTo(-66, -136, 66, -136, 60, -64); c.bezierCurveTo(44, -48, -44, -48, -60, -64); c.closePath();
  c.lineWidth = 2.8; c.strokeStyle = outline(cap); c.stroke();
  c.strokeStyle = rim; c.lineWidth = 3; c.beginPath(); c.moveTo(-58, -63); c.bezierCurveTo(-42, -49, 42, -49, 58, -63); c.stroke();
}
const mushroomSpec: Spec = { fr: 34, b: [-70, -140, 78, 18], draw: mushroom, canopy: true, fp: () => [{ t: 'e', rx: 19, ry: 10, dy: -3 }] };

const TREEC = ['#e0772f', '#86a84d', '#e8b73f', '#b9552b'];
function ashTree(c: C, d: PropDef) {
  const v = (d.v ?? 0) % TREEC.length, col = TREEC[v];
  shadowEll(c, 60, 15, 0.26, 16, 5);
  c.beginPath(); c.moveTo(-30, 8); c.bezierCurveTo(-14, 4, -14, -20, -15, -54); c.lineTo(15, -54); c.bezierCurveTo(14, -20, 16, 4, 32, 9); c.bezierCurveTo(14, 16, -14, 16, -30, 8); c.closePath();
  const tg = c.createLinearGradient(-30, 0, 32, 0); tg.addColorStop(0, '#9a6a42'); tg.addColorStop(0.5, '#7a4d2e'); tg.addColorStop(1, '#4e2f24');
  c.fillStyle = tg; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#3a2220'; c.stroke();
  c.strokeStyle = 'rgba(255,214,160,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-8, -6); c.quadraticCurveTo(-9, -30, -7, -50); c.stroke();
  c.strokeStyle = 'rgba(40,22,20,.45)'; c.lineWidth = 1.8; for (const x of [-3, 4, 10]) { c.beginPath(); c.moveTo(x, -4); c.bezierCurveTo(x - 3, -20, x + 3, -34, x - 1, -52); c.stroke(); }
  ball(c, -4, -26, 4, 6, '#3a2418', 1.2);
  c.fillStyle = 'rgba(120,170,70,.8)'; c.beginPath(); c.ellipse(10, -44, 7, 3, 0.3, 0, TAU); c.fill();
  leafMass(c, col, `tree${v}`, 0, -118, 70, 44, 30);
  const r = rng(`emb${v}`); c.fillStyle = 'rgba(255,214,120,.9)';
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-60 + r() * 120, -170 + r() * 90, 2.2, 0, TAU); c.fill(); }
}
const ashTreeSpec: Spec = { fr: 38, b: [-110, -200, 112, 20], draw: ashTree, canopy: true, fp: () => [{ t: 'e', rx: 17, ry: 9, dy: -2 }] };

function rock(c: C, d: PropDef) {
  const v = (d.v ?? 0) % 3, base = ['#8a766c', '#74645e', '#9a8472'][v];
  shadowEll(c, 38, 11, 0.28, 8, 4);
  ball(c, 0, -22, 34, 24, base, 2.6); ball(c, -18, -12, 18, 13, mix(base, '#c9b19a', 0.25), 2.2); ball(c, 20, -10, 16, 12, darken(base, 0.1), 2.2);
  gloss(c, -12, -34, 14, 5, 0.42);
  if (v === 1) { c.fillStyle = 'rgba(120,170,70,.8)'; c.beginPath(); c.ellipse(-4, -40, 14, 5, -0.2, 0, TAU); c.fill(); }
}
const rockSpec: Spec = { fr: 36, b: [-44, -52, 52, 16], draw: rock, fp: () => [{ t: 'e', rx: 32, ry: 14, dy: -8 }] };

function boulder(c: C, d: PropDef) {
  const base = ['#7b675f', '#6a5a63'][(d.v ?? 0) % 2];
  shadowEll(c, 70, 18, 0.3, 14, 6);
  ball(c, 0, -40, 66, 46, base, 3); ball(c, -34, -24, 32, 24, mix(base, '#d3b9a0', 0.2), 2.4); ball(c, 38, -22, 28, 22, darken(base, 0.12), 2.4);
  gloss(c, -26, -66, 26, 8, 0.4);
  c.fillStyle = 'rgba(120,170,70,.85)'; c.beginPath(); c.ellipse(-8, -80, 24, 8, -0.15, 0, TAU); c.fill(); c.beginPath(); c.ellipse(30, -62, 12, 5, 0.3, 0, TAU); c.fill();
}
const boulderSpec: Spec = { fr: 64, b: [-80, -100, 90, 24], draw: boulder, fp: () => [{ t: 'e', rx: 62, ry: 24, dy: -14 }] };

const CRY = [['#ffb347', '#ff6a2a'], ['#ff7a6a', '#d63a3a'], ['#8fb4ff', '#8a62ff'], ['#ffe27a', '#f2a21c']];
function fireCrystal(c: C, d: PropDef) {
  const [lt, dk] = CRY[(d.v ?? 0) % CRY.length], big = (d.v ?? 0) === 3;
  shadowEll(c, 40, 10, 0.26, 8, 3); glow(c, 0, -34, 70, lt, 0.5);
  const spikes: [number, number, number, number][] = big
    ? [[0, -118, 26, 0], [-30, -78, 18, -0.2], [32, -84, 19, 0.2], [-52, -44, 14, -0.45], [52, -46, 14, 0.45]]
    : [[0, -74, 18, 0], [-24, -48, 13, -0.3], [26, -52, 14, 0.3], [-40, -28, 10, -0.5]];
  for (const [x, h, w, tilt] of spikes) {
    c.save(); c.translate(x, 0); c.rotate(tilt);
    const top = [0, h], l = [-w, h * 0.42], r = [w, h * 0.46], bl = [-w * 0.8, 2], br = [w * 0.9, 4];
    poly(c, [top, l, bl, br, r], dk, 2.2);
    poly(c, [top, l, bl, [-w * 0.1, 4]], lt, 0, undefined);
    poly(c, [top, [w * 0.15, h * 0.5], [-w * 0.1, 4], [-w * 0.8, 2], l], mix(lt, '#fff', 0.15), 0);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * 0.35, h * 0.55); c.lineTo(-w * 0.15, h * 0.18); c.stroke();
    c.restore();
  }
}
const fireCrystalSpec: Spec = { fr: 38, b: [-96, -150, 96, 16], draw: fireCrystal, fp: () => [{ t: 'e', rx: 22, ry: 10, dy: -4 }],
  fx: (c, d, t) => { const [lt] = CRY[(d.v ?? 0) % CRY.length]; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -40, 90 + Math.sin(t * 2 + (d.x ?? 0)) * 8, lt, 0.28); c.restore(); } };

function bush(c: C, d: PropDef) {
  const v = (d.v ?? 0) % 2, col = v ? '#6f9a45' : '#7fa34a';
  shadowEll(c, 44, 11, 0.26, 8, 4);
  ball(c, -22, -16, 22, 18, darken(col, 0.1), 2.4); ball(c, 22, -16, 22, 18, darken(col, 0.1), 2.4); ball(c, 0, -26, 28, 24, col, 2.4);
  gloss(c, -10, -38, 12, 5, 0.4);
  const r = rng(`bush${v}`);
  for (let i = 0; i < 9; i++) { const x = -34 + r() * 68, y = -8 - r() * 30; ball(c, x, y, 4.2, 4.2, v ? '#ffb23d' : '#e53a3a', 1.2); }
}
const bushSpec: Spec = { fr: 42, b: [-56, -56, 60, 14], draw: bush, fp: () => [{ t: 'e', rx: 34, ry: 12, dy: -6 }] };

function lantern(c: C) {
  shadowEll(c, 12, 4, 0.25, 3, 1);
  slab(c, -4, -70, 8, 70, 3, '#6b4630', 2); poly(c, [[-14, -86], [14, -86], [10, -72], [-10, -72]], '#4d3a43', 2);
  glow(c, 0, -62, 34, '#ffc247', 0.6); ball(c, 0, -62, 9, 11, '#ffd46a', 1.8); gloss(c, -3, -66, 3, 4, 0.8);
}
const lanternSpec: Spec = { fr: 12, b: [-30, -96, 30, 8], draw: lantern, fp: () => [{ t: 'e', rx: 7, ry: 4, dy: 0 }],
  fx: (c, d, t) => { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -60, 48 + Math.sin(t * 5 + d.x) * 5, '#ffb347', 0.26); c.restore(); } };

function fence(c: C, d: PropDef) {
  const len = d.len ?? 120, n = Math.max(2, Math.round(len / 40) + 1);
  shadowEll(c, len / 2 + 4, 6, 0.2, 6, 3);
  slab(c, -len / 2, -26, len, 6, 3, '#8a5c38', 1.8); slab(c, -len / 2, -14, len, 6, 3, '#8a5c38', 1.8);
  for (let i = 0; i < n; i++) { const x = -len / 2 + (len * i) / (n - 1); slab(c, x - 5, -36, 10, 38, 4, '#a06a3e', 2); }
}
const fenceSpec: Spec = { b: [-300, -44, 300, 10], draw: fence, fp: (d) => [{ t: 'r', hw: (d.len ?? 120) / 2, hh: 8, dy: -2 }] };

// houses -------------------------------------------------------------
const HOUSE = [{ cap: '#e5432f', wall: '#f2dcb0', spot: '#fff4e0' }, { cap: '#3f8fe0', wall: '#efe0c4', spot: '#e8fbff' }, { cap: '#f28a2a', wall: '#f6e3b8', spot: '#fff2c8' }];
function house(c: C, d: PropDef) {
  const h = HOUSE[(d.v ?? 0) % 3], round = (d.v ?? 0) === 2;
  shadowEll(c, 104, 22, 0.3, 18, 8);
  // body
  const bw = round ? 150 : 140;
  slab(c, -bw / 2, -92, bw, 92, round ? 46 : 18, h.wall, 3);
  c.fillStyle = 'rgba(120,80,60,.25)'; rr(c, -bw / 2 + 4, -22, bw - 8, 16, 6); c.fill();
  // stones at the base
  for (let i = 0; i < 6; i++) ball(c, -bw / 2 + 14 + i * ((bw - 28) / 5), -6, 11, 7, '#a69384', 1.4);
  // door
  c.beginPath(); c.moveTo(-17, -4); c.lineTo(-17, -42); c.arc(0, -42, 17, Math.PI, 0); c.lineTo(17, -4); c.closePath();
  const dg = c.createLinearGradient(-17, 0, 17, 0); dg.addColorStop(0, '#9a6738'); dg.addColorStop(1, '#6e4528'); c.fillStyle = dg; c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#3d2418'; c.stroke();
  ball(c, 8, -24, 2.6, 2.6, '#ffd46a', 1);
  // windows
  for (const sx of [-1, 1]) { const wx = sx * 46; glow(c, wx, -54, 34, '#ffc247', 0.5); ball(c, wx, -54, 13, 14, '#ffd77a', 2.2); c.strokeStyle = '#6e4528'; c.lineWidth = 2; c.beginPath(); c.moveTo(wx - 13, -54); c.lineTo(wx + 13, -54); c.moveTo(wx, -68); c.lineTo(wx, -40); c.stroke(); }
  // flower box
  slab(c, -62, -30, 32, 9, 3, '#8a5c38', 1.6); for (let i = 0; i < 4; i++) ball(c, -57 + i * 8, -34, 4, 4, ['#ff7aa8', '#ffd24a', '#fff', '#ff7aa8'][i], 1);
  // chimney
  slab(c, 36, -150, 20, 36, 4, '#8f7a70', 2.2);
  // mushroom-cap roof
  c.beginPath(); c.moveTo(-98, -84); c.bezierCurveTo(-104, -200, 104, -200, 98, -84); c.bezierCurveTo(70, -66, -70, -66, -98, -84); c.closePath();
  const rg = c.createRadialGradient(-40, -170, 8, 0, -130, 130); rg.addColorStop(0, lighten(h.cap, 0.45)); rg.addColorStop(0.4, h.cap); rg.addColorStop(1, darken(h.cap, 0.42));
  c.fillStyle = rg; c.fill();
  c.save(); c.clip();
  const spots: number[][] = [[-52, -150, 13], [-6, -176, 15], [48, -152, 12], [12, -132, 9], [-74, -112, 8], [76, -110, 8], [-30, -118, 6]];
  for (const [x, y, r] of spots) { c.fillStyle = h.spot; c.beginPath(); c.ellipse(x, y, r, r * 0.72, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(darken(h.cap, 0.3), 0.5); c.lineWidth = 1.4; c.stroke(); }
  gloss(c, -46, -168, 24, 7, 0.5);
  c.restore();
  c.beginPath(); c.moveTo(-98, -84); c.bezierCurveTo(-104, -200, 104, -200, 98, -84); c.bezierCurveTo(70, -66, -70, -66, -98, -84); c.closePath();
  c.lineWidth = 3; c.strokeStyle = outline(h.cap); c.stroke();
  c.strokeStyle = darken(h.cap, 0.45); c.lineWidth = 3.4; c.beginPath(); c.moveTo(-96, -82); c.bezierCurveTo(-66, -64, 66, -64, 96, -82); c.stroke();
}
const houseSpec: Spec = { fr: 92, b: [-112, -210, 112, 24], draw: house, canopy: true, fp: () => [{ t: 'r', hw: 72, hh: 30, dy: -34 }] };

function fountain(c: C) {
  shadowEll(c, 128, 40, 0.3, 14, 8);
  // outer basin: stone ring
  const ring = (rx: number, ry: number, y: number, col: string) => { c.beginPath(); c.ellipse(0, y, rx, ry, 0, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.strokeStyle = outline(col); c.stroke(); };
  c.beginPath(); c.ellipse(0, -22, 112, 56, 0, 0, Math.PI); c.lineTo(-112, -22); c.closePath(); c.fillStyle = '#7d6a66'; c.fill();
  c.beginPath(); c.moveTo(-112, -22); c.lineTo(-112, -2); c.bezierCurveTo(-96, 52, 96, 52, 112, -2); c.lineTo(112, -22); c.bezierCurveTo(96, 34, -96, 34, -112, -22); c.closePath();
  const fg = c.createLinearGradient(-112, 0, 112, 0); fg.addColorStop(0, '#a8938a'); fg.addColorStop(0.5, '#8d7a73'); fg.addColorStop(1, '#5f4f54'); c.fillStyle = fg; c.fill(); c.lineWidth = 3; c.strokeStyle = '#3a2830'; c.stroke();
  ring(112, 56, -24, '#b4a198');
  ring(92, 44, -28, '#ff7b25');
  const lg = c.createRadialGradient(-20, -36, 4, 0, -28, 90); lg.addColorStop(0, '#ffe27a'); lg.addColorStop(0.5, '#ff8a2a'); lg.addColorStop(1, '#c93a12');
  c.beginPath(); c.ellipse(0, -28, 90, 42, 0, 0, TAU); c.fillStyle = lg; c.fill();
  // pedestal + flame
  slab(c, -16, -92, 32, 70, 8, '#9a8780', 2.6); ball(c, 0, -96, 26, 12, '#b6a39a', 2.2);
  glow(c, 0, -112, 40, '#ffb347', 0.8);
  c.beginPath(); c.moveTo(-14, -98); c.bezierCurveTo(-18, -120, -4, -128, 0, -150); c.bezierCurveTo(8, -130, 20, -120, 14, -98); c.closePath();
  const fl = c.createLinearGradient(0, -150, 0, -98); fl.addColorStop(0, '#fff0a0'); fl.addColorStop(0.5, '#ffa23a'); fl.addColorStop(1, '#e0481c'); c.fillStyle = fl; c.fill();
}
const fountainSpec: Spec = { b: [-130, -165, 140, 52], draw: fountain, fp: () => [{ t: 'e', rx: 108, ry: 44, dy: -20 }],
  fx: (c, _d, t) => {
    c.save(); c.globalCompositeOperation = 'lighter';
    glow(c, 0, -118, 56 + Math.sin(t * 6) * 5, '#ffb347', 0.35);
    for (let i = 0; i < 6; i++) { const p = ((t * 0.35 + i / 6) % 1); glow(c, Math.sin(i * 7 + t) * 10 + (i - 3) * 6, -116 - p * 70, 6, '#ffd46a', 0.8 * (1 - p)); }
    c.globalAlpha = 0.5; for (let i = 0; i < 5; i++) { const a = t * 0.5 + i * 1.3; glow(c, Math.cos(a) * 58, -28 + Math.sin(a) * 26, 14, '#ffd46a', 0.35); }
    c.restore();
  } };

function stall(c: C) {
  shadowEll(c, 90, 16, 0.28, 12, 6);
  slab(c, -62, -52, 124, 50, 8, '#a86e3e', 2.8); slab(c, -56, -46, 112, 12, 4, '#c28a52', 1.8);
  // wares
  ball(c, -34, -58, 9, 9, '#4cc3ff', 1.6); ball(c, -10, -58, 9, 9, '#ff7a6a', 1.6); ball(c, 14, -58, 9, 9, '#ffd24a', 1.6); ball(c, 38, -58, 9, 9, '#7fe08a', 1.6);
  slab(c, -72, -112, 8, 112, 3, '#7a4c2c', 2); slab(c, 64, -112, 8, 112, 3, '#7a4c2c', 2);
  // striped awning
  const stripes = 8, w = 160 / stripes;
  for (let i = 0; i < stripes; i++) {
    const x = -80 + i * w, col = i % 2 ? '#fff4dc' : '#e5432f';
    c.beginPath(); c.moveTo(x, -128); c.lineTo(x + w, -128); c.lineTo(x + w + 2, -96); c.quadraticCurveTo(x + w * 0.5, -86, x - 2, -96); c.closePath();
    c.fillStyle = col; c.fill(); c.lineWidth = 2; c.strokeStyle = outline('#e5432f'); c.stroke();
  }
  glow(c, -50, -90, 30, '#ffc247', 0.5); ball(c, -50, -88, 6, 7, '#ffd46a', 1.4); gloss(c, -40, -124, 30, 4, 0.4, 0);
  slab(c, 50, -20, 24, 20, 3, '#9a6a3a', 2);
}
const stallSpec: Spec = { b: [-96, -134, 106, 20], draw: stall, canopy: true, fp: () => [{ t: 'r', hw: 62, hh: 14, dy: -22 }] };

function lighthouse(c: C) {
  shadowEll(c, 110, 24, 0.28, 18, 6);
  // stem with bands & windows
  c.beginPath(); c.moveTo(-58, 0); c.bezierCurveTo(-52, -100, -40, -220, -42, -330); c.lineTo(42, -330); c.bezierCurveTo(40, -220, 52, -100, 58, 0); c.bezierCurveTo(30, 14, -30, 14, -58, 0); c.closePath();
  const sg = c.createLinearGradient(-60, 0, 60, 0); sg.addColorStop(0, '#fff3d3'); sg.addColorStop(0.55, '#f1dcb0'); sg.addColorStop(1, '#bfa57c'); c.fillStyle = sg; c.fill(); c.lineWidth = 3.4; c.strokeStyle = '#7a5a48'; c.stroke();
  c.save(); c.clip(); c.fillStyle = 'rgba(229,67,47,.55)'; for (let i = 0; i < 4; i++) c.fillRect(-70, -60 - i * 78, 140, 22); c.restore();
  for (let i = 0; i < 3; i++) { const y = -110 - i * 78; glow(c, 0, y, 40, '#ffc247', 0.5); ball(c, 0, y, 12, 16, '#ffd77a', 2.4); }
  // lantern room
  slab(c, -34, -380, 68, 54, 10, '#8a5c38', 3); glow(c, 0, -352, 80, '#ffd46a', 0.9); ball(c, 0, -352, 22, 22, '#ffe7a0', 2.4); gloss(c, -6, -360, 6, 8, 0.9);
  // cap
  c.beginPath(); c.moveTo(-168, -372); c.bezierCurveTo(-176, -560, 176, -560, 168, -372); c.bezierCurveTo(120, -340, -120, -340, -168, -372); c.closePath();
  const cg = c.createRadialGradient(-60, -500, 10, 0, -440, 240); cg.addColorStop(0, '#ff8a70'); cg.addColorStop(0.4, '#e5432f'); cg.addColorStop(1, '#8e2224');
  c.fillStyle = cg; c.fill();
  c.save(); c.clip();
  const spots: number[][] = [[-90, -470, 26], [-4, -516, 28], [88, -472, 24], [28, -440, 15], [-140, -410, 14], [140, -408, 14], [-52, -420, 10]];
  for (const [x, y, r] of spots) { c.fillStyle = '#fff4e0'; c.beginPath(); c.ellipse(x, y, r, r * 0.72, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(110,30,40,.5)'; c.lineWidth = 2; c.stroke(); }
  gloss(c, -86, -500, 44, 11, 0.5);
  c.restore();
  c.beginPath(); c.moveTo(-168, -372); c.bezierCurveTo(-176, -560, 176, -560, 168, -372); c.bezierCurveTo(120, -340, -120, -340, -168, -372); c.closePath();
  c.lineWidth = 3.6; c.strokeStyle = '#5a1c28'; c.stroke();
  c.strokeStyle = '#6a1e26'; c.lineWidth = 4; c.beginPath(); c.moveTo(-164, -370); c.bezierCurveTo(-110, -338, 110, -338, 164, -370); c.stroke();
}
const lighthouseSpec: Spec = { fr: 70, b: [-186, -566, 186, 30], draw: lighthouse, canopy: true, fp: () => [{ t: 'e', rx: 56, ry: 18, dy: -4 }],
  fx: (c, _d, t) => { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -352, 130 + Math.sin(t * 3) * 10, '#ffd46a', 0.35); c.restore(); } };

function statue(c: C) {
  shadowEll(c, 170, 40, 0.3, 26, 10);
  const st = '#8a7b74';
  slab(c, -150, -66, 300, 66, 20, '#756660', 3);                          // plinth
  ball(c, 0, -124, 118, 62, st, 3);                                      // lap
  ball(c, -92, -160, 34, 54, mix(st, '#a99a8f', 0.2), 2.8, 0.2);          // left leg
  ball(c, 92, -160, 34, 54, darken(st, 0.1), 2.8, -0.2);                 // right leg
  slab(c, -62, -300, 124, 160, 38, mix(st, '#a99a8f', 0.15), 3);          // torso
  ball(c, -86, -240, 26, 52, st, 2.8, 0.1); ball(c, 86, -240, 26, 52, darken(st, 0.1), 2.8, -0.1); // arms
  slab(c, -40, -390, 80, 78, 28, mix(st, '#b3a398', 0.2), 3);              // head
  // brow + crystal eyes
  c.strokeStyle = '#4a3a3a'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-32, -358); c.lineTo(-8, -352); c.moveTo(32, -358); c.lineTo(8, -352); c.stroke();
  for (const sx of [-1, 1]) { glow(c, sx * 18, -340, 30, '#ff8a2a', 0.8); poly(c, [[sx * 18, -356], [sx * 28, -340], [sx * 18, -324], [sx * 8, -340]], '#ffb347', 2, '#a5361a'); }
  // moss + cracks
  c.fillStyle = 'rgba(110,160,70,.8)'; c.beginPath(); c.ellipse(-70, -184, 28, 9, -0.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(30, -396, 22, 7, 0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(112, -150, 20, 8, 0.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(40,24,30,.5)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, -290); c.lineTo(-4, -250); c.lineTo(14, -220); c.stroke();
  gloss(c, -22, -300, 26, 9, 0.28);
}
const statueSpec: Spec = { b: [-170, -400, 190, 50], draw: statue, canopy: true, fp: () => [{ t: 'e', rx: 126, ry: 30, dy: -34 }],
  fx: (c, _d, t) => { c.save(); c.globalCompositeOperation = 'lighter'; for (const sx of [-1, 1]) glow(c, sx * 18, -340, 38 + Math.sin(t * 2.4) * 6, '#ff8a2a', 0.55); c.restore(); } };

function pillar(c: C, d: PropDef) {
  const broken = d.kind === 'brokenPillar', h = broken ? 70 : 150, col = '#9b8a7e';
  shadowEll(c, 34, 10, 0.28, 8, 4);
  slab(c, -26, -16, 52, 18, 6, darken(col, 0.08), 2.6);
  slab(c, -19, -h, 38, h - 12, 9, col, 2.8);
  for (let i = 1; i < (broken ? 2 : 4); i++) { c.strokeStyle = 'rgba(60,40,44,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-19, -i * 38); c.lineTo(19, -i * 38 + 4); c.stroke(); }
  if (!broken) slab(c, -28, -h - 12, 56, 18, 6, lighten(col, 0.1), 2.6);
  else { poly(c, [[-19, -h], [-6, -h - 12], [4, -h + 4], [19, -h - 8], [19, -h + 6], [-19, -h + 6]], lighten(col, 0.12), 2.2); }
  c.fillStyle = 'rgba(110,160,70,.85)'; c.beginPath(); c.ellipse(-8, -h * 0.55, 11, 6, 0.2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(10, -24, 9, 5, 0, 0, TAU); c.fill();
}
const pillarSpec: Spec = { fr: 26, b: [-36, -176, 44, 14], draw: pillar, fp: () => [{ t: 'e', rx: 24, ry: 11, dy: -4 }] };

function archPost(c: C) {
  shadowEll(c, 40, 11, 0.28, 8, 4);
  const col = '#9a8878';
  slab(c, -30, -26, 60, 28, 7, darken(col, 0.06), 2.8); slab(c, -24, -190, 48, 170, 8, col, 3);
  for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(60,40,44,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-24, -50 - i * 38); c.lineTo(24, -46 - i * 38); c.stroke(); }
  glow(c, 0, -120, 18, '#ff8a2a', 0.5); poly(c, [[0, -136], [8, -120], [0, -104], [-8, -120]], '#ffb347', 1.6, '#a5361a');
  slab(c, -32, -204, 64, 20, 6, lighten(col, 0.12), 2.8);
}
const archPostSpec: Spec = { b: [-44, -214, 52, 14], draw: archPost, fp: () => [{ t: 'e', rx: 32, ry: 12, dy: -6 }], canopy: true };
function archLintel(c: C, d: PropDef) {
  const w = d.len ?? 260, col = '#a08e7e';
  c.fillStyle = 'rgba(30,18,30,.25)'; rr(c, -w / 2 + 8, -8, w, 34, 10); c.fill();
  slab(c, -w / 2, -40, w, 46, 12, col, 3);
  c.fillStyle = darken(col, 0.3); c.beginPath(); c.moveTo(-w / 2 + 20, 4); c.bezierCurveTo(-w / 4, 30, w / 4, 30, w / 2 - 20, 4); c.lineTo(w / 2 - 20, 6); c.bezierCurveTo(w / 4, 40, -w / 4, 40, -w / 2 + 20, 6); c.fill();
  poly(c, [[0, -62], [14, -40], [-14, -40]], '#ffb347', 2, '#a5361a');
  glow(c, 0, -30, 40, '#ff8a2a', 0.4);
}
const archLintelSpec: Spec = { b: [-200, -70, 200, 44], draw: archLintel, overhead: true };

function wall(c: C, d: PropDef) {
  const len = d.len ?? 160, col = '#8d7d72', r = rng(`wall${d.x}${d.y}`);
  shadowEll(c, len / 2 + 4, 9, 0.26, 8, 4);
  const n = Math.max(2, Math.round(len / 46));
  for (let i = 0; i < n; i++) { const w = len / n, h = 46 + (i % 2) * 14 + r() * 8, x = -len / 2 + i * w; slab(c, x + 1, -h, w - 2, h, 7, mix(col, '#b8a898', (i % 3) * 0.1), 2.6); }
  c.fillStyle = 'rgba(110,160,70,.85)'; c.beginPath(); c.ellipse(-len * 0.2, -56, 16, 6, 0, 0, TAU); c.fill();
}
const wallSpec: Spec = { b: [-260, -80, 260, 16], draw: wall, fp: (d) => [{ t: 'r', hw: (d.len ?? 160) / 2, hh: 11, dy: -6 }], canopy: true };

function lavafall(c: C) {
  shadowEll(c, 230, 30, 0.3, 20, 8);
  // rock mass
  c.beginPath(); c.moveTo(-250, 20); c.lineTo(-262, -230); c.bezierCurveTo(-240, -420, 240, -420, 262, -230); c.lineTo(250, 20); c.bezierCurveTo(100, 50, -100, 50, -250, 20); c.closePath();
  const rg = c.createLinearGradient(-260, -400, 260, 0); rg.addColorStop(0, '#6c5656'); rg.addColorStop(0.5, '#4d3a3e'); rg.addColorStop(1, '#2e2028'); c.fillStyle = rg; c.fill(); c.lineWidth = 3.4; c.strokeStyle = '#1f1420'; c.stroke();
  // lava falling
  c.beginPath(); c.moveTo(-62, -330); c.bezierCurveTo(-70, -200, -60, -80, -78, 10); c.lineTo(78, 10); c.bezierCurveTo(60, -80, 70, -200, 62, -330); c.closePath();
  const lg = c.createLinearGradient(0, -330, 0, 10); lg.addColorStop(0, '#ffd46a'); lg.addColorStop(0.5, '#ff8a2a'); lg.addColorStop(1, '#e0481c'); c.fillStyle = lg; c.fill();
  c.strokeStyle = 'rgba(255,240,170,.55)'; c.lineWidth = 6; c.lineCap = 'round';
  for (const x of [-34, -6, 24, 46]) { c.beginPath(); c.moveTo(x, -300); c.bezierCurveTo(x - 8, -190, x + 8, -100, x - 4, -10); c.stroke(); }
  // pool at the base
  c.beginPath(); c.ellipse(0, 12, 120, 30, 0, 0, TAU); c.fillStyle = '#ff7a2a'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#a5361a'; c.stroke();
  ball(c, -180, -250, 30, 22, '#6c5656', 2.4); ball(c, 190, -300, 26, 20, '#5c4850', 2.4);
  gloss(c, -170, -270, 20, 7, 0.3);
}
const lavafallSpec: Spec = { b: [-278, -420, 290, 52], draw: lavafall, fp: () => [{ t: 'r', hw: 250, hh: 30, dy: -10 }],
  fx: (c, _d, t) => {
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -60, 200 + Math.sin(t * 2) * 12, '#ff7a2a', 0.3);
    c.strokeStyle = 'rgba(255,236,160,.45)'; c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const x = -40 + i * 20, p = (t * 0.9 + i * 0.21) % 1; c.beginPath(); c.moveTo(x, -320 + p * 300); c.lineTo(x + 1, -290 + p * 300); c.stroke(); }
    c.restore();
  } };

function waterfall(c: C) {
  shadowEll(c, 110, 18, 0.28, 12, 6);
  c.beginPath(); c.moveTo(-120, 16); c.lineTo(-128, -130); c.bezierCurveTo(-110, -226, 110, -226, 128, -130); c.lineTo(120, 16); c.bezierCurveTo(50, 34, -50, 34, -120, 16); c.closePath();
  const rg = c.createLinearGradient(-120, -200, 120, 20); rg.addColorStop(0, '#8a7a72'); rg.addColorStop(1, '#4a3c44'); c.fillStyle = rg; c.fill(); c.lineWidth = 3.2; c.strokeStyle = '#2c2030'; c.stroke();
  c.beginPath(); c.moveTo(-36, -176); c.lineTo(-38, 8); c.lineTo(38, 8); c.lineTo(36, -176); c.closePath();
  const wg = c.createLinearGradient(0, -176, 0, 8); wg.addColorStop(0, '#aef5ee'); wg.addColorStop(1, '#35d0d0'); c.fillStyle = wg; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4; c.lineCap = 'round'; for (const x of [-20, 0, 20]) { c.beginPath(); c.moveTo(x, -170); c.lineTo(x - 2, 0); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-48 + i * 16, 10 + (i % 2) * 5, 9 + (i % 3) * 3, 0, TAU); c.fill(); }
  ball(c, -96, -150, 20, 16, '#8a7a72', 2); ball(c, 98, -140, 18, 14, '#7a6a68', 2);
  c.fillStyle = 'rgba(120,170,70,.9)'; c.beginPath(); c.ellipse(-60, -190, 26, 8, -0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(70, -188, 22, 7, 0.1, 0, TAU); c.fill();
}
const waterfallSpec: Spec = { fr: 96, b: [-136, -230, 140, 40], draw: waterfall, fp: () => [{ t: 'r', hw: 122, hh: 18, dy: -4 }],
  fx: (c, _d, t) => { c.save(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x = -28 + i * 11, p = (t * 1.1 + i * 0.17) % 1; c.beginPath(); c.moveTo(x, -170 + p * 160); c.lineTo(x, -150 + p * 160); c.stroke(); } c.restore(); } };

function spire(c: C, d: PropDef) {
  shadowEll(c, 56, 14, 0.3, 10, 5);
  const big = (d.v ?? 0) === 1;
  const spikes: number[][] = big ? [[0, -190, 26], [-38, -130, 20], [40, -140, 20], [-64, -80, 14]] : [[0, -120, 20], [-30, -84, 15], [32, -90, 15]];
  for (const [x, h, w] of spikes) {
    const l = [x - w, h * 0.35], r = [x + w, h * 0.4];
    poly(c, [[x, h], l, [x - w * 0.9, 2], [x + w * 0.9, 4], r], '#2e2238', 2.4, '#150d1c');
    poly(c, [[x, h], l, [x - w * 0.9, 2], [x - w * 0.1, 4]], '#4a3a5c', 0);
    c.strokeStyle = 'rgba(255,160,90,.7)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - w * 0.9, 2); c.lineTo(x - w, h * 0.35); c.lineTo(x, h); c.stroke();
  }
  glow(c, 0, -20, 50, '#ff7a2a', 0.35);
}
const spireSpec: Spec = { b: [-80, -200, 80, 18], draw: spire, fp: (d) => [{ t: 'e', rx: (d.v ?? 0) === 1 ? 44 : 30, ry: 12, dy: -4 }], canopy: true };

function altar(c: C) {
  shadowEll(c, 80, 20, 0.3, 12, 6);
  slab(c, -74, -34, 148, 40, 10, '#8d7d72', 3); slab(c, -56, -66, 112, 40, 10, '#a39284', 3);
  glow(c, 0, -70, 64, '#ffb347', 0.7); ball(c, 0, -72, 40, 12, '#ffcf6a', 2.2);
  for (const x of [-30, 0, 30]) poly(c, [[x, -76], [x + 7, -70], [x, -62], [x - 7, -70]], '#a5361a', 0);
}
const altarSpec: Spec = { b: [-90, -90, 96, 26], draw: altar, fp: () => [{ t: 'e', rx: 68, ry: 20, dy: -12 }],
  fx: (c, _d, t) => { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -70, 80 + Math.sin(t * 2.5) * 10, '#ffb347', 0.35); c.restore(); } };

function stalagmite(c: C, d: PropDef) {
  shadowEll(c, 40, 11, 0.32, 8, 4);
  const sp: number[][] = (d.v ?? 0) ? [[0, -100, 20], [-26, -64, 14]] : [[0, -70, 18], [28, -46, 12], [-24, -48, 12]];
  for (const [x, h, w] of sp) { poly(c, [[x, h], [x - w, 0], [x + w, 4]], '#4a3a40', 2.4, '#1a1018'); poly(c, [[x, h], [x - w, 0], [x - w * 0.1, 2]], '#6a5660', 0); }
}
const stalagmiteSpec: Spec = { b: [-54, -110, 58, 16], draw: stalagmite, fp: () => [{ t: 'e', rx: 28, ry: 11, dy: -3 }] };

function sign(c: C, d: PropDef) {
  shadowEll(c, 20, 6, 0.26, 4, 2);
  slab(c, -5, -72, 10, 72, 3, '#7a4c2c', 2);
  const dir = d.dir ?? 'right', dx = dir === 'left' ? -1 : 1, vert = dir === 'up' || dir === 'down';
  c.save(); c.translate(0, -60);
  if (vert) { slab(c, -22, -18, 44, 34, 8, '#d9a15e', 2.6); c.fillStyle = '#6a3f24'; c.beginPath(); if (dir === 'up') { c.moveTo(0, -12); c.lineTo(13, 4); c.lineTo(4, 4); c.lineTo(4, 11); c.lineTo(-4, 11); c.lineTo(-4, 4); c.lineTo(-13, 4); } else { c.moveTo(0, 10); c.lineTo(13, -6); c.lineTo(4, -6); c.lineTo(4, -13); c.lineTo(-4, -13); c.lineTo(-4, -6); c.lineTo(-13, -6); } c.closePath(); c.fill(); }
  else {
    c.beginPath(); c.moveTo(-34 * dx, -14); c.lineTo(22 * dx, -14); c.lineTo(40 * dx, 0); c.lineTo(22 * dx, 14); c.lineTo(-34 * dx, 14); c.closePath();
    const g = c.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#e8b46c'); g.addColorStop(1, '#c58b4c'); c.fillStyle = g; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#5a3520'; c.stroke();
    c.fillStyle = '#6a3f24'; c.beginPath(); c.moveTo(-20 * dx, -4); c.lineTo(14 * dx, -4); c.lineTo(14 * dx, -10); c.lineTo(30 * dx, 0); c.lineTo(14 * dx, 10); c.lineTo(14 * dx, 4); c.lineTo(-20 * dx, 4); c.closePath(); c.fill();
  }
  c.restore();
}
const signSpec: Spec = { fr: 16, b: [-48, -84, 48, 10], draw: sign, fp: () => [{ t: 'e', rx: 7, ry: 4, dy: 0 }] };

function chest(c: C, d: PropDef) {
  const open = (d.v ?? 0) === 1;
  shadowEll(c, 34, 9, 0.28, 6, 3);
  slab(c, -28, -30, 56, 30, 7, '#b0703a', 2.6);
  if (open) { slab(c, -28, -58, 56, 20, 7, '#a0622f', 2.6); glow(c, 0, -34, 38, '#ffe27a', 0.8); ball(c, -10, -34, 6, 5, '#ffd24a', 1.4); ball(c, 8, -36, 6, 5, '#ffe27a', 1.4); }
  else { c.beginPath(); c.moveTo(-28, -30); c.bezierCurveTo(-28, -56, 28, -56, 28, -30); c.closePath(); const g = c.createLinearGradient(0, -52, 0, -30); g.addColorStop(0, '#c98446'); g.addColorStop(1, '#9a5a2c'); c.fillStyle = g; c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#4a2a1a'; c.stroke(); }
  c.fillStyle = '#ffd24a'; c.fillRect(-26, -30, 8, 30); c.fillRect(18, -30, 8, 30); ball(c, 0, -28, 5, 6, '#ffd24a', 1.6);
}
const chestSpec: Spec = { fr: 26, b: [-42, -64, 44, 12], draw: chest, fp: () => [{ t: 'e', rx: 26, ry: 10, dy: -4 }] };

function runeStone(c: C) {
  shadowEll(c, 52, 14, 0.26, 8, 4);
  c.beginPath(); c.ellipse(0, -6, 46, 20, 0, 0, TAU); c.fillStyle = '#6c5e66'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#2e2030'; c.stroke();
  c.beginPath(); c.ellipse(0, -10, 36, 15, 0, 0, TAU); c.strokeStyle = '#7fe9ff'; c.lineWidth = 3; c.stroke();
  glow(c, 0, -10, 40, '#7fe9ff', 0.4);
  slab(c, -14, -64, 28, 60, 12, '#8d7f88', 2.8); poly(c, [[0, -52], [8, -40], [0, -28], [-8, -40]], '#7fe9ff', 1.6, '#2a6a8a');
  for (const a of [0.5, 1.3, 2.1, 2.9, 3.7, 4.5, 5.3]) { c.fillStyle = '#c8f6ff'; c.beginPath(); c.arc(Math.cos(a) * 36, -10 + Math.sin(a) * 15, 2.2, 0, TAU); c.fill(); }
}
const runeStoneSpec: Spec = { b: [-56, -72, 60, 16], draw: runeStone, fp: () => [{ t: 'e', rx: 28, ry: 12, dy: -4 }],
  fx: (c, _d, t) => { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -34, 54 + Math.sin(t * 2.2) * 6, '#7fe9ff', 0.3); c.restore(); } };

function torch(c: C) {
  shadowEll(c, 18, 5, 0.26, 4, 2);
  c.beginPath(); c.ellipse(0, -4, 18, 7, 0, 0, TAU); c.fillStyle = '#5a4a52'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = '#2e2030'; c.stroke();
  slab(c, -5, -66, 10, 62, 3, '#6a5a62', 2); c.beginPath(); c.moveTo(-18, -80); c.lineTo(18, -80); c.lineTo(12, -64); c.lineTo(-12, -64); c.closePath(); c.fillStyle = '#4a3a42'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = '#2e2030'; c.stroke();
}
const torchSpec: Spec = { b: [-34, -140, 34, 8], draw: torch, fp: () => [{ t: 'e', rx: 8, ry: 4, dy: -2 }],
  fx: (c, d, t) => {
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 0, -90, 62 + Math.sin(t * 7 + d.x) * 6, '#ff9a3a', 0.38); c.globalCompositeOperation = 'source-over';
    const f = Math.sin(t * 9 + d.x) * 3;
    c.beginPath(); c.moveTo(-11, -80); c.bezierCurveTo(-14 + f, -100, -2, -108, f, -126); c.bezierCurveTo(6, -108, 15 + f, -98, 11, -80); c.closePath();
    const g = c.createLinearGradient(0, -126, 0, -80); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ffa23a'); g.addColorStop(1, '#e0481c'); c.fillStyle = g; c.fill(); c.restore();
  } };

const SPECS: Partial<Record<PropKind, Spec>> = {
  mushroom: mushroomSpec, ashTree: ashTreeSpec, rock: rockSpec, boulder: boulderSpec, fireCrystal: fireCrystalSpec, iceCrystal: fireCrystalSpec,
  bush: bushSpec, lantern: lanternSpec, fence: fenceSpec, house: houseSpec, fountain: fountainSpec, stall: stallSpec, lighthouse: lighthouseSpec,
  statue: statueSpec, pillar: pillarSpec, brokenPillar: pillarSpec, archPost: archPostSpec, archLintel: archLintelSpec, wall: wallSpec,
  lavafall: lavafallSpec, waterfall: waterfallSpec, spire: spireSpec, altar: altarSpec, stalagmite: stalagmiteSpec, sign: signSpec, chest: chestSpec,
  runeStone: runeStoneSpec, torch: torchSpec,
};
export const propSpec = (k: PropKind): Spec | undefined => SPECS[k];

// ------------------------------------------------------------------ sprite cache
export interface Sprite { cv: HTMLCanvasElement; ox: number; oy: number; w: number; h: number }
const cache = new Map<string, Sprite>();
const PAD = 18;
/** Storybook locations draw their objects from painted sprites (see storybook/story.ts). Set while such a location is active. */
export interface StoryHook { sprite(d: PropDef): Sprite | null; footprints(d: PropDef): ReturnType<typeof footprints> }
let storyHook: StoryHook | null = null;
export const setStoryHook = (h: StoryHook | null) => { storyHook = h; };
export function propSprite(d: PropDef): Sprite | null {
  if (storyHook) return storyHook.sprite(d);
  const spec = SPECS[d.kind]; if (!spec) return null;
  const s = d.s ?? 1, key = `${d.kind}|${d.v ?? 0}|${s}|${d.len ?? ''}|${d.dir ?? ''}|${fringeStyle}`;
  let sp = cache.get(key); if (sp) return sp;
  const [l, t, r, b] = spec.b, pad = d.len ? Math.abs(d.len) / 2 : 0;
  const L = d.len ? Math.min(l, -pad - 10) : l, R = d.len ? Math.max(r, pad + 10) : r;
  const w = Math.ceil((R - L) * s) + PAD * 2, h = Math.ceil((b - t) * s) + PAD * 2;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!; const ox = -L * s + PAD, oy = -t * s + PAD;
  c.save(); c.translate(ox, oy); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; spec.draw(c, d); c.restore();
  if (spec.fr && !spec.overhead) { c.save(); c.translate(ox, oy); fringe(c, spec.fr * Math.min(s, 1.7), key); c.restore(); }
  applyGrain(c, w, h);
  sp = { cv, ox, oy, w, h }; cache.set(key, sp); return sp;
}
export function footprints(d: PropDef): { t: 'e'; rx: number; ry: number; x: number; y: number }[] | { t: 'r'; hw: number; hh: number; x: number; y: number }[] {
  if (storyHook) return storyHook.footprints(d);
  const spec = SPECS[d.kind]; if (!spec || !spec.fp || d.noCollide) return [];
  const s = d.s ?? 1;
  return spec.fp(d).map((f) => f.t === 'e' ? { t: 'e' as const, rx: f.rx * s, ry: f.ry * s, x: d.x, y: d.y + f.dy * s } : { t: 'r' as const, hw: f.hw * s, hh: f.hh * s, x: d.x, y: d.y + f.dy * s }) as never;
}

// ------------------------------------------------------------------ NPCs & critter helpers (drawn live, small)
const NPC_COL: Record<string, { cloak: string; trim: string; skin: string }> = {
  guide: { cloak: '#2fa7a0', trim: '#ffd24a', skin: '#f2c49a' },
  scholar: { cloak: '#7a55c9', trim: '#ffe27a', skin: '#e8b58c' },
  villager: { cloak: '#d9683a', trim: '#fff2c8', skin: '#f6cfa6' },
};
export function npcSprite(kind: string): Sprite {
  const key = `npc|${kind}`, ex = cache.get(key); if (ex) return ex;
  const col = NPC_COL[kind] ?? NPC_COL.guide, w = 90, h = 120, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!; c.translate(45, 108); c.lineJoin = 'round'; c.lineCap = 'round';
  shadowEll(c, 26, 7, 0.28, 4, 2);
  // cloak body
  c.beginPath(); c.moveTo(-26, 0); c.bezierCurveTo(-32, -34, -22, -52, 0, -54); c.bezierCurveTo(22, -52, 32, -34, 26, 0); c.bezierCurveTo(10, 8, -10, 8, -26, 0); c.closePath();
  const g = c.createLinearGradient(-30, -50, 30, 0); g.addColorStop(0, lighten(col.cloak, 0.3)); g.addColorStop(0.5, col.cloak); g.addColorStop(1, darken(col.cloak, 0.4)); c.fillStyle = g; c.fill(); c.lineWidth = 2.6; c.strokeStyle = outline(col.cloak); c.stroke();
  c.strokeStyle = col.trim; c.lineWidth = 4; c.beginPath(); c.moveTo(-22, -6); c.bezierCurveTo(-8, 2, 8, 2, 22, -6); c.stroke();
  ball(c, -16, -6, 8, 6, '#6e4528', 1.6); ball(c, 16, -6, 8, 6, '#6e4528', 1.6);
  // head + hood
  ball(c, 0, -66, 26, 24, col.skin, 2.6);
  c.beginPath(); c.moveTo(-30, -62); c.bezierCurveTo(-34, -102, 34, -102, 30, -62); c.bezierCurveTo(22, -78, -22, -78, -30, -62); c.closePath();
  const hg = c.createLinearGradient(-30, -100, 30, -60); hg.addColorStop(0, lighten(col.cloak, 0.3)); hg.addColorStop(1, darken(col.cloak, 0.3)); c.fillStyle = hg; c.fill(); c.lineWidth = 2.6; c.strokeStyle = outline(col.cloak); c.stroke();
  for (const sx of [-1, 1]) { ball(c, sx * 10, -64, 5.4, 6.4, '#2b2130', 1); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 10 + 1.6, -66, 1.8, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,120,120,.55)'; c.beginPath(); c.ellipse(sx * 17, -56, 4.5, 3, 0, 0, TAU); c.fill(); }
  c.strokeStyle = '#7a3b2e'; c.lineWidth = 2; c.beginPath(); c.arc(0, -55, 4, 0.2, Math.PI - 0.2); c.stroke();
  if (kind === 'scholar') { c.strokeStyle = '#3a2a40'; c.lineWidth = 2; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 10, -64, 8, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(-2, -64); c.lineTo(2, -64); c.stroke(); }
  if (kind === 'guide') { c.strokeStyle = '#5a3520'; c.lineWidth = 3; c.beginPath(); c.moveTo(30, -10); c.lineTo(30, -60); c.stroke(); glow(c, 30, -66, 22, '#ffc247', 0.7); ball(c, 30, -66, 6, 8, '#ffd46a', 1.4); }
  applyGrain(c, w, h);
  const sp = { cv, ox: 45, oy: 108, w, h }; cache.set(key, sp); return sp;
}

/** Marker bubble ("!" or "?" or arrow). Drawn from paths, not text, so nothing is baked in a language. */
export function drawMarker(c: C, kind: '!' | '?' | 'shimmer' | 'arrow', x: number, y: number, t: number) {
  const bob = Math.sin(t * 3 + x * 0.01) * 4;
  c.save(); c.translate(x, y + bob);
  if (kind === 'shimmer') {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const a = t * 1.6 + i * 2.1, r = 1 + Math.sin(a * 2) * 0.4; glow(c, Math.cos(a) * 14, -6 + Math.sin(a * 1.3) * 8, 12 * r, '#ffe27a', 0.9); }
    c.restore(); return;
  }
  if (kind === 'arrow') { c.fillStyle = '#ffd24a'; c.strokeStyle = '#7a4a10'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 6); c.lineTo(11, -8); c.lineTo(4, -8); c.lineTo(4, -20); c.lineTo(-4, -20); c.lineTo(-4, -8); c.lineTo(-11, -8); c.closePath(); c.fill(); c.stroke(); c.restore(); return; }
  c.beginPath(); c.moveTo(-17, -42); c.arcTo(17, -42, 17, -6, 14); c.arcTo(17, -6, 5, -6, 14); c.lineTo(5, -6); c.lineTo(0, 4); c.lineTo(-5, -6); c.arcTo(-17, -6, -17, -42, 14); c.arcTo(-17, -42, 17, -42, 14); c.closePath();
  c.fillStyle = '#fff7df'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#c08a2e'; c.stroke();
  c.fillStyle = kind === '!' ? '#e8742a' : '#2f8fd6'; c.strokeStyle = c.fillStyle; c.lineWidth = 4.4; c.lineCap = 'round';
  if (kind === '!') { c.beginPath(); c.moveTo(0, -35); c.lineTo(0, -22); c.stroke(); c.beginPath(); c.arc(0, -13, 2.8, 0, TAU); c.fill(); }
  else { c.beginPath(); c.arc(0, -29, 7, Math.PI * 1.05, Math.PI * 2.15); c.bezierCurveTo(7, -22, 0, -22, 0, -17); c.stroke(); c.beginPath(); c.arc(0, -11, 2.8, 0, TAU); c.fill(); }
  c.restore();
}
export { glow, ball, shadowEll };
