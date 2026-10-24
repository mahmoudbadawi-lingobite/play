import { WORLD_IDS, type WorldId } from './huntAssets';
import { CLUES } from './huntClues';

/**
 * Builds a world map from a seed (same seed = same map, which is how every player in a
 * multiplayer room will see the identical world without sending the map around).
 * The map is a square grid; the engine draws it in isometric view.
 */

/** Default size of a map (a world can ask for a bigger one with `size`). */
export const GRID = 24;

export interface Cell {
  /** name of the ground picture (grass, path, water, bridge ...) */
  ground: string;
  water: boolean;
  /** a solid object stands here (tree, rock, landmark ...) */
  prop?: string;
  block: boolean;
  /** kept free of random objects */
  keep: boolean;
}

export interface Chest {
  gx: number;
  gy: number;
  /** which landmark it hides next to, and the clue text that points to it */
  landmark: string;
  clue: string;
}

export interface WorldMap {
  id: WorldId;
  name: string;
  tagline: string;
  seed: number;
  n: number;
  cells: Cell[];
  start: { gx: number; gy: number };
  /** the chests of this stage, in the order the player has to find them */
  chests: Chest[];
  sky: [string, string];
}

interface LandmarkDef {
  kind: string;
  asset: string;
  /** must stand on a river bank */
  bank?: boolean;
}
interface DecorDef {
  asset: string;
  weight: number;
  block: boolean;
}
interface WorldDef {
  name: string;
  /** one short line for the world card on the start screen */
  blurb: string;
  tagline: string;
  base: string;
  path: string;
  water: string;
  /** 'river' runs from top to bottom and is crossed on bridges; 'pond' is a lake in the middle */
  terrain: 'river' | 'pond';
  extraGround?: string;
  /** side of the square map in cells (default GRID) */
  size?: number;
  /** how far apart two landmarks must stand (default 5.5 cells) */
  gap?: number;
  landmarks: LandmarkDef[];
  decor: DecorDef[];
  sky: [string, string];
}

