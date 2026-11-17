/** World 2: Emerald Grove. Four locations in the painted storybook style (coordinates are world px at native scale). */
import type { InteractDef, LocationDef, LocPalette, Pt, PropDef } from '../types';
import { rng, smooth } from '../util';
import { avoidOf, beside, blob, insidePoly, rrPts, scaleLoc, scatter, zone } from './helpers';

const PAL: LocPalette = {
  ground: ['#4f9a3a', '#7cc255', '#2f6a2a'], tuft: '#8fd45f',
  path: ['#b98a52', '#e0b684', '#7a5430'], cliff: ['#6f7a5c', '#3b4a38'], wall: ['#1d2c22', '#3d5a44'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#1d7fd0', mid: '#38a9e6', glow: '#b4f6ee', spark: '#ffffff' },
  ashTuft: ['#3f7a2a', '#a8ff7a'], moss: ['#2f9c4a', '#9dff7a'],
  haze: 'rgba(210,255,160,.06)', vignette: '#0b2e16', motes: '#d9ff9a',
};
const PAL_DEEP: LocPalette = { ...PAL, haze: 'rgba(80,255,170,.08)', vignette: '#04160f', motes: '#9dffc8' };
const base = { world: 2, pal: PAL, serverZone: 'forest', particles: 'pollen' as const, fords: [], liquids: [], bridges: [], zones: [], lights: [], blockers: [], plazas: [] };

// ================================================================== 2.1 Mossgate Village
const villageBase: LocationDef = {
  ...base, style: 'storybook', theme: 'grove', forestY: 330,
  id: 'mossgate-village', name: 'Mossgate Village', kind: 'village', w: 1600, h: 1200, mode: 'open', edge: 'foliage',
  plateaus: [],
  blockers: [{ x: 800, y: 130, rx: 900, ry: 205 }],
  plazas: [{ x: 800, y: 660, rx: 240, ry: 190 }],
  paths: [
    { pts: [[800, 1170], [800, 1040], [800, 880]], width: 170, main: true },
    { pts: [[1040, 662], [1200, 656], [1330, 650], [1520, 640]], width: 170, main: true },
    { pts: [[560, 880], [420, 760], [380, 600], [470, 420], [700, 410], [900, 410], [1130, 400], [1190, 470]], width: 110 },
    { pts: [[440, 660], [300, 650], [160, 570]], width: 110 },
    { pts: [[800, 960], [1000, 990], [1290, 960], [1450, 940]], width: 120 },
    { pts: [[560, 900], [420, 960], [250, 965]], width: 110 },
  ],
  liquids: [
    { kind: 'water', pts: [[330, 345], [300, 520], [240, 700], [300, 880], [220, 1040], [160, 1200]], width: 84 },
    { kind: 'water', pts: [[1290, 345], [1260, 520], [1330, 680], [1270, 860], [1340, 1040], [1400, 1200]], width: 84 },
  ],
  bridges: [
    { a: [160, 645], b: [350, 645], width: 100 }, { a: [150, 965], b: [340, 965], width: 100 },
    { a: [1225, 650], b: [1425, 650], width: 100 }, { a: [1195, 960], b: [1385, 960], width: 100 },
  ],
  zones: [
    zone('mg-se', 'Clover patch', 1190, 1085, 150, 95, 'moss', ['sproutle', 'capling', 'lanternfly']),
    zone('mg-sw', 'Clover patch', 390, 1090, 100, 70, 'moss', ['sproutle', 'zapling', 'capling']),
    zone('mg-ne', 'Clover patch', 1440, 440, 95, 70, 'moss', ['lanternfly', 'zapling', 'sproutle'], { density: 0.8 }),
  ],
  gates: [
    { id: 'east', rect: [1490, 540, 110, 200], dir: 'right', style: 'path', label: 'Whispering Woods', to: { loc: 'whispering-woods', entrance: 'west' } },
    { id: 'south', rect: [700, 1090, 200, 110], dir: 'down', style: 'gate', label: 'World map', to: { exit: 'world' } },
  ],
  entrances: { south: { x: 800, y: 1040, facing: 'up' }, east: { x: 1400, y: 640, facing: 'side', flip: true }, spawn: { x: 800, y: 1040, facing: 'up' } },
  props: [
    { kind: 'fountain', x: 800, y: 640 },
    { kind: 'house', x: 500, y: 500, v: 0 }, { kind: 'house', x: 1060, y: 480, v: 1 }, { kind: 'house', x: 470, y: 900, v: 2 }, { kind: 'house', x: 1250, y: 330, v: 0 },
    { kind: 'treehouse', x: 300, y: 400 }, { kind: 'hollowTree', x: 1340, y: 860 },
    { kind: 'stall', x: 1000, y: 800, v: 0 },
    { kind: 'noticeBoard', x: 1150, y: 560 }, { kind: 'well', x: 640, y: 560 },
    { kind: 'lantern', x: 800, y: 420 }, { kind: 'lantern', x: 590, y: 560 }, { kind: 'lantern', x: 1010, y: 560 }, { kind: 'lantern', x: 560, y: 780 }, { kind: 'lantern', x: 1040, y: 790 }, { kind: 'lantern', x: 690, y: 920 },
    { kind: 'fence', x: 380, y: 560, len: 120 }, { kind: 'fence', x: 1160, y: 430, len: 80 }, { kind: 'fence', x: 400, y: 1130, len: 140 }, { kind: 'fence', x: 1000, y: 880, len: 100 },
    { kind: 'campfire', x: 640, y: 1010 }, { kind: 'bench', x: 570, y: 1040 }, { kind: 'bench', x: 650, y: 1085 },
    { kind: 'barrel', x: 1090, y: 830, v: 0 }, { kind: 'crate', x: 1060, y: 860 }, { kind: 'planter', x: 940, y: 880 }, { kind: 'barrel', x: 520, y: 590, v: 1 },
    { kind: 'mushroom', x: 330, y: 440, v: 2, s: 1.2 }, { kind: 'mushroom', x: 1210, y: 580, v: 4, s: 0.9 }, { kind: 'mushroom', x: 1020, y: 1060, v: 3, s: 1.2 },
    { kind: 'bush', x: 700, y: 440, v: 0 }, { kind: 'bush', x: 1200, y: 880, v: 2 }, { kind: 'bush', x: 880, y: 440, v: 2 },
    { kind: 'fireCrystal', x: 290, y: 800, v: 0 }, { kind: 'fireCrystal', x: 1450, y: 850, v: 3 },
  ] as PropDef[],
  interactables: [
    { id: 'guide', kind: 'npc', npc: 'guide', x: 660, y: 740, marker: '!', name: 'Village elder', lines: ['Welcome to Mossgate, the village under the great trees! Walk with the arrow keys or WASD, or drag the joystick.', 'Clover patches hide wild monsters. Step in and keep moving to find one.', 'Paths and the village are always safe. Head east to Whispering Woods when you are ready.'] },
    { id: 'shop', kind: 'shop', x: 1000, y: 800, marker: 'arrow', name: 'Herbalist shop' },
    { id: 'stone', kind: 'stone', x: 800, y: 440, marker: 'none', name: 'Fast-travel stone' },
    { id: 'chest', kind: 'chest', x: 1200, y: 430, marker: 'shimmer', name: 'Treasure chest' },
    { id: 's-east', kind: 'sign', x: 1190, y: 552, dir: 'right', name: 'Whispering Woods', marker: 'none' },
    { id: 's-south', kind: 'sign', x: 740, y: 1040, dir: 'down', name: 'World map', marker: 'none' },
    { id: 's-look', kind: 'sign', x: 440, y: 650, dir: 'left', name: 'Stream lookout', marker: 'none' },
    { id: 'lookout', kind: 'lookout', x: 140, y: 560, marker: '?', name: 'Stream lookout', lines: ['The stream chuckles over mossy stones. Frogs and dewmoths love the quiet banks.'] },
  ] as InteractDef[],
  landmark: { x: 800, y: 300, name: 'Mossgate Village' },
  mood: 'Sun-dappled burrow houses, lanterns and a chattering stream.',
  lights: [{ x: 800, y: 650, r: 380, c: '#fff1b8' }, { x: 1000, y: 800, r: 200, c: '#ffe08a' }],
  mini: '#4f9a3a',
};
const village: LocationDef = scaleLoc(villageBase, 1.4);
village.props = [...village.props, ...(() => {
  const r = rng('mg-forest'), out: PropDef[] = [], W = village.w, fy = village.forestY ?? 400;
  for (let x = 10; x < W + 20; x += 125) out.push({ kind: 'ashTree', x: x + r() * 40, y: fy * 0.34 + r() * 60, v: Math.floor(r() * 8), s: 1.1 + r() * 0.35 });
  for (let x = 60; x < W + 20; x += 118) out.push({ kind: 'ashTree', x: x + r() * 36, y: fy * 0.62 + r() * 60, v: Math.floor(r() * 8), s: 1 + r() * 0.3 });
  for (let x = 30; x < W + 20; x += 135) out.push({ kind: 'ashTree', x: x + r() * 40, y: fy * 0.9 + r() * 45, v: Math.floor(r() * 8), s: 0.9 + r() * 0.3 });
  for (let i = 0; i < 26; i++) out.push({ kind: r() < 0.5 ? 'bush' : 'mushroom', x: 60 + r() * (W - 120), y: fy + 12 + r() * 40, v: Math.floor(r() * 5), s: 0.9 + r() * 0.4 });
  return out;
})(), ...scatter('mg-scatter', 190, village.w, village.h, avoidOf(village), [
  { kind: 'ashTree', v: [0, 1, 2, 3, 4, 5, 6, 7], s: [0.9, 1.25], w: 2 }, { kind: 'bush', v: [0, 1, 2], s: [0.8, 1.2], w: 3 }, { kind: 'flowers', v: [0, 1, 2, 3, 4, 5, 6, 7], s: [0.8, 1.3], w: 10 },
  { kind: 'plant', v: [0, 1, 2, 3], s: [0.8, 1.3], w: 4 }, { kind: 'mushroom', v: [0, 1, 2, 3, 4], s: [0.8, 1.3], w: 2 }, { kind: 'rock', v: [0, 1, 2], s: [0.8, 1.2], w: 2 }, { kind: 'stump', s: [0.8, 1], w: 1 }, { kind: 'log', s: [0.8, 1], w: 1 },
  { kind: 'house', v: [0, 1, 2], s: [1, 1], w: 0.55 }, { kind: 'lantern', v: [0, 1, 2], w: 0.8 }, { kind: 'barrel', v: [0, 1], w: 0.5 }, { kind: 'crate', w: 0.4 },
], 150).filter((q) => q.y > (village.forestY ?? 0) + 90)];

// ================================================================== 2.2 Whispering Woods
const woods: LocationDef = {
  ...base, style: 'storybook', theme: 'grove', id: 'whispering-woods', name: 'Whispering Woods', kind: 'standard', w: 2400, h: 1800, mode: 'open', edge: 'foliage',
  plateaus: [],
  paths: [
    { pts: [[110, 1300], [430, 1350], [720, 1290], [600, 1060], [450, 830], [560, 600], [850, 520], [1100, 540], [1215, 560], [1385, 560], [1560, 590], [1750, 700], [1900, 850], [2050, 1000], [2200, 1100], [2270, 1150]], width: 150, main: true },
    { pts: [[900, 740], [1100, 830], [1130, 980], [1000, 1170], [790, 1160], [670, 1010], [700, 820], [900, 740]], width: 110 },
    { pts: [[1130, 985], [1260, 1000], [1400, 1000], [1650, 1060], [1950, 1140], [2270, 1150]], width: 120 },
    { pts: [[720, 1290], [900, 1450], [1190, 1500], [1360, 1500], [1650, 1480], [1760, 1300], [1900, 1135]], width: 130 },
    { pts: [[560, 600], [380, 580]], width: 100 },
    { pts: [[1700, 1500], [1800, 1560]], width: 100 },
  ],
  liquids: [{ kind: 'water', pts: [[1330, -20], [1280, 200], [1360, 420], [1280, 640], [1360, 820], [1260, 1000], [1330, 1200], [1250, 1400], [1300, 1650], [1290, 1850]], width: 120 }],
  fords: [{ pts: [[1140, 1012], [1260, 1000], [1390, 1000]], width: 84 }],
  bridges: [{ a: [1205, 565], b: [1395, 565], width: 100 }, { a: [1180, 1500], b: [1370, 1500], width: 100 }],
  zones: [
    zone('ww-west', 'West clover patch', 340, 1060, 190, 150, 'moss', ['sproutle', 'zapling', 'capling']),
    zone('ww-north', 'North clover patch', 1960, 520, 170, 100, 'moss', ['dewmoth', 'zapling', 'lanternfly']),
    zone('ww-east', 'East clover patch', 2080, 1340, 190, 130, 'moss', ['lilyhop', 'sproutle', 'dewmoth']),
    zone('ww-rare', 'Hollow-tree glade', 900, 1095, 62, 44, 'moss', ['lunaowl'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'hollowTree', x: 900, y: 985 },
    { kind: 'ashTree', x: 300, y: 450, v: 0, s: 1.4 }, { kind: 'ashTree', x: 1750, y: 330, v: 0, s: 1.4 }, { kind: 'ashTree', x: 2120, y: 360, v: 4, s: 1.3 }, { kind: 'ashTree', x: 1600, y: 1230, v: 0, s: 1.3 },
    { kind: 'fireCrystal', x: 1550, y: 1180, v: 0 }, { kind: 'fireCrystal', x: 600, y: 1590, v: 3 },
    { kind: 'bush', x: 760, y: 1010, v: 0 }, { kind: 'bush', x: 1460, y: 1250, v: 1 }, { kind: 'bush', x: 1100, y: 1380, v: 0 },
    { kind: 'boulder', x: 330, y: 700, v: 0 }, { kind: 'boulder', x: 1650, y: 1650, v: 1 },
    { kind: 'treehouse', x: 760, y: 690 }, { kind: 'vineArch', x: 1330, y: 1120 },
    { kind: 'flowers', x: 1010, y: 905, v: 0, s: 1.4 }, { kind: 'flowers', x: 1060, y: 920, v: 2, s: 1.2 }, { kind: 'flowers', x: 960, y: 1210, v: 4 },
    { kind: 'log', x: 560, y: 1340 }, { kind: 'stump', x: 1500, y: 1130 }, { kind: 'stump', x: 2050, y: 560 },
  ],
  gates: [
    { id: 'west', rect: [0, 1180, 110, 240], dir: 'left', style: 'path', label: 'Mossgate Village', to: { loc: 'mossgate-village', entrance: 'east' } },
    { id: 'east', rect: [2290, 1030, 110, 240], dir: 'right', style: 'path', label: 'Lilypad Hollow', to: { loc: 'lilypad-hollow', entrance: 'west' } },
  ],
  entrances: { west: { x: 210, y: 1300, facing: 'side' }, east: { x: 2190, y: 1150, facing: 'side', flip: true } },
  interactables: [
    { id: 'q1', kind: 'mystery', x: 380, y: 580, marker: '?', name: 'Whispering stump', lines: ['The stump hums a quiet tune. Moths and tiny owls like to rest in the old hollow tree in the middle.'] },
    { id: 'q2', kind: 'mystery', x: 1810, y: 1560, marker: '?', name: 'Shiny acorn', lines: ['An acorn glints under the ferns. Something small must be collecting them nearby.'] },
    { id: 'chest', kind: 'chest', x: 2170, y: 430, marker: 'shimmer', name: 'Woodland chest' },
    { id: 'npc-gardener', kind: 'npc', npc: 'villager', x: 560, y: 1480, marker: '!', name: 'Gardener', lines: ['The hollow tree in the middle is a great landmark. If you get lost, walk toward it.', 'The stepping stones east of the tree are a shortcut, but they slow you down a little.'] },
    { id: 's1', kind: 'sign', x: 200, y: 1230, dir: 'left', name: 'Mossgate Village', marker: 'none' },
    { id: 's2', kind: 'sign', x: 690, y: 1380, dir: 'up', name: 'The hollow tree', marker: 'none' },
    { id: 's3', kind: 'sign', x: 1460, y: 650, dir: 'right', name: 'Plank bridge over the stream', marker: 'none' },
    { id: 's4', kind: 'sign', x: 1140, y: 1100, dir: 'right', name: 'Stepping-stone shortcut east', marker: 'none' },
    { id: 's5', kind: 'sign', x: 2120, y: 1090, dir: 'right', name: 'Lilypad Hollow', marker: 'none' },
  ],
  landmark: { x: 900, y: 985, name: 'Hollow tree' },
  mood: 'Golden light through giant oaks, ferns, and fireflies over the stream.',
  lights: [{ x: 900, y: 1000, r: 420, c: '#ffd9a0' }, { x: 340, y: 1060, r: 240, c: '#b9ff7a' }, { x: 2080, y: 1340, r: 240, c: '#b9ff7a' }],
  mini: '#5aa63f',
};
woods.props = [...woods.props, ...beside(woods.paths[0].pts, 340, 118, (x, y, i) => ({ kind: 'lantern', x, y, v: i })),
  ...scatter('ww-scatter', 200, 2400, 1800, avoidOf(woods), [{ kind: 'ashTree', v: [0, 1, 2, 3, 4, 5, 6, 7], s: [0.9, 1.3], w: 3.5 }, { kind: 'mushroom', v: [0, 1, 2, 3], s: [0.8, 1.3], w: 1.5 }, { kind: 'rock', v: [0, 1, 2], w: 1 }, { kind: 'bush', v: [0, 1, 2, 3], w: 2 },
    { kind: 'flowers', v: [0, 1, 2, 3, 4, 5], s: [0.8, 1.3], w: 8 }, { kind: 'plant', v: [0, 1, 2], s: [0.8, 1.3], w: 6 }, { kind: 'stump', w: 0.8 }, { kind: 'log', w: 0.8 }, { kind: 'fireflies', w: 0.9 }], 150)];

// ================================================================== 2.3 Lilypad Hollow
const hollow: LocationDef = {
  ...base, style: 'storybook', theme: 'grove', id: 'lilypad-hollow', name: 'Lilypad Hollow', kind: 'standard', w: 2400, h: 1800, mode: 'open', edge: 'foliage',
  plateaus: [],
  paths: [
    { pts: [[110, 1300], [420, 1390], [800, 1480], [1150, 1420], [1250, 1150], [1180, 850], [1250, 600], [1200, 330], [1200, 170]], width: 150, main: true },
    { pts: [[1250, 700], [1450, 650], [1700, 640], [1850, 640], [2050, 600], [2200, 450]], width: 120 },
    { pts: [[1250, 1150], [1450, 1120], [1550, 900]], width: 110 },
    { pts: [[420, 1390], [330, 1230]], width: 100 },
    { pts: [[1150, 1420], [1500, 1560], [1900, 1600], [2150, 1520]], width: 110 },
  ],
  liquids: [
    { kind: 'water', pts: blob(620, 880, 340, 220, 'lakeA', 0.1), closed: true },
    { kind: 'water', pts: blob(1860, 1180, 330, 230, 'lakeB', 0.1), closed: true },
    { kind: 'water', pts: [[1700, 340], [1650, 520], [1740, 740], [1780, 930]], width: 100 },
  ],
  bridges: [{ a: [1600, 645], b: [1800, 645], width: 100 }],
  fords: [],
  zones: [
    zone('lh-shore', 'Shore clover', 330, 1230, 150, 100, 'moss', ['lilyhop', 'sproutle', 'dewmoth']),
    zone('lh-reeds', 'Reedy bank', 1500, 1340, 130, 90, 'moss', ['splashet', 'lilyhop', 'dewmoth']),
    zone('lh-east', 'East meadow', 2150, 820, 150, 110, 'moss', ['zapling', 'lilyhop', 'capling']),
    zone('lh-rare', 'Willow glade', 640, 540, 66, 46, 'moss', ['mosswyrm'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'waterfall', x: 1700, y: 300 }, { kind: 'ashTree', x: 640, y: 470, v: 4, s: 1.5 }, { kind: 'ashTree', x: 1430, y: 1010, v: 4, s: 1.2 },
    { kind: 'ashTree', x: 2230, y: 560, v: 0, s: 1.3 }, { kind: 'ashTree', x: 280, y: 540, v: 0, s: 1.3 },
    { kind: 'fireCrystal', x: 2100, y: 400, v: 0 }, { kind: 'fireCrystal', x: 440, y: 1560, v: 2 },
    { kind: 'pond', x: 1000, y: 1150 }, { kind: 'vineArch', x: 1200, y: 480 },
    { kind: 'boulder', x: 1000, y: 700, v: 0 }, { kind: 'boulder', x: 2250, y: 1400, v: 1 }, { kind: 'bush', x: 900, y: 1300, v: 2 },
    { kind: 'flowers', x: 1380, y: 300, v: 1 }, { kind: 'flowers', x: 1980, y: 350, v: 3 }, { kind: 'log', x: 360, y: 1520 }, { kind: 'stump', x: 1560, y: 1480 },
    { kind: 'totem', x: 2130, y: 1370 },
  ],
  gates: [
    { id: 'west', rect: [0, 1180, 110, 240], dir: 'left', style: 'path', label: 'Whispering Woods', to: { loc: 'whispering-woods', entrance: 'east' } },
    { id: 'north', rect: [1100, 60, 200, 110], dir: 'up', style: 'arch', label: 'Heartwood Hollow', to: { loc: 'heartwood-hollow', entrance: 'south' } },
  ],
  entrances: { west: { x: 210, y: 1310, facing: 'side' }, north: { x: 1200, y: 300, facing: 'down' } },
  interactables: [
    { id: 'q1', kind: 'mystery', x: 1100, y: 1230, marker: '?', name: 'Lily-pad pond', lines: ['Tiny rings spread over the pond. Lilyhop sleep on the pads when the sun is warm.'] },
    { id: 'chest', kind: 'chest', x: 2150, y: 450, marker: 'shimmer', name: 'Cliff chest' },
    { id: 'npc-fisher', kind: 'npc', npc: 'villager', x: 880, y: 1380, marker: '!', name: 'Fisher', lines: ['Two lakes and a waterfall, and not one fish will bite. They are too busy playing.', 'Follow the path north to find Heartwood Hollow, the roots of the oldest tree.'] },
    { id: 's1', kind: 'sign', x: 200, y: 1250, dir: 'left', name: 'Whispering Woods', marker: 'none' },
    { id: 's2', kind: 'sign', x: 1300, y: 300, dir: 'up', name: 'Heartwood Hollow', marker: 'none' },
    { id: 's3', kind: 'sign', x: 1530, y: 700, dir: 'right', name: 'Bridge to the waterfall', marker: 'none' },
  ],
  landmark: { x: 1700, y: 300, name: 'Waterfall' },
  mood: 'Blue ponds, floating lily pads, and soft green light on the water.',
  lights: [{ x: 620, y: 880, r: 420, c: '#8fe3ff' }, { x: 1860, y: 1180, r: 420, c: '#8fe3ff' }, { x: 1700, y: 340, r: 300, c: '#b9ffee' }],
  mini: '#4a9a58',
};
hollow.props = [...hollow.props, ...beside(hollow.paths[0].pts, 360, 118, (x, y, i) => ({ kind: 'lantern', x, y, v: i })),
  ...scatter('lh-scatter', 190, 2400, 1800, avoidOf(hollow), [{ kind: 'ashTree', v: [0, 1, 2, 3, 4, 5, 6, 7], s: [0.9, 1.3], w: 2.5 }, { kind: 'rock', v: [0, 1, 2], w: 1 }, { kind: 'bush', v: [0, 1, 2, 3], w: 2 },
    { kind: 'flowers', v: [0, 1, 2, 3, 4, 5], s: [0.8, 1.3], w: 8 }, { kind: 'plant', v: [0, 1, 2], s: [0.8, 1.3], w: 5 }, { kind: 'reeds', w: 3 }, { kind: 'stump', w: 0.6 }, { kind: 'fireflies', w: 0.9 }], 150)];

// ================================================================== 2.4 Heartwood Hollow (root chambers)
const chamber = (cx: number, cy: number, rx: number, ry: number, id: string): Pt[] => blob(cx, cy, rx, ry, id, 0.08);
const heartwood: LocationDef = {
  ...base, pal: PAL_DEEP, particles: 'sparkles', style: 'storybook', theme: 'grove-roots', id: 'heartwood-hollow', name: 'Heartwood Hollow', kind: 'standard', w: 2400, h: 1800, mode: 'carve', base: 'rock', edge: 'rock',
  floors: [
    { pts: chamber(1200, 1480, 560, 250, 'h-entrance'), face: 22 }, { pts: chamber(1200, 760, 700, 310, 'h-middle'), face: 22 }, { pts: chamber(1200, 240, 520, 190, 'h-deep'), face: 22 },
  ],
  paths: [
    { pts: [[1200, 1300], [1160, 1140], [1200, 980]], width: 170, main: true },
    { pts: [[800, 1400], [600, 1250], [520, 1050], [570, 850]], width: 120 }, { pts: [[1600, 1400], [1790, 1250], [1880, 1050], [1830, 850]], width: 120 },
    { pts: [[1560, 540], [1550, 440], [1450, 340], [1380, 260]], width: 190, main: true },
    { pts: [[1200, 1700], [1200, 1450]], width: 170, main: true }, { pts: [[1150, 600], [1380, 560], [1560, 540]], width: 120 },
  ],
  liquids: [{ kind: 'water', pts: blob(1200, 760, 360, 160, 'hpool', 0.08), closed: true }],
  bridges: [{ a: [1200, 960], b: [1200, 570], width: 100 }],
  fords: [],
  zones: [
    zone('hh-entrance', 'Entrance glow-moss', 820, 1520, 190, 120, 'moss', ['capling', 'lanternfly', 'zapling']),
    zone('hh-middle', 'Pool-side glow-moss', 1750, 700, 160, 120, 'moss', ['zapling', 'dewmoth', 'sproutle']),
    zone('hh-deep', 'Root glow-moss', 940, 270, 150, 90, 'moss', ['lanternfly', 'capling', 'zapling']),
    zone('hh-rare', 'Underground waterfall', 780, 650, 66, 46, 'moss', ['wispling'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'waterfall', x: 800, y: 540, s: 1 },
    { kind: 'statue', x: 980, y: 180 }, { kind: 'statue', x: 1420, y: 180 }, { kind: 'altar', x: 1200, y: 400 },
    { kind: 'ashTree', x: 760, y: 190, v: 0, s: 1.3 }, { kind: 'ashTree', x: 1650, y: 170, v: 1, s: 1.2 }, { kind: 'ashTree', x: 640, y: 330, v: 1 },
    { kind: 'fireCrystal', x: 1000, y: 160, v: 1, s: 1.2 }, { kind: 'fireCrystal', x: 1420, y: 150, v: 0 }, { kind: 'fireCrystal', x: 800, y: 200, v: 2 },
    { kind: 'fireCrystal', x: 1000, y: 1290, v: 1 }, { kind: 'fireCrystal', x: 1380, y: 1330, v: 0 }, { kind: 'fireCrystal', x: 1650, y: 600, v: 1 }, { kind: 'fireCrystal', x: 640, y: 1000, v: 0 },
    { kind: 'stalagmite', x: 650, y: 1450, v: 0 }, { kind: 'stalagmite', x: 1760, y: 1480, v: 1 }, { kind: 'stalagmite', x: 1000, y: 1620, v: 0 }, { kind: 'stalagmite', x: 1420, y: 1620, v: 1 },
    { kind: 'stalagmite', x: 760, y: 820, v: 0 }, { kind: 'stalagmite', x: 1700, y: 900, v: 1 }, { kind: 'stalagmite', x: 1500, y: 1070, v: 0 },
    { kind: 'boulder', x: 980, y: 1450, v: 0 }, { kind: 'rock', x: 1500, y: 1400, v: 1 }, { kind: 'rock', x: 560, y: 760, v: 2 },
    { kind: 'mushroom', x: 900, y: 1380, s: 1.2 }, { kind: 'mushroom', x: 1560, y: 1560, s: 1 }, { kind: 'mushroom', x: 1000, y: 500, s: 1.1 },
    { kind: 'lantern', x: 1060, y: 1230 }, { kind: 'lantern', x: 1340, y: 1230 }, { kind: 'fireflies', x: 1300, y: 1000 }, { kind: 'fireflies', x: 1700, y: 1250 },
  ],
  gates: [
    { id: 'south', rect: [1100, 1690, 200, 110], dir: 'down', style: 'cave', label: 'Lilypad Hollow', to: { loc: 'lilypad-hollow', entrance: 'north' } },
    { id: 'exit', rect: [1120, 20, 160, 110], dir: 'up', style: 'portal', label: 'Sandstone Reach', to: { exit: 'locked', message: 'The glowing doorway to Sandstone Reach is sealed for now. It will open on a later unlock.' } },
  ],
  entrances: { south: { x: 1200, y: 1600, facing: 'up' } },
  interactables: [
    { id: 'chest', kind: 'chest', x: 1885, y: 1130, marker: 'shimmer', name: 'Root chest' },
    { id: 'lore1', kind: 'lore', x: 1200, y: 470, marker: '?', name: 'Leaf altar', lines: ['The altar glows softly. Carved in the stone: "Every forest begins with one patient root."'] },
    { id: 'crack', kind: 'mystery', x: 525, y: 980, marker: '?', name: 'Glowing gap', lines: ['Green light seeps between the roots. The underground waterfall nearby is said to hide a shy, glowing wisp.'] },
    { id: 's1', kind: 'sign', x: 1100, y: 1650, dir: 'down', name: 'Back to Lilypad Hollow', marker: 'none' },
    { id: 's2', kind: 'sign', x: 1300, y: 1000, dir: 'up', name: 'Bridge across the root pool', marker: 'none' },
    { id: 's3', kind: 'sign', x: 1670, y: 520, dir: 'up', name: 'Deep chamber and the glowing doorway', marker: 'none' },
  ],
  landmark: { x: 800, y: 540, name: 'Underground waterfall' },
  mood: 'Emerald glow, mossy stone, and slow green fireflies between giant roots.',
  lights: [{ x: 1200, y: 760, r: 560, c: '#5fe8b0' }, { x: 800, y: 540, r: 360, c: '#8fffe0' }, { x: 1200, y: 230, r: 400, c: '#a8ff7a' }, { x: 1200, y: 1480, r: 360, c: '#7affb0' }],
  mini: '#2f5a44',
};
void insidePoly; void rrPts; void smooth;

// Tall trees never stand in front of a person or a chest (they would hide them): clear the ground south of every interactable.
for (const l of [village, woods, hollow, heartwood]) {
  const who = l.interactables.filter((i) => ['npc', 'lookout', 'chest', 'mystery', 'lore', 'shop'].includes(i.kind));
  l.props = l.props.filter((q) => !['ashTree', 'hollowTree', 'treehouse', 'house', 'stall'].includes(q.kind) || !who.some((i) => Math.abs(q.x - i.x) < 260 && q.y - i.y > -60 && q.y - i.y < 360 && !(i.kind === 'shop' && Math.hypot(q.x - i.x, q.y - i.y) < 40)));
}
export const GROVE: LocationDef[] = [village, woods, hollow, heartwood];
