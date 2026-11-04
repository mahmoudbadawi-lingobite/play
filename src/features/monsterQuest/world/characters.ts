/**
 * The playable explorers. Artwork lives in public/monster-quest/players/<id>/{down,side,up}{0,1,2}.png
 * (260x232 frames, feet on line 222). To use newly generated artwork, drop files with the same names over the old ones.
 * The first explorer is chosen for free; the others are bought with coins (prices live in the mq_cosmetics table,
 * rows `char_<id>`, see supabase/monster_quest_roster_patch.sql).
 */
export interface Character { id: string; name: string; blurb: string; /** has a real back view; otherwise the front frames are reused when walking up */ hasBack: boolean }
export const CHARACTERS: Character[] = [
  { id: 'boy', name: 'Rusty', blurb: 'Backpack explorer', hasBack: true },
  { id: 'elf', name: 'Fern', blurb: 'Forest archer', hasBack: true },
  { id: 'scout', name: 'Skye', blurb: 'Sunny scout', hasBack: true },
  { id: 'sage', name: 'Willow', blurb: 'Silver ranger', hasBack: true },
  { id: 'troll', name: 'Bramble', blurb: 'Flower-basket troll', hasBack: true },
  { id: 'fairy', name: 'Twinkle', blurb: 'Star-wand fairy', hasBack: true },
  { id: 'dwarf', name: 'Cogsworth', blurb: 'Gear-pack tinkerer', hasBack: true },
];
export const DEFAULT_CHARACTER = 'boy';
export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
export const characterKey = (id: string) => `char_${id}`;
export const frameUrl = (base: string, id: string, facing: 'down' | 'up' | 'side', step: 0 | 1 | 2) => `${base}${id}/${facing}${step}.png`;
export const PLAYER_BASE = `${import.meta.env.BASE_URL}monster-quest/players/`;
