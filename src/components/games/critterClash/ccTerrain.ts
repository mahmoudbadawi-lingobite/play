import type { ImageStore } from './ccAssets';

/**
 * Destructible meadow terrain.
 *
 * The ground is a bitmask. It is filled with a tiled rock texture and its edges are dressed with three strips
 * (grass cap, rock underside, rock side) that are bent along the true outline, so cliffs, floating islands and
 * freshly blown craters all look finished. Ported from the Python prototype in the handoff package.
 * Strip textures are laid out by world position (x for cap/underside, y for the side strip), so redrawing a small
 * area after an explosion lines up with what is already there.
 */

export const MAP_W = 4400;
export const MAP_H = 1000;
const STRIP_SCALE = 0.34;
const REACH = 150; // how far a strip can reach from the outline, in px

// ---------------------------------------------------------------- blur helpers
function boxBlur(src: Float32Array, w: number, h: number, r: number, horizontal: boolean): Float32Array {
  const out = new Float32Array(src.length);
  const n = 2 * r + 1;
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = src[row] * (r + 1);
      for (let i = 1; i <= r; i++) sum += src[row + Math.min(i, w - 1)];
      for (let x = 0; x < w; x++) {
        out[row + x] = sum / n;
        sum += src[row + Math.min(x + r + 1, w - 1)] - src[row + Math.max(x - r, 0)];
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      let sum = src[x] * (r + 1);
      for (let i = 1; i <= r; i++) sum += src[Math.min(i, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / n;
        sum += src[Math.min(y + r + 1, h - 1) * w + x] - src[Math.max(y - r, 0) * w + x];
      }
    }
  }
  return out;
}
/** Three box passes approximate a gaussian. */
function blur3(src: Float32Array, w: number, h: number, r: number): Float32Array {
  let a = src;
  for (let i = 0; i < 3; i++) a = boxBlur(boxBlur(a, w, h, r, true), w, h, r, false);
  return a;
}

// ---------------------------------------------------------------- map shapes
function buildRawMask(): Float32Array {
  const raw = new Float32Array(MAP_W * MAP_H);
  const cliff = (x0: number, x1: number, top: (x: number) => number) => {
    for (let x = x0; x < x1; x++) for (let y = Math.floor(top(x)); y < MAP_H; y++) raw[y * MAP_W + x] = 1;
  };
  const island = (cx: number, hw: number, top: number, thick: number) => {
    for (let x = Math.floor(cx - hw); x < Math.floor(cx + hw); x++) {
      const u = Math.abs((x - cx) / hw);
      const t = top + 14 * u ** 6;
      const b = top + thick * (1 - u ** 1.7) + 6;
      for (let y = Math.floor(t); y < Math.floor(b); y++) if (x >= 0 && x < MAP_W) raw[y * MAP_W + x] = 1;
    }
  };
  cliff(0, 830, (x) => 540 + 14 * Math.sin(x / 110));
  island(1010, 170, 420, 125);
  island(1380, 140, 610, 95);
  cliff(1560, 2530, (x) => 700 + 12 * Math.sin(x / 130));
  island(2740, 190, 350, 135);
  island(3100, 115, 390, 95);
  cliff(3330, MAP_W, (x) => 640 + 12 * Math.sin(x / 100));
  return raw;
}

// ---------------------------------------------------------------- strips
interface Strip { data: Uint8ClampedArray; hv: number; wt: number; v0: number }

