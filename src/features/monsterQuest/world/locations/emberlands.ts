/** World 1: Emberlands. Four locations authored from the design spec (coordinates are world px at native scale). */
import type { InteractDef, LocationDef, LocPalette, Pt, PropDef, ZoneDef } from '../types';
import { blobPoly, rng, smooth } from '../util';

const PAL: LocPalette = {
  ground: ['#9b8b4e', '#b9a763', '#76683a'], tuft: '#c9b86a',
  path: ['#e2a766', '#f6cf92', '#a86a3a'], cliff: ['#8a6a5c', '#4d3a3c'], wall: ['#2b2024', '#5a4650'],
  lava: { deep: '#c42d0c', mid: '#ff6a1f', glow: '#ffb347', spark: '#fff2a8' },
  water: { deep: '#1b9aa6', mid: '#35cfd0', glow: '#b4f6ee', spark: '#ffffff' },
  ashTuft: ['#6f6a45', '#ff9a3a'], moss: ['#2f9c88', '#7fffe0'],
  haze: 'rgba(255,170,90,.10)', vignette: '#3a2a24', motes: '#ffd28a',
};

// ------------------------------------------------------------------ helpers
function distSeg(p: Pt, a: Pt, b: Pt) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)); return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t)); }
function distPoly(p: Pt, pts: Pt[]) { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, distSeg(p, pts[i - 1], pts[i])); return d; }
function insidePoly(x: number, y: number, poly: Pt[]) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }

interface Avoid { paths: { pts: Pt[]; width: number }[]; liquids: { pts: Pt[]; width?: number; closed?: boolean }[]; zones: Pt[][]; points: { x: number; y: number; r: number }[]; plateaus?: Pt[][]; floorsOnly?: Pt[][] }
function scatter(seed: string, n: number, w: number, h: number, av: Avoid, kinds: { kind: PropDef['kind']; v?: number[]; s?: [number, number]; w: number }[], inset = 150): PropDef[] {
  const r = rng(seed), out: PropDef[] = [], total = kinds.reduce((a, k) => a + k.w, 0);
  const paths = av.paths.map((p) => ({ pts: smooth(p.pts, 6), width: p.width })), liq = av.liquids.map((l) => ({ pts: l.closed ? smooth(l.pts, 6, true) : smooth(l.pts, 6), width: l.width ?? 0, closed: l.closed }));
  const zones = av.zones.map((z) => smooth(z, 4, true));
  for (let tries = 0; out.length < n && tries < n * 60; tries++) {
    const x = inset + r() * (w - inset * 2), y = inset + r() * (h - inset * 2), p: Pt = [x, y];
    if (paths.some((q) => distPoly(p, q.pts) < q.width / 2 + 70)) continue;
    if (liq.some((q) => (q.closed ? insidePoly(x, y, q.pts) || distPoly(p, q.pts) < 80 : distPoly(p, q.pts) < q.width / 2 + 70))) continue;
    if (zones.some((z) => insidePoly(x, y, z) || distPoly(p, z) < 50)) continue;
    if (av.points.some((q) => Math.hypot(q.x - x, q.y - y) < q.r)) continue;
    if (av.floorsOnly && !av.floorsOnly.some((f) => insidePoly(x, y, smooth(f, 4, true)))) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 90)) continue;
    let k = r() * total, pick = kinds[0]; for (const kk of kinds) { if ((k -= kk.w) <= 0) { pick = kk; break; } }
    const v = pick.v ? pick.v[Math.floor(r() * pick.v.length)] : undefined, s = pick.s ? pick.s[0] + r() * (pick.s[1] - pick.s[0]) : 1;
    out.push({ kind: pick.kind, x, y, v, s });
  }
  return out;
}
const avoidOf = (d: { paths: any[]; liquids: any[]; zones: ZoneDef[]; bridges: any[]; interactables: InteractDef[]; props: PropDef[]; gates: any[] }): Avoid => ({
  paths: [...d.paths.map((p) => ({ pts: p.pts, width: p.width })), ...d.bridges.map((b) => ({ pts: [b.a, b.b] as Pt[], width: b.width + 40 }))],
  liquids: d.liquids, zones: d.zones.map((z) => z.poly),
  points: [...d.interactables.map((i) => ({ x: i.x, y: i.y, r: 130 })), ...d.props.map((p) => ({ x: p.x, y: p.y, r: p.kind === 'house' ? 200 : p.kind === 'fountain' || p.kind === 'statue' ? 220 : 90 })), ...d.gates.map((g: any) => ({ x: g.rect[0] + g.rect[2] / 2, y: g.rect[1] + g.rect[3] / 2, r: 320 }))],
});
const zone = (id: string, label: string, cx: number, cy: number, rx: number, ry: number, ground: 'ash' | 'moss', pool: string[], extra: Partial<ZoneDef> = {}): ZoneDef => ({ id, label, ground, pool, poly: blobPoly(cx, cy, rx, ry, id, 0.1, 10).filter((_, i) => i % 6 === 0), ...extra });

