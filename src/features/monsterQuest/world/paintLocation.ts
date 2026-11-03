/** Bakes a LocationDef into: a painted ground canvas, a collision field, sorted props, encounter tufts and a mini-map. */
import { Field, CELL } from './collision';
import { footprints, propSprite, propSpec, type Sprite } from './paintProps';
import type { LocationDef, PropDef, ZoneDef, Pt, PathDef, LiquidKind, LiquidDef } from './types';
import { darken, lighten, makeNoise, mix, outline, pointInPoly, rgba, rng, smooth, hex2rgb } from './util';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export const PLAYER_R = 16;
const MARGIN = 96;

export interface PlacedProp { def: PropDef; sp: Sprite; overhead: boolean; canopy: boolean; fx?: (c: C, d: PropDef, t: number) => void; fade: number }
export interface Tuft { x: number; y: number; k: number; ph: number; zone: number }
export interface Sparkle { x: number; y: number; ph: number; kind: LiquidKind; r: number }
export interface Baked {
  def: LocationDef; bg: HTMLCanvasElement; field: Field; props: PlacedProp[]; tufts: Tuft[]; tuftSprites: Record<string, HTMLCanvasElement[]>;
  sparkles: Sparkle[]; zonePolys: Pt[][]; mini: HTMLCanvasElement; miniScale: number; pathsSmooth: { pts: Pt[]; width: number; main?: boolean }[];
}

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function strokePoly(c: C, pts: Pt[], closed = false) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); if (closed) c.closePath(); }
const sm = (p: Pt[]) => smooth(p, 10);

// --------------------------------------------------------------------------------------------------- border + gate props
function gateProps(def: LocationDef): PropDef[] {
  const out: PropDef[] = [];
  for (const g of def.gates) {
    const [x, y, w, h] = g.rect;
    if ((g.style === 'arch' || g.style === 'gate') && (g.dir === 'up' || g.dir === 'down')) {
      const by = g.dir === 'up' ? y + h - 20 : y + 54;
      out.push({ kind: 'archPost', x: x - 26, y: by, s: 1.25 }, { kind: 'archPost', x: x + w + 26, y: by, s: 1.25 }, { kind: 'archLintel', x: x + w / 2, y: by - 232, len: w + 140 });
      out.push({ kind: 'torch', x: x - 40, y: by + 4 }, { kind: 'torch', x: x + w + 40, y: by + 4 });
    } else if (g.style === 'cave') {
      const vert = g.dir === 'left' || g.dir === 'right';
      if (vert) out.push({ kind: 'stalagmite', x: x + w / 2, y: y - 14, v: 1 }, { kind: 'stalagmite', x: x + w / 2, y: y + h + 40, v: 1 });
      else out.push({ kind: 'stalagmite', x: x - 20, y: y + h, v: 1 }, { kind: 'stalagmite', x: x + w + 20, y: y + h, v: 1 });
    } else if (g.style === 'path' && def.mode === 'carve') {
      const vert = g.dir === 'left' || g.dir === 'right';
      out.push({ kind: 'torch', x: vert ? x + w - 20 : x - 30, y: vert ? y - 10 : y + h }, { kind: 'torch', x: vert ? x + w - 20 : x + w + 30, y: vert ? y + h + 40 : y + h });
    } else if (g.style === 'path') {
      if (g.dir === 'left' || g.dir === 'right') out.push({ kind: 'mushroom', x: x + w / 2, y: y - 12, v: 3, s: 1.35 }, { kind: 'mushroom', x: x + w / 2, y: y + h + 70, v: 0, s: 1.35 });
      else out.push({ kind: 'mushroom', x: x - 40, y: y + h, v: 3, s: 1.35 }, { kind: 'mushroom', x: x + w + 40, y: y + h, v: 0, s: 1.35 });
    }
  }
  return out;
}
function borderProps(def: LocationDef): PropDef[] {
  if (def.mode !== 'open') return [];
  const out: PropDef[] = [], r = rng(`border:${def.id}`), { w, h } = def;
  const nearGate = (x: number, y: number) => def.gates.some((g) => x > g.rect[0] - 90 && x < g.rect[0] + g.rect[2] + 90 && y > g.rect[1] - 90 && y < g.rect[1] + g.rect[3] + 90);
  const place = (x: number, y: number) => {
    if (nearGate(x, y)) return;
    const k = r();
    if (k < 0.5) out.push({ kind: 'ashTree', x, y, v: Math.floor(r() * 4), s: 0.95 + r() * 0.35 });
    else if (k < 0.8) out.push({ kind: 'mushroom', x, y, v: Math.floor(r() * 5), s: 0.9 + r() * 0.7 });
    else if (k < 0.92) out.push({ kind: 'boulder', x, y, v: Math.floor(r() * 2) });
    else out.push({ kind: 'fireCrystal', x, y, v: Math.floor(r() * 4) });
  };
  for (const [off, jit] of [[34, 22], [88, 30]] as const) {
    for (let x = -10 + (off > 50 ? 50 : 0); x <= w + 10; x += 104) { place(x + (r() - 0.5) * jit, off + (r() - 0.5) * jit); place(x + (r() - 0.5) * jit, h - off + 44 + (r() - 0.5) * jit); }
    for (let y = 110; y <= h - 60; y += 104) { place(off - 10 + (r() - 0.5) * jit, y + (r() - 0.5) * jit); place(w - off + 10 + (r() - 0.5) * jit, y + (r() - 0.5) * jit); }
  }
  return out;
}

