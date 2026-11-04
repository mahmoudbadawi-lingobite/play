/**
 * Monster Quest uses the same explorers as Treasure Hunt: the sprite sheets in public/treasure/chars/<id>.png
 * (3 columns = stand, step, step; 4 rows = down, left, right, up; each frame 128x160).
 * Change a sheet there and both games follow. The first explorer is free; the others cost coins
 * (prices are the `char_<id>` rows in mq_cosmetics, see supabase/monster_quest_explorers_patch.sql).
 */
export interface Character { id: string; name: string; blurb: string }
export const CHARACTERS: Character[] = [
  { id: 'pink', name: 'Rawan', blurb: 'Pink adventurer' },
  { id: 'goggles', name: 'Nour', blurb: 'Goggles explorer' },
  { id: 'hijab', name: 'Mayar', blurb: 'Brave explorer' },
  { id: 'redcap', name: 'Mohamed', blurb: 'Red-cap explorer' },
  { id: 'flower', name: 'Mariam', blurb: 'Flower explorer' },
  { id: 'robot', name: 'Robo', blurb: 'Friendly robot' },
];
export const DEFAULT_CHARACTER = 'pink';
export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
export const characterKey = (id: string) => `char_${id}`;

export type Facing = 'down' | 'up' | 'side';
/** Sprite sheet geometry (identical to Treasure Hunt). `feet` = y of the soles inside a frame. */
export const SHEET = { w: 128, h: 160, cols: 3, rows: 4, feet: 157 } as const;
export const sheetUrl = (id: string) => `${import.meta.env.BASE_URL}treasure/chars/${id}.png`;
export interface FrameRect { sx: number; sy: number; sw: number; sh: number }
/** Source rectangle of a frame. Side view uses the real "right" row, or the "left" row when walking left. */
export const frameRect = (facing: Facing, step: 0 | 1 | 2, left = false): FrameRect => ({
  sx: step * SHEET.w, sy: (facing === 'down' ? 0 : facing === 'up' ? 3 : left ? 1 : 2) * SHEET.h, sw: SHEET.w, sh: SHEET.h,
});
