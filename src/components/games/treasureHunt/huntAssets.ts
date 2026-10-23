/**
 * Treasure Hunt art: the explorers, the two worlds and the chests.
 * All pictures live in public/treasure/<folder>/<name>.png and are loaded once.
 */

export type WorldId = 'jungle' | 'desert';

export interface Explorer {
  id: string;
  name: string;
}

/** The five explorers a player can choose from (sprite sheets in public/treasure/chars). */
export const EXPLORERS: Explorer[] = [
  { id: 'pink', name: 'Maya' },
  { id: 'goggles', name: 'Zed' },
  { id: 'hijab', name: 'Noor' },
  { id: 'redcap', name: 'Sami' },
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
};

const PROPS: Record<WorldId, string[]> = {
  jungle: ['tree-big', 'tree-small', 'bush', 'rock', 'flowers', 'statue', 'waterfall', 'arch', 'wall', 'torch'],
  desert: ['palm', 'palm-small', 'palm-dates', 'cactus', 'bush', 'rock', 'crate', 'pot', 'column', 'statue', 'arch', 'house', 'well', 'camel', 'wall'],
};
const GROUND: Record<WorldId, string[]> = {
  jungle: ['grass', 'path', 'water', 'bridge'],
  desert: ['sand', 'stone-path', 'dune', 'shore'],
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

let cache: Promise<HuntAssets> | null = null;

/** Loads every picture once. A picture that fails to load is skipped (the game still works without it). */
export function loadHuntAssets(): Promise<HuntAssets> {
  if (cache) return cache;
  const names: string[] = [
    ...EXPLORERS.map((e) => `chars/${e.id}`),
    ...(['jungle', 'desert'] as WorldId[]).flatMap((w) => [...GROUND[w], ...PROPS[w]].map((n) => `${w}/${n}`)),
    ...UI.map((n) => `ui/${n}`),
  ];
  const img: Record<string, HTMLImageElement> = {};
  cache = Promise.all(
    names.map(
      (n) =>
        new Promise<void>((resolve) => {
          const el = new Image();
          el.onload = () => {
            img[n] = el;
            resolve();
          };
          el.onerror = () => resolve();
          el.src = huntImageUrl(n);
        }),
    ),
  ).then(() => ({ img }));
  return cache;
}