const base = { world: 1, pal: PAL, serverZone: 'forest', particles: 'embers' as const, fords: [], liquids: [], bridges: [], zones: [], critters: [], lights: [], blockers: [], plazas: [] };

// ================================================================== 1.1 Ember Village
const villageCore = {
  props: [
    { kind: 'lighthouse', x: 800, y: 292, s: 1 }, { kind: 'fountain', x: 800, y: 650 },
    { kind: 'house', x: 500, y: 500, v: 0 }, { kind: 'house', x: 1060, y: 480, v: 1 }, { kind: 'house', x: 470, y: 900, v: 2 },
    { kind: 'stall', x: 1000, y: 800 },
    { kind: 'lantern', x: 800, y: 420 }, { kind: 'lantern', x: 590, y: 560 }, { kind: 'lantern', x: 1010, y: 560 }, { kind: 'lantern', x: 560, y: 780 }, { kind: 'lantern', x: 1040, y: 790 }, { kind: 'lantern', x: 690, y: 920 },
    { kind: 'fence', x: 380, y: 560, len: 120 }, { kind: 'fence', x: 1160, y: 430, len: 80 },
    { kind: 'mushroom', x: 330, y: 440, v: 2, s: 1.2 }, { kind: 'mushroom', x: 1180, y: 560, v: 4, s: 0.8 }, { kind: 'mushroom', x: 640, y: 1070, v: 1, s: 1.1 }, { kind: 'mushroom', x: 1020, y: 1060, v: 3, s: 1.3 },
    { kind: 'bush', x: 700, y: 440, v: 0 }, { kind: 'bush', x: 390, y: 1075, v: 1 }, { kind: 'bush', x: 1200, y: 880, v: 0 },
    { kind: 'fireCrystal', x: 290, y: 760, v: 0 }, { kind: 'fireCrystal', x: 1450, y: 840, v: 3 },
  ] as PropDef[],
  interactables: [
    { id: 'guide', kind: 'npc', npc: 'guide', x: 660, y: 740, marker: '!', name: 'Village guide', lines: ['Welcome to Ember Village! Walk with the arrow keys or WASD, or drag the joystick.', 'Tall ash-grass and glowing moss hide wild monsters. Step in and keep moving to find one.', 'Paths and the village are always safe. Head east to Mushroom Valley when you are ready.'] },
    { id: 'shop', kind: 'shop', x: 1000, y: 800, marker: 'arrow', name: 'Shop' },
    { id: 'stone', kind: 'stone', x: 800, y: 440, marker: 'none', name: 'Fast-travel stone' },
    { id: 'chest', kind: 'chest', x: 1200, y: 430, marker: 'shimmer', name: 'Treasure chest' },
    { id: 's-east', kind: 'sign', x: 1190, y: 552, dir: 'right', name: 'Mushroom Valley', marker: 'none' },
    { id: 's-south', kind: 'sign', x: 740, y: 1040, dir: 'down', name: 'World map', marker: 'none' },
    { id: 's-look', kind: 'sign', x: 440, y: 650, dir: 'left', name: 'Lava lookout', marker: 'none' },
    { id: 'lookout', kind: 'lookout', x: 140, y: 560, marker: '?', name: 'Lava lookout', lines: ['From here the lava stream glows like a ribbon of sunset. It is slow and fenced, so it never bothers the village.'] },
  ] as InteractDef[],
};
const village: LocationDef = {
  ...base, id: 'ember-village', name: 'Ember Village', kind: 'village', w: 1600, h: 1200, mode: 'open', edge: 'foliage',
  plateaus: [{ pts: [[-80, -80], [1680, -80], [1680, 300], [1380, 345], [1040, 305], [800, 336], [560, 305], [250, 345], [-80, 300]], face: 34 }],
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
    { kind: 'lava', pts: [[330, 345], [300, 520], [240, 700], [300, 880], [220, 1040], [160, 1200]], width: 56 },
    { kind: 'lava', pts: [[1290, 345], [1260, 520], [1330, 680], [1270, 860], [1340, 1040], [1400, 1200]], width: 56 },
  ],
  bridges: [
    { a: [215, 645], b: [325, 645], width: 140 }, { a: [205, 965], b: [315, 965], width: 140 },
    { a: [1260, 650], b: [1380, 650], width: 140 }, { a: [1230, 960], b: [1350, 960], width: 140 },
  ],
  gates: [
    { id: 'east', rect: [1490, 540, 110, 200], dir: 'right', style: 'path', label: 'Mushroom Valley', to: { loc: 'mushroom-valley', entrance: 'west' } },
    { id: 'south', rect: [700, 1090, 200, 110], dir: 'down', style: 'gate', label: 'World map', to: { exit: 'world' } },
  ],
  entrances: { south: { x: 800, y: 1040, facing: 'up' }, east: { x: 1400, y: 640, facing: 'side', flip: true }, spawn: { x: 800, y: 1040, facing: 'up' } },
  props: villageCore.props, interactables: villageCore.interactables,
  critters: [{ sprite: 'flamora', x: 880, y: 575, size: 92 }, { sprite: 'furron', x: 570, y: 925, size: 88 }, { sprite: 'puffy', x: 1140, y: 540, size: 84, flip: true }],
  landmark: { x: 800, y: 300, name: 'Mushroom lighthouse' },
  mood: 'Warm lantern glow, amber haze, small embers drifting upward.',
  lights: [{ x: 800, y: 650, r: 420, c: '#ffb347' }, { x: 500, y: 520, r: 220, c: '#ffd46a' }, { x: 1060, y: 500, r: 220, c: '#ffd46a' }, { x: 1000, y: 800, r: 200, c: '#ffd46a' }],
  mini: '#b9a763',
};
village.props = [...village.props, ...scatter('v-scatter', 16, 1600, 1200, avoidOf(village), [{ kind: 'ashTree', v: [0, 1, 2, 3], s: [0.9, 1.2], w: 3 }, { kind: 'mushroom', v: [0, 1, 2, 3, 4], s: [0.8, 1.4], w: 3 }, { kind: 'rock', v: [0, 1, 2], w: 1 }], 140).filter((p) => p.y > 400)];

