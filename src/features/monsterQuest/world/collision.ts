/**
 * Collision as a signed-distance-style field. The painter rasterises "blocked" and "slow" masks at 1/4 scale;
 * we turn the blocked mask into an exact Euclidean distance transform. The player is a circle that is pushed
 * out along the field's gradient, which gives smooth sliding along walls and rounded corners (no snagging).
 */
import type { Pt } from './util';

export const CELL = 4;
const INF = 1e12;

/** Felzenszwalb & Huttenlocher exact squared EDT, in place over a w*h grid (source cells = 0). */
function edt(f: Float64Array, w: number, h: number) {
  const n = Math.max(w, h), v = new Int32Array(n), z = new Float64Array(n + 1), d = new Float64Array(n);
  const pass = (len: number, get: (i: number) => number, set: (i: number, val: number) => void) => {
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < len; q++) {
      const fq = get(q) + q * q;
      let s = (fq - (get(v[k]) + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = (fq - (get(v[k]) + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + get(p); }
    for (let q = 0; q < len; q++) set(q, d[q]);
  };
  for (let x = 0; x < w; x++) pass(h, (i) => f[i * w + x], (i, val) => { f[i * w + x] = val; });
  for (let y = 0; y < h; y++) pass(w, (i) => f[y * w + i], (i, val) => { f[y * w + i] = val; });
}

export class Field {
  readonly gw: number; readonly gh: number;
  readonly dist: Float32Array;
  readonly w: number; readonly h: number; readonly blocked: Uint8Array; readonly slow: Uint8Array;
  constructor(w: number, h: number, blocked: Uint8Array, slow: Uint8Array) {
    this.w = w; this.h = h; this.blocked = blocked; this.slow = slow;
    this.gw = Math.ceil(w / CELL); this.gh = Math.ceil(h / CELL);
    const f = new Float64Array(this.gw * this.gh);
    for (let i = 0; i < f.length; i++) f[i] = blocked[i] ? 0 : INF;
    edt(f, this.gw, this.gh);
    this.dist = new Float32Array(f.length);
    for (let i = 0; i < f.length; i++) this.dist[i] = blocked[i] ? 0 : Math.max(0, Math.sqrt(f[i]) * CELL - CELL / 2);
  }
  /** Bilinear distance to the nearest solid, in world px. Outside the map counts as solid. */
  sdf(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    const gx = x / CELL - 0.5, gy = y / CELL - 0.5;
    const x0 = Math.max(0, Math.min(this.gw - 1, Math.floor(gx))), y0 = Math.max(0, Math.min(this.gh - 1, Math.floor(gy)));
    const x1 = Math.min(this.gw - 1, x0 + 1), y1 = Math.min(this.gh - 1, y0 + 1);
    const tx = Math.max(0, Math.min(1, gx - x0)), ty = Math.max(0, Math.min(1, gy - y0)), g = this.dist, W = this.gw;
    return (g[y0 * W + x0] * (1 - tx) + g[y0 * W + x1] * tx) * (1 - ty) + (g[y1 * W + x0] * (1 - tx) + g[y1 * W + x1] * tx) * ty;
  }
  isBlocked(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    return this.blocked[Math.floor(y / CELL) * this.gw + Math.floor(x / CELL)] === 1;
  }
  isSlow(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.slow[Math.floor(y / CELL) * this.gw + Math.floor(x / CELL)] === 1;
  }
  grad(x: number, y: number): Pt {
    const e = CELL; const gx = this.sdf(x + e, y) - this.sdf(x - e, y), gy = this.sdf(x, y + e) - this.sdf(x, y - e);
    const l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l];
  }
  /** Push a circle of radius r out of solids. Returns the corrected position. */
  resolve(x: number, y: number, r: number): Pt {
    for (let i = 0; i < 5; i++) {
      const d = this.sdf(x, y);
      if (d >= r - 0.05) break;
      const [gx, gy] = this.grad(x, y);
      const push = Math.min(r - d, 6);
      x += gx * push; y += gy * push;
    }
    return [x, y];
  }
  /** Nearest open spot (clearance >= r) to a point, searching outwards. */
  nearestFree(x: number, y: number, r: number, maxR = 160): Pt | null {
    if (this.sdf(x, y) >= r) return [x, y];
    for (let rad = 8; rad <= maxR; rad += 8) for (let a = 0; a < 24; a++) {
      const px = x + Math.cos((a / 24) * 6.2832) * rad, py = y + Math.sin((a / 24) * 6.2832) * rad;
      if (this.sdf(px, py) >= r) return [px, py];
    }
    return null;
  }
  /** Clear line of sight for a circle of radius r between two points. */
  clear(a: Pt, b: Pt, r: number): boolean {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 8);
    for (let i = 0; i <= n; i++) { const t = i / n; if (this.sdf(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t) < r) return false; }
    return true;
  }
  /** Flood fill over open space for a circle of radius r. Used by the build-time reachability checks and tap-to-walk. */
  reachable(from: Pt, r: number, step = 16): { has: (x: number, y: number) => boolean; count: number } {
    const gw = Math.ceil(this.w / step), gh = Math.ceil(this.h / step), seen = new Uint8Array(gw * gh);
    const ok = (cx: number, cy: number) => cx >= 0 && cy >= 0 && cx < gw && cy < gh && this.sdf(cx * step + step / 2, cy * step + step / 2) >= r;
    const sx = Math.floor(from[0] / step), sy = Math.floor(from[1] / step), q: number[] = [];
    let count = 0;
    if (ok(sx, sy)) { seen[sy * gw + sx] = 1; q.push(sy * gw + sx); }
    for (let h = 0; h < q.length; h++) {
      const cx = q[h] % gw, cy = (q[h] / gw) | 0; count++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (ok(nx, ny) && !seen[ny * gw + nx]) { seen[ny * gw + nx] = 1; q.push(ny * gw + nx); }
      }
    }
    return { has: (x, y) => { const cx = Math.floor(x / step), cy = Math.floor(y / step); return cx >= 0 && cy >= 0 && cx < gw && cy < gh && seen[cy * gw + cx] === 1; }, count };
  }

  /** A* for tap-to-walk. Returns waypoints (world px) or null. */
  findPath(from: Pt, to: Pt, r: number): Pt[] | null {
    const S = 20, gw = Math.ceil(this.w / S), gh = Math.ceil(this.h / S), plan = r + 4;
    const cx = (g: number) => (g % gw) * S + S / 2, cy = (g: number) => Math.floor(g / gw) * S + S / 2;
    const free = (g: number) => this.sdf(cx(g), cy(g)) >= plan || (Math.hypot(cx(g) - from[0], cy(g) - from[1]) < 40 && this.sdf(cx(g), cy(g)) >= r - 2);
    const gOf = (p: Pt) => Math.max(0, Math.min(gh - 1, Math.floor(p[1] / S))) * gw + Math.max(0, Math.min(gw - 1, Math.floor(p[0] / S)));
    const goalPt = this.nearestFree(to[0], to[1], plan, 120); if (!goalPt) return null;
    const start = gOf(from), goal = gOf(goalPt);
    const gS = new Float32Array(gw * gh).fill(Infinity), prev = new Int32Array(gw * gh).fill(-1), closed = new Uint8Array(gw * gh);
    const heap: [number, number][] = [];
    const push = (g: number, f: number) => { heap.push([f, g]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, rr = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top[1]; };
    const hx = (g: number) => Math.hypot(cx(g) - cx(goal), cy(g) - cy(goal));
    gS[start] = 0; push(start, hx(start));
    let bestNode = start, bestH = hx(start);
    while (heap.length) {
      const g = pop(); if (closed[g]) continue; closed[g] = 1; if (hx(g) < bestH) { bestH = hx(g); bestNode = g; } if (g === goal) break;
      const gx = g % gw, gy = (g / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = gx + dx, ny = gy + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const n = ny * gw + nx; if (closed[n] || !free(n)) continue;
        if (dx && dy && (!free(gy * gw + nx) || !free(ny * gw + gx))) continue;
        const cost = gS[g] + (dx && dy ? 1.414 : 1) * S * (this.isSlow(cx(n), cy(n)) ? 1.6 : 1);
        if (cost < gS[n]) { gS[n] = cost; prev[n] = g; push(n, cost + hx(n)); }
      }
    }
    // unreachable goal (tiny pocket, island): walk to the closest reachable point instead
    const end = closed[goal] ? goal : bestNode;
    if (end === start) return null;
    const pts: Pt[] = [];
    for (let g = end; g !== start && g !== -1; g = prev[g]) pts.push([cx(g), cy(g)]);
    pts.reverse(); if (end === goal) pts.push(goalPt);
    // string-pull: drop waypoints that have a clear line from the previous kept one
    const out: Pt[] = []; let anchor: Pt = from, i = 0;
    while (i < pts.length) {
      let j = i; while (j + 1 < pts.length && this.clear(anchor, pts[j + 1], r + 1)) j++;
      out.push(pts[j]); anchor = pts[j]; i = j + 1;
    }
    return out;
  }
}
