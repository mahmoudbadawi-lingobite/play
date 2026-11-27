/** Critter Clash: asset list, sprite metrics and a small image loader. All files live in public/critter/. */

const BASE = `${import.meta.env.BASE_URL}critter/`;

export const ANIMALS = ['hippo', 'llama', 'chicken', 'sloth', 'walrus', 'penguin', 'bunny', 'goat', 'frog', 'octopus'] as const;
export type Species = (typeof ANIMALS)[number];
export const POSES = ['idle', 'aim', 'hit', 'happy', 'sad', 'water', 'walk_a', 'walk_b'] as const;
export type Pose = (typeof POSES)[number];

/** Measurements of each animal's idle pose in its 512 x 512 canvas (from assets_manifest.json). */
export const ANIMAL_INFO: Record<Species, { feet: number; cx: number; h: number; bbox: [number, number, number, number] }> = {
  bunny: { feet: 482, cx: 231, h: 420, bbox: [44, 62, 419, 482] },
  chicken: { feet: 475, cx: 254, h: 422, bbox: [80, 53, 428, 475] },
  frog: { feet: 419, cx: 256, h: 313, bbox: [59, 106, 453, 419] },
  goat: { feet: 492, cx: 255, h: 410, bbox: [52, 82, 459, 492] },
  hippo: { feet: 460, cx: 260, h: 384, bbox: [60, 76, 460, 460] },
  llama: { feet: 466, cx: 238, h: 390, bbox: [59, 76, 418, 466] },
  octopus: { feet: 471, cx: 256, h: 372, bbox: [68, 99, 444, 471] },
  penguin: { feet: 482, cx: 251, h: 418, bbox: [105, 64, 398, 482] },
  sloth: { feet: 484, cx: 225, h: 383, bbox: [28, 101, 423, 484] },
  walrus: { feet: 473, cx: 253, h: 360, bbox: [69, 113, 438, 473] },
};

export type CoverName = 'boulder' | 'wall' | 'crates' | 'barrel' | 'hay' | 'log';
export type CoverState = 'intact' | 'cracked' | 'rubble';

/** Cover objects: size as a multiple of an animal (175 px), canvas metrics, toughness (hits) and whether an animal can hop onto it. */
export const COVER_INFO: Record<CoverName, { hMul: number; bbox: [number, number, number, number]; height: number; ground: number; hits: number; hoppable: boolean }> = {
  boulder: { hMul: 0.64, bbox: [32, 129, 480, 491], height: 362, ground: 486, hits: 6, hoppable: false },
  wall: { hMul: 1.1, bbox: [45, 258, 468, 471], height: 213, ground: 467, hits: 5, hoppable: false },
  crates: { hMul: 1.3, bbox: [134, 25, 380, 484], height: 459, ground: 483, hits: 3, hoppable: false },
  barrel: { hMul: 0.9, bbox: [72, 55, 438, 492], height: 437, ground: 488, hits: 3, hoppable: true },
  hay: { hMul: 0.7, bbox: [33, 152, 472, 496], height: 344, ground: 493, hits: 2, hoppable: true },
  log: { hMul: 0.6, bbox: [24, 272, 491, 462], height: 190, ground: 460, hits: 3, hoppable: true },
};

export const animalPath = (s: Species, p: Pose) => `animals/animal_${s}_${p}.webp`;
export const coverPath = (c: CoverName, st: CoverState) => `props/cover_${c}_${st}.webp`;

export const WORLD_FILES = [
  'world/bg_meadow_far.webp', 'world/bg_meadow_wide_b.webp', 'world/bg_meadow_wide_c.webp',
  'world/cliff_face_512.webp', 'world/cap_grass_vines.webp', 'world/cap_underside_rock.webp', 'world/edge_side_rock.webp',
];
export const PROP_FILES = [
  'props/prop_lantern_post.webp', 'props/prop_fence.webp', 'props/prop_flag_blue.webp', 'props/prop_flag_red.webp',
  'props/prop_pine.webp', 'props/prop_windmill.webp', 'props/bridge_segment.webp', 'props/bridge_cap.webp', 'props/prop_signpost.webp',
  'props/fg_tree_topleft.webp', 'props/fg_rocks_bottomright.webp', 'props/fg_bushes_bottomleft.webp',
];
export const UI_FILES = [
  'ui/ui_marker_blue.webp', 'ui/ui_marker_red.webp', 'ui/ui_nametag.webp', 'ui/ui_crosshair.webp',
  'ui/ui_btn_left.webp', 'ui/ui_btn_right.webp', 'ui/ui_btn_hop.webp', 'ui/ui_btn_fire.webp',
];
export const assetUrl = (path: string) => BASE + path;
/** the paw/claw/hoof picture that stands for a player or an animal (one per species) */
export const limbUrl = (species: Species) => `${BASE}limbs/limb_${species}.webp`;

export type ImageStore = Map<string, HTMLImageElement>;

function loadOne(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`Could not load ${path}`));
    im.src = BASE + path;
  });
}

/** Loads every file (a few at a time) and reports progress 0..1. */
export async function loadImages(paths: string[], store: ImageStore, onProgress?: (p: number) => void): Promise<void> {
  const todo = paths.filter((p) => !store.has(p));
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const path = todo[next++];
      try {
        store.set(path, await loadOne(path));
      } catch (e) {
        // a missing walking frame falls back to its twin, then to the idle pose, so one bad file cannot stop the game
        const alt = path.includes('_walk_a') ? path.replace('_walk_a', '_walk_b') : path.includes('_walk_b') ? path.replace('_walk_b', '_walk_a') : null;
        const idle = path.replace(/_(walk_a|walk_b|aim|hit|happy|sad|water)\.webp$/, '_idle.webp');
        if (!path.startsWith('animals/')) throw e;
        try { store.set(path, alt ? await loadOne(alt) : await loadOne(idle)); } catch { store.set(path, await loadOne(idle)); }
      }
      done++;
      onProgress?.(done / todo.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
}

/** The files a match with these species needs. */
export function speciesFiles(species: Species[]): string[] {
  return species.flatMap((s) => POSES.map((p) => animalPath(s, p)));
}
export const COVER_FILES: string[] = (Object.keys(COVER_INFO) as CoverName[]).flatMap((c) => (['intact', 'cracked', 'rubble'] as CoverState[]).map((s) => coverPath(c, s)));

/**
 * Extra backgrounds: any picture saved as `public/critter/world/bg_random_1.webp` ... `bg_random_6.webp` is added to the
 * ones a match can pick from. A match picks one at random. Missing files are simply skipped.
 */
export async function probeBackgrounds(store: ImageStore): Promise<string[]> {
  const found: string[] = [];
  await Promise.all([1, 2, 3, 4, 5, 6].map(async (i) => {
    const path = `world/bg_random_${i}.webp`;
    try { store.set(path, await loadOne(path)); found.push(path); } catch { /* not there */ }
  }));
  return found.sort();
}