// ================================================================== 1.2 Mushroom Valley
const valleyPlateau: Pt[] = [[1620, 300], [1950, 230], [2300, 300], [2330, 560], [2260, 800], [1950, 850], [1650, 790], [1580, 560]];
const valley: LocationDef = {
  ...base, id: 'mushroom-valley', name: 'Mushroom Valley', kind: 'standard', w: 2400, h: 1800, mode: 'open', edge: 'foliage', particles: 'sparkles',
  plateaus: [{ pts: valleyPlateau, face: 40 }],
  paths: [
    { pts: [[110, 1300], [430, 1350], [720, 1290], [600, 1060], [450, 830], [560, 600], [850, 520], [1100, 540], [1215, 560], [1385, 560], [1560, 590], [1700, 600], [1850, 520], [2050, 480], [2200, 560], [2230, 780], [2200, 960], [2270, 1150]], width: 150, main: true },
    { pts: [[900, 740], [1100, 830], [1130, 980], [1000, 1170], [790, 1160], [670, 1010], [700, 820], [900, 740]], width: 110 },
    { pts: [[1130, 985], [1260, 1000], [1400, 1000], [1650, 1060], [1950, 1140], [2270, 1150]], width: 120 },
    { pts: [[720, 1290], [900, 1450], [1190, 1500], [1360, 1500], [1650, 1480], [1760, 1300], [1900, 1135]], width: 130 },
    { pts: [[560, 600], [380, 580]], width: 100 },
    { pts: [[1700, 1500], [1800, 1560]], width: 100 },
  ],
  liquids: [
    { kind: 'water', pts: [[1330, 460], [1280, 640], [1360, 820], [1260, 1000], [1330, 1200], [1250, 1400], [1300, 1650], [1290, 1850]], width: 120 },
    { kind: 'water', pts: [[1180, 220], [1250, 330], [1330, 460]], width: 90 },
    { kind: 'water', pts: [[1500, 220], [1440, 330], [1330, 460]], width: 90 },
  ],
  fords: [{ pts: [[1140, 1012], [1260, 1000], [1390, 1000]], width: 84 }],
  bridges: [{ a: [1205, 565], b: [1395, 565], width: 160 }, { a: [1180, 1500], b: [1370, 1500], width: 150 }],
  zones: [
    zone('mv-west', 'West glow-moss', 340, 1060, 190, 150, 'moss', ['capling', 'pebblin', 'cinderpup']),
    zone('mv-plateau', 'Plateau glow-moss', 1960, 720, 170, 80, 'moss', ['lanternfly', 'capling', 'emberkit']),
    zone('mv-east', 'East glow-moss', 2080, 1340, 190, 130, 'moss', ['cinderpup', 'emberkit', 'pebblin']),
    zone('mv-rare', 'Rare spot under the giant cap', 900, 1095, 62, 44, 'moss', ['lanternfly'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'mushroom', x: 900, y: 985, v: 0, s: 3.6 },
    { kind: 'waterfall', x: 1180, y: 250 }, { kind: 'waterfall', x: 1500, y: 250 },
    { kind: 'mushroom', x: 1800, y: 400, v: 1, s: 1.9 }, { kind: 'mushroom', x: 1960, y: 360, v: 2, s: 2.3 }, { kind: 'mushroom', x: 2100, y: 400, v: 1, s: 1.7 }, { kind: 'mushroom', x: 2230, y: 350, v: 2, s: 1.4 },
    { kind: 'fireCrystal', x: 2290, y: 470, v: 2 }, { kind: 'fireCrystal', x: 1700, y: 330, v: 2 },
    { kind: 'fireCrystal', x: 1550, y: 1180, v: 0 }, { kind: 'fireCrystal', x: 600, y: 1590, v: 3 },
    { kind: 'bush', x: 760, y: 1010, v: 0 }, { kind: 'bush', x: 1460, y: 1250, v: 1 }, { kind: 'bush', x: 1100, y: 1380, v: 0 },
    { kind: 'boulder', x: 330, y: 700, v: 0 }, { kind: 'boulder', x: 1650, y: 1650, v: 1 },
  ],
  gates: [
    { id: 'west', rect: [0, 1180, 110, 240], dir: 'left', style: 'path', label: 'Ember Village', to: { loc: 'ember-village', entrance: 'east' } },
    { id: 'east', rect: [2290, 1030, 110, 240], dir: 'right', style: 'path', label: 'Ancient Ember Ruins', to: { loc: 'ember-ruins', entrance: 'west' } },
  ],
  entrances: { west: { x: 210, y: 1300, facing: 'side' }, east: { x: 2190, y: 1150, facing: 'side', flip: true } },
  interactables: [
    { id: 'q1', kind: 'mystery', x: 380, y: 580, marker: '?', name: 'Hollow stump', lines: ['A glowing stump hums softly. Lanternflies like to rest in the mushroom shade near the big cap.'] },
    { id: 'q2', kind: 'mystery', x: 1810, y: 1560, marker: '?', name: 'Sparkling pebble', lines: ['A pebble sparkles in the grass. Pebblin collect shiny stones, so one must live nearby.'] },
    { id: 'chest', kind: 'chest', x: 2170, y: 430, marker: 'shimmer', name: 'Plateau chest' },
    { id: 'npc-hiker', kind: 'npc', npc: 'villager', x: 560, y: 1480, marker: '!', name: 'Hiker', lines: ['The big mushroom in the middle is a great landmark. If you get lost, walk toward it.', 'The stepping stones past the mushroom are a shortcut to the east, but they slow you down a little.'] },
    { id: 's1', kind: 'sign', x: 200, y: 1230, dir: 'left', name: 'Ember Village', marker: 'none' },
    { id: 's2', kind: 'sign', x: 690, y: 1380, dir: 'up', name: 'Giant mushroom and the plateau', marker: 'none' },
    { id: 's3', kind: 'sign', x: 1460, y: 650, dir: 'right', name: 'Glowing mushroom plateau', marker: 'none' },
    { id: 's4', kind: 'sign', x: 1140, y: 1100, dir: 'right', name: 'Stepping-stone shortcut east', marker: 'none' },
    { id: 's5', kind: 'sign', x: 2120, y: 1090, dir: 'right', name: 'Ancient Ember Ruins', marker: 'none' },
  ],
  critters: [
    { sprite: 'flora', x: 300, y: 1050, size: 92, zone: 'mv-west' }, { sprite: 'furron', x: 400, y: 1100, size: 88, zone: 'mv-west' },
    { sprite: 'pixie', x: 1930, y: 700, size: 86, zone: 'mv-plateau' }, { sprite: 'flamora', x: 2010, y: 740, size: 90, zone: 'mv-plateau' },
    { sprite: 'furron', x: 2040, y: 1330, size: 88, zone: 'mv-east' }, { sprite: 'rokki', x: 2130, y: 1370, size: 92, zone: 'mv-east' },
    { sprite: 'pixie', x: 900, y: 1090, size: 90, zone: 'mv-rare' },
  ],
  landmark: { x: 900, y: 985, name: 'Giant spotted mushroom' },
  mood: 'Glowing plants light the shade, soft sparkles over the water.',
  lights: [{ x: 1960, y: 420, r: 380, c: '#9a7bff' }, { x: 900, y: 1000, r: 420, c: '#ffd9a0' }, { x: 340, y: 1060, r: 240, c: '#5ff0d0' }, { x: 2080, y: 1340, r: 240, c: '#5ff0d0' }],
  mini: '#b9a763',
};
valley.props = [...valley.props, ...scatter('mv-scatter', 46, 2400, 1800, avoidOf(valley), [{ kind: 'ashTree', v: [0, 1, 2, 3], s: [0.9, 1.25], w: 4 }, { kind: 'mushroom', v: [0, 1, 2, 3, 4], s: [0.8, 1.7], w: 4 }, { kind: 'rock', v: [0, 1, 2], w: 1 }, { kind: 'bush', v: [0, 1], w: 1 }], 150)
  .filter((p) => !insidePoly(p.x, p.y, smooth(valleyPlateau, 4, true)) || p.y < 760 && p.y > 330)];

// ================================================================== 1.3 Ancient Ember Ruins
const rrPts = (x0: number, y0: number, x1: number, y1: number, r: number): Pt[] => { const o: Pt[] = []; const arc = (cx: number, cy: number, a0: number) => { for (let k = 0; k <= 3; k++) { const a = a0 + (k * Math.PI) / 6; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }; arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); return o; };
const platform = (cx: number, cy: number, rx: number, ry: number, id: string): Pt[] => blobPoly(cx, cy, rx, ry, id, 0.05, 12).filter((_, i) => i % 6 === 0);
const ruins: LocationDef = {
  ...base, id: 'ember-ruins', name: 'Ancient Ember Ruins', kind: 'standard', w: 2400, h: 1800, mode: 'carve', base: 'lava', edge: 'rock', particles: 'ash',
  floors: [
    { pts: rrPts(820, 650, 1580, 1130, 90), face: 30 },
    { pts: platform(300, 900, 240, 200, 'pw'), face: 28 }, { pts: platform(520, 340, 230, 160, 'pha'), face: 28 }, { pts: platform(1200, 310, 260, 150, 'pn'), face: 28 },
    { pts: platform(2100, 900, 220, 200, 'pe'), face: 28 }, { pts: platform(1880, 1450, 230, 150, 'phb'), face: 28 }, { pts: platform(1200, 1500, 270, 150, 'ps'), face: 28 },
  ],
  paths: [
    { pts: [[1200, 830], [1010, 880], [1000, 990], [1200, 1040], [1400, 990], [1410, 880], [1200, 830]], width: 110, main: true },
    { pts: [[1200, 1040], [1200, 1440]], width: 130 }, { pts: [[1200, 830], [1200, 360]], width: 130 },
    { pts: [[1000, 920], [160, 900]], width: 150, main: true }, { pts: [[1410, 920], [2100, 900]], width: 150, main: true },
    { pts: [[520, 360], [760, 330], [1000, 320]], width: 120 }, { pts: [[1880, 1450], [1560, 1470], [1300, 1500]], width: 120 },
    { pts: [[300, 900], [330, 740], [450, 500], [520, 360]], width: 120 }, { pts: [[2100, 900], [2060, 1100], [1950, 1300], [1880, 1450]], width: 120 },
  ],
  bridges: [
    { a: [820, 900], b: [530, 900], width: 150 }, { a: [350, 760], b: [470, 520], width: 140 }, { a: [750, 330], b: [950, 310], width: 140 },
    { a: [1200, 640], b: [1200, 450], width: 150 }, { a: [1580, 900], b: [1880, 900], width: 150 }, { a: [2060, 1080], b: [1960, 1320], width: 140 },
    { a: [1680, 1460], b: [1440, 1480], width: 140 }, { a: [1200, 1150], b: [1200, 1380], width: 150 },
  ],
  liquids: [],
  zones: [
    zone('er-w', 'West ember-grass', 260, 960, 130, 100, 'ash', ['pebblin', 'scorchling', 'lanternfly']),
    zone('er-ha', 'Hall ember-grass', 600, 400, 130, 90, 'ash', ['pebblin', 'magmite', 'lanternfly']),
    zone('er-hb', 'South hall ember-grass', 1860, 1520, 140, 90, 'ash', ['magmite', 'scorchling', 'pebblin']),
    zone('er-s', 'South ember-grass', 1120, 1540, 150, 80, 'ash', ['scorchling', 'magmite', 'lanternfly']),
    zone('er-altar', 'Altar rare spot', 2100, 1000, 70, 50, 'ash', ['runeling'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'statue', x: 1200, y: 748, s: 1.15 },
    { kind: 'fireCrystal', x: 930, y: 1085, v: 0, s: 1.2 }, { kind: 'fireCrystal', x: 1470, y: 1085, v: 3, s: 1.2 },
    { kind: 'altar', x: 2100, y: 880 },
    { kind: 'pillar', x: 380, y: 280 }, { kind: 'brokenPillar', x: 450, y: 250 }, { kind: 'wall', x: 520, y: 220, len: 160 }, { kind: 'pillar', x: 680, y: 260 },
    { kind: 'pillar', x: 1740, y: 1420 }, { kind: 'brokenPillar', x: 1830, y: 1390 }, { kind: 'wall', x: 1900, y: 1360, len: 160 }, { kind: 'pillar', x: 2040, y: 1390 },
    { kind: 'pillar', x: 960, y: 1480 }, { kind: 'brokenPillar', x: 1450, y: 1520 }, { kind: 'pillar', x: 1010, y: 250 }, { kind: 'brokenPillar', x: 1400, y: 270 },
    { kind: 'torch', x: 900, y: 700 }, { kind: 'torch', x: 1500, y: 700 }, { kind: 'torch', x: 900, y: 1110 }, { kind: 'torch', x: 1500, y: 1110 },
    { kind: 'torch', x: 130, y: 1000 }, { kind: 'torch', x: 130, y: 800 },
    { kind: 'boulder', x: 150, y: 1010, v: 0 }, { kind: 'rock', x: 2230, y: 1000, v: 1 }, { kind: 'rock', x: 330, y: 1060, v: 2 }, { kind: 'rock', x: 700, y: 440, v: 0 }, { kind: 'rock', x: 1560, y: 360, v: 1 },
    { kind: 'fireCrystal', x: 2200, y: 760, v: 1 }, { kind: 'fireCrystal', x: 1000, y: 380, v: 0 }, { kind: 'fireCrystal', x: 1400, y: 1560, v: 3 },
  ],
  gates: [
    { id: 'west', rect: [0, 800, 130, 200], dir: 'left', style: 'path', label: 'Mushroom Valley', to: { loc: 'mushroom-valley', entrance: 'east' } },
    { id: 'north', rect: [1100, 60, 200, 110], dir: 'up', style: 'arch', label: 'Molten Caverns', to: { loc: 'molten-caverns', entrance: 'south' } },
  ],
  entrances: { west: { x: 215, y: 790, facing: 'side' }, north: { x: 1200, y: 300, facing: 'down' } },
  interactables: [
    { id: 'scholar', kind: 'npc', npc: 'scholar', x: 350, y: 1010, marker: '!', name: 'Scholar', lines: ['These halls were built by the first ember keepers. The seated statue watches every platform.', 'Two glowing tiles in the halls open the old chest. Step on both.'] },
    { id: 'lore1', kind: 'lore', x: 1010, y: 360, marker: '?', name: 'Weathered statue', lines: ['"Fire is a friend to those who walk with care." The rest of the carving has worn away.'] },
    { id: 'lore2', kind: 'lore', x: 1380, y: 1540, marker: '?', name: 'Weathered statue', lines: ['"Where the lava sleeps, the cave begins." An arrow points north.'] },
    { id: 'plateA', kind: 'plate', x: 470, y: 480, name: 'Glowing tile', link: 'plateB' },
    { id: 'plateB', kind: 'plate', x: 1780, y: 1560, name: 'Glowing tile', link: 'plateA' },
    { id: 'chest', kind: 'chest', x: 1240, y: 1550, marker: 'shimmer', name: 'Sealed chest', link: 'plates' },
    { id: 's1', kind: 'sign', x: 170, y: 1040, dir: 'left', name: 'Mushroom Valley', marker: 'none' },
    { id: 's2', kind: 'sign', x: 1100, y: 250, dir: 'up', name: 'Molten Caverns', marker: 'none' },
  ],
  critters: [
    { sprite: 'rokki', x: 240, y: 960, size: 90, zone: 'er-w' }, { sprite: 'pixie', x: 610, y: 400, size: 86, zone: 'er-ha' },
    { sprite: 'lavaro', x: 1860, y: 1520, size: 96, zone: 'er-hb' }, { sprite: 'puffy', x: 1130, y: 1540, size: 86, zone: 'er-s' },
    { sprite: 'rockzor', x: 2110, y: 1000, size: 96, zone: 'er-altar' },
  ],
  landmark: { x: 1200, y: 780, name: 'Seated fire statue' },
  mood: 'Sunset gold on weathered stone, slow lava glow, drifting ash motes.',
  lights: [{ x: 1200, y: 800, r: 520, c: '#ffb347' }, { x: 2100, y: 900, r: 300, c: '#ffd46a' }, { x: 1200, y: 1500, r: 400, c: '#ff8a2a' }],
  mini: '#8f7b6c',
};
ruins.props = [...ruins.props];

// ================================================================== 1.4 Molten Caverns
const chamber = (cx: number, cy: number, rx: number, ry: number, id: string): Pt[] => blobPoly(cx, cy, rx, ry, id, 0.08, 12).filter((_, i) => i % 6 === 0);
const caverns: LocationDef = {
  ...base, id: 'molten-caverns', name: 'Molten Caverns', kind: 'standard', w: 2400, h: 1800, mode: 'carve', base: 'rock', edge: 'rock', particles: 'embers',
  floors: [
    { pts: chamber(1200, 1480, 560, 250, 'c-entrance'), face: 22 }, { pts: chamber(1200, 760, 700, 310, 'c-middle'), face: 22 }, { pts: chamber(1200, 240, 520, 190, 'c-deep'), face: 22 },
  ],
  paths: [
    { pts: [[1200, 1300], [1160, 1140], [1200, 980]], width: 170, main: true },
    { pts: [[800, 1400], [600, 1250], [520, 1050], [570, 850]], width: 120 }, { pts: [[1600, 1400], [1790, 1250], [1880, 1050], [1830, 850]], width: 120 },
    { pts: [[1560, 540], [1550, 440], [1450, 340], [1380, 260]], width: 190, main: true },
    { pts: [[1200, 1700], [1200, 1450]], width: 170, main: true }, { pts: [[1150, 600], [1380, 560], [1560, 540]], width: 120 },
  ],
  liquids: [{ kind: 'lava', pts: blobPoly(1200, 760, 360, 160, 'pool', 0.08, 12).filter((_, i) => i % 6 === 0), closed: true }],
  bridges: [{ a: [1200, 960], b: [1200, 570], width: 150 }],
  fords: [],
  zones: [
    zone('mc-entrance', 'Entrance glow-moss', 820, 1520, 190, 120, 'moss', ['magmite', 'cinderpup', 'scorchling']),
    zone('mc-middle', 'Middle-chamber glow-moss', 1750, 700, 160, 120, 'moss', ['cinderpup', 'scorchling', 'magmite']),
    zone('mc-spires', 'Spire glow-moss', 940, 270, 150, 90, 'moss', ['magmite', 'scorchling', 'cinderpup']),
    zone('mc-rare', 'Lava-fall rare spot', 780, 650, 66, 46, 'moss', ['pyrovern'], { rare: true, density: 1.4 }),
  ],
  props: [
    { kind: 'lavafall', x: 800, y: 540, s: 1 },
    { kind: 'spire', x: 1200, y: 250, v: 1, s: 1.5 }, { kind: 'spire', x: 1100, y: 190, v: 0, s: 1.2 }, { kind: 'spire', x: 1340, y: 200, v: 1 },
    { kind: 'fireCrystal', x: 1000, y: 160, v: 3, s: 1.3 }, { kind: 'fireCrystal', x: 1420, y: 150, v: 0 }, { kind: 'fireCrystal', x: 800, y: 200, v: 1 },
    { kind: 'fireCrystal', x: 1000, y: 1290, v: 3 }, { kind: 'fireCrystal', x: 1380, y: 1330, v: 0 }, { kind: 'fireCrystal', x: 1650, y: 600, v: 3 }, { kind: 'fireCrystal', x: 640, y: 1000, v: 0 },
    { kind: 'stalagmite', x: 650, y: 1450, v: 0 }, { kind: 'stalagmite', x: 1760, y: 1480, v: 1 }, { kind: 'stalagmite', x: 1000, y: 1620, v: 0 }, { kind: 'stalagmite', x: 1420, y: 1620, v: 1 },
    { kind: 'stalagmite', x: 760, y: 820, v: 0 }, { kind: 'stalagmite', x: 1700, y: 900, v: 1 }, { kind: 'stalagmite', x: 1500, y: 1070, v: 0 },
    { kind: 'boulder', x: 980, y: 1450, v: 1 }, { kind: 'rock', x: 1500, y: 1400, v: 0 }, { kind: 'rock', x: 560, y: 760, v: 1 },
    { kind: 'torch', x: 1060, y: 1230 }, { kind: 'torch', x: 1340, y: 1230 },
  ],
  gates: [
    { id: 'south', rect: [1100, 1690, 200, 110], dir: 'down', style: 'cave', label: 'Ancient Ember Ruins', to: { loc: 'ember-ruins', entrance: 'north' } },
    { id: 'exit', rect: [1120, 20, 160, 110], dir: 'up', style: 'portal', label: 'Emerald Grove', to: { exit: 'locked', message: 'The glowing doorway to Emerald Grove is sealed for now. It will open on a later unlock.' } },
  ],
  entrances: { south: { x: 1200, y: 1600, facing: 'up' } },
  interactables: [
    { id: 'chest', kind: 'chest', x: 1885, y: 1130, marker: 'shimmer', name: 'Tunnel chest' },
    { id: 'crack', kind: 'mystery', x: 525, y: 980, marker: '?', name: 'Glowing crack', lines: ['Something orange glows inside the crack. The lava-fall nearby is where Pyrovern is said to sleep.'] },
    { id: 's1', kind: 'sign', x: 1100, y: 1650, dir: 'down', name: 'Back to Ancient Ember Ruins', marker: 'none' },
    { id: 's2', kind: 'sign', x: 1300, y: 1000, dir: 'up', name: 'Bridge across the lava pool', marker: 'none' },
    { id: 's3', kind: 'sign', x: 1670, y: 520, dir: 'up', name: 'Deep chamber and the glowing doorway', marker: 'none' },
  ],
  critters: [
    { sprite: 'lavaro', x: 800, y: 1520, size: 98, zone: 'mc-entrance' }, { sprite: 'furron', x: 890, y: 1560, size: 86, zone: 'mc-entrance' },
    { sprite: 'puffy', x: 1740, y: 700, size: 86, zone: 'mc-middle' }, { sprite: 'lavaro', x: 940, y: 280, size: 96, zone: 'mc-spires' },
    { sprite: 'rexi', x: 780, y: 660, size: 100, zone: 'mc-rare' },
  ],
  landmark: { x: 800, y: 540, name: 'Lava-fall' },
  mood: 'Orange and obsidian black with cool crystal highlights for contrast.',
  lights: [{ x: 1200, y: 760, r: 560, c: '#ff7a2a' }, { x: 800, y: 540, r: 360, c: '#ff8a2a' }, { x: 1200, y: 230, r: 400, c: '#ffb347' }, { x: 1200, y: 1480, r: 360, c: '#ff9a4a' }],
  mini: '#6b5648',
};

export const EMBERLANDS: LocationDef[] = [village, valley, ruins, caverns];