export const WORLD_DEFS: Record<WorldId, WorldDef> = {
  jungle: {
    name: 'Jungle Temple',
    blurb: 'Vines, ruins and a rushing waterfall',
    terrain: 'river',
    tagline: 'Old ruins hide under the vines. Follow the clues and find the chests!',
    base: 'grass',
    path: 'path',
    water: 'water',
    landmarks: [
      { kind: 'waterfall', asset: 'waterfall', bank: true },
      { kind: 'statue', asset: 'statue' },
      { kind: 'arch', asset: 'arch' },
      { kind: 'ruins', asset: 'wall' },
      { kind: 'tree', asset: 'tree-big' },
      { kind: 'torch', asset: 'torch' },
    ],
    decor: [
      { asset: 'tree-small', weight: 0.4, block: true },
      { asset: 'bush', weight: 0.3, block: true },
      { asset: 'rock', weight: 0.15, block: true },
      { asset: 'flowers', weight: 0.15, block: false },
    ],
    sky: ['#9ddcff', '#e4f7cf'],
  },
  desert: {
    name: 'Desert Oasis',
    blurb: 'Sand, palms and a sleepy camel',
    terrain: 'pond',
    tagline: 'Sand, palms and sandstone ruins. A chest waits at every landmark.',
    base: 'sand',
    path: 'stone-path',
    water: 'shore',
    extraGround: 'dune',
    landmarks: [
      { kind: 'well', asset: 'well' },
      { kind: 'house', asset: 'house' },
      { kind: 'camel', asset: 'camel' },
      { kind: 'arch', asset: 'arch' },
      { kind: 'statue', asset: 'statue' },
      { kind: 'column', asset: 'column' },
    ],
    decor: [
      { asset: 'palm', weight: 0.18, block: true },
      { asset: 'palm-small', weight: 0.22, block: true },
      { asset: 'palm-dates', weight: 0.08, block: true },
      { asset: 'cactus', weight: 0.2, block: true },
      { asset: 'bush', weight: 0.14, block: true },
      { asset: 'rock', weight: 0.12, block: true },
      { asset: 'pot', weight: 0.06, block: true },
    ],
    sky: ['#ffd9a0', '#ffb27a'],
  },
  saudi: {
    name: 'Saudi Landmarks',
    blurb: 'Ten famous places of the Kingdom, from Makkah to AlUla',
    tagline: 'Visit the famous places of Saudi Arabia. Every landmark hides a chest, so read the clue and find the right one!',
    terrain: 'pond',
    base: 'sand',
    path: 'path',
    water: 'water',
    extraGround: 'redsand',
    size: 30,
    gap: 5.2,
    landmarks: [
      { kind: 'haram', asset: 'haram' },
      { kind: 'medina', asset: 'medina' },
      { kind: 'tower', asset: 'tower' },
      { kind: 'tomb', asset: 'tomb' },
      { kind: 'albalad', asset: 'albalad' },
      { kind: 'fort', asset: 'fort' },
      { kind: 'cliff', asset: 'cliff' },
      { kind: 'asir', asset: 'asir' },
      { kind: 'maraya', asset: 'maraya' },
      { kind: 'fountain', asset: 'fountain', bank: true },
    ],
    decor: [
      { asset: 'palm', weight: 0.2, block: true },
      { asset: 'palm-trio', weight: 0.1, block: true },
      { asset: 'bush', weight: 0.2, block: true },
      { asset: 'rock', weight: 0.18, block: true },
      { asset: 'canyon', weight: 0.07, block: true },
      { asset: 'oasis', weight: 0.04, block: true },
      { asset: 'palm-grove', weight: 0.05, block: true },
    ],
    sky: ['#bfe9ff', '#ffe6b0'],
  },
  crystal: {
    name: 'Crystal Cave',
    blurb: 'Glowing crystals, runes and a hidden waterfall',
    tagline: 'Deep under the mountain, crystals glow and old stone doors wait in the dark. Follow the clues and find the chests!',
    terrain: 'river',
    base: 'floor',
    path: 'path',
    water: 'water',
    size: 30,
    gap: 5.2,
    landmarks: [
      { kind: 'waterfall', asset: 'waterfall', bank: true },
      { kind: 'gate', asset: 'gate' },
      { kind: 'shrine', asset: 'shrine' },
      { kind: 'arch', asset: 'arch' },
      { kind: 'statue', asset: 'statue' },
      { kind: 'lamp', asset: 'lamp' },
      { kind: 'bluecrystal', asset: 'crystal-blue' },
      { kind: 'purplecrystal', asset: 'crystal-purple' },
      { kind: 'cave', asset: 'cave' },
      { kind: 'flowers', asset: 'flowers' },
    ],
    decor: [
      { asset: 'crystal-small', weight: 0.25, block: true },
      { asset: 'crystal-cluster', weight: 0.2, block: true },
      { asset: 'boulder', weight: 0.2, block: true },
      { asset: 'stone', weight: 0.2, block: false },
    ],
    sky: ['#0d1235', '#26306b'],
  },
  autumn: {
    name: 'Autumn Woods',
    blurb: 'Golden leaves, an old stone trail and a stream',
    tagline: 'Golden leaves cover the old trail. The chests are hiding between the trees.',
    terrain: 'river',
    base: 'grass',
    path: 'path',
    water: 'water',
    landmarks: [],
    decor: [],
    sky: ['#ffd8a8', '#fdf0cf'],
  },
  night: {
    name: 'Moonlit Ruins',
    blurb: 'The old temple at night. Follow the torches',
    tagline: 'The temple sleeps under the moon. Follow the torches and stay sharp!',
    terrain: 'river',
    base: 'grass',
    path: 'path',
    water: 'water',
    landmarks: [],
    decor: [],
    sky: ['#233a73', '#4a6aa8'],
  },
  frost: {
    name: 'Frozen Valley',
    blurb: 'Snow, a frozen pond and icy ruins',
    tagline: 'Snow everywhere and icy ruins. Every landmark guards a chest.',
    terrain: 'pond',
    base: 'snow',
    path: 'stone-path',
    water: 'ice',
    extraGround: 'drift',
    landmarks: [
      { kind: 'well', asset: 'well' },
      { kind: 'house', asset: 'house' },
      { kind: 'arch', asset: 'arch' },
      { kind: 'statue', asset: 'statue' },
      { kind: 'column', asset: 'column' },
      { kind: 'torch', asset: 'torch' },
    ],
    decor: [
      { asset: 'tree-small', weight: 0.34, block: true },
      { asset: 'bush', weight: 0.22, block: true },
      { asset: 'rock', weight: 0.16, block: true },
      { asset: 'tree-big', weight: 0.06, block: true },
      { asset: 'crate', weight: 0.04, block: true },
      { asset: 'pot', weight: 0.04, block: true },
    ],
    sky: ['#cfeaff', '#f4fbff'],
  },
};

// the re-coloured jungle worlds have the same landmarks and scenery as the jungle
for (const id of ['autumn', 'night'] as const) {
  WORLD_DEFS[id].landmarks = WORLD_DEFS.jungle.landmarks;
  WORLD_DEFS[id].decor = WORLD_DEFS.jungle.decor;
}

/** How many chests a world can hold: one per landmark. */
export function worldCapacity(id: WorldId): number {
  return WORLD_DEFS[id].landmarks.length;
}

export function worldBlurb(id: WorldId): string {
  return WORLD_DEFS[id].blurb;
}

