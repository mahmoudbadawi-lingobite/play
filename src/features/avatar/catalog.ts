/**
 * Style Store catalog. Pure data (no three.js) so the store, the 2D fallback and
 * the rest of the app can use it without loading the 3D chunk.
 * Every item is tagged boy / girl / unisex; the store only shows a character the
 * items that suit them.
 */

export type Gender = 'boy' | 'girl';
export type ItemGender = Gender | 'unisex';
export type Slot = 'hair' | 'outfit' | 'shoes' | 'hat' | 'accessory' | 'backpack' | 'pet' | 'character';
export type Category = 'outfits' | 'hats' | 'hair' | 'accessories' | 'shoes' | 'backpacks' | 'pets' | 'sets';
export type Rarity = 'common' | 'rare' | 'epic';

export interface Item {
  id: string;
  name: string;
  /** 'set' items are bundles of other items. */
  slot: Slot | 'set';
  category: Category;
  gender: ItemGender;
  price: number;
  rarity: Rarity;
  blurb: string;
  /** Style parameters read by the 3D / 2D builders. */
  spec: Record<string, string | number | boolean>;
  /** Set-only pieces are not listed on their own. */
  hidden?: boolean;
  /** Sets: ids of the pieces they contain. */
  pieces?: string[];
  /** Added by an admin (not part of the built-in catalog). */
  custom?: boolean;
  /** A built-in item that an admin changed (price, name, colors, text...). */
  edited?: boolean;
  /** Hidden from the store by an admin (students who own it can still wear it). */
  disabled?: boolean;
}

/** Optional printed text on an outfit: front and back, Arabic or English. */
export interface OutfitText {
  front: string;
  back: string;
  color: string;
}

export function cleanOutfitText(raw: unknown): OutfitText | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = raw as Partial<OutfitText>;
  const front = typeof t.front === 'string' ? t.front.trim().slice(0, 30) : '';
  const back = typeof t.back === 'string' ? t.back.trim().slice(0, 30) : '';
  if (!front && !back) return null;
  return { front, back, color: typeof t.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(t.color) ? t.color : '#FFFFFF' };
}

/** The printed text (front / back) written in an item's spec, if any. */
export function textOfSpec(spec: Record<string, string | number | boolean>): OutfitText | null {
  return cleanOutfitText({ front: spec.frontText, back: spec.backText, color: spec.textColor });
}

export interface Look {
  hair: string;
  outfit: string;
  shoes: string;
  hat: string | null;
  accessory: string | null;
  backpack: string | null;
  pet: string | null;
  /** A full character skin (animal, robot, mascot...). Replaces the hero's body while worn. */
  character: string | null;
  /** Printed text of the equipped set (outfits carry their own text in their spec). */
  outfitText: OutfitText | null;
  skin: string;
  hairColor: string;
}

export const SKINS: { id: string; name: string; color: string }[] = [
  { id: 'skin1', name: 'Light', color: '#FFDDBF' },
  { id: 'skin2', name: 'Fair', color: '#F6C9A0' },
  { id: 'skin3', name: 'Tan', color: '#E8B07C' },
  { id: 'skin4', name: 'Caramel', color: '#C98B5B' },
  { id: 'skin5', name: 'Brown', color: '#A0673F' },
  { id: 'skin6', name: 'Deep', color: '#6F4426' },
];

export const HAIR_COLORS: { id: string; name: string; color: string }[] = [
  { id: 'brown', name: 'Brown', color: '#5A3825' },
  { id: 'black', name: 'Black', color: '#1F1B24' },
  { id: 'blonde', name: 'Blonde', color: '#E9C46A' },
  { id: 'ginger', name: 'Ginger', color: '#D9622B' },
  { id: 'pink', name: 'Pink', color: '#FF7EB6' },
  { id: 'blue', name: 'Blue', color: '#4A7BFF' },
  { id: 'purple', name: 'Purple', color: '#8B5CF6' },
  { id: 'white', name: 'Silver', color: '#E4E1F0' },
];

export const skinColor = (id: string) => (SKINS.find((s) => s.id === id) ?? SKINS[0]).color;
export const hairColor = (id: string) => (HAIR_COLORS.find((s) => s.id === id) ?? HAIR_COLORS[0]).color;

type Spec = Item['spec'];
const mk = (
  id: string,
  name: string,
  slot: Item['slot'],
  category: Category,
  gender: ItemGender,
  price: number,
  rarity: Rarity,
  blurb: string,
  spec: Spec,
  extra: Partial<Item> = {},
): Item => ({ id, name, slot, category, gender, price, rarity, blurb, spec, ...extra });