function scaledData(im: HTMLImageElement, k: number): { data: Uint8ClampedArray; w: number; h: number } {
  const w = Math.max(1, Math.round(im.width * k));
  const h = Math.max(1, Math.round(im.height * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(im, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, w, h };
}
const smooth01 = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

function makeStrips(imgs: ImageStore): { cap: Strip; under: Strip; side: Strip } {
  // cap: rows are v (outer edge at the top), columns are u
  const c = scaledData(imgs.get('world/cap_grass_vines.webp')!, STRIP_SCALE);
  const cap: Strip = { data: c.data, hv: c.h, wt: c.w, v0: Math.floor(c.h * 0.3) };

  // underside: fade the flat edge (first 34 rows), then flip so that edge becomes the inner side
  const u = scaledData(imgs.get('world/cap_underside_rock.webp')!, STRIP_SCALE);
  for (let y = 0; y < Math.min(34, u.h); y++) {
    const f = smooth01(y / 34);
    for (let x = 0; x < u.w; x++) u.data[(y * u.w + x) * 4 + 3] *= f;
  }
  const ud = new Uint8ClampedArray(u.data.length);
  for (let v = 0; v < u.h; v++) ud.set(u.data.subarray((u.h - 1 - v) * u.w * 4, (u.h - v) * u.w * 4), v * u.w * 4);
  const under: Strip = { data: ud, hv: u.h, wt: u.w, v0: u.h - 1 - 30 };

  // side: fade the flat inner edge (last 60 columns), then transpose so v = columns (outer bumpy edge first), u = rows
  const s = scaledData(imgs.get('world/edge_side_rock.webp')!, STRIP_SCALE);
  for (let x = 0; x < s.w; x++) {
    const k = s.w - 1 - x;
    const f = k >= 60 ? 1 : smooth01(k / 60);
    for (let y = 0; y < s.h; y++) s.data[(y * s.w + x) * 4 + 3] *= f;
  }
  const sd = new Uint8ClampedArray(s.data.length);
  const firsts: number[] = [];
  for (let y = 0; y < s.h; y++) {
    let first = -1;
    for (let x = 0; x < s.w; x++) {
      const si = (y * s.w + x) * 4;
      const di = (x * s.h + y) * 4;
      sd[di] = s.data[si]; sd[di + 1] = s.data[si + 1]; sd[di + 2] = s.data[si + 2]; sd[di + 3] = s.data[si + 3];
      if (first < 0 && s.data[si + 3] > 20) first = x;
    }
    if (first >= 0) firsts.push(first);
  }
  firsts.sort((a, b) => a - b);
  const side: Strip = { data: sd, hv: s.w, wt: s.h, v0: firsts[Math.floor(firsts.length / 2)] ?? 0 };
  return { cap, under, side };
}

/** The hills run off the bottom of the map. Cut them with a rounded, rough underside so they end like real rocks (the underside strip is drawn along it). */
function roughenBottoms(mask: Uint8Array) {
  const last = (MAP_H - 1) * MAP_W; const R = 170;
  let x = 0;
  while (x < MAP_W) {
    if (!mask[last + x]) { x++; continue; }
    let b = x; while (b + 1 < MAP_W && mask[last + b + 1]) b++;
    const a = x; const ph = a * 0.37;
    for (let c = a; c <= b; c++) {
      const dl = a > 0 ? c - a : 1e9; const dr = b < MAP_W - 1 ? b - c : 1e9; const d = Math.min(dl, dr);
      const drop = d >= R ? 0 : R - Math.sqrt(Math.max(0, R * R - (R - d) * (R - d))); // circular corner
      const rough = Math.sin(c * 0.031 + ph) * 0.55 + Math.sin(c * 0.083 + ph * 1.7) * 0.3 + Math.sin(c * 0.21 + ph * 0.6) * 0.15;
      const B = Math.round(MAP_H - 105 - drop * 0.9 + rough * 24);
      for (let y = Math.max(0, B); y < MAP_H; y++) mask[y * MAP_W + c] = 0;
    }
    x = b + 1;
  }
}

// ---------------------------------------------------------------- contours (marching squares)
interface Samples { n: number; x: Float32Array; y: Float32Array; nx: Float32Array; ny: Float32Array; wc: Float32Array; wu: Float32Array; ws: Float32Array }

interface Loop { pts: number[]; open: boolean }
function traceContours(mask: Uint8Array): Loop[] {
  // padded copy: left, right and bottom edges repeat the border (so no strips are drawn on screen borders), top row is empty
  const PW = MAP_W + 2;
  const PH = MAP_H + 2;
  const pad = new Uint8Array(PW * PH);
  for (let y = 0; y < MAP_H; y++) {
    const row = (y + 1) * PW;
    pad.set(mask.subarray(y * MAP_W, (y + 1) * MAP_W), row + 1);
    pad[row] = mask[y * MAP_W];
    pad[row + PW - 1] = mask[y * MAP_W + MAP_W - 1];
  }
  pad.set(pad.subarray(MAP_H * PW, (MAP_H + 1) * PW), (MAP_H + 1) * PW);
  const SEG: number[][] = [[], [3, 2], [2, 1], [3, 1], [0, 1], [0, 3, 2, 1], [0, 2], [0, 3], [0, 3], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];
  const KEYW = 2 * PW + 4;
  const nodeKey = (e: number, x: number, y: number) =>
    e === 0 ? (2 * y) * KEYW + 2 * x + 1 : e === 1 ? (2 * y + 1) * KEYW + 2 * x + 2 : e === 2 ? (2 * y + 2) * KEYW + 2 * x + 1 : (2 * y + 1) * KEYW + 2 * x;
  const links = new Map<number, number[]>();
  const add = (a: number, b: number) => {
    const la = links.get(a); if (la) la.push(b); else links.set(a, [b]);
    const lb = links.get(b); if (lb) lb.push(a); else links.set(b, [a]);
  };
  for (let y = 0; y < PH - 1; y++) {
    const r0 = y * PW; const r1 = r0 + PW;
    for (let x = 0; x < PW - 1; x++) {
      const idx = (pad[r0 + x] << 3) | (pad[r0 + x + 1] << 2) | (pad[r1 + x + 1] << 1) | pad[r1 + x];
      if (idx === 0 || idx === 15) continue;
      const s = SEG[idx];
      for (let i = 0; i < s.length; i += 2) add(nodeKey(s[i], x, y), nodeKey(s[i + 1], x, y));
    }
  }
  const seen = new Set<number>();
  const loops: { keys: number[]; open: boolean }[] = [];
  // open chains (they run into the map border) must be walked from one end, so start at the end points first
  const starts = [...links.keys()].sort((a, b) => (links.get(a)!.length === 1 ? 0 : 1) - (links.get(b)!.length === 1 ? 0 : 1));
  for (const start of starts) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    const open = links.get(start)!.length === 1;
    let prev = -1; let cur = start;
    for (let guard = 0; guard < 400000; guard++) {
      seen.add(cur); loop.push(cur);
      const nb = links.get(cur)!;
      const next = nb[0] !== prev ? nb[0] : nb[1];
      if (next === undefined) break;
      prev = cur; cur = next;
      if (cur === start || seen.has(cur)) break;
    }
    if (loop.length >= 150) loops.push({ keys: loop, open });
  }
  // key -> world coordinates (padded grid is offset by 1, node coordinates are doubled)
  return loops.map(({ keys, open }) => {
    const out: number[] = [];
    for (const k of keys) { const gy = Math.floor(k / KEYW); const gx = k - gy * KEYW; out.push(gx / 2 - 1, gy / 2 - 1); }
    return { pts: out, open };
  });
}

function gauss1d(vals: number[], sigma: number, open: boolean): number[] {
  const n = vals.length / 2;
  const R = Math.ceil(sigma * 3);
  const ker: number[] = []; let ks = 0;
  for (let i = -R; i <= R; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); ker.push(v); ks += v; }
  const out = new Array<number>(vals.length);
  for (let i = 0; i < n; i++) {
    let sx = 0; let sy = 0;
    for (let k = -R; k <= R; k++) { const j = open ? Math.min(n - 1, Math.max(0, i + k)) : (((i + k) % n) + n) % n; const w = ker[k + R]; sx += vals[2 * j] * w; sy += vals[2 * j + 1] * w; }
    out[2 * i] = sx / ks; out[2 * i + 1] = sy / ks;
  }
  return out;
}