// --------------------------------------------------------------------------------------------------- liquids
function liquidColors(def: LocationDef, k: LiquidKind) { return k === 'lava' ? def.pal.lava : def.pal.water; }
function paintLiquid(c: C, def: LocationDef, L: LiquidDef, glowPass: boolean) {
  const col = liquidColors(def, L.kind), pts = L.closed ? smooth(L.pts, 8, true) : sm(L.pts), lava = L.kind === 'lava';
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  const body = () => { if (L.closed) { strokePoly(c, pts, true); } else strokePoly(c, pts); };
  if (glowPass) {
    c.shadowColor = rgba(col.glow, lava ? 0.9 : 0.5); c.shadowBlur = lava ? 46 : 22;
    c.strokeStyle = rgba(col.glow, lava ? 0.55 : 0.0); c.lineWidth = (L.width ?? 0) + 18; body();
    if (L.closed) { c.fillStyle = col.glow; c.fill(); } else c.stroke();
    c.restore(); return;
  }
  // bank
  if (L.closed) { body(); c.fillStyle = rgba(darken(def.pal.ground[2], 0.35), 0.9); c.lineWidth = 30; c.strokeStyle = rgba(darken(def.pal.ground[2], 0.35), 0.9); c.stroke(); c.fill(); }
  else { body(); c.strokeStyle = rgba(darken(def.pal.ground[2], 0.35), 0.9); c.lineWidth = (L.width ?? 80) + 20; c.stroke(); }
  // foam / rim
  if (L.closed) { body(); c.strokeStyle = lava ? col.glow : lighten(col.glow, 0.5); c.lineWidth = 14; c.stroke(); } else { body(); c.strokeStyle = lava ? col.glow : lighten(col.glow, 0.55); c.lineWidth = (L.width ?? 80) + 8; c.stroke(); }
  // body
  body(); c.fillStyle = col.mid; c.strokeStyle = col.mid; c.lineWidth = L.closed ? 4 : (L.width ?? 80); c.stroke(); if (L.closed) c.fill();
  // deep centre
  if (L.closed) { c.save(); body(); c.clip(); c.strokeStyle = rgba(col.deep, 0.7); c.lineWidth = 70; body(); c.stroke(); c.restore(); }
  else { body(); c.strokeStyle = rgba(col.deep, 0.75); c.lineWidth = (L.width ?? 80) * 0.5; c.stroke(); body(); c.strokeStyle = rgba(col.mid, 0.5); c.lineWidth = (L.width ?? 80) * 0.22; c.stroke(); }
  c.restore();
}

// --------------------------------------------------------------------------------------------------- bridges
function paintBridge(c: C, b: { a: Pt; b: Pt; width: number; kind?: string }) {
  const [ax, ay] = b.a, [bx, by] = b.b, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax), hw = b.width / 2;
  c.save(); c.translate((ax + bx) / 2, (ay + by) / 2); c.rotate(ang);
  const L = len / 2 + 20; // overhang onto both banks
  // shadow on the liquid below
  c.fillStyle = 'rgba(30,14,26,.38)'; c.beginPath(); c.roundRect(-L + 6, -hw + 14, L * 2, b.width, 10); c.fill();
  // deck
  const g = c.createLinearGradient(0, -hw, 0, hw); g.addColorStop(0, lighten('#b8a898', 0.12)); g.addColorStop(1, '#8d7d72');
  c.fillStyle = g; c.beginPath(); c.roundRect(-L, -hw, L * 2, b.width, 8); c.fill(); c.lineWidth = 3; c.strokeStyle = '#3d2c34'; c.stroke();
  c.strokeStyle = 'rgba(60,40,44,.45)'; c.lineWidth = 2;
  for (let x = -L + 22; x < L - 10; x += 26) { c.beginPath(); c.moveTo(x, -hw + 12); c.lineTo(x + 2, hw - 12); c.stroke(); }
  // rails (low stone walls)
  for (const sy of [-1, 1]) {
    const y0 = sy < 0 ? -hw - 2 : hw - 14, wall = c.createLinearGradient(0, y0, 0, y0 + 16); wall.addColorStop(0, lighten('#a69584', 0.25)); wall.addColorStop(1, '#6c5c58');
    c.fillStyle = wall; c.beginPath(); c.roundRect(-L - 4, y0, L * 2 + 8, 16, 7); c.fill(); c.lineWidth = 2.6; c.strokeStyle = '#3d2c34'; c.stroke();
    c.fillStyle = 'rgba(255,240,210,.35)'; c.beginPath(); c.roundRect(-L + 4, y0 + 2, L * 2 - 8, 4, 2); c.fill();
    for (let x = -L + 10; x < L; x += 44) { c.fillStyle = '#9a8878'; c.beginPath(); c.roundRect(x, y0 - 4, 14, 24, 5); c.fill(); c.lineWidth = 2; c.strokeStyle = '#3d2c34'; c.stroke(); }
  }
  c.restore();
}

