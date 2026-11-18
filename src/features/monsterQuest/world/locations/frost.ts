/** World 4: Tidewhisper Coast. Same four-place shape as the Grove (derived from its layouts), re-dressed with snow art, new monsters and text. */
import type { InteractDef, LocationDef, LocPalette, PropDef, ZoneDef } from '../types';
import { GROVE } from './grove';

const PAL: LocPalette = {
  ground: ['#e6f0fb', '#ffffff', '#a9c4e0'], tuft: '#cfe4f5',
  path: ['#b9c6d6', '#e3ecf6', '#7a8aa0'], cliff: ['#6f86a8', '#34496b'], wall: ['#16294a', '#3d5f8f'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#1c8fd6', mid: '#5fc8f2', glow: '#d4f6ff', spark: '#ffffff' },
  ashTuft: ['#8fb4d6', '#ffffff'], moss: ['#9cc4e8', '#ffffff'],
  haze: 'rgba(200,230,255,.08)', vignette: '#0e1e3a', motes: '#e8f6ff',
};
const PAL_TOMB: LocPalette = { ...PAL, water: { deep: '#08336e', mid: '#1a6fc4', glow: '#8fe4ff', spark: '#ffffff' }, haze: 'rgba(90,170,255,.1)', vignette: '#050d1e', motes: '#9fe0ff' };

const [g1, g2, g3, g4] = GROVE;
const swapKind: Record<string, PropDef['kind']> = { mushroom: 'mushroom', hollowTree: 'tent', treehouse: 'house', log: 'bones', stump: 'stump' };
const dress = (p: PropDef): PropDef => ({ ...p, kind: swapKind[p.kind] ?? p.kind });
const pools: Record<string, string[]> = {
  'mg-se': ['frostkit', 'snowpuff', 'pengli'], 'mg-sw': ['snowpuff', 'frostkit', 'shardling'], 'mg-ne': ['pengli', 'frostkit', 'snowpuff'],
  'ww-west': ['frostkit', 'snowpuff', 'pengli'], 'ww-north': ['snowhoot', 'rimeram', 'frostkit'], 'ww-east': ['rimeram', 'pengli', 'snowpuff'], 'ww-rare': ['aurorix'],
  'lh-shore': ['pengli', 'snowpuff', 'shardling'], 'lh-reeds': ['frostkit', 'snowhoot', 'pengli'], 'lh-east': ['rimeram', 'shardling', 'snowhoot'], 'lh-rare': ['crystalynx'],
  'hh-entrance': ['shardling', 'snowhoot', 'frostkit'], 'hh-middle': ['shardling', 'rimeram', 'wispling'], 'hh-deep': ['wispling', 'shardling', 'snowhoot'], 'hh-rare': ['crystalynx'],
};
const ids: Record<string, string> = { 'mg-': 'sv-', 'ww-': 'pp-', 'lh-': 'gb-', 'hh-': 'cc-' };
const zones = (z: ZoneDef[]): ZoneDef[] => z.map((q) => {
  const pre = q.id.slice(0, 3), nid = ids[pre] ? ids[pre] + q.id.slice(3) : q.id;
  const label = q.label.replace(/clover patch|clover|meadow|glow-moss|glade|Hollow-tree|Willow/gi, (m) => /glade/i.test(m) ? 'glade' : 'snowfield').replace('Underground waterfall', 'Frozen falls');
  return { ...q, id: nid, label: q.rare ? 'Aurora glade' : label, pool: pools[q.id] ?? q.pool };
});
const it = (l: LocationDef, f: (i: InteractDef) => InteractDef | null) => l.interactables.map(f).filter(Boolean) as InteractDef[];
const lines: Record<string, string[]> = {
  guide: ['Welcome to Snowdrift Village, the warm place in the cold mountains! Walk with the arrow keys or WASD, or drag the joystick.', 'Snowy patches hide wild monsters. Step in and keep moving to find one.', 'Paths and the village are always safe. Head east to Pinefrost Pass when you are ready.'],
  lookout: ['The frozen stream creaks and sings. Penguins slide along it when nobody is watching.'],
  q1: ['The pines whisper in the wind. Something small is tracking footprints through the snow.'],
  q2: ['A shiny blue shard glints in the snow. Something nearby loves to collect them.'],
  'npc-gardener': ['The old stump in the middle of the pass is a good landmark. If you get lost, walk toward it.', 'The stepping stones across the frozen stream are a shortcut, but they slow you down a little.'],
  'npc-fisher': ['Two frozen lakes and not one fish. They are all asleep under the ice.', 'Follow the path north to find Crystal Cavern, where the ice glows from inside.'],
  lore1: ['The altar glows softly. Carved in the stone: "Every snowflake remembers the mountain it came from."'],
  crack: ['Cold blue light seeps from a crack in the ice. A shy glowing wisp is said to live nearby.'],
};
const names: Record<string, string> = { guide: 'Village elder', 'npc-gardener': 'Skier', 'npc-fisher': 'Ice fisher', lookout: 'Stream lookout', stone: 'Fast-travel stone', 'lore1': 'Frost altar', crack: 'Glowing crack', q1: 'Whispering pines', q2: 'Shiny shard', shop: 'Trading post', chest: 'Treasure chest' };
const retext = (i: InteractDef): InteractDef => ({ ...i, name: names[i.id] ?? i.name, lines: lines[i.id] ?? i.lines });
const sign = (_n: string) => (i: InteractDef) => i.kind === 'sign' ? { ...i, name: (i.name ?? '').replace('Mossgate Village', 'Snowdrift Village').replace('Whispering Woods', 'Pinefrost Pass').replace('Lilypad Hollow', 'Glasslake Basin').replace('Heartwood Hollow', 'Crystal Cavern').replace(/hollow tree/i, 'old stump').replace('Plank bridge over the stream', 'Plank bridge over the frozen stream').replace(/Stepping-stone/, 'Stepping-stone').replace('Bridge to the waterfall', 'Bridge to the ice cliffs').replace('Stream lookout', 'Stream lookout').replace('Bridge across the root pool', 'Bridge across the freezing pool').replace('Back to Lilypad Hollow', 'Back to Glasslake Basin').replace('Deep chamber and the glowing doorway', 'Deep chamber and the sealed doorway') } : retext(i);
void 0;
const gate = (g: LocationDef['gates'][number]) => ({ ...g, label: g.label.replace('Mossgate Village', 'Snowdrift Village').replace('Whispering Woods', 'Pinefrost Pass').replace('Lilypad Hollow', 'Glasslake Basin').replace('Heartwood Hollow', 'Crystal Cavern').replace('Sandstone Reach', 'Tidewhisper Coast'),
  to: 'loc' in g.to ? { ...g.to, loc: g.to.loc.replace('mossgate-village', 'snowdrift-village').replace('whispering-woods', 'pinefrost-pass').replace('lilypad-hollow', 'glasslake-basin').replace('heartwood-hollow', 'crystal-cavern') } : g.id === 'exit' ? { exit: 'locked' as const, message: 'The glowing doorway to Tidewhisper Coast is sealed for now. It will open on a later unlock.' } : g.to });

const common = (l: LocationDef, id: string, name: string, mood: string, mini: string): LocationDef => ({
  ...l, id, name, world: 4, theme: 'frost', pal: PAL, serverZone: 'forest', particles: 'sparkles', mood, mini,
  props: l.props.map(dress), zones: zones(l.zones), interactables: l.interactables.map(sign(id)), gates: l.gates.map(gate),
  landmark: l.landmark ? { ...l.landmark, name: l.landmark.name.replace('Mossgate Village', 'Snowdrift Village').replace('Hollow tree', 'Old stump').replace('Waterfall', 'Frozen falls').replace('Underground waterfall', 'Ice falls') } : l.landmark,
  lights: (l.lights ?? []).map((q) => ({ ...q, c: q.c === '#8fe3ff' || q.c === '#b9ffee' ? '#7fe9e0' : q.c === '#b9ff7a' ? '#ffd27a' : q.c })),
});

const haven = common(g1, 'snowdrift-village', 'Snowdrift Village', 'Snug cabins, glowing windows and a steaming hot spring.', '#dcecff');
haven.interactables = it(haven, (i) => i.id === 's-look' ? { ...i, name: 'Stream lookout' } : i);

const dunes = common(g2, 'pinefrost-pass', 'Pinefrost Pass', 'Snowy pines, drifts and a frozen stream.', '#bcd8f2');

const canyonPlateau: [number, number][] = [[1960, 220], [2300, 220], [2350, 520], [2260, 660], [1980, 640], [1910, 430]];
const canyon = common(g3, 'glasslake-basin', 'Glasslake Basin', 'Two frozen lakes, an ice-cliff ledge and a crystal waterfall.', '#8fb4e8');
canyon.plateaus = [{ pts: canyonPlateau, face: 40 }];
canyon.props = canyon.props.filter((p) => !(p.x > 1880 && p.y > 200 && p.y < 700 && !['cactus'].includes(p.kind) && p.kind !== 'ashTree')).concat([
  { kind: 'boulder', x: 2010, y: 260, v: 0 }, { kind: 'boulder', x: 2290, y: 600, v: 1 }, { kind: 'cactus', x: 2250, y: 280 },
]);
canyon.mood = 'Two frozen lakes, an ice-cliff ledge and a crystal waterfall.';

const tomb: LocationDef = {
  ...common(g4, 'crystal-cavern', 'Crystal Cavern', 'Blue ice, glowing crystals and a deep freezing pool.', '#2a5a9a'),
  theme: 'frost-cave', pal: PAL_TOMB, serverZone: 'forest', particles: 'sparkles',
};
tomb.props = tomb.props.map((p) => p.kind === 'fireCrystal' ? { ...p } : p);

for (const l of [haven, dunes, canyon, tomb]) {
  const who = l.interactables.filter((i) => ['npc', 'lookout', 'chest', 'mystery', 'lore', 'shop'].includes(i.kind));
  l.props = l.props.filter((q) => !['ashTree', 'tent', 'house', 'stall'].includes(q.kind) || !who.some((i) => Math.abs(q.x - i.x) < 260 && q.y - i.y > -60 && q.y - i.y < 360 && !(i.kind === 'shop' && Math.hypot(q.x - i.x, q.y - i.y) < 40)));
}
export const FROST: LocationDef[] = [haven, dunes, canyon, tomb];