function buildSamples(mask: Uint8Array): Samples {
  const loops = traceContours(mask);
  const xs: number[] = []; const ys: number[] = []; const nxs: number[] = []; const nys: number[] = [];
  const wcs: number[] = []; const wus: number[] = []; const wss: number[] = [];
  const solid = (x: number, y: number) => {
    const xi = Math.min(MAP_W - 1, Math.max(0, Math.round(x))); const yi = Math.round(y);
    return yi < 0 ? false : mask[Math.min(MAP_H - 1, yi) * MAP_W + xi] === 1;
  };
  for (const { pts: raw, open } of loops) {
    const pts = gauss1d(raw, 5, open);
    const n = pts.length / 2;
    // arclength resample every 0.5 px
    const cum = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) { const j = open ? Math.min(i + 1, n - 1) : (i + 1) % n; cum[i + 1] = cum[i] + Math.hypot(pts[2 * j] - pts[2 * i], pts[2 * j + 1] - pts[2 * i + 1]); }
    const L = cum[n];
    const N = Math.floor(L / 0.5);
    if (N < 40) continue;
    const X = new Float64Array(N); const Y = new Float64Array(N);
    let seg = 0;
    for (let s = 0; s < N; s++) {
      const d = s * 0.5;
      while (seg < n - 1 && cum[seg + 1] < d) seg++;
      const j = open ? Math.min(seg + 1, n - 1) : (seg + 1) % n; const span = cum[seg + 1] - cum[seg] || 1; const f = (d - cum[seg]) / span;
      X[s] = pts[2 * seg] + (pts[2 * j] - pts[2 * seg]) * f; Y[s] = pts[2 * seg + 1] + (pts[2 * j + 1] - pts[2 * seg + 1]) * f;
    }
    const k = 10;
    for (let i = 0; i < N; i++) {
      const a = open ? Math.min(N - 1, i + k) : (i + k) % N; const b = open ? Math.max(0, i - k) : (i - k + N) % N;
      let tx = X[a] - X[b]; let ty = Y[a] - Y[b]; const nn = Math.hypot(tx, ty) + 1e-9; tx /= nn; ty /= nn;
      let nx = ty; let ny = -tx;
      if (solid(X[i] + nx * 4, Y[i] + ny * 4)) { nx = -nx; ny = -ny; }
      const ok = X[i] > 3 && X[i] < MAP_W - 4 && Y[i] < MAP_H - 4 ? 1 : 0;
      const wc = smooth01((-ny - 0.35) / 0.35); const wu = smooth01((ny - 0.35) / 0.35);
      const ws = 1 - 0.9 * Math.max(wc, wu);
      xs.push(X[i]); ys.push(Y[i]); nxs.push(nx); nys.push(ny); wcs.push(wc * ok); wus.push(wu * ok); wss.push(ws * ok);
    }
  }
  return { n: xs.length, x: Float32Array.from(xs), y: Float32Array.from(ys), nx: Float32Array.from(nxs), ny: Float32Array.from(nys), wc: Float32Array.from(wcs), wu: Float32Array.from(wus), ws: Float32Array.from(wss) };
}

