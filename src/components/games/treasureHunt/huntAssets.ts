/**
 * Treasure Hunt art: the explorers, the four worlds and the chests.
 * All pictures live in public/treasure/<folder>/<name>.png and are loaded once
 * (the pictures of a world are only loaded when a hunt in that world starts).
 */

export type WorldId = 'jungle' | 'desert' | 'saudi' | 'crystal';

/** The worlds in the order the player sees them on the start screen. */
export const WORLD_IDS: WorldId[] = ['jungle', 'desert', 'saudi', 'crystal'];

export interface Explorer {
  id: string;
  name: string;
}

/** The six explorers a player can choose from (sprite sheets in public/treasure/chars). */
export const EXPLORERS: Explorer[] = [
  { id: 'pink', name: 'Rawan' },
  { id: 'goggles', name: 'Nour' },
  { id: 'hijab', name: 'Mayar' },
  { id: 'redcap', name: 'Mohamed' },
  { id: 'flower', name: 'Mariam' },
  { id: 'robot', name: 'Robo' },
];

/** Each sprite sheet is 3 columns (stand, step, step) x 4 rows (down, left, right, up) of FRAME_W x FRAME_H. */
export const FRAME_W = 128;
export const FRAME_H = 160;

/** y (in the picture) of the middle of the flat diamond on top of each ground tile. */
export const GROUND_ANCHOR: Record<string, number> = {
  'jungle/grass': 92,
  'jungle/path': 90,
  'jungle/water': 102,
  'jungle/bridge': 104,
  'desert/sand': 93,
  'desert/stone-path': 95,
  'desert/dune': 96,
  'desert/shore': 98,
  'saudi/sand': 89,
  'saudi/path': 89,
  'saudi/redsand': 89,
  'saudi/water': 89,
  'crystal/floor': 89,
  'crystal/path': 89,
  'crystal/water': 89,
  'crystal/bridge': 89,
};

/**
 * y (in the picture) of the spot where a prop touches the ground. Props that are not listed here
 * use the default (a little above the bottom edge). The big landmarks that stand on a flat base
 * (mosques, old towns, forts) and the tile-shaped props need this so they sit in the middle of their cell.
 */
export const PROP_ANCHOR: Record<string, number> = {
  'saudi/canyon': 199,
  'saudi/oasis': 138,
  'saudi/palm-grove': 141,
  'saudi/tomb': 230,
  'saudi/haram': 199,
  'saudi/medina': 230,
  'saudi/albalad': 184,
  'saudi/fort': 183,
  'saudi/cliff': 274,
  'saudi/tower': 314,
  'saudi/asir': 200,
  'saudi/maraya': 224,
  'saudi/fountain': 307,
  'crystal/cave': 267,
  'crystal/statue': 180,
  'crystal/waterfall': 263,
  'crystal/gate': 250,
  'crystal/shrine': 234,
  'crystal/arch': 189,
  'crystal/lamp': 221,
  'crystal/flowers': 128,
  'crystal/stone': 28,
};

const PROPS: Record<WorldId, string[]> = {
  jungle: ['tree-big', 'tree-small', 'bush', 'rock', 'flowers', 'statue', 'waterfall', 'arch', 'wall', 'torch'],
  desert: ['palm', 'palm-small', 'palm-dates', 'cactus', 'bush', 'rock', 'crate', 'pot', 'column', 'statue', 'arch', 'house', 'well', 'camel', 'wall'],
  saudi: ['palm', 'palm-trio', 'bush', 'rock', 'canyon', 'oasis', 'palm-grove', 'tomb', 'haram', 'medina', 'albalad', 'fort', 'cliff', 'tower', 'asir', 'maraya', 'fountain'],
  crystal: ['crystal-cluster', 'crystal-small', 'boulder', 'stone', 'crystal-purple', 'crystal-blue', 'cave', 'statue', 'waterfall', 'gate', 'shrine', 'arch', 'lamp', 'flowers'],
};
const GROUND: Record<WorldId, string[]> = {
  jungle: ['grass', 'path', 'water', 'bridge'],
  desert: ['sand', 'stone-path', 'dune', 'shore'],
  saudi: ['sand', 'path', 'redsand', 'water'],
  crystal: ['floor', 'path', 'water', 'bridge'],
};
const UI = ['chest-bronze', 'chest-silver', 'chest-gold', 'open-bronze', 'open-silver', 'open-gold', 'coin', 'star', 'key', 'heart', 'compass'];

export interface HuntAssets {
  img: Record<string, HTMLImageElement>;
}

function baseUrl() {
  try {
    return `${import.meta.env.BASE_URL}treasure/`;
  } catch {
    return '/treasure/';
  }
}

export function huntImageUrl(path: string) {
  return `${baseUrl()}${path}.png`;
}

/** The picture shown on the card of a world (public/treasure/previews/<world>.webp). */
export function worldPreviewUrl(world: WorldId) {
  return `${baseUrl()}previews/${world}.webp`;
}

const shared: HuntAssets = { img: {} };
const pending = new Map<string, Promise<void>>();

function loadOne(n: string): Promise<void> {
  const known = pending.get(n);
  if (known) return known;
  const p = new Promise<void>((resolve) => {
    const el = new Image();
    el.onload = () => {
      shared.img[n] = el;
      resolve();
    };
    el.onerror = () => {
      pending.delete(n); // not cached, so a later try can load it again
      resolve();
    };
    el.src = huntImageUrl(n);
  });
  pending.set(n, p);
  return p;
}

/**
 * Loads the explorers and the interface pictures, plus the ground and props of the given worlds.
 * Every picture is loaded once. A picture that fails to load is skipped (the game still works without it).
 * The returned object is shared, so pictures of a world that loads later also show up in it.
 */
export function loadHuntAssets(worlds: WorldId[] = []): Promise<HuntAssets> {
  const names: string[] = [
    ...EXPLORERS.map((e) => `chars/${e.id}`),
    ...UI.map((n) => `ui/${n}`),
    ...worlds.flatMap((w) => [...GROUND[w], ...PROPS[w]].map((n) => `${w}/${n}`)),
  ];
  return Promise.all(names.map(loadOne)).then(() => shared);
}