// ---------------------------------------------------------------- outfits
const outfit = (id: string, name: string, g: ItemGender, price: number, rarity: Rarity, blurb: string, spec: Spec, hidden = false) =>
  mk(`outfit-${id}`, name, 'outfit', 'outfits', g, price, rarity, blurb, spec, hidden ? { hidden: true } : {});

const OUTFITS: Item[] = [
  // boys
  outfit('b-tee', 'Sky Tee', 'boy', 0, 'common', 'A fresh blue tee and jeans.', { kind: 'tee', top: '#3D7BFF', bottom: '#2B3A67', bottomKind: 'pants', accent: '#FFFFFF' }),
  outfit('b-hoodie', 'Explorer Hoodie', 'boy', 60, 'common', 'A classic hoodie for every adventure.', { kind: 'hoodie', top: '#E8453C', bottom: '#2B3A67', bottomKind: 'pants', accent: '#FFFFFF' }),
  outfit('b-stripes', 'Sunny Stripes', 'boy', 60, 'common', 'Bright stripes and khaki shorts.', { kind: 'stripes', top: '#FFC83D', bottom: '#C9A66B', bottomKind: 'shorts', accent: '#FFFFFF' }),
  outfit('b-soccer', 'Soccer Kit', 'boy', 70, 'common', 'Ready for the big match.', { kind: 'tee', top: '#2DB36B', bottom: '#FFFFFF', bottomKind: 'shorts', accent: '#FFFFFF' }),
  outfit('b-jacket', 'Urban Jacket', 'boy', 120, 'rare', 'Cool black jacket with a zip.', { kind: 'jacket', top: '#2B2B3A', bottom: '#4B4B5E', bottomKind: 'pants', accent: '#FFC83D', collar: '#1A1A24' }),
  outfit('b-dino', 'Dino Hoodie', 'boy', 140, 'rare', 'Roar! A hoodie with a dino hood.', { kind: 'hoodie', top: '#34B35A', bottom: '#2B3A67', bottomKind: 'pants', accent: '#FFF4C2', spikes: true }),
  outfit('b-space', 'Space Suit', 'boy', 240, 'epic', 'A suit built for blasting off.', { kind: 'suit', top: '#F4F6FF', bottom: '#F4F6FF', bottomKind: 'pants', accent: '#3D7BFF' }),
  outfit('b-robe', 'Royal Robe', 'boy', 260, 'epic', 'Fit for a block kingdom.', { kind: 'robe', top: '#6B3FD0', bottom: '#6B3FD0', bottomKind: 'none', accent: '#FFC83D' }),
  outfit('b-lava', 'Lava Armor', 'boy', 0, 'epic', 'Glowing armor from the Lava Lab.', { kind: 'armor', top: '#2B2540', bottom: '#2B2540', bottomKind: 'pants', accent: '#FF7A1F' }, true),
  outfit('b-candy', 'Candy Jacket', 'boy', 0, 'epic', 'Sweet polka-dot jacket.', { kind: 'candy', top: '#FF8AC0', bottom: '#7FE3C4', bottomKind: 'pants', accent: '#FFFFFF' }, true),
  outfit('b-pilot', 'Pilot Jacket', 'boy', 0, 'epic', 'A bomber jacket for sky pilots.', { kind: 'jacket', top: '#8A5A33', bottom: '#3A3F5C', bottomKind: 'pants', accent: '#F4E9D2', collar: '#F4E9D2' }, true),
  // girls
  outfit('g-tee', 'Sunny Tee', 'girl', 0, 'common', 'A coral tee with denim shorts.', { kind: 'tee', top: '#FF7A59', bottom: '#4A6FA5', bottomKind: 'shorts', accent: '#FFFFFF' }),
  outfit('g-hoodie', 'Rainbow Hoodie', 'girl', 60, 'common', 'Cozy pink hoodie with a heart.', { kind: 'hoodie', top: '#FF8CC6', bottom: '#F4F6FF', bottomKind: 'pants', accent: '#FFFFFF' }),
  outfit('g-dress', 'Meadow Dress', 'girl', 70, 'common', 'A fresh mint dress.', { kind: 'dress', top: '#7FE3C4', bottom: '#7FE3C4', bottomKind: 'none', accent: '#FFFFFF' }),
  outfit('g-sport', 'Sport Kit', 'girl', 70, 'common', 'Sporty tee and skirt.', { kind: 'tee', top: '#3D7BFF', bottom: '#2B3A67', bottomKind: 'skirt', accent: '#FFFFFF' }),
  outfit('g-denim', 'Denim Jacket', 'girl', 120, 'rare', 'A denim jacket over a white tee.', { kind: 'jacket', top: '#4A7BC8', bottom: '#F4F6FF', bottomKind: 'skirt', accent: '#FFFFFF', collar: '#3A63A8' }),
  outfit('g-bunny', 'Bunny Hoodie', 'girl', 140, 'rare', 'A fluffy white hoodie with bunny ears.', { kind: 'hoodie', top: '#FFFFFF', bottom: '#FFB3D1', bottomKind: 'pants', accent: '#FFB3D1', ears: true }),
  outfit('g-space', 'Space Suit', 'girl', 240, 'epic', 'A suit built for blasting off.', { kind: 'suit', top: '#F4F6FF', bottom: '#F4F6FF', bottomKind: 'pants', accent: '#FF5FA2' }),
  outfit('g-gown', 'Royal Gown', 'girl', 260, 'epic', 'A sparkling purple gown.', { kind: 'dress', top: '#8B5CF6', bottom: '#8B5CF6', bottomKind: 'none', accent: '#FFC83D', long: true }),
  outfit('g-lava', 'Lava Armor', 'girl', 0, 'epic', 'Glowing armor from the Lava Lab.', { kind: 'armor', top: '#3A2347', bottom: '#3A2347', bottomKind: 'pants', accent: '#FF5F8A' }, true),
  outfit('g-candy', 'Candy Dress', 'girl', 0, 'epic', 'A sweet polka-dot dress.', { kind: 'dress', top: '#FFB3D1', bottom: '#FFB3D1', bottomKind: 'none', accent: '#FFFFFF', dots: true }, true),
  outfit('g-pilot', 'Pilot Jacket', 'girl', 0, 'epic', 'A bomber jacket for sky pilots.', { kind: 'jacket', top: '#B56A8A', bottom: '#3A3F5C', bottomKind: 'pants', accent: '#F4E9D2', collar: '#F4E9D2' }, true),
];