// ---------------------------------------------------------------- the terrain object
const mkCanvas = () => { const c = document.createElement('canvas'); c.width = MAP_W; c.height = MAP_H; return c; };

export class Terrain {
  mask = new Uint8Array(MAP_W * MAP_H);
  /** first solid row of every column (MAP_H when empty): used for the front grass band and quick lookups */
  surf = new Int16Array(MAP_W);
  rock = mkCanvas();
  edge = mkCanvas();
  cap = mkCanvas();
  private strips!: ReturnType<typeof makeStrips>;
  private tex!: Uint8ClampedArray;
  private samples!: Samples;

  static async build(imgs: ImageStore, onProgress?: (p: number) => void): Promise<Terrain> {
    const t = new Terrain();
    const tick = () => new Promise<void>((r) => setTimeout(r, 0));
    const blurred = blur3(buildRawMask(), MAP_W, MAP_H, 11);
    for (let i = 0; i < blurred.length; i++) t.mask[i] = blurred[i] > 0.5 ? 1 : 0;
    roughenBottoms(t.mask);
    onProgress?.(0.15); await tick();
    t.strips = makeStrips(imgs);
    const tex = imgs.get('world/cliff_face_512.webp')!;
    const tc = document.createElement('canvas'); tc.width = 512; tc.height = 512;
    const tg = tc.getContext('2d', { willReadFrequently: true })!; tg.drawImage(tex, 0, 0, 512, 512);
    t.tex = tg.getImageData(0, 0, 512, 512).data;
    t.recomputeSurf(0, MAP_W);
    t.samples = buildSamples(t.mask);
    onProgress?.(0.3); await tick();
    const TILE = 440;
    for (let x0 = 0; x0 < MAP_W; x0 += TILE) {
      const x1 = Math.min(MAP_W, x0 + TILE);
      t.renderRock(x0, 0, x1, MAP_H);
      t.renderEdges(x0, 0, x1, MAP_H);
      onProgress?.(0.3 + 0.7 * (x1 / MAP_W)); await tick();
    }
    return t;
  }

