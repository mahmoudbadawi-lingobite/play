/** World 3: Sandstone Reach. Same four-place shape as the Grove (derived from its layouts), re-dressed with sand art, new monsters and text. */
import type { InteractDef, LocationDef, LocPalette, PropDef, ZoneDef } from '../types';
import { GROVE } from './grove';

const PAL: LocPalette = {
  ground: ['#d9a95a', '#f0cf86', '#b27c36'], tuft: '#c9a24a',
  path: ['#b98a52', '#e0b684', '#7a5430'], cliff: ['#a8582f', '#5a2c18'], wall: ['#3a2312', '#8a5a2c'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#12a0b8', mid: '#2fc9d0', glow: '#a6f5ea', spark: '#ffffff' },
  ashTuft: ['#a8802f', '#ffe08a'], moss: ['#c79a3e', '#ffe08a'],
  haze: 'rgba(255,214,120,.07)', vignette: '#3a1c08', motes: '#ffe3a0',
};
const PAL_TOMB: LocPalette = { ...PAL, water: { deep: '#8a5314', mid: '#d9a03a', glow: '#ffe9a0', spark: '#ffffff' }, haze: 'rgba(255,170,60,.08)', vignette: '#150a02', motes: '#ffcf70' };

const [g1, g2, g3, g4] = GROVE;
const swapKind: Record<string, PropDef['kind']> = { mushroom: 'cactus', hollowTree: 'tent', treehouse: 'house', log: 'bones', stump: 'stump' };
const dress = (p: PropDef): PropDef => ({ ...p, kind: swapKind[p.kind] ?? p.kind });
const pools: Record<string, string[]> = {
  'mg-se': ['dunepup', 'cactling', 'sandwisp'], 'mg-sw': ['cactling', 'dunepup', 'pebblin'], 'mg-ne': ['sandwisp', 'dunepup', 'cactling'],
  'ww-west': ['dunepup', 'cactling', 'sandwisp'], 'ww-north': ['sandwisp', 'pebblin', 'dunepup'], 'ww-east': ['cactling', 'sunscarab', 'sandwisp'], 'ww-rare': ['sunscarab'],
  'lh-shore': ['sandwisp', 'cactling', 'pebblin'], 'lh-reeds': ['dunepup', 'sunscarab', 'cactling'], 'lh-east': ['pebblin', 'dunepup', 'sunscarab'], 'lh-rare': ['solarix'],
  'hh-entrance': ['pebblin', 'sunscarab', 'runeling'], 'hh-middle': ['runeling', 'sandwisp', 'sunscarab'], 'hh-deep': ['sunscarab', 'runeling', 'pebblin'], 'hh-rare': ['solarix'],
};
const ids: Record<string, string> = { 'mg-': 'dh-', 'ww-': 'wd-', 'lh-': 'sc-', 'hh-': 'st-' };
const zones = (z: ZoneDef[]): ZoneDef[] => z.map((q) => {
  const pre = q.id.slice(0, 3), nid = ids[pre] ? ids[pre] + q.id.slice(3) : q.id;
  const label = q.label.replace(/clover patch|clover|meadow|glow-moss|glade|Hollow-tree|Willow/gi, (m) => /glade/i.test(m) ? 'glade' : 'scrub').replace('Underground waterfall', 'Sandfall pool');
  return { ...q, id: nid, label: q.rare ? 'Mirage glade' : label, pool: pools[q.id] ?? q.pool };
});
const it = (l: LocationDef, f: (i: InteractDef) => InteractDef | null) => l.interactables.map(f).filter(Boolean) as InteractDef[];
const lines: Record<string, string[]> = {
  guide: ['Welcome to Dune Haven, the oasis town! Walk with the arrow keys or WASD, or drag the joystick.', 'Scrub patches hide wild monsters. Step in and keep moving to find one.', 'Paths and the town are always safe. Head east to the Whispering Dunes when you are ready.'],
  lookout: ['The wadi is dry most of the year, but when the rains come the whole canyon sings.'],
  q1: ['The sand hums when the wind crosses the dunes. Something small digs just beneath.'],
  q2: ['A bright scarab shell glints in the sand. Its owner cannot be far.'],
  'npc-gardener': ['The twisted palm in the middle of the dunes is the best landmark. If you get lost, walk toward it.', 'Stepping stones in the wadi are a shortcut, but they slow you down a little.'],
  'npc-fisher': ['An oasis this blue and not one fish. They are all hiding from the sun.', 'Follow the canyon north to find the Scarab Tomb, where the old kings sleep.'],
  lore1: ['The altar glows softly. Carved in the stone: "Even the longest desert ends in a green shore."'],
  crack: ['Warm light seeps from a crack in the wall. A sand-coloured scarab is said to nest nearby.'],
};
const names: Record<string, string> = { guide: 'Oasis elder', 'npc-gardener': 'Camel keeper', 'npc-fisher': 'Water seller', lookout: 'Wadi lookout', stone: 'Fast-travel stone', 'lore1': 'Hieroglyph altar', crack: 'Glowing crack', q1: 'Humming dune', q2: 'Shiny scarab shell', shop: 'Bazaar shop', chest: 'Treasure chest' };
const retext = (i: InteractDef): InteractDef => ({ ...i, name: names[i.id] ?? i.name, lines: lines[i.id] ?? i.lines });
const sign = (_n: string) => (i: InteractDef) => i.kind === 'sign' ? { ...i, name: (i.name ?? '').replace('Mossgate Village', 'Dune Haven').replace('Whispering Woods', 'Whispering Dunes').replace('Lilypad Hollow', 'Sunstone Canyon').replace('Heartwood Hollow', 'Scarab Tomb').replace(/hollow tree/i, 'twisted palm').replace('Plank bridge over the stream', 'Plank bridge over the wadi').replace(/Stepping-stone/, 'Stepping-stone').replace('Bridge to the waterfall', 'Bridge to the red cliffs').replace('Stream lookout', 'Wadi lookout').replace('Bridge across the root pool', 'Bridge across the quicksand').replace('Back to Lilypad Hollow', 'Back to Sunstone Canyon').replace('Deep chamber and the glowing doorway', 'Deep chamber and the sealed doorway') } : retext(i);
void 0;
const gate = (g: LocationDef['gates'][number]) => ({ ...g, label: g.label.replace('Mossgate Village', 'Dune Haven').replace('Whispering Woods', 'Whispering Dunes').replace('Lilypad Hollow', 'Sunstone Canyon').replace('Heartwood Hollow', 'Scarab Tomb').replace('Sandstone Reach', 'Frostglass Peaks'),
  to: 'loc' in g.to ? { ...g.to, loc: g.to.loc.replace('mossgate-village', 'dune-haven').replace('whispering-woods', 'whispering-dunes').replace('lilypad-hollow', 'sunstone-canyon').replace('heartwood-hollow', 'scarab-tomb') } : g.id === 'exit' ? { exit: 'portal' as const, world: 4, message: 'The glowing doorway to Frostglass Peaks shimmers.' } : g.to });

const common = (l: LocationDef, id: string, name: string, mood: string, mini: string): LocationDef => ({
  ...l, id, name, world: 3, theme: 'sand', pal: PAL, serverZone: 'forest', particles: 'pollen', mood, mini,
  props: l.props.map(dress), zones: zones(l.zones), interactables: l.interactables.map(sign(id)), gates: l.gates.map(gate),
  landmark: l.landmark ? { ...l.landmark, name: l.landmark.name.replace('Mossgate Village', 'Dune Haven').replace('Hollow tree', 'Twisted palm').replace('Waterfall', 'Red cliffs').replace('Underground waterfall', 'Sandfall') } : l.landmark,
  lights: (l.lights ?? []).map((q) => ({ ...q, c: q.c === '#8fe3ff' || q.c === '#b9ffee' ? '#7fe9e0' : q.c === '#b9ff7a' ? '#ffd27a' : q.c })),
});

const haven = common(g1, 'dune-haven', 'Dune Haven', 'Clay houses, striped awnings and a palm-ringed spring.', '#e0b060');
haven.interactables = it(haven, (i) => i.id === 's-look' ? { ...i, name: 'Wadi lookout' } : i);

const dunes = common(g2, 'whispering-dunes', 'Whispering Dunes', 'Golden dunes, cacti and a dry riverbed under a hot sun.', '#d9a95a');

const canyonPlateau: [number, number][] = [[1960, 220], [2300, 220], [2350, 520], [2260, 660], [1980, 640], [1910, 430]];
const canyon = common(g3, 'sunstone-canyon', 'Sunstone Canyon', 'Red-gold cliffs, a turquoise oasis and a bridge over the gorge.', '#c8703a');
canyon.plateaus = [{ pts: canyonPlateau, face: 40 }];
canyon.props = canyon.props.filter((p) => !(p.x > 1880 && p.y > 200 && p.y < 700 && !['cactus'].includes(p.kind) && p.kind !== 'ashTree')).concat([
  { kind: 'boulder', x: 2010, y: 260, v: 0 }, { kind: 'boulder', x: 2290, y: 600, v: 1 }, { kind: 'cactus', x: 2250, y: 280 },
]);
canyon.mood = 'Red-gold cliffs, a turquoise oasis and a bridge over the gorge.';

const tomb: LocationDef = {
  ...common(g4, 'scarab-tomb', 'Scarab Tomb', 'Torch-lit sandstone, amber glow and a pit of quicksand.', '#6a4a22'),
  theme: 'sand-tomb', pal: PAL_TOMB, serverZone: 'forest', particles: 'sparkles',
};
tomb.props = tomb.props.map((p) => p.kind === 'fireCrystal' ? { ...p } : p);

for (const l of [haven, dunes, canyon, tomb]) {
  const who = l.interactables.filter((i) => ['npc', 'lookout', 'chest', 'mystery', 'lore', 'shop', 'plate'].includes(i.kind));
  l.props = l.props.filter((q) => !['ashTree', 'tent', 'house', 'stall'].includes(q.kind) || !who.some((i) => Math.abs(q.x - i.x) < 260 && q.y - i.y > -60 && q.y - i.y < 360 && !(i.kind === 'shop' && Math.hypot(q.x - i.x, q.y - i.y) < 40)));
}
haven.gates = haven.gates.map((g) => g.id === 'back' ? { ...g, label: 'Back to Emerald Grove', to: { exit: 'portal' as const, world: 2, message: 'The glowing doorway back to Emerald Grove shimmers.' } } : g);
export const SAND: LocationDef[] = [haven, dunes, canyon, tomb];
