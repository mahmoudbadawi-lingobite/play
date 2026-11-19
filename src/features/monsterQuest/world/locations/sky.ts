/** World 6: Skyspire Crown. Same four-place shape as the Grove (derived from its layouts), re-dressed with sky art, new monsters and text. */
import type { InteractDef, LocationDef, LocPalette, PropDef, ZoneDef } from '../types';
import { GROVE } from './grove';

const PAL: LocPalette = {
  ground: ['#8fd94a', '#c8f27a', '#4f9a2a'], tuft: '#7fcf40',
  path: ['#e6c898', '#f7e2b8', '#a88a5a'], cliff: ['#a9a6c8', '#5a557e'], wall: ['#2a2458', '#6a60b0'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#1ea0f0', mid: '#5cc8ff', glow: '#d8f4ff', spark: '#ffffff' },
  ashTuft: ['#7fcf40', '#f4ffb0'], moss: ['#8fd94a', '#f4ffb0'],
  haze: 'rgba(255,248,210,.07)', vignette: '#3a2f6a', motes: '#fff7d0',
};
const PAL_TOMB: LocPalette = { ...PAL, water: { deep: '#2b3fa0', mid: '#5a8ff0', glow: '#bfe6ff', spark: '#ffffff' }, haze: 'rgba(255,210,100,.1)', vignette: '#0a0620', motes: '#ffe9a0' };

const [g1, g2, g3, g4] = GROVE;
const swapKind: Record<string, PropDef['kind']> = { mushroom: 'mushroom', hollowTree: 'tent', treehouse: 'house', log: 'bones', stump: 'stump' };
const dress = (p: PropDef): PropDef => ({ ...p, kind: swapKind[p.kind] ?? p.kind });
const pools: Record<string, string[]> = {
  'mg-se': ['puffwing', 'starlet', 'petalfay'], 'mg-sw': ['starlet', 'puffwing', 'petalfay'], 'mg-ne': ['petalfay', 'puffwing', 'starlet'],
  'ww-west': ['puffwing', 'starlet', 'petalfay'], 'ww-north': ['stormpuff', 'gryphlet', 'puffwing'], 'ww-east': ['gryphlet', 'petalfay', 'starlet'], 'ww-rare': ['starhorn'],
  'lh-shore': ['petalfay', 'starlet', 'stormpuff'], 'lh-reeds': ['puffwing', 'gryphlet', 'petalfay'], 'lh-east': ['gryphlet', 'stormpuff', 'lunaowl'], 'lh-rare': ['starhorn'],
  'hh-entrance': ['stormpuff', 'lunaowl', 'starlet'], 'hh-middle': ['lunaowl', 'gryphlet', 'starlet'], 'hh-deep': ['lunaowl', 'stormpuff', 'gryphlet'], 'hh-rare': ['celestyrax'],
};
const ids: Record<string, string> = { 'mg-': 'cp-', 'ww-': 'wm-', 'lh-': 'st-', 'hh-': 'cs-' };
const zones = (z: ZoneDef[]): ZoneDef[] => z.map((q) => {
  const pre = q.id.slice(0, 3), nid = ids[pre] ? ids[pre] + q.id.slice(3) : q.id;
  const label = q.label.replace(/clover patch|clover|meadow|glow-moss|glade|Hollow-tree|Willow/gi, (m) => /glade/i.test(m) ? 'glade' : 'meadow').replace('Underground waterfall', 'Cloud falls');
  return { ...q, id: nid, label: q.rare ? 'Sun glade' : label, pool: pools[q.id] ?? q.pool };
});
const it = (l: LocationDef, f: (i: InteractDef) => InteractDef | null) => l.interactables.map(f).filter(Boolean) as InteractDef[];
const lines: Record<string, string[]> = {
  guide: ['Welcome to Cloudgate Plaza, the gateway to the Skyspire Crown! Walk with the arrow keys or WASD, or drag the joystick.', 'Meadow patches hide wild monsters. Step in and keep moving to find one.', 'Paths and the plaza are always safe. Head east to the Windswept Meadows when you are ready.'],
  lookout: ['The sky stream never stops flowing, even though it has no bed. The bridge is the dry way across.'],
  q1: ['The grass hums a tune. Something small is dancing in the wind.'],
  q2: ['A golden feather glints in the grass. Its owner cannot be far.'],
  'npc-gardener': ['The tall golden tree is the best landmark on the island. If you get lost, walk toward it.', 'The stepping stones across the sky stream are a shortcut, but they slow you down a little.'],
  'npc-fisher': ['I fish for clouds here. They never bite, but they sure are fluffy.', 'Follow the path north to find the Crown Sanctum, where the starlight lives.'],
  lore1: ['The altar glows softly. Carved in the stone: "The crown belongs to whoever climbs highest, and stays kind."'],
  crack: ['Warm golden light seeps from a crack in the marble. A shy light spirit is said to hide nearby.'],
};
const names: Record<string, string> = { guide: 'Gate keeper', 'npc-gardener': 'Sky pilot', 'npc-fisher': 'Cloud fisher', lookout: 'Sky lookout', stone: 'Fast-travel stone', 'lore1': 'Sun altar', crack: 'Glowing crack', q1: 'Humming grass', q2: 'Golden feather', shop: 'Cloud market', chest: 'Treasure chest' };
const retext = (i: InteractDef): InteractDef => ({ ...i, name: names[i.id] ?? i.name, lines: lines[i.id] ?? i.lines });
const sign = (_n: string) => (i: InteractDef) => i.kind === 'sign' ? { ...i, name: (i.name ?? '').replace('Mossgate Village', 'Cloudgate Plaza').replace('Whispering Woods', 'Windswept Meadows').replace('Lilypad Hollow', 'Sunspire Terraces').replace('Heartwood Hollow', 'Crown Sanctum').replace(/hollow tree/i, 'golden tree').replace('Plank bridge over the stream', 'Bridge over the sky stream').replace(/Stepping-stone/, 'Stepping-stone').replace('Bridge to the waterfall', 'Bridge to the cloud falls').replace('Sky lookout', 'Sky lookout').replace('Bridge across the root pool', 'Bridge across the light pool').replace('Back to Lilypad Hollow', 'Back to Sunspire Terraces').replace('Deep chamber and the glowing doorway', 'Deep chamber and the sealed doorway') } : retext(i);
void 0;
const gate = (g: LocationDef['gates'][number]) => ({ ...g, label: g.label.replace('Mossgate Village', 'Cloudgate Plaza').replace('Whispering Woods', 'Windswept Meadows').replace('Lilypad Hollow', 'Sunspire Terraces').replace('Heartwood Hollow', 'Crown Sanctum').replace('Sandstone Reach', 'the sealed gate'),
  to: 'loc' in g.to ? { ...g.to, loc: g.to.loc.replace('mossgate-village', 'cloudgate-plaza').replace('whispering-woods', 'windswept-meadows').replace('lilypad-hollow', 'sunspire-terraces').replace('heartwood-hollow', 'crown-sanctum') } : g.id === 'exit' ? { exit: 'locked' as const, message: 'The final gate is sealed for now. More adventures are coming soon!' } : g.to });

const common = (l: LocationDef, id: string, name: string, mood: string, mini: string): LocationDef => ({
  ...l, id, name, world: 6, theme: 'sky', pal: PAL, serverZone: 'forest', particles: 'sparkles', mood, mini,
  props: l.props.map(dress), zones: zones(l.zones), interactables: l.interactables.map(sign(id)), gates: l.gates.map(gate),
  landmark: l.landmark ? { ...l.landmark, name: l.landmark.name.replace('Mossgate Village', 'Cloudgate Plaza').replace('Hollow tree', 'Golden tree').replace('Waterfall', 'Cloud falls').replace('Underground waterfall', 'Cloud falls') } : l.landmark,
  lights: (l.lights ?? []).map((q) => ({ ...q, c: q.c === '#8fe3ff' || q.c === '#b9ffee' ? '#7fe9e0' : q.c === '#b9ff7a' ? '#ffd27a' : q.c })),
});

const haven = common(g1, 'cloudgate-plaza', 'Cloudgate Plaza', 'Marble houses with golden domes and a sunny plaza.', '#f4ecff');
haven.interactables = it(haven, (i) => i.id === 's-look' ? { ...i, name: 'Sky lookout' } : i);

const dunes = common(g2, 'windswept-meadows', 'Windswept Meadows', 'Floating meadows and a sky stream.', '#d8f0c0');

const canyonPlateau: [number, number][] = [[1960, 220], [2300, 220], [2350, 520], [2260, 660], [1980, 640], [1910, 430]];
const canyon = common(g3, 'sunspire-terraces', 'Sunspire Terraces', 'Marble terraces, two sky pools and a cloud waterfall.', '#e8d8ff');
canyon.plateaus = [{ pts: canyonPlateau, face: 40 }];
canyon.props = canyon.props.filter((p) => !(p.x > 1880 && p.y > 200 && p.y < 700 && !['cactus'].includes(p.kind) && p.kind !== 'ashTree')).concat([
  { kind: 'boulder', x: 2010, y: 260, v: 0 }, { kind: 'boulder', x: 2290, y: 600, v: 1 }, { kind: 'cactus', x: 2250, y: 280 },
]);
canyon.mood = 'Marble terraces, two sky pools and a cloud waterfall.';

const tomb: LocationDef = {
  ...common(g4, 'crown-sanctum', 'Crown Sanctum', 'Starlit marble, gold crystals and a deep light pool.', '#3a2f8a'),
  theme: 'sky-cave', pal: PAL_TOMB, serverZone: 'forest', particles: 'sparkles',
};
tomb.props = tomb.props.map((p) => p.kind === 'fireCrystal' ? { ...p } : p);

for (const l of [haven, dunes, canyon, tomb]) {
  const who = l.interactables.filter((i) => ['npc', 'lookout', 'chest', 'mystery', 'lore', 'shop', 'plate'].includes(i.kind));
  l.props = l.props.filter((q) => !['ashTree', 'tent', 'house', 'stall'].includes(q.kind) || !who.some((i) => Math.abs(q.x - i.x) < 260 && q.y - i.y > -60 && q.y - i.y < 360 && !(i.kind === 'shop' && Math.hypot(q.x - i.x, q.y - i.y) < 40)));
}
haven.gates = haven.gates.map((g) => g.id === 'back' ? { ...g, label: 'Back to Tidewhisper Coast', to: { exit: 'portal' as const, world: 5, message: 'The glowing doorway back to Tidewhisper Coast shimmers.' } } : g);
export const SKY: LocationDef[] = [haven, dunes, canyon, tomb];