// ---------------------------------------------------------------- hair
const hair = (id: string, name: string, g: Gender, price: number, rarity: Rarity, blurb: string, style: string) =>
  mk(`hair-${id}`, name, 'hair', 'hair', g, price, rarity, blurb, { style });

const HAIR: Item[] = [
  hair('b-short', 'Short Cut', 'boy', 0, 'common', 'Neat and tidy.', 'short'),
  hair('b-spiky', 'Spiky', 'boy', 40, 'common', 'Spikes up to the sky.', 'spiky'),
  hair('b-side', 'Side Part', 'boy', 40, 'common', 'Smart side-swept style.', 'sidepart'),
  hair('b-curly', 'Curly', 'boy', 50, 'common', 'Bouncy curls.', 'curly'),
  hair('b-mohawk', 'Mohawk', 'boy', 90, 'rare', 'Stand out in the crowd.', 'mohawk'),
  hair('b-messy', 'Messy Long', 'boy', 90, 'rare', 'Long, wild and free.', 'messy'),
  hair('g-ponytail', 'Ponytail', 'girl', 0, 'common', 'Sporty and swishy.', 'ponytail'),
  hair('g-bob', 'Bob', 'girl', 40, 'common', 'A smooth bob cut.', 'bob'),
  hair('g-pigtails', 'Pigtails', 'girl', 40, 'common', 'Two playful pigtails.', 'pigtails'),
  hair('g-long', 'Long Waves', 'girl', 50, 'common', 'Long flowing hair.', 'long'),
  hair('g-braid', 'Braid', 'girl', 90, 'rare', 'A neat back braid.', 'braid'),
  hair('g-buns', 'Space Buns', 'girl', 90, 'rare', 'Two cute buns on top.', 'buns'),
];

// ---------------------------------------------------------------- hats
const hat = (id: string, name: string, price: number, rarity: Rarity, blurb: string, spec: Spec) =>
  mk(`hat-${id}`, name, 'hat', 'hats', 'unisex', price, rarity, blurb, spec);

