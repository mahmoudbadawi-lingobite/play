/** World 4: Skyspire Crown. Same four-place shape as the Grove (derived from its layouts), re-dressed with coast art, new monsters and text. */
import type { InteractDef, LocationDef, LocPalette, PropDef, ZoneDef } from '../types';
import { GROVE } from './grove';

const PAL: LocPalette = {
  ground: ['#f2d58f', '#ffe8b0', '#c9a45a'], tuft: '#8fc060',
  path: ['#c69a62', '#e8c28a', '#7a5a34'], cliff: ['#8a8c8e', '#44494f'], wall: ['#1d2f3a', '#52707f'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#0fa3c4', mid: '#2fd0d6', glow: '#b8f7ee', spark: '#ffffff' },
  ashTuft: ['#6fae4a', '#e8f7a0'], moss: ['#7fbf5a', '#e8f7a0'],
  haze: 'rgba(255,240,180,.07)', vignette: '#1d3a4a', motes: '#fff3c0',
};
const PAL_TOMB: LocPalette = { ...PAL, water: { deep: '#05466e', mid: '#0f8fc0', glow: '#8ff0ff', spark: '#ffffff' }, haze: 'rgba(60,200,230,.1)', vignette: '#03101a', motes: '#9fe8ff' };

const [g1, g2, g3, g4] = GROVE;
const swapKind: Record<string, PropDef['kind']> = { mushroom: 'mushroom', hollowTree: 'tent', treehouse: 'house', log: 'bones', stump: 'stump' };
const dress = (p: PropDef): PropDef => ({ ...p, kind: swapKind[p.kind] ?? p.kind });
const pools: Record<string, string[]> = {
  'mg-se': ['pinchy', 'shellby', 'blupp'], 'mg-sw': ['shellby', 'pinchy', 'splashet'], 'mg-ne': ['blupp', 'pinchy', 'shellby'],
  'ww-west': ['pinchy', 'shellby', 'blupp'], 'ww-north': ['splashet', 'jellibloom', 'pinchy'], 'ww-east': ['jellibloom', 'blupp', 'shellby'], 'ww-rare': ['aquarion'],
  'lh-shore': ['blupp', 'shellby', 'splashet'], 'lh-reeds': ['pinchy', 'jellibloom', 'blupp'], 'lh-east': ['jellibloom', 'splashet', 'coralynx'], 'lh-rare': ['aquarion'],
  'hh-entrance': ['splashet', 'coralynx', 'pinchy'], 'hh-middle': ['coralynx', 'blupp', 'jellibloom'], 'hh-deep': ['coralynx', 'splashet', 'jellibloom'], 'hh-rare': ['aquarion'],
};
const ids: Record<string, string> = { 'mg-': 'ph-', 'ww-': 'db-', 'lh-': 'cl-', 'hh-': 'sg-' };
const zones = (z: ZoneDef[]): ZoneDef[] => z.map((q) => {
  const pre = q.id.slice(0, 3), nid = ids[pre] ? ids[pre] + q.id.slice(3) : q.id;
  const label = q.label.replace(/clover patch|clover|meadow|glow-moss|glade|Hollow-tree|Willow/gi, (m) => /glade/i.test(m) ? 'glade' : 'tide flat').replace('Underground waterfall', 'Sea-cave falls');
  return { ...q, id: nid, label: q.rare ? 'Pearl glade' : label, pool: pools[q.id] ?? q.pool };
});
const it = (l: LocationDef, f: (i: InteractDef) => InteractDef | null) => l.interactables.map(f).filter(Boolean) as InteractDef[];
const lines: Record<string, string[]> = {
  guide: ['Welcome to Pearl Harbor, the friendliest port on the coast! Walk with the arrow keys or WASD, or drag the joystick.', 'Tide flats and shell patches hide wild monsters. Step in and keep moving to find one.', 'Paths and the harbour are always safe. Head east to Driftwood Beach when you are ready.'],
  lookout: ['The tide stream rises and falls twice a day. The bridge is the dry way across.'],
  q1: ['The sand ripples as if something is breathing beneath it.'],
  q2: ['A pearly shell glints in the sand. Its owner cannot be far.'],
  'npc-gardener': ['The tall leaning palm is the best landmark on the beach. If you get lost, walk toward it.', 'The stepping stones across the tidal stream are a shortcut, but they slow you down a little.'],
  'npc-fisher': ['Two calm lagoons and the fish still will not bite. They know I am here.', 'Follow the path north to find the Sunken Grotto, where pearls glow in the dark.'],
  lore1: ['The altar glows softly. Carved in the stone: "Every wave carries a message home."'],
  crack: ['Cool blue light seeps from a crack in the rock. A shy glowing pearl is said to hide nearby.'],
};
const names: Record<string, string> = { guide: 'Harbour master', 'npc-gardener': 'Sailor', 'npc-fisher': 'Fisher', lookout: 'Tide lookout', stone: 'Fast-travel stone', 'lore1': 'Wave altar', crack: 'Glowing crack', q1: 'Breathing sand', q2: 'Pearly shell', shop: 'Harbour market', chest: 'Treasure chest' };
const retext = (i: InteractDef): InteractDef => ({ ...i, name: names[i.id] ?? i.name, lines: lines[i.id] ?? i.lines });
const sign = (_n: string) => (i: InteractDef) => i.kind === 'sign' ? { ...i, name: (i.name ?? '').replace('Mossgate Village', 'Pearl Harbor').replace('Whispering Woods', 'Driftwood Beach').replace('Lilypad Hollow', 'Coral Lagoon').replace('Heartwood Hollow', 'Sunken Grotto').replace(/hollow tree/i, 'leaning palm').replace('Plank bridge over the stream', 'Plank bridge over the tidal stream').replace(/Stepping-stone/, 'Stepping-stone').replace('Bridge to the waterfall', 'Bridge to the sea-cave falls').replace('Tide lookout', 'Tide lookout').replace('Bridge across the root pool', 'Bridge across the deep pool').replace('Back to Lilypad Hollow', 'Back to Coral Lagoon').replace('Deep chamber and the glowing doorway', 'Deep chamber and the sealed doorway') } : retext(i);
void 0;
const gate = (g: LocationDef['gates'][number]) => ({ ...g, label: g.label.replace('Mossgate Village', 'Pearl Harbor').replace('Whispering Woods', 'Driftwood Beach').replace('Lilypad Hollow', 'Coral Lagoon').replace('Heartwood Hollow', 'Sunken Grotto').replace('Sandstone Reach', 'Skyspire Crown'),
  to: 'loc' in g.to ? { ...g.to, loc: g.to.loc.replace('mossgate-village', 'pearl-harbor').replace('whispering-woods', 'driftwood-beach').replace('lilypad-hollow', 'coral-lagoon').replace('heartwood-hollow', 'sunken-grotto') } : g.id === 'exit' ? { exit: 'portal' as const, world: 6, message: 'The glowing doorway to Skyspire Crown shimmers.' } : g.to });

const common = (l: LocationDef, id: string, name: string, mood: string, mini: string): LocationDef => ({
  ...l, id, name, world: 5, theme: 'coast', pal: PAL, serverZone: 'ocean', particles: 'sparkles', mood, mini,
  props: l.props.map(dress), zones: zones(l.zones), interactables: l.interactables.map(sign(id)), gates: l.gates.map(gate),
  landmark: l.landmark ? { ...l.landmark, name: l.landmark.name.replace('Mossgate Village', 'Pearl Harbor').replace('Hollow tree', 'Leaning palm').replace('Waterfall', 'Sea-cave falls').replace('Underground waterfall', 'Sea-cave falls') } : l.landmark,
  lights: (l.lights ?? []).map((q) => ({ ...q, c: q.c === '#8fe3ff' || q.c === '#b9ffee' ? '#7fe9e0' : q.c === '#b9ff7a' ? '#ffd27a' : q.c })),
});

const haven = common(g1, 'pearl-harbor', 'Pearl Harbor', 'Stilt cottages, boats and a lantern-lit harbour.', '#f3dfa8');
haven.interactables = it(haven, (i) => i.id === 's-look' ? { ...i, name: 'Tide lookout' } : i);

const dunes = common(g2, 'driftwood-beach', 'Driftwood Beach', 'Palms, driftwood and a tidal stream.', '#f0d28a');

const canyonPlateau: [number, number][] = [[1960, 220], [2300, 220], [2350, 520], [2260, 660], [1980, 640], [1910, 430]];
const canyon = common(g3, 'coral-lagoon', 'Coral Lagoon', 'Two turquoise lagoons, a rocky ledge and a sea-cave waterfall.', '#7fd0d8');
canyon.plateaus = [{ pts: canyonPlateau, face: 40 }];
canyon.props = canyon.props.filter((p) => !(p.x > 1880 && p.y > 200 && p.y < 700 && !['cactus'].includes(p.kind) && p.kind !== 'ashTree')).concat([
  { kind: 'boulder', x: 2010, y: 260, v: 0 }, { kind: 'boulder', x: 2290, y: 600, v: 1 }, { kind: 'cactus', x: 2250, y: 280 },
]);
canyon.mood = 'Two turquoise lagoons, a rocky ledge and a sea-cave waterfall.';

const tomb: LocationDef = {
  ...common(g4, 'sunken-grotto', 'Sunken Grotto', 'Glowing pearls, blue coral and a deep tide pool.', '#1b5a78'),
  theme: 'coast-cave', pal: PAL_TOMB, serverZone: 'ocean', particles: 'sparkles',
};
tomb.props = tomb.props.map((p) => p.kind === 'fireCrystal' ? { ...p } : p);

for (const l of [haven, dunes, canyon, tomb]) {
  const who = l.interactables.filter((i) => ['npc', 'lookout', 'chest', 'mystery', 'lore', 'shop', 'plate'].includes(i.kind));
  l.props = l.props.filter((q) => !['ashTree', 'tent', 'house', 'stall'].includes(q.kind) || !who.some((i) => Math.abs(q.x - i.x) < 260 && q.y - i.y > -60 && q.y - i.y < 360 && !(i.kind === 'shop' && Math.hypot(q.x - i.x, q.y - i.y) < 40)));
}
haven.gates = haven.gates.map((g) => g.id === 'back' ? { ...g, label: 'Back to Frostglass Peaks', to: { exit: 'portal' as const, world: 4, message: 'The glowing doorway back to Frostglass Peaks shimmers.' } } : g);
export const COAST: LocationDef[] = [haven, dunes, canyon, tomb];
