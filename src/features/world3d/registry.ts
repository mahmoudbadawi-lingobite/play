import type { WorldDef } from './build';
import { ADVENTURE_AWAITS, ENGLISH_VILLAGE, NEON_CITY } from './worldsA';
import { DREAM_WORLD, PIRATE_WORLD, SNOW_WORLD } from './worldsB';
import { SPACE_WORLD, THEME_WORLD, VALLEY_WORLD } from './worldsC';

/** The nine worlds, in the order they are shown. */
export const WORLD_LIST: WorldDef[] = [ENGLISH_VILLAGE, ADVENTURE_AWAITS, NEON_CITY, SNOW_WORLD, DREAM_WORLD, PIRATE_WORLD, THEME_WORLD, SPACE_WORLD, VALLEY_WORLD];

export const WORLD_DEFS: Record<string, WorldDef> = Object.fromEntries(WORLD_LIST.map((w) => [w.id, w]));