const HATS: Item[] = [
  hat('cap', 'Red Cap', 40, 'common', 'A sporty red cap.', { style: 'cap', color: '#E8453C', accent: '#B72F28' }),
  hat('beanie', 'Cozy Beanie', 40, 'common', 'Warm and woolly.', { style: 'beanie', color: '#3D7BFF', accent: '#FFFFFF' }),
  hat('party', 'Party Hat', 50, 'common', 'Every day is a party!', { style: 'party', color: '#FF5FA2', accent: '#FFE066' }),
  hat('explorer', 'Explorer Hat', 70, 'common', 'For jungle adventures.', { style: 'explorer', color: '#C9A66B', accent: '#6B4A2B' }),
  hat('cat', 'Cat Ears', 90, 'rare', 'Purr-fect headband.', { style: 'catears', color: '#FF8CC6', accent: '#FFFFFF' }),
  hat('wizard', 'Wizard Hat', 100, 'rare', 'Abracadabra!', { style: 'wizard', color: '#6B3FD0', accent: '#FFE066' }),
  hat('helmet', 'Space Helmet', 160, 'rare', 'Ready for zero gravity.', { style: 'helmet', color: '#F4F6FF', accent: '#4AA8FF', hidesHair: true }),
  hat('crown', 'Gold Crown', 220, 'epic', 'Rule the blocky kingdom.', { style: 'crown', color: '#FFC83D', accent: '#E8453C' }),
];

// ---------------------------------------------------------------- accessories
const acc = (id: string, name: string, price: number, rarity: Rarity, blurb: string, spec: Spec) =>
  mk(`acc-${id}`, name, 'accessory', 'accessories', 'unisex', price, rarity, blurb, spec);

const ACCESSORIES: Item[] = [
  acc('round', 'Round Glasses', 40, 'common', 'Smart round specs.', { style: 'round', color: '#2B2B3A' }),
  acc('shades', 'Cool Shades', 50, 'common', 'Too cool for school.', { style: 'shades', color: '#1A1A24' }),
  acc('scarf', 'Red Scarf', 50, 'common', 'Snug and stylish.', { style: 'scarf', color: '#E8453C', accent: '#FFFFFF' }),
  acc('medal', 'Gold Medal', 60, 'common', 'You are a winner!', { style: 'medal', color: '#FFC83D', accent: '#3D7BFF' }),
  acc('goggles', 'Adventure Goggles', 70, 'common', 'Goggles on the forehead.', { style: 'goggles', color: '#FF9A1F', accent: '#4AA8FF' }),
  acc('phones', 'Blue Headphones', 90, 'rare', 'Music while you run.', { style: 'headphones', color: '#3D7BFF', accent: '#FFFFFF' }),
  acc('wings-star', 'Star Wings', 200, 'epic', 'Shiny golden wings.', { style: 'wingsStar', color: '#FFC83D', accent: '#FFFFFF' }),
  acc('wings-fairy', 'Fairy Wings', 200, 'epic', 'Glittery see-through wings.', { style: 'wingsFairy', color: '#9FE8FF', accent: '#FF9BD1' }),
];

// ---------------------------------------------------------------- shoes
const shoe = (id: string, name: string, g: ItemGender, price: number, rarity: Rarity, blurb: string, spec: Spec) =>
  mk(`shoes-${id}`, name, 'shoes', 'shoes', g, price, rarity, blurb, spec);

const SHOES: Item[] = [
  shoe('b-blue', 'Blue Sneakers', 'boy', 0, 'common', 'Comfy everyday sneakers.', { style: 'sneaker', color: '#3D7BFF', sole: '#FFFFFF', accent: '#FFC83D' }),
  shoe('b-red', 'Red High-tops', 'boy', 50, 'common', 'Bold high-tops.', { style: 'hightop', color: '#E8453C', sole: '#FFFFFF', accent: '#FFFFFF' }),
  shoe('b-boots', 'Green Boots', 'boy', 70, 'common', 'Sturdy trail boots.', { style: 'boot', color: '#2DB36B', sole: '#3A2B1F', accent: '#C9A66B' }),
  shoe('b-gold', 'Gold Runners', 'boy', 150, 'epic', 'Shiny, speedy runners.', { style: 'runner', color: '#FFC83D', sole: '#FFFFFF', accent: '#FF9A1F' }),
  shoe('g-pink', 'Pink Sneakers', 'girl', 0, 'common', 'Comfy everyday sneakers.', { style: 'sneaker', color: '#FF8CC6', sole: '#FFFFFF', accent: '#FFFFFF' }),
  shoe('g-purple', 'Purple High-tops', 'girl', 50, 'common', 'Bold high-tops.', { style: 'hightop', color: '#8B5CF6', sole: '#FFFFFF', accent: '#FFE066' }),
  shoe('g-rain', 'Rain Boots', 'girl', 70, 'common', 'Splash in puddles.', { style: 'boot', color: '#FFC83D', sole: '#3A2B1F', accent: '#FF8CC6' }),
  shoe('g-sparkle', 'Sparkle Runners', 'girl', 150, 'epic', 'Sparkly, speedy runners.', { style: 'runner', color: '#FF9BD1', sole: '#FFFFFF', accent: '#9FE8FF' }),
  shoe('space', 'Space Boots', 'unisex', 110, 'rare', 'Boots with glowing rings.', { style: 'space', color: '#F4F6FF', sole: '#4B5A7A', accent: '#4AE3FF' }),
  shoe('cloud', 'Cloud Shoes', 'unisex', 120, 'rare', 'Walk on fluffy clouds.', { style: 'cloud', color: '#FFFFFF', sole: '#CFE8FF', accent: '#FFFFFF' }),
];

