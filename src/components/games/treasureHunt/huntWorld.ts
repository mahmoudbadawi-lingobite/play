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
  /** which copy of the landmark this is (1 for the first or the only one) */
  copy?: number;
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
  /** how many of this landmark the world can hold (default 1). Extra copies are only placed when a big hunt needs them. */
  copies?: number;
  /** a landmark that is only placed when a hunt has more chests than the world's main landmarks */
  extra?: boolean;
}

/** One placed landmark: a copy of a landmark kind. */
interface LandmarkInstance {
  /** unique inside the world: 'statue', 'statue2' ... */
  key: string;
  copy: number;
  def: LandmarkDef;
}

/** every landmark a world can hold, main ones first, then the extras (first copies of extra kinds, then 2nd copies and so on) */
function landmarkInstances(def: WorldDef): { main: LandmarkInstance[]; extra: LandmarkInstance[] } {
  const main: LandmarkInstance[] = [];
  const extra: LandmarkInstance[] = [];
  def.landmarks.forEach((lm) => {
    for (let c = 1; c <= (lm.copies ?? 1); c++) {
      const inst = { key: c === 1 ? lm.kind : `${lm.kind}${c}`, copy: c, def: lm };
      (c === 1 && !lm.extra ? main : extra).push(inst);
    }
  });
  extra.sort((a, b) => a.copy - b.copy);
  return { main, extra };
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
      // only placed in hunts with more than 6 chests
      { kind: 'treehouse', asset: 'treehouse', extra: true },
      { kind: 'hut', asset: 'hut', extra: true },
      { kind: 'jaguar', asset: 'jaguar', extra: true },
      { kind: 'totem', asset: 'totem', extra: true },
      { kind: 'lookout', asset: 'lookout', extra: true },
      { kind: 'hollow', asset: 'hollow', extra: true },
      { kind: 'pyramid', asset: 'pyramid', extra: true },
      { kind: 'canoe', asset: 'canoe', extra: true },
      { kind: 'parrot', asset: 'parrot', extra: true },
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
      // only placed in hunts with more than 6 chests
      { kind: 'tent', asset: 'tent', extra: true },
      { kind: 'lookout', asset: 'lookout', extra: true },
      { kind: 'skull', asset: 'skull', extra: true },
      { kind: 'signpost', asset: 'signpost', extra: true },
      { kind: 'campfire', asset: 'campfire', extra: true },
      { kind: 'oasispool', asset: 'oasispool', extra: true },
      { kind: 'sandfort', asset: 'sandfort', extra: true },
      { kind: 'fossil', asset: 'fossil', extra: true },
      { kind: 'mesa', asset: 'mesa', extra: true },
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
    blurb: 'Famous places of the Kingdom, from Makkah and AlUla to the Eastern Province',
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
      // only placed in hunts with more than 10 chests
      { kind: 'khobar', asset: 'khobar', extra: true },
      { kind: 'ithra', asset: 'ithra', extra: true },
      { kind: 'halfmoon', asset: 'halfmoon', extra: true },
      { kind: 'fanateer', asset: 'fanateer', extra: true },
      { kind: 'tarout', asset: 'tarout', extra: true },
      { kind: 'ibrahim', asset: 'ibrahim', extra: true },
      { kind: 'uqair', asset: 'uqair', extra: true },
      { kind: 'jawatha', asset: 'jawatha', extra: true },
      { kind: 'qaisariya', asset: 'qaisariya', extra: true },
      { kind: 'qatif', asset: 'qatif', extra: true },
      { kind: 'dammam', asset: 'dammam', extra: true },
      { kind: 'dougha', asset: 'dougha', extra: true },
      { kind: 'qarah', asset: 'qarah', extra: true },
      { kind: 'asfar', asset: 'asfar', extra: true },
      { kind: 'ahsa', asset: 'ahsa', extra: true },
      { kind: 'darin', asset: 'darin', extra: true },
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
  egypt: {
    name: 'Egyptian Wonders',
    blurb: 'Pyramids, temples and a river Nile winding through the sand',
    tagline: 'Walk beside the Nile and visit the great wonders of Egypt. Every landmark hides a chest, so read the clue and find the right one!',
    terrain: 'river',
    base: 'sand',
    path: 'path',
    water: 'water',
    size: 30,
    gap: 5.2,
    landmarks: [
      { kind: 'giza', asset: 'giza' },
      { kind: 'sphinx', asset: 'sphinx' },
      { kind: 'karnak', asset: 'karnak' },
      { kind: 'valleykings', asset: 'valleykings' },
      { kind: 'abusimbel', asset: 'abusimbel' },
      { kind: 'philae', asset: 'philae', bank: true },
      { kind: 'citadel', asset: 'citadel' },
      { kind: 'luxor', asset: 'luxor' },
      // only placed in hunts with more than 8 chests
      { kind: 'hatshepsut', asset: 'hatshepsut', extra: true },
      { kind: 'djoser', asset: 'djoser', extra: true },
      { kind: 'stcatherine', asset: 'stcatherine', extra: true },
      { kind: 'qaitbay', asset: 'qaitbay', bank: true, extra: true },
      { kind: 'edfu', asset: 'edfu', extra: true },
      { kind: 'gem', asset: 'gem', extra: true },
      { kind: 'catacombs', asset: 'catacombs', extra: true },
    ],
    decor: [
      { asset: 'palm', weight: 0.3, block: true },
      { asset: 'palm-small', weight: 0.25, block: true },
      { asset: 'bush', weight: 0.25, block: true },
      { asset: 'rock', weight: 0.2, block: true },
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
      { kind: 'gate', asset: 'gate', copies: 2 },
      { kind: 'shrine', asset: 'shrine', copies: 2 },
      { kind: 'arch', asset: 'arch', copies: 2 },
      { kind: 'statue', asset: 'statue', copies: 2 },
      { kind: 'lamp', asset: 'lamp', copies: 2 },
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
      { kind: 'well', asset: 'well', copies: 2 },
      { kind: 'house', asset: 'house', copies: 3 },
      { kind: 'arch', asset: 'arch', copies: 2 },
      { kind: 'statue', asset: 'statue', copies: 3 },
      { kind: 'column', asset: 'column', copies: 3 },
      { kind: 'torch', asset: 'torch', copies: 2 },
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

/** How many chests a world can hold: one per landmark, counting the extra ones (at least 15 in every world). */
export function worldCapacity(id: WorldId): number {
  const { main, extra } = landmarkInstances(WORLD_DEFS[id]);
  return main.length + extra.length;
}

export function worldBlurb(id: WorldId): string {
  return WORLD_DEFS[id].blurb;
}

export function worldName(id: WorldId): string {
  return WORLD_DEFS[id].name;
}

export const ALL_WORLDS: WorldId[] = WORLD_IDS;

/** The most chests one hunt can have, whatever the world. */
export const MAX_CHESTS = 15;

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
  // the main landmarks are always placed; the extra ones only when the hunt has more chests than that
  const { main, extra } = landmarkInstances(def);
  const wantExtra = Math.max(0, Math.min(extra.length, chestCount - main.length));
  // which extras a hunt gets is picked by the seed (the 1st copies of a landmark before the 2nd copies)
  if (wantExtra > 0 && wantExtra < extra.length) {
    const key = new Map(extra.map((e) => [e, e.copy + rng() * 0.9]));
    extra.sort((a, b) => (key.get(a) as number) - (key.get(b) as number));
  }
  const placeList = [...main, ...extra.slice(0, wantExtra)];
  // a hunt with many landmarks gets a bigger map: 34 cells wide at 11 landmarks, growing by 2 for each one more (42 at 15)
  const crowded = placeList.length > 10;
  const N = crowded ? Math.max(def.size ?? GRID, 32 + (placeList.length - 10) * 2) : def.size ?? GRID;
  const gap = crowded ? Math.min(def.gap ?? 5.5, 5) : def.gap ?? 5.5;
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
  const picked: { x: number; y: number; inst: LandmarkInstance }[] = [];
  const order = [...placeList].sort(() => rng() - 0.5);
  // a bank landmark goes first so it still finds a free bank
  order.sort((a, b) => Number(!!b.def.bank) - Number(!!a.def.bank));
  for (const inst of order) {
    const lm = inst.def;
    let ok = false;
    for (let t = 0; t < 600 && !ok; t++) {
      const x = 2 + Math.floor(rng() * (N - 4));
      const y = 2 + Math.floor(rng() * (N - 4));
      if (!isLand(x, y) || at(x, y).prop || at(x, y).keep) continue;
      if (lm.bank && !nearWater(x, y)) continue;
      if (!lm.bank && nearWater(x, y)) continue;
      if (Math.hypot(x - start.gx, y - start.gy) < 7) continue;
      if (picked.some((p) => Math.hypot(p.x - x, p.y - y) < gap)) continue;
      picked.push({ x, y, inst });
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
    chestPos.set(p.inst.key, opts[0]);
    for (const [dx, dy] of NB8) {
      for (const q of [p, opts[0]]) if (inside(q.x + dx, q.y + dy)) at(q.x + dx, q.y + dy).keep = true;
    }
    at(opts[0].x, opts[0].y).keep = true;
  }

  // ---------------------------------------------------------------- paths (cheapest way, so rivers are crossed on bridges)
  const nodes = [{ x: start.gx, y: start.gy }, ...picked.map((p) => chestPos.get(p.inst.key) as { x: number; y: number })];
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
  // copies of the same landmark come in order (1st, 2nd, 3rd), so a clue can say "the one you have not opened yet"
  const slots = new Map<string, number[]>();
  play.forEach((p, i) => slots.set(p.inst.def.kind, [...(slots.get(p.inst.def.kind) ?? []), i]));
  for (const idxs of slots.values()) {
    const sorted = idxs.map((i) => play[i]).sort((a, b) => a.inst.copy - b.inst.copy);
    idxs.forEach((slot, k) => { play[slot] = sorted[k]; });
  }
  // a landmark that appears more than once in this hunt needs a warning in its clue
  const times = new Map<string, number>();
  play.forEach((p) => times.set(p.inst.def.kind, (times.get(p.inst.def.kind) ?? 0) + 1));
  const chests: Chest[] = play.map((p) => {
    const kind = p.inst.def.kind;
    const pos = chestPos.get(p.inst.key) as { x: number; y: number };
    const variants = CLUES[worldId][kind] ?? ['Find the next chest!'];
    let clue = variants[Math.floor(rng() * variants.length)];
    if ((times.get(kind) ?? 0) > 1) clue += ' There is more than one of these here, so check each one and skip any chest that is already open.';
    return { gx: pos.x, gy: pos.y, landmark: kind, clue, copy: p.inst.copy };
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