export function worldName(id: WorldId): string {
  return WORLD_DEFS[id].name;
}

export const ALL_WORLDS: WorldId[] = WORLD_IDS;

export const MAX_CHESTS_PER_WORLD = 6;

export function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function attempt(worldId: WorldId, seed: number, chestCount: number): WorldMap | null {
  const def = WORLD_DEFS[worldId];
  const rng = rngFrom(seed);
  const N = def.size ?? GRID;
  const gap = def.gap ?? 5.5;
  const idx = (x: number, y: number) => y * N + x;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N;
  const cells: Cell[] = Array.from({ length: N * N }, () => ({ ground: def.base, water: false, block: false, keep: false }));
  const at = (x: number, y: number) => cells[idx(x, y)];

  // ---------------------------------------------------------------- water
  if (def.terrain === 'river') {
    const phase = rng() * 6;
    const bridgeRows = [Math.round(N * 0.3 + rng() * 2), Math.round(N * 0.7 - rng() * 2)];
    for (let y = 0; y < N; y++) {
      const cx = Math.round(N * 0.5 + 2.5 * Math.sin(y * 0.4 + phase));
      for (let w = 0; w < 2; w++) {
        const c = at(cx + w, y);
        if (bridgeRows.includes(y)) {
          c.ground = 'bridge';
          c.keep = true;
        } else {
          c.ground = def.water;
          c.water = true;
        }
      }
    }
  } else {
    const k = N / GRID; // a bigger map gets a bigger lake
    const px = N * 0.5 + (rng() - 0.5) * 4;
    const py = N * 0.46 + (rng() - 0.5) * 4;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = (x + 0.5 - px) / (3.3 * k);
        const dy = (y + 0.5 - py) / (2.6 * k);
        if (dx * dx + dy * dy < 1) {
          const c = at(x, y);
          c.ground = def.water;
          c.water = true;
        }
      }
    for (let b = 0; b < Math.round(6 * k); b++) {
      const bx = rng() * N;
      const by = rng() * N;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const c = at(x, y);
          if (!c.water && Math.hypot(x - bx, y - by) < 2 + rng() * 0.6) c.ground = def.extraGround as string;
        }
    }
  }

  const start = { gx: 3, gy: N - 5 };
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) at(start.gx + dx, start.gy + dy).keep = true;

  const isLand = (x: number, y: number) => inside(x, y) && !at(x, y).water && at(x, y).ground !== 'bridge';
  const nearWater = (x: number, y: number) => NB4.some(([dx, dy]) => inside(x + dx, y + dy) && at(x + dx, y + dy).water);

  // ---------------------------------------------------------------- landmarks (each one gets a chest beside it)
  const picked: { x: number; y: number; def: LandmarkDef }[] = [];
  const order = [...def.landmarks].sort(() => rng() - 0.5);
  // a bank landmark goes first so it still finds a free bank
  order.sort((a, b) => Number(!!b.bank) - Number(!!a.bank));
  for (const lm of order) {
    let ok = false;
    for (let t = 0; t < 600 && !ok; t++) {
      const x = 2 + Math.floor(rng() * (N - 4));
      const y = 2 + Math.floor(rng() * (N - 4));
      if (!isLand(x, y) || at(x, y).prop || at(x, y).keep) continue;
      if (lm.bank && !nearWater(x, y)) continue;
      if (!lm.bank && nearWater(x, y)) continue;
      if (Math.hypot(x - start.gx, y - start.gy) < 7) continue;
      if (picked.some((p) => Math.hypot(p.x - x, p.y - y) < gap)) continue;
      picked.push({ x, y, def: lm });
      at(x, y).prop = lm.asset;
      at(x, y).block = true;
      ok = true;
    }
    if (!ok) return null;
  }

  // chest next to each landmark (prefer the side facing the camera so it is not hidden behind the landmark)
  const chestPos = new Map<string, { x: number; y: number }>();
  for (const p of picked) {
    const opts = NB8.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
      .filter((c) => isLand(c.x, c.y) && !at(c.x, c.y).prop && c.x >= 1 && c.y >= 1 && c.x < N - 1 && c.y < N - 1)
      .sort((a, b) => b.x + b.y - (a.x + a.y) + (rng() - 0.5) * 0.4);
    if (!opts.length) return null;
    chestPos.set(p.def.kind, opts[0]);
    for (const [dx, dy] of NB8) {
      for (const q of [p, opts[0]]) if (inside(q.x + dx, q.y + dy)) at(q.x + dx, q.y + dy).keep = true;
    }
    at(opts[0].x, opts[0].y).keep = true;
  }

  // ---------------------------------------------------------------- paths (cheapest way, so rivers are crossed on bridges)
  const nodes = [{ x: start.gx, y: start.gy }, ...picked.map((p) => chestPos.get(p.def.kind) as { x: number; y: number })];
  const connected: { x: number; y: number }[] = [nodes[0]];
  const rest = nodes.slice(1);
  const chestCells = new Set(nodes.slice(1).map((c) => idx(c.x, c.y)));
  // chests are solid, so a path must never run through one (only end at it)
  const passable = (x: number, y: number) => inside(x, y) && !at(x, y).water && !(at(x, y).prop && at(x, y).block) && !chestCells.has(idx(x, y));
  while (rest.length) {
    let bi = 0;
    let bd = 1e9;
    let bc = connected[0];
    rest.forEach((r, i) => connected.forEach((c) => {
      const d = Math.abs(r.x - c.x) + Math.abs(r.y - c.y);
      if (d < bd) { bd = d; bi = i; bc = c; }
    }));
    const from = rest.splice(bi, 1)[0];
    // Dijkstra from `from` to `bc` with a little noise so paths curve
    const dist = new Float32Array(N * N).fill(1e9);
    const prev = new Int32Array(N * N).fill(-1);
    const open: number[] = [idx(from.x, from.y)];
    dist[open[0]] = 0;
    while (open.length) {
      let mi = 0;
      for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[mi]]) mi = i;
      const cur = open.splice(mi, 1)[0];
      const cx = cur % N;
      const cy = Math.floor(cur / N);
      if (cx === bc.x && cy === bc.y) break;
      for (const [dx, dy] of NB4) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!inside(nx, ny) || !(passable(nx, ny) || (nx === bc.x && ny === bc.y))) continue;
        const nd = dist[cur] + 1 + rng() * 0.9;
        if (nd < dist[idx(nx, ny)]) {
          dist[idx(nx, ny)] = nd;
          prev[idx(nx, ny)] = cur;
          open.push(idx(nx, ny));
        }
      }
    }
    let cur = idx(bc.x, bc.y);
    if (prev[cur] < 0 && !(bc.x === from.x && bc.y === from.y)) return null;
    while (cur >= 0) {
      const c = cells[cur];
      if (c.ground !== 'bridge' && !c.water) c.ground = def.path;
      c.keep = true;
      cur = prev[cur];
    }
    connected.push(from);
  }

  // ---------------------------------------------------------------- scenery
  const total = def.decor.reduce((s, d) => s + d.weight, 0);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const c = at(x, y);
      if (c.water || c.prop || c.keep || c.ground === 'bridge' || c.ground === def.path) continue;
      const edge = Math.min(x, y, N - 1 - x, N - 1 - y);
      const p = 0.12 + (edge <= 1 ? 0.28 : edge <= 3 ? 0.08 : 0);
      if (rng() > p) continue;
      let r = rng() * total;
      for (const d of def.decor) {
        if ((r -= d.weight) <= 0) {
          c.prop = d.asset;
          c.block = d.block;
          break;
        }
      }
    }

  // ---------------------------------------------------------------- every chest must be reachable
  const seen = new Uint8Array(N * N);
  const q = [idx(start.gx, start.gy)];
  seen[q[0]] = 1;
  const chestSet = new Set([...chestPos.values()].map((c) => idx(c.x, c.y)));
  while (q.length) {
    const cur = q.pop() as number;
    const cx = cur % N;
    const cy = Math.floor(cur / N);
    for (const [dx, dy] of NB4) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inside(nx, ny) || seen[idx(nx, ny)]) continue;
      const c = at(nx, ny);
      if (c.water || (c.block && !chestSet.has(idx(nx, ny)))) continue;
      seen[idx(nx, ny)] = 1;
      if (!chestSet.has(idx(nx, ny))) q.push(idx(nx, ny)); // a chest can be reached but not walked through
    }
  }
  for (const i of chestSet) if (!seen[i]) return null;

  // ---------------------------------------------------------------- chests in play order
  const play = [...picked].sort(() => rng() - 0.5).slice(0, Math.min(chestCount, picked.length));
  const chests: Chest[] = play.map((p) => {
    const pos = chestPos.get(p.def.kind) as { x: number; y: number };
    const variants = CLUES[worldId][p.def.kind] ?? ['Find the next chest!'];
    return { gx: pos.x, gy: pos.y, landmark: p.def.kind, clue: variants[Math.floor(rng() * variants.length)] };
  });

  return { id: worldId, name: def.name, tagline: def.tagline, seed, n: N, cells, start, chests, sky: def.sky };
}

export function generateWorld(worldId: WorldId, seed: number, chestCount: number): WorldMap {
  for (let t = 0; t < 40; t++) {
    const w = attempt(worldId, seed + t * 7919, chestCount);
    if (w) return w;
  }
  throw new Error('Could not build the map');
}
