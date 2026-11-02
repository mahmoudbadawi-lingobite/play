/** Deterministic isometric tile maps, generated per zone so every visit looks the same. */
export const SIZE = 24;
export const GROUND = 0, PATH = 1, TALL = 2, TREE = 3, ROCK = 4, WATER = 5;
export type Tile = 0 | 1 | 2 | 3 | 4 | 5;

export interface GameMap { size: number; tiles: Tile[]; flowers: boolean[]; spawn: { x: number; y: number } }

function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noiseField(rng: () => number, size: number, cell: number) {
  const n = Math.ceil(size / cell) + 2;
  const lat = Array.from({ length: n * n }, () => rng());
  return (x: number, y: number) => {
    const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const s = (t: number) => t * t * (3 - 2 * t);
    const a = lat[y0 * n + x0], b = lat[y0 * n + x0 + 1], c = lat[(y0 + 1) * n + x0], d = lat[(y0 + 1) * n + x0 + 1];
    return (a * (1 - s(tx)) + b * s(tx)) * (1 - s(ty)) + (c * (1 - s(tx)) + d * s(tx)) * s(ty);
  };
}

export const walkable = (m: GameMap, x: number, y: number) => {
  if (x < 0 || y < 0 || x >= m.size || y >= m.size) return false;
  const t = m.tiles[y * m.size + x];
  return t === GROUND || t === PATH || t === TALL;
};

export interface MapOpts { waterBias?: number; treeDensity?: number }

export function generateMap(zoneId: string, opts: MapOpts = {}): GameMap {
  const rng = mulberry(hashStr(`monster-quest:${zoneId}`));
  const S = SIZE, tiles: Tile[] = new Array(S * S).fill(GROUND);
  const grassN = noiseField(rng, S, 5), waterN = noiseField(rng, S, 7);
  const spawn = { x: S >> 1, y: S >> 1 };
  const dist = (x: number, y: number) => Math.hypot(x - spawn.x, y - spawn.y);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x;
    if (grassN(x, y) > 0.5) tiles[i] = TALL;
    if (waterN(x + 3, y + 5) > 0.72 + (opts.waterBias ?? 0) && dist(x, y) > 5) tiles[i] = WATER;
    else if (rng() < (opts.treeDensity ?? 0.09) && tiles[i] === GROUND) tiles[i] = TREE;
    else if (rng() < 0.03 && tiles[i] !== WATER) tiles[i] = ROCK;
    if (x === 0 || y === 0 || x === S - 1 || y === S - 1) tiles[i] = TREE;
  }
  // winding paths from the centre to a few points
  const carve = (tx: number, ty: number) => {
    let x = spawn.x, y = spawn.y;
    for (let k = 0; k < 120 && (x !== tx || y !== ty); k++) {
      tiles[y * S + x] = PATH;
      const horizontal = rng() < 0.5;
      if (horizontal && x !== tx) x += Math.sign(tx - x); else if (y !== ty) y += Math.sign(ty - y); else x += Math.sign(tx - x);
    }
    tiles[ty * S + tx] = PATH;
  };
  carve(S - 3, spawn.y + 2); carve(3, spawn.y - 3); carve(spawn.x + 3, 3); carve(spawn.x - 2, S - 3);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) tiles[(spawn.y + dy) * S + spawn.x + dx] = dx === 0 && dy === 0 ? PATH : GROUND;

  // anything the player can never reach becomes scenery
  const seen = new Uint8Array(S * S), q = [spawn.y * S + spawn.x];
  seen[q[0]] = 1;
  const m: GameMap = { size: S, tiles, flowers: [], spawn };
  for (let h = 0; h < q.length; h++) {
    const cx = q[h] % S, cy = (q[h] / S) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy, ni = ny * S + nx;
      if (walkable(m, nx, ny) && !seen[ni]) { seen[ni] = 1; q.push(ni); }
    }
  }
  m.flowers = new Array(S * S).fill(false);
  for (let i = 0; i < S * S; i++) {
    if (!seen[i] && (tiles[i] === GROUND || tiles[i] === TALL || tiles[i] === PATH)) tiles[i] = TREE;
    if (tiles[i] === GROUND && rng() < 0.07) m.flowers[i] = true;
  }
  return m;
}

/** Shortest walkable route (8-way, no corner cutting). Returns the steps after `from`. */
export function findPath(m: GameMap, from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] | null {
  if (!walkable(m, to.x, to.y)) return null;
  const S = m.size, start = from.y * S + from.x, goal = to.y * S + to.x;
  const prev = new Int32Array(S * S).fill(-1); prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; if (c === goal) break;
    const cx = c % S, cy = (c / S) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (!walkable(m, nx, ny)) continue;
      if (dx && dy && (!walkable(m, cx + dx, cy) || !walkable(m, cx, cy + dy))) continue;
      const ni = ny * S + nx;
      if (prev[ni] !== -1) continue;
      prev[ni] = c; q.push(ni);
    }
  }
  if (prev[goal] === -1) return null;
  const out: { x: number; y: number }[] = [];
  for (let c = goal; c !== start; c = prev[c]) out.push({ x: c % S, y: (c / S) | 0 });
  return out.reverse();
}