// --------------------------------------------------------------------------------------------------- ground
function paintBase(c: C, def: LocationDef, noise: (x: number, y: number) => number, r: () => number) {
  const { w, h, pal } = def;
  if (def.mode === 'carve') {
    const lava = def.base === 'lava', a = lava ? pal.lava.deep : darken(pal.wall[0], 0.1), b = lava ? pal.lava.mid : pal.wall[0];
    c.fillStyle = a; c.fillRect(0, 0, w, h);
    const sm_ = canvas(Math.ceil(w / 12), Math.ceil(h / 12)), sc = sm_.getContext('2d')!, id = sc.createImageData(sm_.width, sm_.height);
    const A = hex2rgb(a), B = hex2rgb(b);
    for (let y = 0; y < sm_.height; y++) for (let x = 0; x < sm_.width; x++) { const n = Math.pow(noise(x * 0.09, y * 0.09), lava ? 1.6 : 1.2), i = (y * sm_.width + x) * 4; id.data[i] = A[0] + (B[0] - A[0]) * n; id.data[i + 1] = A[1] + (B[1] - A[1]) * n; id.data[i + 2] = A[2] + (B[2] - A[2]) * n; id.data[i + 3] = 255; }
    sc.putImageData(id, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(sm_, 0, 0, w, h);
    if (lava) {
      c.lineCap = 'round'; for (let i = 0; i < (w * h) / 5500; i++) { const x = r() * w, y = r() * h, len = 18 + r() * 40; c.strokeStyle = rgba(pal.lava.spark, 0.12 + r() * 0.2); c.lineWidth = 2 + r() * 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len * 0.5, y - 6 + r() * 12, x + len, y + (r() - 0.5) * 10); c.stroke(); }
    } else {
      for (let i = 0; i < (w * h) / 1800; i++) { const x = r() * w, y = r() * h; c.fillStyle = rgba(r() < 0.5 ? pal.wall[1] : '#120a14', 0.18 + r() * 0.2); c.beginPath(); c.ellipse(x, y, 5 + r() * 12, 3 + r() * 7, r() * 3, 0, TAU); c.fill(); }
    }
    return;
  }
  c.fillStyle = pal.ground[0]; c.fillRect(0, 0, w, h);
  const sm_ = canvas(Math.ceil(w / 12), Math.ceil(h / 12)), sc = sm_.getContext('2d')!, id = sc.createImageData(sm_.width, sm_.height);
  const D = hex2rgb(pal.ground[2]), M = hex2rgb(pal.ground[0]), Lc = hex2rgb(pal.ground[1]);
  for (let y = 0; y < sm_.height; y++) for (let x = 0; x < sm_.width; x++) {
    const n = noise(x * 0.07, y * 0.07), i = (y * sm_.width + x) * 4, t = n < 0.5 ? n * 2 : (n - 0.5) * 2, A = n < 0.5 ? D : M, B = n < 0.5 ? M : Lc;
    id.data[i] = A[0] + (B[0] - A[0]) * t; id.data[i + 1] = A[1] + (B[1] - A[1]) * t; id.data[i + 2] = A[2] + (B[2] - A[2]) * t; id.data[i + 3] = 255;
  }
  sc.putImageData(id, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(sm_, 0, 0, w, h);
  // brush strokes: short curved blades
  c.lineCap = 'round';
  for (let i = 0; i < (w * h) / 700; i++) {
    const x = r() * w, y = r() * h, l = 8 + r() * 12, k = r();
    c.strokeStyle = k < 0.4 ? rgba(pal.tuft, 0.35) : k < 0.7 ? rgba(pal.ground[1], 0.4) : rgba(pal.ground[2], 0.4); c.lineWidth = 2 + r() * 1.6;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 6, y - l * 0.5, x + (r() - 0.5) * 9, y - l); c.stroke();
  }
}