  solid(x: number, y: number): boolean {
    const xi = Math.floor(x); const yi = Math.floor(y);
    if (xi < 0 || xi >= MAP_W || yi < 0 || yi >= MAP_H) return false;
    return this.mask[yi * MAP_W + xi] === 1;
  }
  /** first solid row at or below y (or -1) */
  groundFrom(x: number, y: number): number {
    const xi = Math.floor(x);
    if (xi < 0 || xi >= MAP_W) return -1;
    for (let yy = Math.max(0, Math.floor(y)); yy < MAP_H; yy++) if (this.mask[yy * MAP_W + xi] === 1) return yy;
    return -1;
  }

  private recomputeSurf(x0: number, x1: number) {
    for (let x = Math.max(0, x0); x < Math.min(MAP_W, x1); x++) {
      let y = 0; while (y < MAP_H && this.mask[y * MAP_W + x] === 0) y++;
      this.surf[x] = y;
    }
  }

  /** Blow a round hole in the ground and redraw the damaged area. */
  carve(cx: number, cy: number, r: number) {
    const x0 = Math.max(0, Math.floor(cx - r - 28)); const x1 = Math.min(MAP_W, Math.ceil(cx + r + 28));
    const y0 = Math.max(0, Math.floor(cy - r - 28)); const y1 = Math.min(MAP_H, Math.ceil(cy + r + 28));
    const w = x1 - x0; const h = y1 - y0;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(MAP_H, Math.ceil(cy + r)); y++)
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(MAP_W, Math.ceil(cx + r)); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.mask[y * MAP_W + x] = 0;
    // round off the rim and drop thin slivers
    const f = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) f[y * w + x] = this.mask[(y0 + y) * MAP_W + x0 + x];
    const b = blur3(f, w, h, 3);
    for (let y = 4; y < h - 4; y++) for (let x = 4; x < w - 4; x++) this.mask[(y0 + y) * MAP_W + x0 + x] = b[y * w + x] > 0.5 ? 1 : 0;
    this.recomputeSurf(x0, x1);
    this.samples = buildSamples(this.mask);
    const m = Math.ceil(r + 12);
    this.renderRock(Math.max(0, Math.floor(cx - m)), Math.max(0, Math.floor(cy - m)), Math.min(MAP_W, Math.ceil(cx + m)), Math.min(MAP_H, Math.ceil(cy + m)));
    const e = Math.ceil(r + REACH);
    this.renderEdges(Math.max(0, Math.floor(cx - e)), Math.max(0, Math.floor(cy - e)), Math.min(MAP_W, Math.ceil(cx + e)), Math.min(MAP_H, Math.ceil(cy + e)));
  }

  // rock fill + bottom shading + dark outline for one rectangle
  private renderRock(x0: number, y0: number, x1: number, y1: number) {
    const w = x1 - x0; const h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const R = 4;
    // eroded mask (square window) to find the outline band
    const ph = h + 2 * R;
    const tmp = new Uint8Array(w * ph);
    const get = (x: number, y: number) => {
      const xi = Math.min(MAP_W - 1, Math.max(0, x)); const yi = y < 0 ? -1 : Math.min(MAP_H - 1, y);
      return yi < 0 ? 0 : this.mask[yi * MAP_W + xi];
    };
    for (let y = 0; y < ph; y++) for (let x = 0; x < w; x++) {
      let v = 1;
      for (let k = -R; k <= R && v; k++) if (!get(x0 + x + k, y0 + y - R)) v = 0;
      tmp[y * w + x] = v;
    }
    const img = new ImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const yy = y0 + y;
      const sh = Math.min(1, Math.max(0, (yy / MAP_H - 0.55) * 1.2)) * (80 / 255);
      for (let x = 0; x < w; x++) {
        const xx = x0 + x;
        if (this.mask[yy * MAP_W + xx] !== 1) continue;
        let inner = 1;
        for (let k = 0; k <= 2 * R && inner; k++) if (!tmp[(y + k) * w + x]) inner = 0;
        const o = (y * w + x) * 4;
        const ti = ((yy & 511) * 512 + (xx & 511)) * 4;
        let r = this.tex[ti]; let g = this.tex[ti + 1]; let b = this.tex[ti + 2];
        r = r * (1 - sh) + 40 * sh; g = g * (1 - sh) + 20 * sh; b = b * (1 - sh) + 15 * sh;
        if (!inner) { r = r * 0.1 + 70 * 0.9; g = g * 0.1 + 40 * 0.9; b = b * 0.1 + 25 * 0.9; }
        d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
      }
    }
    this.rock.getContext('2d')!.putImageData(img, x0, y0);
  }

  // grass cap, rock side and underside strips for one rectangle
  private renderEdges(x0: number, y0: number, x1: number, y1: number) {
    const w = x1 - x0; const h = y1 - y0;
    if (w <= 0 || h <= 0) return;
    const S = this.samples;
    const pick: number[] = [];
    for (let i = 0; i < S.n; i++) if (S.x[i] > x0 - REACH && S.x[i] < x1 + REACH && S.y[i] > y0 - REACH && S.y[i] < y1 + REACH) pick.push(i);
    const draw = (strip: Strip, weights: Float32Array, useY: boolean): Float32Array => {
      const buf = new Float32Array(w * h * 4);
      const sel = pick.filter((i) => weights[i] > 0.02);
      if (!sel.length) return buf;
      const { data, hv, wt, v0 } = strip;
      const ui = new Int32Array(sel.length);
      for (let k = 0; k < sel.length; k++) { const u = Math.floor(useY ? S.y[sel[k]] : S.x[sel[k]]); ui[k] = ((u % wt) + wt) % wt; }
      for (let v = hv - 1; v >= 0; v--) {
        const off = v0 - v;
        for (let k = 0; k < sel.length; k++) {
          const i = sel[k];
          const p = (v * wt + ui[k]) * 4;
          const a = (data[p + 3] / 255) * weights[i];
          if (a <= 0.02) continue;
          const px = Math.round(S.x[i] + S.nx[i] * off) - x0; const py = Math.round(S.y[i] + S.ny[i] * off) - y0;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;
          const o = (py * w + px) * 4; const inv = 1 - a;
          buf[o] = data[p] * a + buf[o] * inv; buf[o + 1] = data[p + 1] * a + buf[o + 1] * inv; buf[o + 2] = data[p + 2] * a + buf[o + 2] * inv; buf[o + 3] = a * 255 + buf[o + 3] * inv;
        }
      }
      return buf;
    };
    const cap = draw(this.strips.cap, S.wc, false);
    const side = draw(this.strips.side, S.ws, true);
    const under = draw(this.strips.under, S.wu, false);
    const capImg = new ImageData(w, h); const edgeImg = new ImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      const ac = cap[o + 3];
      if (ac > 0.5) { capImg.data[o] = (cap[o] * 255) / ac; capImg.data[o + 1] = (cap[o + 1] * 255) / ac; capImg.data[o + 2] = (cap[o + 2] * 255) / ac; capImg.data[o + 3] = ac; }
      const au = under[o + 3]; const inv = 1 - au / 255;
      const A = au + side[o + 3] * inv;
      if (A > 0.5) {
        edgeImg.data[o] = ((under[o] + side[o] * inv) * 255) / A; edgeImg.data[o + 1] = ((under[o + 1] + side[o + 1] * inv) * 255) / A;
        edgeImg.data[o + 2] = ((under[o + 2] + side[o + 2] * inv) * 255) / A; edgeImg.data[o + 3] = A;
      }
    }
    this.cap.getContext('2d')!.putImageData(capImg, x0, y0);
    this.edge.getContext('2d')!.putImageData(edgeImg, x0, y0);
  }
}