// ---------------------------------------------------------------- backpacks
const pack = (id: string, name: string, price: number, rarity: Rarity, blurb: string, spec: Spec) =>
  mk(`pack-${id}`, name, 'backpack', 'backpacks', 'unisex', price, rarity, blurb, spec);

const BACKPACKS: Item[] = [
  pack('school', 'School Bag', 60, 'common', 'Books packed and ready.', { style: 'school', color: '#E8453C', accent: '#FFC83D' }),
  pack('explorer', 'Explorer Pack', 80, 'common', 'Everything for an expedition.', { style: 'explorer', color: '#3D7BFF', accent: '#FFC83D' }),
  pack('star', 'Star Bag', 80, 'common', 'A bag with a big star.', { style: 'star', color: '#FFC83D', accent: '#FFFFFF' }),
  pack('candy', 'Candy Pack', 100, 'rare', 'With a lollipop on top.', { style: 'candy', color: '#FF8AC0', accent: '#7FE3C4' }),
  pack('dino', 'Dino Pack', 120, 'rare', 'Spikes and a tail!', { style: 'dino', color: '#34B35A', accent: '#FFF4C2' }),
  pack('jet', 'Jet Pack', 220, 'epic', 'Rocket power on your back.', { style: 'jet', color: '#C9D1E6', accent: '#E8453C' }),
];

// ---------------------------------------------------------------- pets
const pet = (id: string, name: string, price: number, rarity: Rarity, blurb: string, spec: Spec) =>
  mk(`pet-${id}`, name, 'pet', 'pets', 'unisex', price, rarity, blurb, spec);

const PETS: Item[] = [
  pet('corgi', 'Corgi Pup', 150, 'rare', 'A fluffy loyal friend.', { style: 'corgi', color: '#F29B3D', accent: '#FFFFFF' }),
  pet('cat', 'Kitty', 140, 'rare', 'Soft, curious and cuddly.', { style: 'cat', color: '#8E96A8', accent: '#FFFFFF' }),
  pet('bunny', 'Bunny', 140, 'rare', 'Hop hop hop!', { style: 'bunny', color: '#FFFFFF', accent: '#FFB3D1' }),
  pet('fox', 'Little Fox', 160, 'rare', 'Clever and quick.', { style: 'fox', color: '#F2762E', accent: '#FFFFFF' }),
  pet('robo', 'Robo Buddy', 180, 'rare', 'A friendly little robot.', { style: 'robot', color: '#C9D1E6', accent: '#4AE3FF' }),
  pet('dragon', 'Baby Dragon', 280, 'epic', 'Tiny, green and fierce.', { style: 'dragon', color: '#34B35A', accent: '#FFE066' }),
];

// ---------------------------------------------------------------- sets
const PRICE_FACTOR = 0.65;
const roundTo5 = (n: number) => Math.round(n / 5) * 5;

const set = (id: string, name: string, g: Gender, blurb: string, pieces: string[]): Item =>
  mk(`set-${id}`, name, 'set', 'sets', g, 0, 'epic', blurb, {}, { pieces });

const SETS: Item[] = [
  set('b-space', 'Space Explorer', 'boy', 'Suit, boots, helmet and jet pack.', ['outfit-b-space', 'shoes-space', 'hat-helmet', 'pack-jet']),
  set('b-lava', 'Lava Hero', 'boy', 'Armor, high-tops, goggles and dino pack.', ['outfit-b-lava', 'shoes-b-red', 'acc-goggles', 'pack-dino']),
  set('b-candy', 'Candy Adventurer', 'boy', 'Jacket, cloud shoes, party hat and candy pack.', ['outfit-b-candy', 'shoes-cloud', 'hat-party', 'pack-candy']),
  set('b-pilot', 'Sky Pilot', 'boy', 'Bomber jacket, boots, goggles and explorer pack.', ['outfit-b-pilot', 'shoes-b-boots', 'acc-goggles', 'pack-explorer']),
  set('g-space', 'Space Explorer', 'girl', 'Suit, boots, helmet and jet pack.', ['outfit-g-space', 'shoes-space', 'hat-helmet', 'pack-jet']),
  set('g-lava', 'Lava Hero', 'girl', 'Armor, high-tops, goggles and dino pack.', ['outfit-g-lava', 'shoes-g-purple', 'acc-goggles', 'pack-dino']),
  set('g-candy', 'Candy Adventurer', 'girl', 'Dress, cloud shoes, party hat and candy pack.', ['outfit-g-candy', 'shoes-cloud', 'hat-party', 'pack-candy']),
  set('g-pilot', 'Sky Pilot', 'girl', 'Bomber jacket, rain boots, goggles and explorer pack.', ['outfit-g-pilot', 'shoes-g-rain', 'acc-goggles', 'pack-explorer']),
];

