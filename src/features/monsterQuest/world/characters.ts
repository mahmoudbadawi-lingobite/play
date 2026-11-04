/** The seven playable explorers. Artwork is the supplied sprite sheets, cut out unchanged (see public/monster-quest/players). */
export interface Character { id: string; name: string; blurb: string; /** has a real back view; otherwise the front frames are reused when walking up */ hasBack: boolean }
export const CHARACTERS: Character[] = [
  { id: 'boy', name: 'Rusty', blurb: 'Backpack explorer', hasBack: true },
  { id: 'elf', name: 'Fern', blurb: 'Forest archer', hasBack: true },
  { id: 'scout', name: 'Skye', blurb: 'Sunny scout', hasBack: false },
  { id: 'sage', name: 'Willow', blurb: 'Silver ranger', hasBack: false },
  { id: 'fairy', name: 'Twinkle', blurb: 'Star-wand fairy', hasBack: false },
  { id: 'troll', name: 'Bramble', blurb: 'Flower-basket troll', hasBack: false },
  { id: 'dwarf', name: 'Cogsworth', blurb: 'Gear-pack tinkerer', hasBack: false },
];
export const DEFAULT_CHARACTER = 'boy';
export const characterById = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
export const frameUrl = (base: string, id: string, facing: 'down' | 'up' | 'side', step: 0 | 1 | 2) => `${base}${id}/${facing}${step}.png`;
