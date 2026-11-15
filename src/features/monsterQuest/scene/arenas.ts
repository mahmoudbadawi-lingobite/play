/**
 * Battle arenas: one painted picture per zone (public/monster-quest/arenas/<zone id>.webp) and where the two animated
 * braziers stand in it. Everything here is plain data, so tuning an arena never means touching the battle code.
 *
 * Coordinates are in PIXELS OF THE PICTURE (the pictures are about 1733 x 907). The stage scales them to any screen.
 */
export const ARENA_W = 1733;
export const ARENA_H = 907;

/** A brazier: x = centre of its base, y = the line the base stands on (top of the column), w = width of one animation frame. */
export interface Brazier { x: number; y: number; w: number }
export interface ArenaDef { name: string; braziers: [Brazier, Brazier] }

export const ARENAS: Record<string, ArenaDef> = {
  forest: { name: 'Green Forest', braziers: [{ x: 487, y: 404, w: 140 }, { x: 1258, y: 404, w: 140 }] },
  desert: { name: 'Sunbaked Desert', braziers: [{ x: 477, y: 374, w: 149 }, { x: 1260, y: 374, w: 149 }] },
  snow: { name: 'Frostpeak Tundra', braziers: [{ x: 493, y: 368, w: 145 }, { x: 1238, y: 368, w: 145 }] },
  jungle: { name: 'Emerald Jungle', braziers: [{ x: 487, y: 384, w: 145 }, { x: 1245, y: 384, w: 145 }] },
  volcano: { name: 'Cinder Volcano', braziers: [{ x: 478, y: 421, w: 122 }, { x: 1260, y: 421, w: 122 }] },
  ocean: { name: 'Coral Coast', braziers: [{ x: 505, y: 376, w: 140 }, { x: 1238, y: 376, w: 140 }] },
  crystal: { name: 'Crystal Cave', braziers: [{ x: 502, y: 358, w: 145 }, { x: 1232, y: 358, w: 145 }] },
  city: { name: 'Monster City', braziers: [{ x: 475, y: 388, w: 149 }, { x: 1255, y: 388, w: 149 }] },
};
export const DEFAULT_ARENA = 'forest';
export const arenaFor = (zoneId: string | null | undefined) => (zoneId && ARENAS[zoneId] ? zoneId : DEFAULT_ARENA);
export const arenaImage = (zoneId: string) => `${import.meta.env.BASE_URL}monster-quest/arenas/${arenaFor(zoneId)}.webp`;
export const BRAZIER_IMAGE = `${import.meta.env.BASE_URL}monster-quest/arenas/brazier.webp`;
/** One animation frame of the brazier strip (6 frames side by side). */
export const BRAZIER_FRAME = { w: 135, h: 236, frames: 6, fps: 8 };

/**
 * Monsters that fly: they hover in the air above their spot instead of standing on the ground.
 * Species ids are the monster names in lower case (see supabase/monster_quest_roster_patch.sql).
 */
export const FLYING_MONSTERS = new Set(['drakko', 'aero', 'bugsy', 'skyro', 'aquos', 'vampi', 'owly', 'stormy', 'zeezy']);
export const isFlying = (speciesId: string, spriteUrl?: string | null) => {
  const sprite = spriteUrl?.split('/').pop()?.replace(/\.\w+$/, '') ?? '';
  return FLYING_MONSTERS.has(speciesId) || FLYING_MONSTERS.has(sprite);
};

/**
 * Where the two fighters stand, as % of the picture. Both feet are on the SAME ground line and face each other.
 *  dx     = how far each monster stands from the centre of the picture (% of picture width)
 *  ground = the ground line the feet stand on (% of picture height)      size = monster width (% of picture width)
 *  fly    = how high a flying monster hovers above the ground line (% of picture height)
 *  lunge  = how far a monster darts towards the other one when it attacks (% of picture width)
 */
export const STAND = {
  dx: 18,
  ground: 73,
  size: 16,
  fly: 15,
  lunge: 13,
} as const;