// Set-only pieces cost nothing on their own; their value comes from the set price.
export const PIECE_VALUE: Record<string, number> = { 'outfit-b-lava': 200, 'outfit-b-candy': 180, 'outfit-b-pilot': 180, 'outfit-g-lava': 200, 'outfit-g-candy': 180, 'outfit-g-pilot': 180 };

// ---------------------------------------------------------------- Adventurous Girl / Boy sets
const ADVENTURE_PIECES: Item[] = [
  outfit('g-adventure', 'Adventure Hoodie', 'girl', 0, 'epic', 'A pink hoodie with jeans.', { kind: 'hoodie', top: '#FF7FB5', bottom: '#4A6FA5', bottomKind: 'pants', accent: '#FFFFFF' }, true),
  outfit('b-adventure', 'Adventure Hoodie', 'boy', 0, 'epic', 'A blue hoodie with dark pants.', { kind: 'hoodie', top: '#2F6BFF', bottom: '#27324F', bottomKind: 'pants', accent: '#FFFFFF' }, true),
  mk('hat-cap-pink', 'Pink Cap', 'hat', 'hats', 'girl', 0, 'epic', 'A bright pink cap.', { style: 'cap', color: '#FF4F9A', accent: '#D93580' }, { hidden: true }),
  mk('hat-cap-blue', 'Blue Cap', 'hat', 'hats', 'boy', 0, 'epic', 'A sporty blue cap.', { style: 'cap', color: '#2F6BFF', accent: '#1F4FCC' }, { hidden: true }),
  mk('pack-adv-girl', 'Adventure Pack', 'backpack', 'backpacks', 'girl', 0, 'epic', 'A pink explorer pack.', { style: 'explorer', color: '#FF7FB5', accent: '#FFC83D' }, { hidden: true }),
  mk('pack-adv-boy', 'Adventure Pack', 'backpack', 'backpacks', 'boy', 0, 'epic', 'A blue explorer pack.', { style: 'explorer', color: '#2F6BFF', accent: '#FFC83D' }, { hidden: true }),
];
PIECE_VALUE['outfit-g-adventure'] = 180;
PIECE_VALUE['outfit-b-adventure'] = 180;
PIECE_VALUE['hat-cap-pink'] = 40;
PIECE_VALUE['hat-cap-blue'] = 40;
PIECE_VALUE['pack-adv-girl'] = 80;
PIECE_VALUE['pack-adv-boy'] = 80;
SETS.push(
  set('g-adventure', 'Adventurous Girl', 'girl', 'Pink cap, adventure hoodie and explorer pack.', ['outfit-g-adventure', 'hat-cap-pink', 'pack-adv-girl']),
  set('b-adventure', 'Adventurous Boy', 'boy', 'Blue cap, adventure hoodie and explorer pack.', ['outfit-b-adventure', 'hat-cap-blue', 'pack-adv-boy']),
);

// ---------------------------------------------------------------- Character skins (Sets & Collections)
const ch = (id: string, name: string, price: number, rarity: Rarity, blurb: string): Item =>
  mk(`char-${id}`, name, 'character', 'sets', 'unisex', price, rarity, blurb, { model: id });

