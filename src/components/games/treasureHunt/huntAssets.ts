/**
 * Treasure Hunt art: the explorers, the four worlds and the chests.
 * All pictures live in public/treasure/<folder>/<name>.png and are loaded once
 * (the pictures of a world are only loaded when a hunt in that world starts).
 */

export type WorldId = 'jungle' | 'desert' | 'saudi' | 'crystal' | 'autumn' | 'night' | 'frost' | 'egypt';

/** The worlds in the order the player sees them on the start screen. */
export const WORLD_IDS: WorldId[] = ['jungle', 'desert', 'saudi', 'egypt', 'crystal', 'autumn', 'night', 'frost'];

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
  'egypt/sand': 89,
  'egypt/path': 89,
  'egypt/water': 89,
  'egypt/bridge': 104,
  'crystal/floor': 89,
  'crystal/path': 89,
  'crystal/water': 89,
  'crystal/bridge': 89,
  // the re-coloured worlds use the same tiles as the jungle and the desert
  'autumn/grass': 92,
  'autumn/path': 90,
  'autumn/water': 102,
  'autumn/bridge': 104,
  'night/grass': 92,
  'night/path': 90,
  'night/water': 102,
  'night/bridge': 104,
  'frost/snow': 93,
  'frost/stone-path': 95,
  'frost/drift': 96,
  'frost/ice': 98,
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
  'jungle/treehouse': 259,
  'autumn/treehouse': 259,
  'night/treehouse': 259,
  'jungle/hut': 231,
  'autumn/hut': 231,
  'night/hut': 231,
  'jungle/jaguar': 198,
  'autumn/jaguar': 198,
  'night/jaguar': 198,
  'jungle/totem': 235,
  'autumn/totem': 235,
  'night/totem': 235,
  'jungle/lookout': 253,
  'autumn/lookout': 253,
  'night/lookout': 253,
  'jungle/hollow': 187,
  'autumn/hollow': 187,
  'night/hollow': 187,
  'jungle/pyramid': 183,
  'autumn/pyramid': 183,
  'night/pyramid': 183,
  'jungle/canoe': 138,
  'autumn/canoe': 138,
  'night/canoe': 138,
  'jungle/parrot': 201,
  'autumn/parrot': 201,
  'night/parrot': 201,
  'desert/tent': 137,
  'desert/lookout': 194,
  'desert/skull': 121,
  'desert/signpost': 167,
  'desert/campfire': 138,
  'desert/oasispool': 159,
  'desert/sandfort': 150,
  'desert/fossil': 110,
  'desert/mesa': 174,
  'saudi/khobar': 147,
  'saudi/ithra': 132,
  'saudi/halfmoon': 125,
  'saudi/fanateer': 128,
  'saudi/tarout': 120,
  'saudi/ibrahim': 117,
  'saudi/uqair': 117,
  'saudi/jawatha': 130,
  'saudi/qaisariya': 112,
  'saudi/qatif': 120,
  'saudi/dammam': 125,
  'saudi/dougha': 121,
  'saudi/qarah': 149,
  'saudi/asfar': 114,
  'saudi/ahsa': 123,
  'saudi/darin': 121,
  'egypt/giza': 108,
  'egypt/sphinx': 130,
  'egypt/karnak': 118,
  'egypt/valleykings': 170,
  'egypt/hatshepsut': 110,
  'egypt/abusimbel': 130,
  'egypt/djoser': 122,
  'egypt/philae': 142,
  'egypt/citadel': 156,
  'egypt/luxor': 140,
  'egypt/stcatherine': 124,
  'egypt/qaitbay': 152,
  'egypt/edfu': 142,
  'egypt/gem': 124,
  'egypt/catacombs': 170,
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
  jungle: ['tree-big', 'tree-small', 'bush', 'rock', 'flowers', 'statue', 'waterfall', 'arch', 'wall', 'torch', 'treehouse', 'hut', 'jaguar', 'totem', 'lookout', 'hollow', 'pyramid', 'canoe', 'parrot'],
  desert: ['palm', 'palm-small', 'palm-dates', 'cactus', 'bush', 'rock', 'crate', 'pot', 'column', 'statue', 'arch', 'house', 'well', 'camel', 'wall', 'tent', 'lookout', 'skull', 'signpost', 'campfire', 'oasispool', 'sandfort', 'fossil', 'mesa'],
  saudi: ['palm', 'palm-trio', 'bush', 'rock', 'canyon', 'oasis', 'palm-grove', 'tomb', 'haram', 'medina', 'albalad', 'fort', 'cliff', 'tower', 'asir', 'maraya', 'fountain', 'khobar', 'ithra', 'halfmoon', 'fanateer', 'tarout', 'ibrahim', 'uqair', 'jawatha', 'qaisariya', 'qatif', 'dammam', 'dougha', 'qarah', 'asfar', 'ahsa', 'darin'],
  egypt: ['palm', 'palm-small', 'bush', 'rock', 'giza', 'sphinx', 'karnak', 'valleykings', 'hatshepsut', 'abusimbel', 'djoser', 'philae', 'citadel', 'luxor', 'stcatherine', 'qaitbay', 'edfu', 'gem', 'catacombs'],
  crystal: ['crystal-cluster', 'crystal-small', 'boulder', 'stone', 'crystal-purple', 'crystal-blue', 'cave', 'statue', 'waterfall', 'gate', 'shrine', 'arch', 'lamp', 'flowers'],
  autumn: ['tree-big', 'tree-small', 'bush', 'rock', 'flowers', 'statue', 'waterfall', 'arch', 'wall', 'torch', 'treehouse', 'hut', 'jaguar', 'totem', 'lookout', 'hollow', 'pyramid', 'canoe', 'parrot'],
  night: ['tree-big', 'tree-small', 'bush', 'rock', 'flowers', 'statue', 'waterfall', 'arch', 'wall', 'torch', 'treehouse', 'hut', 'jaguar', 'totem', 'lookout', 'hollow', 'pyramid', 'canoe', 'parrot'],
  frost: ['tree-big', 'tree-small', 'bush', 'rock', 'crate', 'pot', 'column', 'statue', 'arch', 'house', 'well', 'torch', 'wall'],
};
const GROUND: Record<WorldId, string[]> = {
  jungle: ['grass', 'path', 'water', 'bridge'],
  desert: ['sand', 'stone-path', 'dune', 'shore'],
  saudi: ['sand', 'path', 'redsand', 'water'],
  egypt: ['sand', 'path', 'water', 'bridge'],
  crystal: ['floor', 'path', 'water', 'bridge'],
  autumn: ['grass', 'path', 'water', 'bridge'],
  night: ['grass', 'path', 'water', 'bridge'],
  frost: ['snow', 'stone-path', 'drift', 'ice'],
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