function paintFloorShape(c: C, pts: Pt[], r: () => number, face: number, opts: { top: string; faceCol: string; rim: string }) {
  const poly = smooth(pts, 8, true);
  // soft contact shadow + glow below
  c.save(); c.translate(0, face);
  strokePoly(c, poly, true); c.fillStyle = opts.faceCol; c.fill(); c.lineWidth = 8; c.strokeStyle = outline(opts.faceCol); c.stroke(); c.restore();
  // face gradient (darker at the bottom)
  c.save(); c.translate(0, face); strokePoly(c, poly, true); c.clip(); const g = c.createLinearGradient(0, 0, 0, 1); c.restore();
  void g;
  // fill the strip between top and face with a vertical shade
  c.save(); strokePoly(c, poly, true); c.clip(); c.restore();
  strokePoly(c, poly, true); c.fillStyle = opts.top; c.fill();
  c.save(); strokePoly(c, poly, true); c.clip();
  // detail strokes on the top surface
  const bb = poly.reduce((b, p) => ({ x0: Math.min(b.x0, p[0]), y0: Math.min(b.y0, p[1]), x1: Math.max(b.x1, p[0]), y1: Math.max(b.y1, p[1]) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  const area = (bb.x1 - bb.x0) * (bb.y1 - bb.y0);
  for (let i = 0; i < area / 520; i++) {
    const x = bb.x0 + r() * (bb.x1 - bb.x0), y = bb.y0 + r() * (bb.y1 - bb.y0); const k = r();
    c.strokeStyle = k < 0.5 ? rgba(lighten(opts.top, 0.3), 0.3) : rgba(darken(opts.top, 0.3), 0.3); c.lineWidth = 2 + r() * 1.5;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 + r() * 12, y + (r() - 0.5) * 4); c.stroke();
  }
  // inner edge shade
  c.strokeStyle = rgba(darken(opts.top, 0.5), 0.35); c.lineWidth = 30; strokePoly(c, poly, true); c.stroke();
  c.restore();
  // upper-left rim light
  c.strokeStyle = opts.rim; c.lineWidth = 5; strokePoly(c, poly, true); c.stroke();
  c.strokeStyle = outline(opts.top); c.lineWidth = 2.4; strokePoly(c, poly, true); c.stroke();
}

function paintPath(c: C, def: LocationDef, p: PathDef, r: () => number, carveMode: boolean) {
  const pts = sm(p.pts), tunnel = carveMode && def.base === 'rock', ft = mix('#6b5648', def.pal.ground[0], 0.2);
  const pal: [string, string, string] = tunnel ? [ft, lighten(ft, 0.18), darken(ft, 0.55)] : def.pal.path;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  strokePoly(c, pts.map(([x, y]) => [x + 3, y + 5] as Pt)); c.strokeStyle = 'rgba(40,24,30,.28)'; c.lineWidth = p.width + 16; c.stroke();
  strokePoly(c, pts); c.strokeStyle = carveMode ? lighten(pal[2], 0.1) : pal[2]; c.lineWidth = p.width + 12; c.stroke();
  strokePoly(c, pts); c.strokeStyle = pal[1]; c.lineWidth = p.width + 6; c.stroke();
  strokePoly(c, pts); c.strokeStyle = pal[0]; c.lineWidth = p.width; c.stroke();
  strokePoly(c, pts); c.strokeStyle = rgba(lighten(pal[0], 0.35), 0.28); c.lineWidth = p.width * 0.45; c.stroke();
  // pebbles & wheel-rut strokes
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], seg = Math.hypot(x1 - x0, y1 - y0); acc += seg;
    if (acc < 16) continue; acc = 0;
    const nx = -(y1 - y0) / (seg || 1), ny = (x1 - x0) / (seg || 1), off = (r() - 0.5) * p.width * 0.85;
    const px = x1 + nx * off, py = y1 + ny * off, k = r();
    c.fillStyle = k < 0.5 ? rgba(pal[2], 0.45) : rgba(lighten(pal[0], 0.4), 0.5); c.beginPath(); c.ellipse(px, py, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, TAU); c.fill();
  }
  c.restore();
}

// --------------------------------------------------------------------------------------------------- encounter tufts
function tuftSprites(def: LocationDef): Record<string, HTMLCanvasElement[]> {
  const mk = (kind: 'ash' | 'moss', k: number) => {
    const cv = canvas(48, 54), c = cv.getContext('2d')!, r = rng(`tuft${kind}${k}`); c.translate(24, 50); c.lineCap = 'round';
    if (kind === 'ash') {
      const [blade, tip] = def.pal.ashTuft;
      for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36 + (r() - 0.5) * 0.2, l = 28 + r() * 16; const x = Math.sin(a) * l, y = -Math.cos(a) * l; c.strokeStyle = outline(blade); c.lineWidth = 6; c.beginPath(); c.moveTo((i - 2.5) * 3, 0); c.quadraticCurveTo(x * 0.3, -l * 0.55, x, y); c.stroke(); c.strokeStyle = i % 2 ? blade : lighten(blade, 0.15); c.lineWidth = 3.6; c.beginPath(); c.moveTo((i - 2.5) * 3, 0); c.quadraticCurveTo(x * 0.3, -l * 0.55, x, y); c.stroke(); c.fillStyle = tip; c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); }
    } else {
      const [base, gl] = def.pal.moss;
      c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, -10, 0, 0, -10, 24); g.addColorStop(0, rgba(gl, 0.35)); g.addColorStop(1, rgba(gl, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, -10, 24, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 5; i++) { const a = -1 + i * 0.5 + (r() - 0.5) * 0.2, l = 20 + r() * 14, x = Math.sin(a) * l, y = -Math.cos(a) * l; c.fillStyle = mix(base, '#0c3a40', i % 2 ? 0.3 : 0); c.strokeStyle = outline(base); c.lineWidth = 2.2; c.beginPath(); c.ellipse(x * 0.7, y * 0.7 - 2, 6, l * 0.5, a, 0, TAU); c.fill(); c.stroke(); c.fillStyle = gl; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill(); }
    }
    return cv;
  };
  return { ash: [0, 1, 2].map((k) => mk('ash', k)), moss: [0, 1, 2].map((k) => mk('moss', k)) };
}