const CHARACTERS: Item[] = [
  ch('gray-cat', 'Gray Cat', 160, 'common', 'A sleepy gray cat with a fluffy tail.'),
  ch('brown-mouse', 'Brown Mouse', 160, 'common', 'Small, quick and full of cheese ideas.'),
  ch('jellyfish', 'Sunny Jellyfish', 380, 'epic', 'A glowing yellow jellyfish from the deep sea.'),
  ch('starfish', 'Pink Starfish', 380, 'epic', 'A cheerful starfish with a snorkel mask.'),
  ch('duck', 'Rainy Duck', 160, 'common', 'A duck in a yellow raincoat and red boots.'),
  ch('dog', 'Floppy Dog', 160, 'common', 'A happy dog with big floppy ears.'),
  ch('rabbit', 'Long-Eared Rabbit', 160, 'common', 'Super long ears and a green scarf.'),
  ch('coyote', 'Desert Coyote', 240, 'rare', 'A clever coyote from the desert.'),
  ch('bluebird', 'Speedy Bird', 240, 'rare', 'A bluebird that never stops running.'),
  ch('bulldog', 'Grumpy Bulldog', 240, 'rare', 'Grumpy face, kind heart.'),
  ch('tuxedo-cat', 'Comic Cat', 240, 'rare', 'A tuxedo cat with a big grin.'),
  ch('chick', 'Tiny Chick', 160, 'common', 'A tiny fluffy yellow chick.'),
  ch('bear', 'Explorer Bear', 240, 'rare', 'A bear with a safari hat and backpack.'),
  ch('fox', 'Clever Fox', 240, 'rare', 'A fox in a green jacket.'),
  ch('wolf', 'Gray Wolf', 240, 'rare', 'A calm gray wolf.'),
  ch('panda', 'Panda', 240, 'rare', 'Black, white and very cuddly.'),
  ch('elephant', 'Elephant', 240, 'rare', 'A friendly blue elephant.'),
  ch('lion', 'King Lion', 380, 'epic', 'A lion with a golden crown and red cape.'),
  ch('penguin', 'Penguin', 240, 'rare', 'A penguin with a red scarf.'),
  ch('croc', 'Crocodile', 240, 'rare', 'A friendly green crocodile.'),
  ch('monkey', 'Monkey', 160, 'common', 'A playful monkey with a curly tail.'),
  ch('horse', 'Horse', 160, 'common', 'A strong brown horse.'),
  ch('cow', 'Cow', 160, 'common', 'A spotted cow with a little bell.'),
  ch('pilot-penguin', 'Pilot Penguin', 380, 'epic', 'A penguin pilot with flying goggles.'),
  ch('dino', 'Baby Dinosaur', 380, 'epic', 'A baby dino with orange spikes.'),
  ch('robot', 'Robot Friend', 380, 'epic', 'A friendly helper robot.'),
  ch('cookie', 'LingoBite Cookie', 450, 'epic', 'The LingoBite mascot, ready to play!'),
];

/** Built-in style names used by the Style Store admin tool. */
export const STYLE_OPTIONS: Record<string, string[]> = {
  hat: ['cap', 'beanie', 'party', 'explorer', 'catears', 'wizard', 'crown', 'helmet'],
  accessory: ['round', 'shades', 'goggles', 'headphones', 'scarf', 'medal', 'wingsStar', 'wingsFairy'],
  shoes: ['sneaker', 'hightop', 'boot', 'runner', 'cloud', 'space'],
  backpack: ['school', 'explorer', 'star', 'dino', 'candy', 'jet'],
  pet: ['corgi', 'cat', 'bunny', 'fox', 'robot', 'dragon'],
  outfit: ['tee', 'stripes', 'hoodie', 'jacket', 'dress', 'robe', 'suit', 'armor', 'candy'],
  hair: ['short', 'spiky', 'sidepart', 'curly', 'mohawk', 'messy', 'ponytail', 'bob', 'pigtails', 'long', 'braid', 'buns'],
  character: CHARACTERS.map((c) => String(c.spec.model)),
};

export const ITEMS: Item[] = [...OUTFITS, ...HAIR, ...HATS, ...ACCESSORIES, ...SHOES, ...BACKPACKS, ...PETS, ...ADVENTURE_PIECES, ...SETS, ...CHARACTERS];
const BY_ID = new Map<string, Item>(ITEMS.map((i) => [i.id, i]));

export const getItem = (id: string | null | undefined): Item | undefined => (id ? BY_ID.get(id) : undefined);

/** What a piece is worth when bundled (set-only pieces use a fixed value). */
export const pieceValue = (id: string): number => PIECE_VALUE[id] ?? getItem(id)?.price ?? 0;

/** Sets are cheaper than buying the pieces one by one, and only count pieces you don't own yet. */
export function bundlePrice(setItem: Item, owned: string[]): number {
  const pieces = setItem.pieces ?? [];
  const missing = pieces.filter((p) => !owned.includes(p));
  if (missing.length === 0) return 0;
  const missingValue = missing.reduce((s, p) => s + pieceValue(p), 0);
  // an admin can give a set its own price (price > 0); students then pay their share for the pieces they don't own yet
  if (setItem.price > 0) {
    const total = pieces.reduce((s, p) => s + pieceValue(p), 0) || 1;
    return Math.max(1, Math.round((setItem.price * missingValue) / total));
  }
  return roundTo5(missingValue * PRICE_FACTOR);
}

