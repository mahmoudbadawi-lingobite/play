/** Small shared helpers for the painted world: seeded random, colour maths, smooth curves. */
export type Pt = [number, number];

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed: number | string): () => number {
  let a = (typeof seed === 'string' ? hashStr(seed) : seed) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- colour
export function hex2rgb(h: string): [number, number, number] {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
const clamp8 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export function rgb2hex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clamp8(v).toString(16).padStart(2, '0')).join('');
}
export function mix(a: string, b: string, t: number): string {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
/** Lighten towards a warm white. */
export const lighten = (c: string, t: number) => mix(c, '#fff6dc', t);
/** Darken towards a cool, slightly blue-green shadow (storybook shading). */
export const darken = (c: string, t: number) => mix(c, '#1d2a3a', t);
export const rgba = (c: string, a: number) => { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; };
/** Thin outline colour: a darker, richer version of the fill (never black). */
export const outline = (c: string) => mix(darken(c, 0.5), '#2a1424', 0.25);

// ---- geometry
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Catmull-Rom spline through points, returned as a dense polyline. */
export function smooth(pts: Pt[], steps = 10, closed = false): Pt[] {
  if (pts.length < 3) return pts.slice();
  const n = pts.length, out: Pt[] = [];
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

/** A rounded blob outline (closed smooth polygon) from an ellipse with seeded wobble. */
export function blobPoly(cx: number, cy: number, rx: number, ry: number, seed: string, wobble = 0.12, n = 14): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 2 * wobble;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts, 6, true);
}

export function pointInPoly(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---- value noise (coarse, smooth) used to give the ground a painted, blotchy tone
export function makeNoise(seed: string) {
  const r = rng(seed), G = 64, lat = new Float32Array(G * G);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const s = (t: number) => t * t * (3 - 2 * t);
  const at = (x: number, y: number) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), tx = s(x - x0), ty = s(y - y0);
    const g = (ix: number, iy: number) => lat[((iy % G) + G) % G * G + ((ix % G) + G) % G];
    return (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
  };
  return (x: number, y: number) => at(x, y) * 0.55 + at(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + at(x * 4.3 + 1, y * 4.3 + 9) * 0.15;
}