// --------------------------------------------------------------------------------------------------- bake
export function bakeLocation(def: LocationDef): Baked {
  const { w, h, pal } = def, r = rng(`bake:${def.id}`), noise = makeNoise(def.id);
  const bg = canvas(w, h), c = bg.getContext('2d')!; c.lineJoin = 'round'; c.lineCap = 'round';
  const gw = Math.ceil(w / CELL), gh = Math.ceil(h / CELL);
  const mk = canvas(gw, gh), m = mk.getContext('2d', { willReadFrequently: true })!; m.scale(1 / CELL, 1 / CELL);
  const sk = canvas(gw, gh), sl = sk.getContext('2d', { willReadFrequently: true })!; sl.scale(1 / CELL, 1 / CELL);
  const black = (fn: () => void) => { m.fillStyle = m.strokeStyle = '#000'; fn(); };
  const white = (fn: () => void) => { m.fillStyle = m.strokeStyle = '#fff'; fn(); };

  paintBase(c, def, noise, r);
  m.fillStyle = def.mode === 'open' ? '#fff' : '#000'; m.fillRect(0, 0, w, h); sl.fillStyle = '#000'; sl.fillRect(0, 0, w, h);

  // ---- floors (carve mode) and raised plateaus (open mode)
  const floorTop = def.base === 'lava' ? mix('#8f7b6c', pal.ground[1], 0.2) : mix('#6b5648', pal.ground[0], 0.2);
  if (def.mode === 'carve') {
    // lava glow around the platforms first
    if (def.base === 'lava') for (const f of def.floors ?? []) { c.save(); c.shadowColor = rgba(pal.lava.glow, 0.85); c.shadowBlur = 56; c.fillStyle = pal.lava.glow; strokePoly(c, smooth(f.pts, 8, true), true); c.fill(); c.restore(); }
    if (def.base === 'rock') for (const f of def.floors ?? []) { c.save(); c.shadowColor = rgba(pal.lava.glow, 0.55); c.shadowBlur = 70; c.fillStyle = pal.lava.mid; strokePoly(c, smooth(f.pts, 8, true), true); c.fill(); c.restore(); }
    for (const f of def.floors ?? []) {
      paintFloorShape(c, f.pts, r, f.face ?? 26, { top: floorTop, faceCol: def.base === 'lava' ? '#4e3a40' : '#2c2028', rim: def.base === 'lava' ? 'rgba(255,236,190,.55)' : rgba(pal.lava.glow, 0.5) });
      white(() => { strokePoly(m, smooth(f.pts, 8, true), true); m.fill(); });
    }
  }
  for (const p of def.plateaus ?? []) {
    const face = p.face ?? 34, poly = smooth(p.pts, 8, true);
    paintFloorShape(c, p.pts, r, face, { top: mix(pal.ground[1], pal.ground[0], 0.35), faceCol: pal.cliff[1], rim: rgba(lighten(pal.cliff[0], 0.5), 0.6) });
    // solid face band, walkable top, solid lip; paths drawn later carve ramps through all of it
    black(() => { m.save(); m.translate(0, face); strokePoly(m, poly, true); m.fill(); m.lineWidth = 30; m.stroke(); m.restore(); });
    white(() => { strokePoly(m, poly, true); m.fill(); });
    black(() => { strokePoly(m, poly, true); m.lineWidth = 44; m.stroke(); });
  }
  // flat detail scattered on open ground (painted under paths and liquids)
  if (def.mode === 'open') {
    for (let i = 0; i < (w * h) / 26000; i++) {
      const x = 120 + r() * (w - 240), y = 120 + r() * (h - 240), k = r(), cols = ['#ff7aa8', '#ffd24a', '#fff2d8', '#c78bff', '#ff9a4a'];
      c.fillStyle = 'rgba(40,24,30,.2)'; c.beginPath(); c.ellipse(x + 2, y + 3, 5, 2.4, 0, 0, TAU); c.fill();
      if (k < 0.55) { for (let a = 0; a < 5; a++) { c.fillStyle = cols[(i + a) % cols.length]; c.beginPath(); c.arc(x + Math.cos(a * 1.26) * 4, y + Math.sin(a * 1.26) * 4 - 2, 2.8, 0, TAU); c.fill(); } c.fillStyle = '#ffe07a'; c.beginPath(); c.arc(x, y - 2, 2.2, 0, TAU); c.fill(); }
      else { c.fillStyle = '#a79a8e'; c.strokeStyle = '#4a3a3a'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, 6 + r() * 4, 3.6 + r() * 2, r(), 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - 2, y - 1.4, 2.4, 1.2, 0, 0, TAU); c.fill(); }
    }
  }

  // ---- plazas & paths (carve walkable so paths can ramp up cliffs)
  for (const pz of def.plazas ?? []) {
    c.save(); c.fillStyle = 'rgba(40,24,30,.28)'; c.beginPath(); c.ellipse(pz.x + 4, pz.y + 8, pz.rx + 14, pz.ry + 14, 0, 0, TAU); c.fill();
    c.fillStyle = pal.path[2]; c.beginPath(); c.ellipse(pz.x, pz.y, pz.rx + 10, pz.ry + 10, 0, 0, TAU); c.fill();
    c.fillStyle = pal.path[1]; c.beginPath(); c.ellipse(pz.x, pz.y, pz.rx + 4, pz.ry + 4, 0, 0, TAU); c.fill();
    c.fillStyle = pal.path[0]; c.beginPath(); c.ellipse(pz.x, pz.y, pz.rx, pz.ry, 0, 0, TAU); c.fill();
    // cobbles
    for (let i = 0; i < (pz.rx * pz.ry) / 330; i++) { const a = r() * TAU, d = Math.sqrt(r()); const x = pz.x + Math.cos(a) * pz.rx * 0.96 * d, y = pz.y + Math.sin(a) * pz.ry * 0.96 * d; c.fillStyle = r() < 0.5 ? rgba(lighten(pal.path[0], 0.35), 0.55) : rgba(pal.path[2], 0.4); c.strokeStyle = rgba(pal.path[2], 0.5); c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 8 + r() * 5, 5 + r() * 3, 0, 0, TAU); c.fill(); c.stroke(); }
    c.strokeStyle = rgba(lighten(pal.path[1], 0.2), 0.7); c.lineWidth = 3; c.beginPath(); c.ellipse(pz.x, pz.y, pz.rx - 14, pz.ry - 14, 0, 0, TAU); c.stroke();
    c.restore();
    if (def.mode === 'open') white(() => { m.beginPath(); m.ellipse(pz.x, pz.y, pz.rx, pz.ry, 0, 0, TAU); m.fill(); });
  }
  const paths = def.paths.map((p) => ({ ...p, pts: sm(p.pts) }));
  for (const p of def.paths) {
    paintPath(c, def, p, r, def.mode === 'carve');
    white(() => { m.lineWidth = p.width; m.lineCap = 'round'; m.lineJoin = 'round'; strokePoly(m, sm(p.pts)); m.stroke(); });
  }

  // ---- liquids: glow first, bodies after
  for (const L of def.liquids) paintLiquid(c, def, L, true);
  for (const L of def.liquids) paintLiquid(c, def, L, false);
  for (const L of def.liquids) black(() => { m.lineCap = 'round'; m.lineJoin = 'round'; if (L.closed) { strokePoly(m, smooth(L.pts, 8, true), true); m.fill(); m.lineWidth = 16; m.stroke(); } else { m.lineWidth = (L.width ?? 80) + 14; strokePoly(m, sm(L.pts)); m.stroke(); } });

  // ---- fords & stepping stones (shallow, slow)
  for (const f of def.fords) {
    const pts = sm(f.pts);
    c.save(); strokePoly(c, pts); c.strokeStyle = rgba(lighten(pal.water.mid, 0.25), 0.9); c.lineWidth = f.width + 10; c.stroke(); strokePoly(c, pts); c.strokeStyle = rgba(pal.water.glow, 0.7); c.lineWidth = f.width; c.stroke(); c.restore();
    let acc = 0; for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc < 44) continue; acc = 0; const [x, y] = pts[i], off = (r() - 0.5) * 16; c.fillStyle = 'rgba(30,20,40,.25)'; c.beginPath(); c.ellipse(x + 3, y + off + 6, 24, 15, 0, 0, TAU); c.fill(); c.fillStyle = '#a8978a'; c.strokeStyle = '#4a3a3a'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(x, y + off, 24, 15, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,248,230,.4)'; c.beginPath(); c.ellipse(x - 7, y + off - 4, 9, 4, -0.2, 0, TAU); c.fill(); }
    white(() => { m.lineWidth = f.width; m.lineCap = 'round'; m.lineJoin = 'round'; strokePoly(m, pts); m.stroke(); });
    sl.strokeStyle = '#fff'; sl.lineWidth = f.width; sl.lineCap = 'round'; sl.lineJoin = 'round'; strokePoly(sl, pts); sl.stroke();
  }

  // ---- bridges
  for (const b of def.bridges) { paintBridge(c, b); const [ax, ay] = b.a, [bx, by] = b.b, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax); white(() => { m.save(); m.translate((ax + bx) / 2, (ay + by) / 2); m.rotate(ang); m.fillRect(-len / 2 - 30, -b.width / 2 + 4, len + 60, b.width - 8); m.restore(); }); }


  // ---- gateway art painted into the ground (caves, portals, doorways)
  for (const g of def.gates) {
    const [gx, gy, gw_, gh_] = g.rect, cx = gx + gw_ / 2, cy = gy + gh_ / 2;
    if (g.style === 'cave') {
      c.save(); c.fillStyle = 'rgba(8,4,10,.92)'; c.beginPath(); c.ellipse(cx, cy + 10, gw_ / 2 + 30, gh_ / 2 + 24, 0, 0, TAU); c.fill(); c.lineWidth = 8; c.strokeStyle = '#5a4650'; c.stroke();
      c.strokeStyle = rgba(pal.lava.glow, 0.4); c.lineWidth = 3; c.stroke(); c.restore();
    } else if (g.style === 'portal' || g.style === 'door') {
      c.save(); c.shadowColor = '#ffe9a0'; c.shadowBlur = 40; const gr = c.createRadialGradient(cx, cy, 6, cx, cy, gw_ * 0.62); gr.addColorStop(0, '#fffbe6'); gr.addColorStop(0.55, '#ffd46a'); gr.addColorStop(1, '#ff8a2a');
      c.fillStyle = gr; c.beginPath(); c.ellipse(cx, cy + 6, gw_ * 0.5, gh_ * 0.56, 0, 0, TAU); c.fill(); c.lineWidth = 9; c.strokeStyle = '#8a5a40'; c.stroke(); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(cx, cy + 6, gw_ * (0.18 + k * 0.1), gh_ * (0.2 + k * 0.1), k, 0, TAU * 0.7); c.stroke(); }
    }
  }

  // ---- encounter ground
  const zonePolys = def.zones.map((z) => smooth(z.poly, 8, true));
  def.zones.forEach((z, zi) => {
    const poly = zonePolys[zi], col = z.ground === 'moss' ? pal.moss[0] : mix(pal.ashTuft[0], pal.ground[2], 0.5);
    c.save(); c.shadowColor = rgba(col, 0.95); c.shadowBlur = 36; c.shadowOffsetX = 20000; c.fillStyle = col;
    c.translate(-20000, 0); strokePoly(c, poly, true); c.globalAlpha = 0.5; c.fill(); c.fill(); c.restore();
    c.save(); c.globalAlpha = z.ground === 'moss' ? 0.5 : 0.38; strokePoly(c, poly, true); c.fillStyle = col; c.fill(); c.restore();
    if (z.rare) { c.save(); c.globalCompositeOperation = 'lighter'; const [cx, cy] = z.poly.reduce((a, p) => [a[0] + p[0] / z.poly.length, a[1] + p[1] / z.poly.length], [0, 0]); const g = c.createRadialGradient(cx, cy, 0, cx, cy, 90); g.addColorStop(0, 'rgba(255,230,150,.6)'); g.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 90, 0, TAU); c.fill(); c.restore(); }
  });

  // ---- lights baked into the ground, then edge foliage wash
  c.save(); c.globalCompositeOperation = 'soft-light';
  for (const l of def.lights) { const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, rgba(l.c, 0.85)); g.addColorStop(1, rgba(l.c, 0)); c.fillStyle = g; c.beginPath(); c.arc(l.x, l.y, l.r, 0, TAU); c.fill(); }
  c.restore();
  if (def.mode === 'open') {
    const edge = pal.vignette, e = 170;
    for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, 0, e, 0, 0, w, e], [0, h, 0, h - e, 0, h - e, w, e], [0, 0, e, 0, 0, 0, e, h], [w, 0, w - e, 0, w - e, 0, e, h]] as number[][]) {
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(edge, 0.85)); g.addColorStop(1, rgba(edge, 0)); c.fillStyle = g; c.fillRect(rx, ry, rw, rh);
    }
  } else { const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba(pal.vignette, 0.65)); c.fillStyle = g; c.fillRect(0, 0, w, h); }

  // ---- props (authored + gates + border) -> sprites and collision
  const all: PropDef[] = [...def.props, ...gateProps(def), ...borderProps(def)];
  const placed: PlacedProp[] = [];
  for (const d of all) {
    const sp = propSprite(d), spec = propSpec(d.kind); if (!sp || !spec) continue;
    placed.push({ def: d, sp, overhead: !!spec.overhead, canopy: !!spec.canopy, fx: spec.fx, fade: 1 });
  }
  placed.sort((a, b) => a.def.y - b.def.y);

  // ---- finish the collision mask
  if (def.mode === 'open') {
    // soft border: solid outside MARGIN
    black(() => { m.fillRect(0, 0, w, MARGIN); m.fillRect(0, h - MARGIN, w, MARGIN); m.fillRect(0, 0, MARGIN, h); m.fillRect(w - MARGIN, 0, MARGIN, h); });
  }
  for (const g of def.gates) white(() => { m.fillRect(g.rect[0], g.rect[1], g.rect[2], g.rect[3]); });
  for (const d of placed) for (const f of footprints(d.def) as any[]) black(() => { m.beginPath(); if (f.t === 'e') m.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, TAU); else m.rect(f.x - f.hw, f.y - f.hh, f.hw * 2, f.hh * 2); m.fill(); });
  for (const b of def.blockers ?? []) black(() => { m.beginPath(); m.ellipse(b.x, b.y, b.rx, b.ry, 0, 0, TAU); m.fill(); });
  // interactables that stand in the world are solid too
  for (const it of def.interactables) if (it.kind === 'npc' || it.kind === 'chest' || it.kind === 'shop' || it.kind === 'stone' || it.kind === 'sign') {
    const rad = it.kind === 'shop' ? 0 : it.kind === 'npc' ? 14 : it.kind === 'chest' ? 22 : it.kind === 'stone' ? 26 : 7;
    if (rad) black(() => { m.beginPath(); m.ellipse(it.x, it.y, rad, rad * 0.55, 0, 0, TAU); m.fill(); });
  }

  const md = m.getImageData(0, 0, gw, gh).data, sd = sl.getImageData(0, 0, gw, gh).data, blocked = new Uint8Array(gw * gh), slow = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) { blocked[i] = md[i * 4] < 128 ? 1 : 0; slow[i] = sd[i * 4] > 128 ? 1 : 0; }
  const field = new Field(w, h, blocked, slow);

  // ---- encounter tufts
  const tufts: Tuft[] = [], tr = rng(`tufts:${def.id}`);
  def.zones.forEach((z: ZoneDef, zi) => {
    const poly = zonePolys[zi], bb = poly.reduce((b, p) => ({ x0: Math.min(b.x0, p[0]), y0: Math.min(b.y0, p[1]), x1: Math.max(b.x1, p[0]), y1: Math.max(b.y1, p[1]) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
    const n = ((bb.x1 - bb.x0) * (bb.y1 - bb.y0) * (z.density ?? 1)) / 700;
    for (let i = 0; i < n; i++) { const x = bb.x0 + tr() * (bb.x1 - bb.x0), y = bb.y0 + tr() * (bb.y1 - bb.y0); if (pointInPoly(x, y, poly) && !field.isBlocked(x, y)) tufts.push({ x, y, k: Math.floor(tr() * 3), ph: tr() * TAU, zone: zi }); }
  });
  tufts.sort((a, b) => a.y - b.y);

  // ---- liquid sparkles
  const sparkles: Sparkle[] = [], sr = rng(`spark:${def.id}`);
  for (const L of def.liquids) {
    const pts = L.closed ? smooth(L.pts, 8, true) : sm(L.pts);
    if (L.closed) { const bb = pts.reduce((b, p) => ({ x0: Math.min(b.x0, p[0]), y0: Math.min(b.y0, p[1]), x1: Math.max(b.x1, p[0]), y1: Math.max(b.y1, p[1]) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }); for (let i = 0; i < (bb.x1 - bb.x0) * (bb.y1 - bb.y0) / 6000; i++) { const x = bb.x0 + sr() * (bb.x1 - bb.x0), y = bb.y0 + sr() * (bb.y1 - bb.y0); if (pointInPoly(x, y, pts)) sparkles.push({ x, y, ph: sr() * TAU, kind: L.kind, r: 3 + sr() * 4 }); } }
    else for (let i = 0; i < pts.length; i += 2) { const [x, y] = pts[i]; if (sr() < 0.5) sparkles.push({ x: x + (sr() - 0.5) * (L.width ?? 80) * 0.7, y: y + (sr() - 0.5) * (L.width ?? 80) * 0.7, ph: sr() * TAU, kind: L.kind, r: 3 + sr() * 4 }); }
  }

  // ---- mini-map (0.22 scale)
  const ms = 0.22, mini = canvas(Math.ceil(w * ms), Math.ceil(h * ms)), mc = mini.getContext('2d')!;
  mc.scale(ms, ms); mc.drawImage(bg, 0, 0);
  // flatten detail: tint zones lighter, paths stand out
  for (const poly of zonePolys) { strokePoly(mc, poly, true); mc.fillStyle = 'rgba(255,255,255,.32)'; mc.fill(); }
  mc.lineCap = 'round'; for (const p of paths) { strokePoly(mc, p.pts); mc.strokeStyle = 'rgba(255,236,190,.55)'; mc.lineWidth = Math.max(40, p.width * 0.7); mc.stroke(); }
  for (const g of def.gates) { const [x, y, gw_, gh_] = g.rect; mc.fillStyle = '#ffd24a'; mc.strokeStyle = '#6a3f10'; mc.lineWidth = 10; mc.beginPath(); mc.arc(x + gw_ / 2, y + gh_ / 2, 54, 0, TAU); mc.fill(); mc.stroke(); }

  return { def, bg, field, props: placed, tufts, tuftSprites: tuftSprites(def), sparkles, zonePolys, mini, miniScale: ms, pathsSmooth: paths };
}