export function priceOf(item: Item, owned: string[]): number {
  return item.slot === 'set' ? bundlePrice(item, owned) : item.price;
}

export const suitsGender = (item: Item, g: Gender) => item.gender === 'unisex' || item.gender === g;

/** Items a character may see in the store (set-only pieces are hidden). */
export const itemsFor = (g: Gender): Item[] => ITEMS.filter((i) => !i.hidden && !i.disabled && suitsGender(i, g));

/** Free (price 0), visible, single items are owned from the start - including free items an admin adds later. */
export const isFreeItem = (i: Item) => i.slot !== 'set' && i.price === 0 && !i.hidden;
export const FREE_ITEM_IDS = ITEMS.filter(isFreeItem).map((i) => i.id);

// ---------------------------------------------------------------- items added by an admin at runtime
let catalogVersion = 0;
const catalogListeners = new Set<() => void>();

/** The built-in catalog exactly as shipped (used to undo admin edits). */
const ORIGINALS = new Map<string, Item>(ITEMS.map((i) => [i.id, i]));
export const isBuiltInId = (id: string) => ORIGINALS.has(id);
export const getOriginalItem = (id: string) => ORIGINALS.get(id);

/**
 * Applies what admins did in the Style Editor:
 *  - `list`: brand-new items
 *  - `overrides`: edited versions of built-in items (name, price, colors, text...).
 * Calling it again replaces everything the previous call did.
 */
export function registerCustomItems(list: Item[], overrides: Item[] = []) {
  for (let n = ITEMS.length - 1; n >= 0; n--) {
    if (ITEMS[n].custom) ITEMS.splice(n, 1);
    else {
      const o = ORIGINALS.get(ITEMS[n].id);
      if (o) ITEMS[n] = o;
    }
  }
  for (const ov of overrides) {
    const base = ORIGINALS.get(ov.id);
    const at = ITEMS.findIndex((i) => i.id === ov.id);
    if (!base || at < 0) continue;
    // the kind of item and its "set-only" flag never change; everything else can
    ITEMS[at] = { ...ov, slot: base.slot, category: base.category, hidden: base.hidden, pieces: ov.pieces?.length ? ov.pieces : base.pieces, edited: true, custom: undefined };
  }
  ITEMS.push(...list.filter((i) => !ORIGINALS.has(i.id)).map((i) => ({ ...i, custom: true })));
  BY_ID.clear();
  ITEMS.forEach((i) => BY_ID.set(i.id, i));
  catalogVersion++;
  catalogListeners.forEach((l) => l());
}
export const subscribeCatalog = (fn: () => void) => {
  catalogListeners.add(fn);
  return () => {
    catalogListeners.delete(fn);
  };
};
export const getCatalogVersion = () => catalogVersion;

export const STARTER: Record<Gender, Look> = {
  boy: { hair: 'hair-b-short', outfit: 'outfit-b-tee', shoes: 'shoes-b-blue', hat: null, accessory: null, backpack: null, pet: null, character: null, outfitText: null, skin: 'skin2', hairColor: 'brown' },
  girl: { hair: 'hair-g-ponytail', outfit: 'outfit-g-tee', shoes: 'shoes-g-pink', hat: null, accessory: null, backpack: null, pet: null, character: null, outfitText: null, skin: 'skin2', hairColor: 'brown' },
};

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'outfits', label: 'Outfits & Clothing', icon: '👕' },
  { id: 'hats', label: 'Hats', icon: '🎩' },
  { id: 'hair', label: 'Hairstyles', icon: '💇' },
  { id: 'accessories', label: 'Glasses & Accessories', icon: '🕶️' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'backpacks', label: 'Backpacks', icon: '🎒' },
  { id: 'pets', label: 'Pets & Companions', icon: '🐾' },
  { id: 'sets', label: 'Sets & Collections', icon: '⭐' },
];

export const SLOT_LABEL: Record<Slot, string> = {
  hair: 'Hairstyle',
  outfit: 'Outfit',
  shoes: 'Shoes',
  hat: 'Hat',
  accessory: 'Accessory',
  backpack: 'Backpack',
  pet: 'Pet',
  character: 'Character',
};

export const REQUIRED_SLOTS: Slot[] = ['hair', 'outfit', 'shoes'];
export const OPTIONAL_SLOTS: Slot[] = ['hat', 'accessory', 'backpack', 'pet', 'character'];
