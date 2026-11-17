/**
 * Storybook look for a location: ground textures, dirt paths, water, bridges and every object drawn from the
 * painted sprites in public/monster-quest/world/. A location opts in with `style: 'storybook'`.
 * To change how big or where an object sits, edit SCALE and km() below. New pictures: tools/build_world_assets.py.
 */
import type { Field } from '../collision';
import type { Sprite, StoryHook } from '../paintProps';
import type { LiquidDef, LocationDef, PathDef, PropDef, Pt, ZoneDef } from '../types';
import { pointInPoly, rng, smooth } from '../util';
import { aAsset, aImg, gImg, loadStoryAssets, sImg } from './assets';

type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const mkcv = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };

export interface AnimFrames { img: HTMLImageElement; n: number; fps: number; fw: number; fh: number }
type Fp = { t: 'e'; rx: number; ry: number; dy: number } | { t: 'r'; hw: number; hh: number; dy: number };
export interface StoryPlaced { sp: Sprite; canopy: boolean; fx?: (c: C, d: PropDef, t: number) => void; sway?: number; frames?: AnimFrames; fp: Fp[]; shadow: [number, number] }
export interface Peek { x: number; y: number; id: string; ph: number }

// ------------------------------------------------------------------ how big each picture is drawn (1 = as cut from the sheet)
const SCALE: Record<string, number> = {
  'tree-green': 1.0, 'tree-pink': 1.0, 'tree-orange': 1.0, pine: 1.0, palm: 1.0, cypress: 1.0,
  'house-red': 0.82, 'house-purple': 0.82, 'house-blue': 0.82, 'house-orange': 0.82, 'house-pink': 0.82, 'house-green': 0.82, 'cottage-blue': 0.8, 'hut-wood': 0.74, 'shop-house': 0.74,
  'bush-big': 0.32, 'bush-mid': 0.33, 'bush-berry': 0.38, 'bush-flowers': 0.9, 'bush-flowers2': 0.9,
  'rock-moss': 0.85, 'rock-block': 0.85, 'rocks-small': 0.7, 'rock-mossy': 0.36,
  'mush-red': 0.42, 'mush-purple': 0.45,
  'crystal-pillar': 1, 'crystal-shard': 1, 'gem-big': 1, 'gem-small': 1, 'crystal-pedestal': 1.1,
  'lamp-a': 1, 'lamp-b': 1, 'lamp-c': 1.1, 'lamp-hanging': 1,
  'stall-potions': 1.05, 'stall-blue': 1.15, 'stall-fruit': 1.15, 'notice-board': 0.8, chest: 0.65, 'sign-green': 0.7, 'sign-blue': 0.7,
  'fence-wood': 0.8, 'fence-picket': 0.8, 'banner-post': 1.3, well: 1, bench: 0.9, barrel: 0.9, barrel2: 0.9, crate: 0.9, planter: 0.9, log: 1, stump: 1, 'stump-roots': 0.3, 'log-hollow': 0.3,
  'flowers-white': 0.8, 'flowers-purple': 1, 'flowers-yellow': 1, tulips: 1, 'flowers-big': 0.3, 'flowers-mid': 0.4, 'flowers-small': 0.5,
  'grass-big': 0.3, 'grass-mid': 0.3, 'grass-small': 0.3, fern: 0.35, 'plant-a': 1, 'plant-b': 1, 'leaf-small': 1, wheat: 0.3, cattail: 0.3, 'lilypad-a': 0.4, 'lilypad-b': 0.4,
  'bridge-wood': 1, 'pillar': 1, 'pillar-broken': 1,
};
Object.assign(SCALE, {
  // Mushroom Valley
  'mv-giant-blue': 0.62, 'mv-giant-purple': 0.62, 'mv-giant-teal': 0.62, 'mv-giant-pink': 0.62, 'mv-giant-orange': 0.62, 'mv-giant-white': 0.62,
  'mv-fairy-ring': 0.7, 'mv-stump-house': 0.75, 'mv-treehouse': 0.75, 'mv-mush-lamp': 0.55,
  'mv-bluebell-big': 0.34, 'mv-bluebell-small': 0.36, 'mv-fern-big': 0.34, 'mv-fern-small': 0.34, 'mv-vines': 0.4, 'mv-crystal-big': 0.34, 'mv-crystal-mid': 0.32, 'mv-lantern-hang': 0.5, 'mv-jar': 0.35,
  'mv-stones': 0.5, 'mv-stone-c': 0.5, 'mv-log': 0.4, 'mv-stump-glow': 0.4, 'mv-pond-rocks': 0.4, 'mv-berry-bush': 0.4, 'mv-sign': 0.4, 'mv-vine-arch': 0.5,
  'npc-elder': 0.33, 'npc-shopkeeper': 0.33, 'npc-guard': 0.33, 'npc-gardener': 0.33, 'npc-fisher': 0.33, 'npc-child': 0.33,
});
Object.assign(SCALE, {
  // Ember ruins and Molten Caverns (the 'ember' themes)
  'em-statue': 0.9, 'em-altar': 0.85, 'em-pillar': 0.62, 'em-pillar-broken': 0.5, 'em-wall': 0.55, 'em-wall-corner': 0.5, 'em-stairs': 0.5, 'em-rune-orange': 0.5, 'em-rune-teal': 0.5,
  'em-crystal-big': 0.42, 'em-crystal-small': 0.42, 'em-dead-tree': 0.65, 'em-boulder': 0.42, 'em-rocks': 0.35, 'em-bridge': 1, 'em-sign': 0.4,
  'em-stal-a': 0.5, 'em-stal-b': 0.5, 'em-stal-c': 0.5, 'em-spire': 0.45, 'em-crystal-orange': 0.42, 'em-crystal-teal': 0.4, 'em-cave-boulder': 0.42, 'em-cave-rocks': 0.38,
  'em-lantern-post': 0.55, 'em-barrel': 0.4, 'em-crate': 0.35, 'em-chest': 0.32, 'em-mushroom': 0.5, 'em-cave-arch': 0.6, 'em-minecart': 0.4, 'em-sign2': 0.4,
});
Object.assign(SCALE, {
  // Emerald Grove ('grove' themes)
  'gr-oak': 0.92, 'gr-birch': 0.8, 'gr-willow': 0.95, 'gr-hollow-tree': 0.9, 'gr-fern-big': 0.6, 'gr-bigleaf': 0.55, 'gr-foxglove': 0.5, 'gr-daisies': 0.55,
  'gr-log': 0.8, 'gr-boulder': 0.7, 'gr-ivy': 0.7, 'gr-glowcaps': 0.5, 'gr-stump': 0.7, 'gr-root-a': 0.85, 'gr-root-b': 0.8, 'gr-crystal': 0.55,
  'gr-treehouse': 0.95, 'gr-burrow': 1.0, 'gr-burrow2': 1.0, 'gr-cottage': 0.95, 'gr-bridge': 1, 'gr-arch': 0.9, 'gr-pillar': 0.7, 'gr-wall': 0.75,
  'gr-owl': 0.8, 'gr-altar': 0.85, 'gr-totem': 0.7, 'gr-stairs': 0.8, 'gr-root-arch': 0.95, 'gr-lantern': 0.66, 'gr-stall': 0.95, 'gr-chest': 0.3, 'gr-bridge-deck-h': 1, 'gr-bridge-deck-v': 1, 'gr-bridge-rail-h': 1, 'gr-bridge-rail-v': 1, 'gr-bridge-post': 1,
});
Object.assign(SCALE, {
  // Sandstone Reach ('sand' themes)
  'sr-palm': 0.95, 'sr-palm2': 0.85, 'sr-barrel-cactus': 0.5, 'sr-saguaro': 0.6, 'sr-prickly': 0.55, 'sr-thorn': 0.55, 'sr-drygrass': 0.55, 'sr-flowers': 0.5,
  'sr-boulder': 0.7, 'sr-rocks': 0.7, 'sr-deadtree': 0.8, 'sr-bones': 0.65, 'sr-pond': 0.8, 'sr-hoodoo': 0.8, 'sr-crystal': 0.55, 'sr-pots': 0.45,
  'sr-house': 0.98, 'sr-house2': 1.0, 'sr-hut': 0.95, 'sr-tent': 1.0, 'sr-stall': 0.95, 'sr-arch': 0.9, 'sr-pillar': 0.7, 'sr-wall': 0.75, 'sr-cat': 0.8, 'sr-altar': 0.85,
  'sr-obelisk': 0.75, 'sr-stairs': 0.8, 'sr-tomb-door': 0.95, 'sr-lantern': 0.66, 'sr-well': 0.75, 'sr-chest': 0.3,
  'sr-bridge-deck-h': 1, 'sr-bridge-deck-v': 1, 'sr-bridge-rail-h': 1, 'sr-bridge-rail-v': 1, 'sr-bridge-post': 1,
});
const ANIM_K: Record<string, number> = { 'sr-waterfall': 1.3, 'sr-pond-anim': 1.15, 'sr-crystal-glow': 0.95, 'sr-rune': 0.95, 'sr-dust': 1.35, 'gr-waterfall': 1.25, 'gr-pond': 1.1, 'gr-crystal-glow': 0.9, 'gr-rune': 0.9, 'gr-fireflies': 1.3, 'em-lavafall': 1.88, 'em-crystal': 0.6, 'em-lava': 1, 'em-rune': 0.6, fountain: 0.86, portal: 0.75, campfire: 0.3, brazier: 0.32, torch: 0.36, 'mv-waterfall': 0.7, 'mv-fireflies': 0.55, 'mv-mushroom': 0.7, 'mv-mushroom2': 0.7, 'mv-bluebell': 0.55 };
/** Each storybook place picks a theme: which ground pictures it uses and how its objects look. */
interface Theme { edge: [string, number][]; bank: [string, number][]; name: string; ground: string[]; grass: string; patches: string[]; forest: string; path: string; plaza: string; base?: string; basePatches?: string[]; top?: string; fill?: string; rim?: string; wash?: string; zoneRgb?: string; bridge?: string; bridgeY?: number; causeway?: boolean; tuftTint?: string; lava?: string; pathRock?: string; tint?: string; objTint?: string; water?: [string, string, string]; br?: 'gr' | 'sr'; line?: string; shade?: string; cliff?: string; bankTex?: string; pads?: boolean; kinds?: (d: PropDef) => Km | null | undefined; sprites: (id: string) => boolean; anims: string[] }
const VILLAGE_ANIMS = ['fountain', 'portal', 'campfire', 'brazier', 'torch'];
const VALLEY_SHARED = new Set(['tree-green', 'pine', 'tree-orange', 'rocks-small', 'rock-moss', 'rock-block', 'bush-big', 'bush-mid', 'cattail', 'wheat', 'flowers-white', 'flowers-purple', 'flowers-small', 'plant-a', 'plant-b', 'leaf-small', 'lamp-a', 'lamp-b', 'lamp-c', 'sign-green', 'sign-blue', 'chest', 'bridge-wood', 'fence-wood', 'barrel', 'crate', 'banner-post', 'mush-red', 'mush-purple', 'grass-big', 'grass-mid', 'grass-small', 'house-purple', 'house-blue', 'lilypad-a', 'lilypad-b', 'bush-flowers', 'tulips']);
const THEMES: Record<string, Theme> = {
  village: { edge: [['grass-small', 0.8], ['plant-a', 0.85], ['flowers-small', 0.6], ['plant-b', 0.85], ['leaf-small', 0.85], ['flowers-white', 0.85], ['tulips', 0.85]], bank: [['rocks-small', 0.6], ['rock-moss', 0.55], ['cattail', 0.85], ['fern', 0.85], ['rocks-small', 0.6], ['wheat', 0.85], ['flowers-white', 0.85]], name: 'village', ground: ['grass1', 'grass2', 'grass3', 'dirt', 'cobble', 'forest', 'sand'], grass: 'grass1', patches: ['grass2', 'grass3', 'grass1'], forest: 'forest', path: 'dirt', plaza: 'cobble', sprites: (id) => !id.startsWith('mv-') && !id.startsWith('gr-'), anims: VILLAGE_ANIMS },
  valley: { edge: [['mv-fern-small', 0.55], ['mv-bluebell-small', 0.5], ['grass-small', 0.8], ['leaf-small', 0.85], ['flowers-white', 0.85], ['mv-fern-big', 0.4]], bank: [['rocks-small', 0.6], ['rock-moss', 0.55], ['cattail', 0.85], ['mv-fern-small', 0.6], ['mv-bluebell-small', 0.55], ['rocks-small', 0.6], ['wheat', 0.85]], name: 'valley', ground: ['mv-grass', 'mv-moss', 'mv-glow', 'mv-petal', 'mv-mud', 'mv-roots', 'mv-stone'], grass: 'mv-grass', patches: ['mv-moss', 'mv-glow', 'mv-petal', 'mv-grass', 'mv-grass'], forest: 'mv-roots', path: 'mv-mud', plaza: 'mv-stone',
    tint: 'rgba(70,60,160,0.13)', objTint: 'rgba(60,70,170,0.2)', kinds: valleyKinds, sprites: (id) => id.startsWith('mv-') || VALLEY_SHARED.has(id), anims: ['mv-waterfall', 'mv-fireflies', 'mv-mushroom', 'mv-mushroom2', 'mv-bluebell', 'fountain', 'torch'] },
};
/** Ancient Ember Ruins and Molten Caverns: warm stone platforms over lava (ruins) or dark basalt chambers (caverns). */
const EMBER_SHARED = new Set(['rocks-small', 'torch', 'lamp-a', 'banner-post', 'grass-big', 'grass-mid', 'grass-small']);
const EMBER_ANIMS = ['em-lava', 'em-lavafall', 'em-crystal', 'torch', 'brazier'];
const emberBase = { edge: [['em-rocks', 0.45], ['em-cave-rocks', 0.4], ['em-rocks', 0.35]] as [string, number][], bank: [['em-rocks', 0.5], ['em-cave-rocks', 0.45], ['em-rocks', 0.4]] as [string, number][],
  zoneRgb: '255,120,40', causeway: true, tuftTint: 'rgba(150,60,15,.82)', lava: 'em-lava', pathRock: 'em-rocks', kinds: emberKinds, sprites: (id: string) => id.startsWith('em-') || EMBER_SHARED.has(id), anims: EMBER_ANIMS };
THEMES.ember = { ...emberBase, basePatches: [], name: 'ember', ground: ['em-lava', 'em-sandstone', 'em-redrock', 'em-basalt', 'em-ash', 'em-embers', 'em-cracked'], grass: 'em-sandstone', base: 'em-lava', top: 'em-sandstone', patches: ['em-sandstone', 'em-redrock', 'em-sandstone'], forest: 'em-basalt', path: 'em-ash', plaza: 'em-basalt',
  fill: '#c4440c', rim: 'rgba(255,214,140,.75)', wash: 'rgba(255,190,110,.08)' };
THEMES['ember-cave'] = { ...emberBase, basePatches: ['em-obsidian', 'em-basalt'], name: 'ember-cave', ground: ['em-basalt', 'em-cave', 'em-embers', 'em-obsidian', 'em-ash', 'em-lava', 'em-cracked'], grass: 'em-cave', base: 'em-basalt', top: 'em-cave', patches: ['em-embers', 'em-cave', 'em-cave'], forest: 'em-obsidian', path: 'em-ash', plaza: 'em-obsidian',
  fill: '#2a1a24', rim: 'rgba(255,150,60,.8)', wash: 'rgba(255,120,60,.07)', tint: 'rgba(120,40,120,.10)' };

/** Emerald Grove: lush forest villages and ponds ('grove'), and the root chambers under the ancient tree ('grove-roots'). */
const GROVE_SHARED = new Set(['tree-green', 'pine', 'rocks-small', 'rock-moss', 'rock-block', 'bush-big', 'bush-mid', 'bush-berry', 'bush-flowers', 'bush-flowers2', 'cattail', 'wheat', 'flowers-white', 'flowers-purple', 'flowers-yellow', 'flowers-small', 'flowers-mid', 'flowers-big', 'tulips', 'plant-a', 'plant-b', 'leaf-small', 'fern', 'grass-big', 'grass-mid', 'grass-small', 'well', 'bench', 'notice-board', 'crate', 'barrel', 'barrel2', 'planter', 'fence-wood', 'fence-picket', 'sign-green', 'sign-blue', 'chest', 'lilypad-a', 'lilypad-b', 'lilypad-c', 'mush-red', 'mush-purple', 'lamp-a', 'banner-post', 'log', 'stump']);
THEMES.grove = { edge: [['grass-small', 0.8], ['leaf-small', 0.85], ['flowers-white', 0.85], ['gr-daisies', 0.42], ['gr-fern-big', 0.42], ['plant-a', 0.85]], bank: [['rocks-small', 0.6], ['rock-moss', 0.55], ['cattail', 0.85], ['gr-fern-big', 0.5], ['gr-daisies', 0.42], ['wheat', 0.85]],
  name: 'grove', ground: ['gr-grass', 'gr-clover', 'gr-moss', 'gr-leaves', 'gr-dirt', 'gr-flagstone', 'gr-bank', 'gr-roots'], grass: 'gr-grass', patches: ['gr-clover', 'gr-moss', 'gr-grass'], forest: 'gr-leaves', path: 'gr-dirt', plaza: 'gr-flagstone',
  bridge: 'gr-bridge', bridgeY: 1.05, zoneRgb: '30,150,50', kinds: groveKinds, sprites: (id) => id.startsWith('gr-') || GROVE_SHARED.has(id), anims: ['gr-waterfall', 'gr-pond', 'gr-crystal-glow', 'gr-fireflies', 'fountain', 'campfire', 'torch'],
  wash: 'rgba(200,255,150,.07)', rim: 'rgba(170,255,120,.7)', water: ['#1d7fd0', '#38a9e6', '#8fe3ff'] };
THEMES['grove-roots'] = { edge: [['rocks-small', 0.5], ['gr-glowcaps', 0.3], ['gr-fern-big', 0.38]], bank: [['rocks-small', 0.5], ['gr-glowcaps', 0.3], ['gr-fern-big', 0.4]],
  name: 'grove-roots', ground: ['gr-roots', 'gr-cave', 'gr-moss', 'gr-leaves', 'gr-dirt', 'gr-flagstone'], grass: 'gr-cave', base: 'gr-roots', basePatches: ['gr-roots', 'gr-leaves'], top: 'gr-cave', patches: ['gr-moss', 'gr-cave', 'gr-cave'], forest: 'gr-roots', path: 'gr-dirt', plaza: 'gr-cave', pathRock: 'rocks-small',
  bridge: 'gr-bridge', bridgeY: 1.05, zoneRgb: '70,230,120', tuftTint: 'rgba(20,90,60,.55)', kinds: groveKinds, sprites: (id) => id.startsWith('gr-') || GROVE_SHARED.has(id), anims: ['gr-waterfall', 'gr-crystal-glow', 'gr-rune', 'gr-fireflies', 'torch'],
  fill: '#17261c', rim: 'rgba(130,255,150,.75)', wash: 'rgba(90,255,150,.07)', tint: 'rgba(10,50,50,.22)', water: ['#0d6f80', '#1fa8a0', '#8ff5d0'] };

/** Sandstone Reach: oasis villages and dunes ('sand'), and the torch-lit chambers of the Scarab Tomb ('sand-tomb'). */
const SAND_SHARED = new Set(['rocks-small', 'rock-moss', 'rock-block', 'cattail', 'wheat', 'well', 'bench', 'notice-board', 'crate', 'barrel', 'barrel2', 'planter', 'fence-wood', 'fence-picket', 'sign-green', 'sign-blue', 'chest', 'lilypad-a', 'lilypad-b', 'lamp-a', 'banner-post', 'grass-small']);
THEMES.sand = { edge: [['sr-drygrass', 0.4], ['sr-flowers', 0.4], ['sr-thorn', 0.4], ['rocks-small', 0.6]], bank: [['rocks-small', 0.6], ['sr-drygrass', 0.4], ['cattail', 0.85], ['sr-flowers', 0.4]],
  name: 'sand', ground: ['sr-sand', 'sr-scrub', 'sr-dune', 'sr-clay', 'sr-flagstone', 'sr-bank', 'sr-wadi', 'sr-canyon'], grass: 'sr-sand', patches: ['sr-scrub', 'sr-dune', 'sr-sand'], forest: 'sr-dune', path: 'sr-clay', plaza: 'sr-flagstone', cliff: 'sr-canyon', bankTex: 'sr-bank',
  bridge: 'sr-bridge', bridgeY: 1.05, br: 'sr', zoneRgb: '255,170,40', tuftTint: 'rgba(205,150,50,.8)', kinds: sandKinds, sprites: (id) => id.startsWith('sr-') || SAND_SHARED.has(id), anims: ['sr-waterfall', 'sr-pond-anim', 'sr-crystal-glow', 'sr-dust', 'fountain', 'campfire', 'torch'],
  wash: 'rgba(255,214,120,.08)', rim: 'rgba(255,232,160,.75)', line: '#6a3d18', shade: 'rgba(110,50,10,.28)', water: ['#12a0b8', '#2fc9d0', '#a6f5ea'] };
THEMES['sand-tomb'] = { edge: [['rocks-small', 0.5], ['sr-pots', 0.3], ['sr-drygrass', 0.3]], bank: [['rocks-small', 0.5], ['sr-pots', 0.3], ['sr-bones', 0.3]],
  name: 'sand-tomb', ground: ['sr-canyon', 'sr-tomb', 'sr-flagstone', 'sr-clay', 'sr-bank', 'sr-sand'], grass: 'sr-tomb', base: 'sr-canyon', basePatches: ['sr-canyon', 'sr-wadi'], top: 'sr-tomb', patches: ['sr-tomb', 'sr-tomb', 'sr-flagstone'], forest: 'sr-canyon', path: 'sr-clay', plaza: 'sr-tomb', pathRock: 'rocks-small', cliff: 'sr-tomb',
  bridge: 'sr-bridge', bridgeY: 1.05, br: 'sr', zoneRgb: '255,190,60', tuftTint: 'rgba(60,30,10,.6)', kinds: sandKinds, sprites: (id) => id.startsWith('sr-') || SAND_SHARED.has(id), anims: ['sr-waterfall', 'sr-crystal-glow', 'sr-rune', 'sr-dust', 'torch'],
  fill: '#24150b', rim: 'rgba(255,200,90,.8)', wash: 'rgba(255,170,60,.07)', tint: 'rgba(40,18,0,.22)', line: '#2a160a', shade: 'rgba(20,8,0,.45)', water: ['#6e4311', '#b98228', '#f1cf7a'], pads: false, bankTex: 'sr-bank' };
let theme: Theme = THEMES.village;
const pick = (a: string[], d: PropDef) => a[Math.abs(d.v ?? 0) % a.length];

interface Km { tint?: string; sOverride?: number; id?: string; anim?: string; fp?: 'tree' | 'house' | 'bush' | 'rock' | 'small' | 'stall' | 'lamp' | 'crystal' | 'round' | 'post' | 'none'; canopy?: boolean; sway?: number; foot?: number; shadow?: [number, number]; glow?: { y: number; r: number; c: string; a: number }; len?: boolean; kScale?: number }
const sizeK = (d: PropDef, ref: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, (d.s ?? 1) / ref));
/** Mushroom Valley: giant glowing mushrooms, bluebells, ferns, fireflies; shared trees and rocks get a dusk tint. */
function valleyKinds(d: PropDef): Km | null | undefined {
  const T = theme.objTint;
  switch (d.kind) {
    case 'ashTree': return { id: pick(['tree-green', 'pine', 'tree-green', 'tree-orange'], d), fp: 'tree', canopy: true, sway: 0.012, foot: 0.92, shadow: [0.36, 0.1], tint: T };
    case 'mushroom': {
      const s = d.s ?? 1;
      if (s >= 2.8) return { id: 'mv-giant-purple', sOverride: sizeK(d, 2.4, 0.9, 1.8), fp: 'round', canopy: true, foot: 0.93, shadow: [0.42, 0.1], glow: { y: 0.62, r: 150, c: '#b98cff', a: 0.3 } };
      if (s >= 1.35) return { id: pick(['mv-giant-blue', 'mv-giant-teal', 'mv-giant-pink', 'mv-giant-orange', 'mv-giant-white', 'mv-giant-purple'], d), sOverride: sizeK(d, 2.2, 0.7, 1.2), fp: 'round', canopy: true, foot: 0.93, shadow: [0.42, 0.1], glow: { y: 0.62, r: 90, c: '#b9a0ff', a: 0.22 } };
      return { id: pick(['mush-purple', 'mush-red', 'mush-purple'], d), fp: 'small', foot: 0.95, shadow: [0.4, 0.1], tint: T };
    }
    case 'rock': case 'boulder': return { id: pick(['rock-moss', 'rock-block', 'rocks-small'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1], tint: T };
    case 'bush': return { id: pick(['mv-berry-bush', 'bush-big', 'mv-berry-bush', 'bush-mid'], d), fp: 'bush', sway: 0.02, foot: 0.93, shadow: [0.42, 0.09], tint: d.v && d.v % 4 === 1 || d.v === 3 ? T : undefined };
    case 'fireCrystal': case 'iceCrystal': return { id: pick(['mv-crystal-big', 'mv-crystal-mid', 'mv-crystal-big', 'mv-crystal-mid'], d), fp: 'crystal', foot: 0.94, shadow: [0.4, 0.1], glow: { y: 0.55, r: 70, c: '#7fe0ff', a: 0.4 } };
    case 'waterfall': return { anim: 'mv-waterfall', fp: 'round', foot: 0.9, shadow: [0.4, 0.08] };
    case 'flowers': return { id: pick(['mv-bluebell-big', 'mv-bluebell-small', 'mv-bluebell-big', 'flowers-purple', 'mv-bluebell-small', 'flowers-white'], d), fp: 'none', sway: 0.05, foot: 0.95, glow: undefined };
    case 'plant': return { id: pick(['mv-fern-big', 'mv-fern-small', 'mv-fern-small'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'lantern': return { id: pick(['lamp-b', 'mv-mush-lamp', 'lamp-a'], d), fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.8, r: 84, c: '#ffcf6a', a: 0.5 } };
    case 'stump': return { id: 'mv-stump-glow', fp: 'small', foot: 0.9, shadow: [0.42, 0.1] };
    case 'log': return { id: 'mv-log', fp: 'small', foot: 0.85, shadow: [0.42, 0.1] };
    case 'sign': return { id: 'mv-sign', fp: 'none', foot: 0.97 };
    case 'fireflies': return { anim: 'mv-fireflies', fp: 'none', foot: 0.5, glow: { y: 0.5, r: 90, c: '#ffe08a', a: 0.25 } };
    case 'treehouse': return { id: 'mv-treehouse', fp: 'tree', canopy: true, foot: 0.93, shadow: [0.4, 0.09] };
    case 'stumpHouse': return { id: 'mv-stump-house', fp: 'house', canopy: true, foot: 0.93, shadow: [0.42, 0.08] };
    case 'mushLamp': return { id: 'mv-mush-lamp', fp: 'lamp', foot: 0.96, shadow: [0.4, 0.1], glow: { y: 0.8, r: 90, c: '#ffb36a', a: 0.45 } };
    case 'fairyRing': return { id: 'mv-fairy-ring', fp: 'round', foot: 0.9, shadow: [0.45, 0.1], glow: { y: 0.45, r: 80, c: '#8fd0ff', a: 0.3 } };
    case 'vineArch': return { id: 'mv-vine-arch', fp: 'post', foot: 0.95 };
    case 'jar': return { id: 'mv-jar', fp: 'none', foot: 0.95, glow: { y: 0.5, r: 50, c: '#ffe08a', a: 0.35 } };
    default: return undefined;
  }
}
/** Ember ruins and caverns: carved sandstone, glowing crystals, basalt stalagmites, lava-fall. */
function emberKinds(d: PropDef): Km | null | undefined {
  const ruin = theme.name === 'ember';
  switch (d.kind) {
    case 'statue': return { id: 'em-statue', fp: 'round', canopy: true, foot: 0.93, shadow: [0.4, 0.09], glow: { y: 0.5, r: 120, c: '#ff9a3a', a: 0.3 } };
    case 'altar': return { id: 'em-altar', fp: 'round', foot: 0.9, shadow: [0.42, 0.09], glow: { y: 0.55, r: 100, c: '#ffb347', a: 0.35 } };
    case 'pillar': case 'archPost': return { id: 'em-pillar', fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'brokenPillar': return { id: 'em-pillar-broken', fp: 'small', foot: 0.92, shadow: [0.42, 0.1] };
    case 'wall': case 'archLintel': return { id: 'em-wall', fp: 'none', foot: 0.92, len: true };
    case 'torch': case 'brazier': return { anim: d.kind, fp: 'post', foot: 0.96, shadow: [0.4, 0.1], glow: { y: 0.8, r: 110, c: '#ff9a3a', a: 0.55 } };
    case 'fireCrystal': case 'iceCrystal': {
      const v = Math.abs(d.v ?? 0) % 4, g = { y: 0.55, r: 80, c: '#ff8a3a', a: 0.42 };
      if (v % 2 === 0) return { anim: 'em-crystal', fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: g };
      return { id: !ruin && v === 1 ? 'em-crystal-teal' : pick(['em-crystal-big', 'em-crystal-small', 'em-crystal-orange'], d), fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: !ruin && v === 1 ? { ...g, c: '#5fe0e0' } : g };
    }
    case 'boulder': case 'rock': return { id: pick(ruin ? ['em-boulder', 'em-rocks', 'em-rocks'] : ['em-cave-boulder', 'em-cave-rocks', 'em-cave-rocks'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1] };
    case 'ashTree': return { id: 'em-dead-tree', fp: 'tree', canopy: true, sway: 0.006, foot: 0.93, shadow: [0.36, 0.1] };
    case 'stalagmite': return { id: pick(['em-stal-a', 'em-stal-b', 'em-stal-c'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1], glow: { y: 0.6, r: 70, c: '#ff7a2a', a: 0.3 } };
    case 'spire': return { id: 'em-spire', fp: 'rock', canopy: true, foot: 0.93, shadow: [0.42, 0.1], glow: { y: 0.6, r: 90, c: '#ff7a2a', a: 0.3 } };
    case 'lavafall': return { anim: 'em-lavafall', fp: 'round', foot: 0.9, shadow: [0.4, 0.08], glow: { y: 0.6, r: 220, c: '#ff7a1a', a: 0.45 } };
    case 'lantern': return { id: 'em-lantern-post', fp: 'lamp', foot: 0.96, shadow: [0.45, 0.1], glow: { y: 0.7, r: 100, c: '#ffcf6a', a: 0.5 } };
    case 'mushroom': return { id: 'em-mushroom', fp: 'small', foot: 0.94, shadow: [0.4, 0.1], glow: { y: 0.5, r: 50, c: '#ff9a3a', a: 0.3 } };
    case 'chest': return { id: 'em-chest', fp: 'none', foot: 0.95 };
    case 'barrel': return { id: 'em-barrel', fp: 'small', foot: 0.92, shadow: [0.42, 0.1] };
    case 'crate': return { id: 'em-crate', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'sign': return { id: ruin ? 'em-sign' : 'em-sign2', fp: 'none', foot: 0.97 };
    default: return undefined;
  }
}
/** Sandstone Reach: palms and cacti, clay houses and tents; in the tomb the trees become rock spires and the lanterns braziers. */
function sandKinds(d: PropDef): Km | null | undefined {
  const tomb = theme.name === 'sand-tomb';
  switch (d.kind) {
    case 'ashTree': return tomb ? { id: 'sr-hoodoo', fp: 'rock', canopy: true, foot: 0.93, shadow: [0.4, 0.1] }
      : { id: pick(['sr-palm', 'sr-palm2', 'sr-palm', 'sr-palm2', 'sr-deadtree', 'sr-palm', 'sr-palm2', 'sr-palm'], d), fp: 'tree', canopy: true, sway: 0.01, foot: 0.92, shadow: [0.36, 0.1] };
    case 'cactus': return { id: 'sr-saguaro', fp: 'post', foot: 0.94, shadow: [0.4, 0.09] };
    case 'mushroom': return { id: 'sr-barrel-cactus', fp: 'small', foot: 0.94, shadow: [0.4, 0.1] };
    case 'rock': case 'boulder': return { id: pick(['sr-boulder', 'sr-rocks', 'sr-boulder'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1] };
    case 'bush': return { id: pick(['sr-thorn', 'sr-prickly', 'sr-barrel-cactus', 'sr-thorn'], d), fp: 'bush', sway: 0.01, foot: 0.93, shadow: [0.42, 0.09] };
    case 'fireCrystal': case 'iceCrystal': return (d.v ?? 0) % 2 === 0
      ? { anim: 'sr-crystal-glow', fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: { y: 0.55, r: 90, c: '#ffc24a', a: 0.4 } }
      : { id: 'sr-crystal', fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: { y: 0.55, r: 80, c: '#ffc24a', a: 0.35 } };
    case 'house': return { id: pick(['sr-house', 'sr-house2', 'sr-hut'], d), fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'tent': return { id: 'sr-tent', fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'stumpHouse': case 'hollowTree': return { id: 'sr-hut', fp: 'house', canopy: true, foot: 0.93, shadow: [0.45, 0.08] };
    case 'treehouse': return { id: 'sr-house2', fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'stall': return { id: 'sr-stall', fp: 'stall', canopy: true, foot: 0.95, shadow: [0.46, 0.08] };
    case 'lantern': case 'mushLamp': return tomb ? { id: 'sr-lantern', fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.62, r: 100, c: '#ffb347', a: 0.55 } }
      : { id: 'sr-lantern', fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.62, r: 90, c: '#ffcf6a', a: 0.5 } };
    case 'chest': return { id: 'sr-chest', fp: 'none', foot: 0.95 };
    case 'flowers': return { id: pick(['sr-flowers', 'sr-drygrass', 'sr-flowers', 'sr-drygrass'], d), fp: 'none', sway: 0.04, foot: 0.95 };
    case 'plant': return { id: pick(['sr-drygrass', 'sr-thorn', 'sr-drygrass'], d), fp: 'none', sway: 0.04, foot: 0.95 };
    case 'statue': return { id: 'sr-cat', fp: 'round', canopy: true, foot: 0.93, shadow: [0.4, 0.09], glow: { y: 0.5, r: 90, c: '#ffc24a', a: 0.2 } };
    case 'altar': return { id: 'sr-altar', fp: 'round', foot: 0.9, shadow: [0.42, 0.09], glow: { y: 0.62, r: 100, c: '#ffc24a', a: 0.45 } };
    case 'runeStone': return { id: 'sr-altar', sOverride: 0.62, fp: 'none', foot: 0.9, glow: { y: 0.62, r: 80, c: '#ffc24a', a: 0.45 } };
    case 'pillar': case 'archPost': return { id: 'sr-pillar', fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'brokenPillar': return { id: 'sr-pillar', sOverride: 0.78, fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'archLintel': return null;
    case 'wall': return { id: 'sr-wall', fp: 'none', foot: 0.92, len: true };
    case 'vineArch': return { id: 'sr-arch', fp: 'none', foot: 0.95, shadow: [0.45, 0.1] };
    case 'totem': return { id: 'sr-obelisk', fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'stairs': return { id: 'sr-stairs', fp: 'none', foot: 0.94 };
    case 'rootArch': return { id: 'sr-tomb-door', fp: 'none', foot: 0.93, canopy: true };
    case 'log': case 'bones': return { id: 'sr-bones', fp: 'small', foot: 0.85, shadow: [0.42, 0.1] };
    case 'stump': case 'jar': return { id: 'sr-pots', fp: 'small', foot: 0.9, shadow: [0.42, 0.1] };
    case 'well': return { id: 'sr-well', fp: 'round', canopy: true, foot: 0.94, shadow: [0.42, 0.09] };
    case 'stalagmite': case 'spire': return { id: 'sr-hoodoo', fp: 'rock', foot: 0.93, shadow: [0.42, 0.1] };
    case 'waterfall': return { anim: 'sr-waterfall', fp: 'round', foot: 0.9, shadow: [0.4, 0.08] };
    case 'pond': return { anim: 'sr-pond-anim', fp: 'round', foot: 0.8, shadow: [0.4, 0.08] };
    case 'fireflies': return { anim: 'sr-dust', fp: 'none', foot: 0.5, glow: { y: 0.5, r: 90, c: '#ffd070', a: 0.25 } };
    case 'torch': case 'brazier': return { id: 'sr-lantern', fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.62, r: 100, c: '#ffb347', a: 0.55 } };
    default: return undefined;
  }
}
/** Emerald Grove: oaks and willows, burrow houses, ferns and foxgloves; in the root chambers the trees become root pillars and glowing crystals. */
function groveKinds(d: PropDef): Km | null | undefined {
  const cave = theme.name === 'grove-roots';
  switch (d.kind) {
    case 'ashTree': return cave ? { id: pick(['gr-root-a', 'gr-root-b'], d), fp: 'rock', canopy: true, foot: 0.93, shadow: [0.4, 0.1] }
      : { id: pick(['gr-oak', 'gr-birch', 'gr-oak', 'gr-willow', 'gr-oak', 'gr-birch', 'gr-oak', 'gr-willow'], d), fp: 'tree', canopy: true, sway: 0.012, foot: 0.92, shadow: [0.36, 0.1] };
    case 'mushroom': return { id: 'gr-glowcaps', fp: 'small', foot: 0.94, shadow: [0.4, 0.1], glow: { y: 0.5, r: 52, c: '#9dff7a', a: 0.3 } };
    case 'rock': case 'boulder': return { id: pick(['gr-boulder', 'rock-moss', 'rocks-small', 'gr-boulder'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1] };
    case 'bush': return { id: pick(['bush-big', 'gr-bigleaf', 'bush-mid', 'bush-berry'], d), fp: 'bush', sway: 0.02, foot: 0.93, shadow: [0.42, 0.09] };
    case 'fireCrystal': case 'iceCrystal': return (d.v ?? 0) % 2 === 0
      ? { anim: 'gr-crystal-glow', fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: { y: 0.55, r: 90, c: '#6dff9a', a: 0.4 } }
      : { id: 'gr-crystal', fp: 'crystal', foot: 0.93, shadow: [0.4, 0.1], glow: { y: 0.55, r: 80, c: '#6dff9a', a: 0.35 } };
    case 'house': return { id: pick(['gr-burrow', 'gr-burrow2', 'gr-cottage'], d), fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'stumpHouse': case 'hollowTree': return { id: 'gr-hollow-tree', fp: 'tree', canopy: true, foot: 0.93, shadow: [0.4, 0.09], glow: { y: 0.7, r: 60, c: '#ffd46a', a: 0.25 } };
    case 'treehouse': return { id: 'gr-treehouse', fp: 'tree', canopy: true, foot: 0.93, shadow: [0.4, 0.09] };
    case 'stall': return { id: 'gr-stall', fp: 'stall', canopy: true, foot: 0.95, shadow: [0.46, 0.08] };
    case 'lantern': case 'mushLamp': return { id: 'gr-lantern', fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.62, r: 90, c: '#ffcf6a', a: 0.5 } };
    case 'chest': return { id: 'gr-chest', fp: 'none', foot: 0.95 };
    case 'flowers': return { id: pick(['gr-foxglove', 'gr-daisies', 'flowers-white', 'gr-daisies', 'flowers-purple', 'gr-foxglove', 'tulips', 'flowers-yellow'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'plant': return { id: pick(['gr-fern-big', 'gr-bigleaf', 'fern', 'gr-fern-big', 'plant-a'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'statue': return { id: 'gr-owl', fp: 'round', canopy: true, foot: 0.93, shadow: [0.4, 0.09], glow: { y: 0.5, r: 90, c: '#9dff7a', a: 0.2 } };
    case 'altar': return { id: 'gr-altar', fp: 'round', foot: 0.9, shadow: [0.42, 0.09], glow: { y: 0.62, r: 100, c: '#8dff7a', a: 0.4 } };
    case 'pillar': case 'archPost': return { id: 'gr-pillar', fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'brokenPillar': return { id: 'gr-pillar', sOverride: 0.78, fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'archLintel': return null;
    case 'wall': return { id: 'gr-wall', fp: 'none', foot: 0.92, len: true };
    case 'vineArch': return { id: 'gr-arch', fp: 'none', foot: 0.95, shadow: [0.45, 0.1] };
    case 'runeStone': return { id: 'gr-altar', sOverride: 0.62, fp: 'none', foot: 0.9, glow: { y: 0.62, r: 80, c: '#8dff7a', a: 0.45 } };
    case 'totem': return { id: 'gr-totem', fp: 'post', foot: 0.96, shadow: [0.45, 0.1] };
    case 'stairs': return { id: 'gr-stairs', fp: 'none', foot: 0.94 };
    case 'rootArch': return { id: 'gr-root-arch', fp: 'none', foot: 0.93, canopy: true };
    case 'ivy': return { id: 'gr-ivy', fp: 'none', foot: 0.98, canopy: true, sway: 0.02 };
    case 'log': return { id: 'gr-log', fp: 'small', foot: 0.85, shadow: [0.42, 0.1] };
    case 'stump': return { id: 'gr-stump', fp: 'small', foot: 0.9, shadow: [0.42, 0.1] };
    case 'stalagmite': case 'spire': return { id: pick(['gr-root-a', 'gr-root-b'], d), fp: 'rock', foot: 0.93, shadow: [0.42, 0.1], glow: d.kind === 'spire' ? { y: 0.6, r: 80, c: '#6dff9a', a: 0.25 } : undefined };
    case 'waterfall': return { anim: 'gr-waterfall', fp: 'round', foot: 0.9, shadow: [0.4, 0.08] };
    case 'pond': return { anim: 'gr-pond', fp: 'round', foot: 0.8, shadow: [0.4, 0.08] };
    case 'fireflies': return { anim: 'gr-fireflies', fp: 'none', foot: 0.5, glow: { y: 0.5, r: 90, c: '#ffe08a', a: 0.25 } };
    case 'torch': case 'brazier': return { id: 'gr-lantern', fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.62, r: 90, c: '#ffcf6a', a: 0.5 } };
    default: return undefined;
  }
}
const km = (d: PropDef): Km | null => theme.kinds?.(d) ?? kmBase(d);
function kmBase(d: PropDef): Km | null {
  switch (d.kind) {
    case 'ashTree': return { id: pick(['tree-green', 'tree-green', 'pine', 'tree-orange', 'tree-pink', 'tree-green'], d), fp: 'tree', canopy: true, sway: 0.012, foot: 0.92, shadow: [0.36, 0.1] };
    case 'mushroom': return { id: pick(['mush-red', 'mush-purple', 'mush-red', 'mush-purple', 'mush-red'], d), fp: 'small', foot: 0.95, shadow: [0.4, 0.1] };
    case 'rock': case 'boulder': return { id: pick(['rock-moss', 'rock-block', 'rocks-small'], d), fp: 'rock', foot: 0.92, shadow: [0.42, 0.1] };
    case 'bush': return { id: pick(['bush-big', 'bush-mid', 'bush-berry'], d), fp: 'bush', sway: 0.02, foot: 0.93, shadow: [0.42, 0.09] };
    case 'fireCrystal': case 'iceCrystal': return { id: pick(['crystal-pillar', 'crystal-shard', 'gem-big', 'crystal-pedestal'], d), fp: 'crystal', foot: 0.94, shadow: [0.4, 0.1], glow: { y: 0.55, r: 60, c: '#7fe0ff', a: 0.4 } };
    case 'house': return { id: pick(['house-red', 'house-purple', 'house-blue', 'house-orange', 'house-pink', 'house-green', 'cottage-blue', 'hut-wood'], d), fp: 'house', canopy: true, foot: 0.93, shadow: [0.5, 0.07] };
    case 'stall': return { id: pick(['stall-potions', 'stall-blue', 'stall-fruit'], d), fp: 'stall', canopy: true, foot: 0.95, shadow: [0.46, 0.08] };
    case 'lantern': return { id: pick(['lamp-a', 'lamp-b', 'lamp-c'], d), fp: 'lamp', foot: 0.97, shadow: [0.5, 0.1], glow: { y: 0.8, r: 78, c: '#ffcf6a', a: 0.5 } };
    case 'fence': return { id: 'fence-wood', fp: 'none', foot: 0.9, len: true };
    case 'fountain': return { anim: 'fountain', fp: 'round', foot: 0.92, shadow: [0.5, 0.1] };
    case 'portal': return { anim: 'portal', fp: 'round', foot: 0.9, shadow: [0.48, 0.1], glow: { y: 0.4, r: 140, c: '#59c8ff', a: 0.35 } };
    case 'campfire': return { anim: 'campfire', fp: 'round', foot: 0.9, shadow: [0.45, 0.1], glow: { y: 0.4, r: 120, c: '#ff9a3a', a: 0.5 } };
    case 'brazier': case 'torch': return { anim: d.kind, fp: 'post', foot: 0.96, shadow: [0.4, 0.1], glow: { y: 0.8, r: 100, c: '#ff9a3a', a: 0.5 } };
    case 'archPost': return { id: 'banner-post', fp: 'post', foot: 0.97, shadow: [0.5, 0.1] };
    case 'chest': return { id: 'chest', fp: 'none', foot: 0.95 };
    case 'sign': return { id: d.dir === 'left' ? 'sign-blue' : 'sign-green', fp: 'none', foot: 0.97 };
    case 'runeStone': return { id: 'crystal-pedestal', fp: 'none', foot: 0.95, glow: { y: 0.7, r: 80, c: '#7fe0ff', a: 0.45 } };
    case 'flowers': return { id: pick(['flowers-white', 'flowers-purple', 'tulips', 'flowers-yellow', 'bush-flowers', 'flowers-mid', 'flowers-big', 'flowers-small'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'plant': return { id: pick(['fern', 'plant-a', 'plant-b', 'leaf-small'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'grassClump': return { id: pick(['grass-big', 'grass-mid', 'grass-small'], d), fp: 'none', sway: 0.06, foot: 0.95 };
    case 'reeds': return { id: pick(['cattail', 'wheat'], d), fp: 'none', sway: 0.05, foot: 0.95 };
    case 'well': return { id: 'well', fp: 'round', canopy: true, foot: 0.94, shadow: [0.42, 0.09] };
    case 'bench': return { id: 'bench', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'noticeBoard': return { id: 'notice-board', fp: 'stall', canopy: true, foot: 0.95, shadow: [0.4, 0.08] };
    case 'crate': return { id: 'crate', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'barrel': return { id: pick(['barrel', 'barrel2'], d), fp: 'small', foot: 0.92, shadow: [0.42, 0.1] };
    case 'planter': return { id: 'planter', fp: 'small', foot: 0.9, shadow: [0.45, 0.1] };
    case 'log': return { id: 'log', fp: 'small', foot: 0.85, shadow: [0.42, 0.1] };
    case 'stump': return { id: 'stump', fp: 'small', foot: 0.88, shadow: [0.42, 0.1] };
    case 'banner': return { id: 'banner-post', fp: 'post', foot: 0.97, shadow: [0.5, 0.1] };
    case 'pillar': return { id: 'pillar', fp: 'post', foot: 0.95, shadow: [0.45, 0.1] };
    case 'brokenPillar': return { id: 'pillar-broken', fp: 'post', foot: 0.95, shadow: [0.45, 0.1] };
    default: return null;                                   // archLintel, lighthouse ... : not drawn in the storybook style
  }
}

// ------------------------------------------------------------------ sprites
const spriteCache = new Map<string, Sprite>();
function scaled(id: string, k: number, foot: number, tint?: string): Sprite | null {
  const img = sImg(id); if (!img || !img.naturalWidth) return null;
  const key = `${id}|${k.toFixed(3)}|${foot}|${tint ?? ''}`; const hit = spriteCache.get(key); if (hit) return hit;
  const w = Math.max(2, Math.round(img.naturalWidth * k)), h = Math.max(2, Math.round(img.naturalHeight * k));
  const c = mkcv(w, h), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
  if (tint) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, w, h); }   // a cool dusk tint over the whole picture
  const sp = { cv: c, ox: w / 2, oy: h * foot, w, h }; spriteCache.set(key, sp); return sp;
}
const FP: Record<string, (w: number, h: number) => Fp[]> = {
  tree: (w, h) => [{ t: 'e', rx: w * 0.1, ry: w * 0.045, dy: -h * 0.03 }],
  house: (w, h) => [{ t: 'r', hw: w * 0.4, hh: h * 0.1, dy: -h * 0.1 }],
  bush: (w, h) => [{ t: 'e', rx: w * 0.32, ry: w * 0.12, dy: -h * 0.08 }],
  rock: (w, h) => [{ t: 'e', rx: w * 0.34, ry: w * 0.12, dy: -h * 0.08 }],
  small: (w, h) => [{ t: 'e', rx: w * 0.26, ry: w * 0.1, dy: -h * 0.06 }],
  stall: (w, h) => [{ t: 'r', hw: w * 0.42, hh: h * 0.08, dy: -h * 0.08 }],
  lamp: () => [{ t: 'e', rx: 7, ry: 5, dy: -2 }],
  post: () => [{ t: 'e', rx: 9, ry: 5, dy: -2 }],
  crystal: (w, h) => [{ t: 'e', rx: Math.max(10, w * 0.22), ry: Math.max(6, w * 0.09), dy: -h * 0.05 }],
  round: (w, h) => [{ t: 'e', rx: w * 0.38, ry: w * 0.15, dy: -h * 0.16 }],
  none: () => [],
};
const glowFx = (g: NonNullable<Km['glow']>, h: number) => (c: C, d: PropDef, t: number) => {
  const r = g.r * (1 + 0.07 * Math.sin(t * 6 + d.x * 0.13)), y = -h * g.y;
  c.globalCompositeOperation = 'lighter';
  const gr = c.createRadialGradient(0, y, 0, 0, y, r); gr.addColorStop(0, g.c + 'cc'); gr.addColorStop(1, g.c + '00');
  c.globalAlpha = g.a * (0.85 + 0.15 * Math.sin(t * 5 + d.y)); c.fillStyle = gr; c.fillRect(-r, y - r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
};
const placedCache = new Map<string, StoryPlaced | null>();
function place(d: PropDef): StoryPlaced | null {
  const key = `${theme.name}|${d.kind}|${d.v ?? 0}|${d.s ?? 1}|${d.len ?? ''}|${d.dir ?? ''}`;
  if (placedCache.has(key)) return placedCache.get(key)!;
  const m = km(d), s = m?.sOverride ?? d.s ?? 1; let out: StoryPlaced | null = null;
  if (m?.anim) {
    const img = aImg(m.anim), a = aAsset(m.anim), k = (ANIM_K[m.anim] ?? 0.5) * s;
    if (img && a) {
      const w = Math.round(a.fw * k), h = Math.round(a.fh * k), foot = m.foot ?? 0.92;
      const sp: Sprite = { cv: mkcv(w, h), ox: w / 2, oy: h * foot, w, h };
      out = { sp, canopy: !!m.canopy, fx: m.glow ? glowFx(m.glow, h * foot) : undefined, frames: { img, n: a.n, fps: a.fps, fw: a.fw, fh: a.fh }, fp: (FP[m.fp ?? 'none'] ?? FP.none)(w, h), shadow: m.shadow ?? [0, 0] };
    }
  } else if (m?.id && m.len && d.len) {
    const img = sImg(m.id);
    if (img) {
      const k = (SCALE[m.id] ?? 1) * s, sw = img.naturalWidth * k, len = Math.abs(d.len), step = sw * 0.9, n = Math.max(1, Math.round((len - sw) / step) + 1);
      const h = Math.round(img.naturalHeight * k), w = Math.round((n - 1) * step + sw), c = mkcv(w, h), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high';
      for (let i = 0; i < n; i++) g.drawImage(img, i * step, 0, sw, h);
      out = { sp: { cv: c, ox: w / 2, oy: h * (m.foot ?? 0.9), w, h }, canopy: false, fp: [{ t: 'r', hw: w / 2, hh: 6, dy: -h * 0.1 }], shadow: [0, 0] };
    }
  } else if (m?.id) {
    const sp = scaled(m.id, (SCALE[m.id] ?? 1) * s, m.foot ?? 0.94, m.tint);
    if (sp) out = { sp, canopy: !!m.canopy, sway: m.sway, fx: m.glow ? glowFx(m.glow, sp.oy) : undefined, fp: (FP[m.fp ?? 'none'] ?? FP.none)(sp.w, sp.h), shadow: m.shadow ?? [0, 0] };
  }
  placedCache.set(key, out); return out;
}
function shadow(c: C, d: PropDef, p: StoryPlaced) {
  const [rx0, ry0] = p.shadow; if (!rx0) return;
  const rx = p.sp.w * rx0, ry = Math.max(4, p.sp.w * ry0);
  c.save(); c.translate(d.x, d.y - 2); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(20,45,20,.38)'); g.addColorStop(0.7, 'rgba(20,45,20,.2)'); g.addColorStop(1, 'rgba(20,45,20,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
const hook: StoryHook = {
  sprite: (d) => place(d)?.sp ?? null,
  footprints: (d) => (place(d)?.fp ?? []).map((f) => f.t === 'e' ? { t: 'e' as const, rx: f.rx, ry: f.ry, x: d.x, y: d.y + f.dy } : { t: 'r' as const, hw: f.hw, hh: f.hh, x: d.x, y: d.y + f.dy }) as never,
};

// ------------------------------------------------------------------ ground
const tileCache = new Map<string, HTMLCanvasElement>();
function tile(id: string, k: number): HTMLCanvasElement | null {
  const img = gImg(id); if (!img || !img.naturalWidth) return null;
  const key = `${id}|${k}`; const hit = tileCache.get(key); if (hit) return hit;
  const c = mkcv(img.naturalWidth * k, img.naturalHeight * k), g = c.getContext('2d')!; g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height); tileCache.set(key, c); return c;
}
const pattern = (c: C, id: string, k: number) => { const t = tile(id, k); return t ? c.createPattern(t, 'repeat') : null; };
function softMask(size: number) {
  const m = mkcv(size, size), g = m.getContext('2d')!, gr = g.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.6, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, size, size); return m;
}
function patches(c: C, ids: string[], k: number, n: number, area: [number, number, number, number], r: () => number, size = 380) {
  const mask = softMask(size), tmp = mkcv(size, size), t = tmp.getContext('2d')!;
  for (let i = 0; i < n; i++) {
    const pat = pattern(c, ids[Math.floor(r() * ids.length)], k); if (!pat) continue;
    t.save(); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, size, size); t.translate(-Math.floor(r() * 900), -Math.floor(r() * 900)); t.fillStyle = pat; t.fillRect(0, 0, 1800, 1800); t.restore();
    t.globalCompositeOperation = 'destination-in'; t.drawImage(mask, 0, 0); t.globalCompositeOperation = 'source-over';
    c.drawImage(tmp, area[0] + r() * area[2] - size / 2, area[1] + r() * area[3] - size / 2);
  }
}
function ground(c: C, def: LocationDef, r: () => number) {
  const { w, h } = def;
  c.fillStyle = theme.fill ?? '#58b84a'; c.fillRect(0, 0, w, h);
  const base = pattern(c, theme.base ?? theme.grass, 0.6); if (base) { c.fillStyle = base; c.fillRect(0, 0, w, h); }
  if ((theme.basePatches ?? theme.patches).length) patches(c, theme.basePatches ?? theme.patches, 0.6, Math.ceil((w * h) / (190 * 190)), [0, 0, w, h], r);
  if (theme.tint) { c.fillStyle = theme.tint; c.fillRect(0, 0, w, h); }
  if (def.forestY) {
    patches(c, [theme.forest], 0.6, Math.ceil((w * (def.forestY + 120)) / (170 * 170)), [0, -60, w, def.forestY + 110], r, 340);
    const g = c.createLinearGradient(0, 0, 0, def.forestY + 120); g.addColorStop(0, 'rgba(8,40,18,.5)'); g.addColorStop(1, 'rgba(8,40,18,0)'); c.fillStyle = g; c.fillRect(0, 0, w, def.forestY + 120);
  }
}
function ellipse(c: C, x: number, y: number, rx: number, ry: number) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); }
function plaza(c: C, pz: { x: number; y: number; rx: number; ry: number }) {
  c.save(); c.fillStyle = 'rgba(30,55,25,.3)'; ellipse(c, pz.x + 3, pz.y + 12, pz.rx + 18, pz.ry + 16); c.fill();
  c.fillStyle = '#8f877d'; ellipse(c, pz.x, pz.y + 3, pz.rx + 12, pz.ry + 12); c.fill();
  c.fillStyle = '#c9c0b3'; ellipse(c, pz.x, pz.y, pz.rx + 8, pz.ry + 8); c.fill();
  const t = gImg(theme.plaza);
  if (t) { c.save(); ellipse(c, pz.x, pz.y, pz.rx, pz.ry); c.clip(); const k = Math.max((2 * pz.rx) / t.naturalWidth, (2 * pz.ry) / t.naturalHeight) * 1.06; c.drawImage(t, pz.x - (t.naturalWidth * k) / 2, pz.y - (t.naturalHeight * k) / 2, t.naturalWidth * k, t.naturalHeight * k); c.restore(); }
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 3; ellipse(c, pz.x, pz.y, pz.rx - 12, pz.ry - 12); c.stroke(); c.restore();
}
function strokePts(c: C, pts: Pt[]) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); }
/** walk a polyline, calling fn every `step` px with the point and its left normal */
function along(pts: Pt[], step: number, fn: (x: number, y: number, nx: number, ny: number) => void) {
  let carry = step * 0.5;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay); if (!len) continue;
    const dx = (bx - ax) / len, dy = (by - ay) / len;
    for (let d = carry; d < len; d += step) fn(ax + dx * d, ay + dy * d, -dy, dx);
    carry = ((carry - len) % step + step) % step; if (carry === 0) carry = step;
  }
}
function drawSprite(c: C, id: string, x: number, y: number, k: number, flip = false, alpha = 1) {
  const img = sImg(id); if (!img || !img.naturalWidth) return; const w = img.naturalWidth * k, h = img.naturalHeight * k;
  c.save(); c.globalAlpha = alpha; c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(img, -w / 2, -h * 0.94, w, h); c.restore();
}
function path(c: C, def: LocationDef, p: PathDef, r: () => number, pts: Pt[]) {
  const dirt = pattern(c, theme.path, 0.6), w = p.width;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  strokePts(c, pts); c.strokeStyle = 'rgba(86,58,24,.22)'; c.lineWidth = w + 22; c.stroke();
  for (const [grow, a] of [[10, 0.35], [5, 0.7], [0, 1]] as const) { strokePts(c, pts); c.strokeStyle = dirt ?? '#d9a35a'; c.globalAlpha = a; c.lineWidth = w + grow; c.stroke(); }
  c.globalAlpha = 1; strokePts(c, pts); c.strokeStyle = 'rgba(255,236,190,.1)'; c.lineWidth = w * 0.45; c.stroke();
  c.restore();
  // grass and flowers creeping over the edges
  along(pts, 34, (x, y, nx, ny) => {
    for (const side of [-1, 1]) {
      if (r() < 0.35) continue;
      const off = w / 2 + 2 + (r() - 0.4) * 14, [id, f] = theme.edge[Math.floor(r() * theme.edge.length)], k = (SCALE[id] ?? 1) * f * (0.8 + r() * 0.4);
      drawSprite(c, id, x + nx * off * side + (r() - 0.5) * 8, y + ny * off * side + 6, k, r() < 0.5);
    }
  });
  along(pts, 120, (x, y, nx, ny) => { if (r() < 0.5) drawSprite(c, theme.pathRock ?? 'rocks-small', x + nx * (r() - 0.5) * w * 0.5, y + ny * (r() - 0.5) * w * 0.5, theme.pathRock ? 0.12 : 0.18, r() < 0.5, 0.95); });
  void def;
}
function liquid(c: C, def: LocationDef, L: LiquidDef, r: () => number, sm: (p: Pt[]) => Pt[]) {
  if (L.kind === 'lava' && theme.lava && L.closed) { lavaPool(c, L, r); return; }
  if (L.kind === 'water' && L.closed) { lake(c, L, r); return; }
  const w = L.width ?? 80, pts = sm(L.pts);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [grow, col] of [[44, 'rgba(78,58,30,.25)'], [30, '#8b6a3f'], [20, '#b08a55']] as const) { strokePts(c, pts); c.strokeStyle = col; c.lineWidth = w + grow; c.stroke(); }
  for (const [mul, col] of [[1, '#2186d6'], [0.78, '#3aa9ec'], [0.5, 'rgba(140,226,255,.7)'], [0.22, 'rgba(230,252,255,.55)']] as const) { strokePts(c, pts); c.strokeStyle = col; c.lineWidth = w * mul; c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2.2;
  along(pts, 30, (x, y, nx, ny) => { if (r() < 0.55) return; const o = (r() - 0.5) * w * 0.7, ang = Math.atan2(nx, -ny); c.beginPath(); c.ellipse(x + nx * o, y + ny * o, 11 + r() * 8, 3.2, ang + Math.PI / 2, 0, Math.PI); c.stroke(); });
  c.restore();
  along(pts, 46, (x, y, nx, ny) => {
    for (const side of [-1, 1]) {
      if (r() < 0.25) continue;
      const [id, f] = theme.bank[Math.floor(r() * theme.bank.length)], off = w / 2 + 14 + (r() - 0.3) * 16, k = (SCALE[id] ?? 1) * f * (0.8 + r() * 0.4);
      drawSprite(c, id, x + nx * off * side, y + ny * off * side + 8, k, r() < 0.5);
    }
  });
  void def;
}
/** A pond or lake: a bank-coloured rim, shaded water with light ripples, lily pads and reeds round the shore. */
function lake(c: C, L: LiquidDef, r: () => number) {
  const poly = smooth(L.pts, 8, true), [deep, mid, lite] = theme.water ?? ['#1d7fd0', '#38a9e6', '#8fe3ff'];
  const trace = () => { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  c.save(); c.lineJoin = 'round';
  trace(); c.strokeStyle = 'rgba(20,40,20,.3)'; c.lineWidth = 56; c.stroke();
  trace(); c.strokeStyle = '#4a3a22'; c.lineWidth = 36; c.stroke(); trace(); c.strokeStyle = '#8b6a3f'; c.lineWidth = 26; c.stroke(); trace(); c.strokeStyle = pattern(c, theme.bankTex ?? 'gr-bank', 0.5) ?? '#a98a58'; c.lineWidth = 20; c.stroke();
  const g = c.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 10, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, y1 - y0) * 0.6); g.addColorStop(0, mid); g.addColorStop(1, deep);
  trace(); c.fillStyle = g; c.fill();
  c.save(); trace(); c.clip(); trace(); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 26; c.stroke(); trace(); c.strokeStyle = lite; c.globalAlpha = 0.5; c.lineWidth = 10; c.stroke(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2.2;
  for (let i = 0; i < ((x1 - x0) * (y1 - y0)) / 9000; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); if (!pointInPoly(x, y, poly)) continue; c.beginPath(); c.ellipse(x, y, 12 + r() * 14, 3.5 + r() * 2, 0, 0, Math.PI); c.stroke(); }
  c.restore(); c.restore();
  const cx = (x0 + x1) / 2;
  if (theme.pads !== false) for (let i = 0, n = Math.round(((x1 - x0) * (y1 - y0)) / 60000) + 3; i < n; i++) { const x = x0 + (x1 - x0) * (0.15 + r() * 0.7), y = y0 + (y1 - y0) * (0.15 + r() * 0.7); if (!pointInPoly(x, y, poly)) continue; const id = ['lilypad-a', 'lilypad-b', 'lilypad-c'][Math.floor(r() * 3)]; drawSprite(c, id, x, y + 10, (SCALE[id] ?? 0.4) * (0.9 + r() * 0.5), r() < 0.5); }
  let k = 0; for (const [x, y] of poly) { if (k++ % 2) continue; const [id, f] = theme.bank[Math.floor(r() * theme.bank.length)]; drawSprite(c, id, x + (x - cx) * 0.03, y + 16, (SCALE[id] ?? 1) * f * (0.9 + r() * 0.4), r() < 0.5); }
}
/** A pool of glowing lava: the lava picture clipped to the pool, with a rock rim and a bright glow. */
function lavaPool(c: C, L: LiquidDef, r: () => number) {
  const poly = smooth(L.pts, 8, true), t = pattern(c, theme.lava!, 0.6);
  const trace = () => { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  c.save(); c.lineJoin = 'round';
  trace(); c.shadowColor = 'rgba(255,120,30,.9)'; c.shadowBlur = 60; c.fillStyle = '#ff7a1a'; c.fill(); c.shadowBlur = 0;
  trace(); c.strokeStyle = '#2a1a24'; c.lineWidth = 34; c.stroke(); trace(); c.strokeStyle = '#6a4a3c'; c.lineWidth = 22; c.stroke();
  trace(); c.fillStyle = t ?? '#ff6a1f'; c.fill();
  c.save(); trace(); c.clip(); trace(); c.strokeStyle = 'rgba(255,230,140,.55)'; c.lineWidth = 22; c.stroke(); c.restore();
  c.restore();
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  let i = 0; for (const [x, y] of poly) { if (i++ % 3) continue; const [id, f] = theme.bank[Math.floor(r() * theme.bank.length)]; drawSprite(c, id, x + (x - (x0 + (Math.max(...xs) - x0) / 2)) * 0.04, y + 14 + (y - y0) * 0.0, (SCALE[id] ?? 1) * f * (0.9 + r() * 0.3), r() < 0.5); }
}
/** A flat stone causeway over lava: a slab of the platform stone with a dark side face and a lit rim, plus rubble along the edges. */
function causeway(c: C, b: { a: Pt; b: Pt; width: number }) {
  const [ax, ay] = b.a, [bx, by] = b.b, len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, nx = -uy, ny = ux, hw = b.width * 0.5 - 6, ext = 46;
  const P = (t: number, k: number): Pt => [ax + ux * t + nx * k, ay + uy * t + ny * k];
  const quad = (dy: number) => { c.beginPath(); for (const [t, k] of [[-ext, -hw], [len + ext, -hw], [len + ext, hw], [-ext, hw]] as const) { const [x, y] = P(t, k); c.lineTo(x, y + dy); } c.closePath(); };
  c.save(); c.lineJoin = 'round';
  quad(10); c.shadowColor = 'rgba(255,110,30,.75)'; c.shadowBlur = 40; c.fillStyle = '#2a1a24'; c.fill(); c.shadowBlur = 0;
  quad(14); c.fillStyle = '#4a3238'; c.fill();
  quad(0); c.fillStyle = pattern(c, theme.top ?? theme.grass, 0.6) ?? '#c8924a'; c.fill(); c.fillStyle = theme.wash ?? 'rgba(255,190,110,.08)'; c.fill();
  // slab joints across the road and a lit rim along both long edges
  c.save(); quad(0); c.clip(); c.strokeStyle = 'rgba(70,35,20,.35)'; c.lineWidth = 3;
  for (let t = -ext + 30; t < len + ext; t += 46) { const [x0, y0] = P(t, -hw), [x1, y1] = P(t, hw); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  c.restore();
  c.strokeStyle = theme.rim ?? 'rgba(255,214,140,.75)'; c.lineWidth = 3;
  for (const k of [-hw, hw]) { const [x0, y0] = P(-ext, k), [x1, y1] = P(len + ext, k); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
  c.restore();
  const rr = rng(Math.round(ax * 7 + ay * 13));
  for (const k of [-hw, hw]) for (let t = -ext + 20; t < len + ext - 10; t += 34 + rr() * 22) { const [x, y] = P(t, k + (k < 0 ? -4 : 4) + (rr() - 0.5) * 8); drawSprite(c, 'em-rocks', x, y + 8, 0.1 + rr() * 0.05, rr() < 0.5, 0.95); }
}
/** Rope bridge pieces (deck, posts, ropes). The walkable lane is `b.width - 8` wide and the rails stand just outside it, so the explorer walks inside the railings. */
const rope = (c: C, x0: number, y0: number, x1: number, y1: number, sag: number, w = 3.6) => {
  c.lineCap = 'round'; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
  c.strokeStyle = 'rgba(50,30,10,.55)'; c.lineWidth = w + 1.6; c.beginPath(); c.moveTo(x0, y0 + 1.5); c.quadraticCurveTo(mx, my + 1.5, x1, y1 + 1.5); c.stroke();
  c.strokeStyle = '#ecd9a6'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
};
const postAt = (c: C, x: number, y: number, h: number) => {
  c.fillStyle = 'rgba(20,35,20,.28)'; c.beginPath(); c.ellipse(x + 3, y + 3, 8, 3.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#6a4220'; c.fillRect(x - 5, y - h, 10, h + 4); c.fillStyle = '#a06f3a'; c.fillRect(x - 5, y - h, 4, h + 4);
  c.fillStyle = '#c08a4a'; c.beginPath(); c.arc(x, y - h, 6.4, 0, TAU); c.fill(); c.strokeStyle = '#4a2c14'; c.lineWidth = 1.6; c.stroke();
};
const POST_H = 34;
const deckGeom = (b: { a: Pt; b: Pt; width: number }) => {
  const hw = (b.width - 8) / 2 + 7, vertical = Math.abs(b.b[1] - b.a[1]) > Math.abs(b.b[0] - b.a[0]) * 1.5;
  const cx = (b.a[0] + b.b[0]) / 2, cy = (b.a[1] + b.b[1]) / 2, ext = 34;
  return vertical ? { vertical, hw, x0: cx - hw, x1: cx + hw, y0: Math.min(b.a[1], b.b[1]) - ext, y1: Math.max(b.a[1], b.b[1]) + ext, cx, cy }
    : { vertical, hw, x0: Math.min(b.a[0], b.b[0]) - ext, x1: Math.max(b.a[0], b.b[0]) + ext, y0: cy - hw, y1: cy + hw, cx, cy };
};
/** Painted bridge pieces (gr-bridge-*): source rects (in sprite px) that repeat seamlessly, from the generated sheet. */
const BRP = { sr: { dh: { sx: 40, sw: 401 }, dv: { sy: 60, sh: 395 }, rh: { sx: 142, sw: 228.5 }, rv: { sy: 107, sh: 164 }, k: 0.6, kv: 0.4, kr: 0.285, kp: 0.15 } };
let BR = { dh: { sx: 27, sw: 445 }, dv: { sy: 40, sh: 425 }, rh: { sx: 138, sw: 230.5 }, rv: { sy: 96, sh: 157.5 }, k: 0.6, kv: 0.43, kr: 0.3, kp: 0.2 };
const BRG = BR;
const brImgs = () => { const p = theme.br ?? 'gr'; BR = p === 'sr' ? BRP.sr : BRG; const o = { dh: sImg(`${p}-bridge-deck-h`), dv: sImg(`${p}-bridge-deck-v`), rh: sImg(`${p}-bridge-rail-h`), rv: sImg(`${p}-bridge-rail-v`), po: sImg(`${p}-bridge-post`) }; return Object.values(o).every((i) => i && i.naturalWidth) ? o as Record<'dh' | 'dv' | 'rh' | 'rv' | 'po', HTMLImageElement> : null; };
/** repeat a source strip along x (or y) between two limits */
function stripX(c: C, img: HTMLImageElement, sx: number, sw: number, k: number, x0: number, x1: number, dy: number) {
  const tw = sw * k, h = img.naturalHeight * k; for (let x = x0; x < x1 - 0.5; x += tw) { const len = Math.min(tw, x1 - x); c.drawImage(img, sx, 0, len / k, img.naturalHeight, x, dy, len, h); }
}
function stripY(c: C, img: HTMLImageElement, sy: number, sh: number, k: number, y0: number, y1: number, dx: number) {
  const th = sh * k, w = img.naturalWidth * k; for (let y = y0; y < y1 - 0.5; y += th) { const len = Math.min(th, y1 - y); c.drawImage(img, 0, sy, img.naturalWidth, len / k, dx, y, w, len); }
}
function paintedPost(c: C, im: HTMLImageElement, x: number, y: number) { const k = BR.kp, w = im.naturalWidth * k, h = im.naturalHeight * k; c.drawImage(im, x - w / 2, y - h * 0.94, w, h); }
function paintedBridge(c: C, b: { a: Pt; b: Pt; width: number }, im: NonNullable<ReturnType<typeof brImgs>>) {
  const g = deckGeom(b); c.save();
  if (g.vertical) {
    const kv = (g.x1 - g.x0) / im.dv.naturalWidth, rw = im.rv.naturalWidth * BR.kv;
    c.fillStyle = 'rgba(10,30,20,.3)'; c.fillRect(g.x0 - 4, g.y0 + 10, g.x1 - g.x0 + 8, g.y1 - g.y0 + 6);
    stripY(c, im.dv, BR.dv.sy, BR.dv.sh, kv, g.y0, g.y1, g.x0);
    for (const px of [g.x0 + 2, g.x1 - 2]) stripY(c, im.rv, BR.rv.sy, BR.rv.sh, BR.kv, g.y0 - 8, g.y1, px - rw / 2);
    for (const px of [g.x0 + 2, g.x1 - 2]) { paintedPost(c, im.po, px, g.y0 + 4); paintedPost(c, im.po, px, g.y1 + 6); }
  } else {
    const kh = (g.y1 - g.y0) / im.dh.naturalHeight, rh = im.rh.naturalHeight * BR.kr;
    c.fillStyle = 'rgba(10,30,20,.3)'; c.fillRect(g.x0 - 4, g.y0 + 10, g.x1 - g.x0 + 8, g.y1 - g.y0 + 6);
    stripX(c, im.dh, BR.dh.sx, BR.dh.sw, kh, g.x0, g.x1, g.y0);
    stripX(c, im.rh, BR.rh.sx, BR.rh.sw, BR.kr, g.x0, g.x1, g.y0 + 8 - rh);      // far rail, behind the explorer
    paintedPost(c, im.po, g.x0 + 4, g.y0 + 8); paintedPost(c, im.po, g.x1 - 4, g.y0 + 8);
  }
  c.restore();
}
function ropeBridge(c: C, b: { a: Pt; b: Pt; width: number }) {
  const im = brImgs(); if (im) { paintedBridge(c, b, im); return; }
  const g = deckGeom(b); c.save();
  c.fillStyle = 'rgba(10,30,20,.3)'; c.fillRect(g.x0 - 6, g.y0 + 10, g.x1 - g.x0 + 12, g.y1 - g.y0 + 6);
  c.fillStyle = '#5a3a1e'; c.fillRect(g.x0 - 6, g.y0 - 2, g.x1 - g.x0 + 12, g.y1 - g.y0 + 10);
  if (g.vertical) {
    for (let y = g.y0, i = 0; y < g.y1; y += 18, i++) { c.fillStyle = i % 2 ? '#c08a4a' : '#d29a58'; c.fillRect(g.x0, y, g.x1 - g.x0, 15); c.fillStyle = 'rgba(255,230,170,.25)'; c.fillRect(g.x0, y, g.x1 - g.x0, 3); c.fillStyle = 'rgba(70,40,15,.5)'; c.fillRect(g.x0, y + 15, g.x1 - g.x0, 2); }
    const n = Math.max(1, Math.round((g.y1 - g.y0) / 80)), step = (g.y1 - g.y0) / n;
    for (const px of [g.x0 - 4, g.x1 + 4]) {
      rope(c, px, g.y0 - POST_H, px, g.y1 - POST_H, 0, 3.4); rope(c, px, g.y0 - POST_H * 0.5, px, g.y1 - POST_H * 0.5, 0, 2.6);
      for (let i = 0; i <= n; i++) postAt(c, px, g.y0 + i * step, POST_H);
    }
  } else {
    for (let x = g.x0, i = 0; x < g.x1; x += 18, i++) { c.fillStyle = i % 2 ? '#c08a4a' : '#d29a58'; c.fillRect(x, g.y0, 15, g.y1 - g.y0); c.fillStyle = 'rgba(255,230,170,.25)'; c.fillRect(x, g.y0, 3, g.y1 - g.y0); c.fillStyle = 'rgba(70,40,15,.5)'; c.fillRect(x + 15, g.y0, 2, g.y1 - g.y0); }
    c.fillStyle = '#7a5028'; c.fillRect(g.x0, g.y1 - 3, g.x1 - g.x0, 5);
    const n = Math.max(1, Math.round((g.x1 - g.x0) / 80)), step = (g.x1 - g.x0) / n, py = g.y0 - 3;      // the back rail stands behind the explorer
    rope(c, g.x0, py - POST_H, g.x1, py - POST_H, 5, 3.4); rope(c, g.x0, py - POST_H * 0.5, g.x1, py - POST_H * 0.5, 4, 2.6);
    for (let i = 0; i <= n; i++) postAt(c, g.x0 + i * step, py, POST_H);
  }
  c.restore();
}
/** The near rail of a left-right bridge is drawn after the explorer (the world sorts it by its y), so the explorer stands inside the railings. */
function bridgeRails(bridges: { a: Pt; b: Pt; width: number }[]): { y: number; draw: (c: C) => void }[] {
  if (!theme.name.startsWith('grove') && !theme.name.startsWith('sand')) return [];
  const out: { y: number; draw: (c: C) => void }[] = [];
  for (const br of bridges) {
    const g = deckGeom(br); if (g.vertical) continue;
    const n = Math.max(1, Math.round((g.x1 - g.x0) / 80)), step = (g.x1 - g.x0) / n, py = g.y1 + 4;
    const im = brImgs();
    if (im) { const rh = im.rh.naturalHeight * BR.kr; out.push({ y: g.y1 + 2, draw: (c) => { c.save(); stripX(c, im.rh, BR.rh.sx, BR.rh.sw, BR.kr, g.x0, g.x1, g.y1 + 2 - rh); paintedPost(c, im.po, g.x0 + 4, g.y1 + 2); paintedPost(c, im.po, g.x1 - 4, g.y1 + 2); c.restore(); } }); continue; }
    out.push({ y: py, draw: (c) => {
      c.save(); rope(c, g.x0, py - POST_H, g.x1, py - POST_H, 5, 3.4); rope(c, g.x0, py - POST_H * 0.5, g.x1, py - POST_H * 0.5, 4, 2.6);
      for (let i = 0; i <= n; i++) postAt(c, g.x0 + i * step, py, POST_H); c.restore();
    } });
  }
  return out;
}
function bridge(c: C, b: { a: Pt; b: Pt; width: number }) {
  if (theme.causeway) { causeway(c, b); return; }
  if (theme.name.startsWith('grove') || theme.name.startsWith('sand')) { ropeBridge(c, b); return; }
  const img = sImg(theme.bridge ?? 'bridge-wood'); if (!img) return;
  const [ax, ay] = b.a, [bx, by] = b.b, len = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax), sx = (len + 90) / img.naturalWidth, sy = sx * (theme.bridgeY ?? 1.1);
  c.save(); c.translate((ax + bx) / 2, (ay + by) / 2 + 4); c.rotate(ang);
  c.fillStyle = 'rgba(20,45,20,.22)'; ellipse(c, 0, 24, len / 2 + 30, 18); c.fill();
  c.drawImage(img, (-img.naturalWidth * sx) / 2, (-img.naturalHeight * sy) / 2, img.naturalWidth * sx, img.naturalHeight * sy); c.restore();
}
function zone(c: C, poly: Pt[], z: ZoneDef, r: () => number) {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const g = pattern(c, theme.patches[0], 0.6);
  for (const [sc, a] of [[1.12, 0.07], [1.06, 0.1], [1, 0.16], [0.9, 0.12]] as const) {
    c.save(); c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy); c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    c.fillStyle = `rgba(${theme.zoneRgb ?? '20,120,45'},${a})`; c.fill(); if (g) { c.globalAlpha = a * 2.2; c.fillStyle = g; c.fill(); } c.restore();
  }
  if (z.rare) { c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(cx, cy, 4, cx, cy, 70); gr.addColorStop(0, 'rgba(255,240,160,.55)'); gr.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = gr; c.fillRect(cx - 70, cy - 70, 140, 140); c.restore(); }
  void r;
}
function tuftSprites() {
  const mk = (ids: string[]) => ids.map((id) => scaled(id, (SCALE[id] ?? 0.3) * 1.15, 0.96, theme.tuftTint ?? theme.objTint)?.cv ?? mkcv(48, 54));
  const set = mk(['grass-big', 'grass-mid', 'grass-small']);
  return { ash: set, moss: set };
}
/** A raised area: stone cliff face below, lush grass on top. */
function plateau(c: C, pts: Pt[], face: number, r: () => number) {
  const poly = smooth(pts, 8, true), stone = pattern(c, theme.cliff ?? theme.plaza, 0.42);
  const trace = () => { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  c.save();
  c.translate(0, face + 6); trace(); c.fillStyle = 'rgba(20,35,20,.3)'; c.fill(); c.translate(0, -6);
  for (let dy = face; dy >= 3; dy -= 3) { c.save(); c.translate(0, dy); trace(); c.fillStyle = stone ?? '#8a8798'; c.fill(); c.restore(); }
  c.translate(0, face); trace(); c.fillStyle = theme.shade ?? 'rgba(40,30,90,.32)'; c.fill(); c.strokeStyle = theme.line ?? '#3c2f55'; c.lineWidth = 3; c.stroke(); c.translate(0, -face);
  trace(); c.fillStyle = pattern(c, theme.top ?? theme.grass, 0.6) ?? '#58b84a'; c.fill();
  c.fillStyle = theme.wash ?? 'rgba(190,255,170,.1)'; c.fill();
  c.lineJoin = 'round'; c.strokeStyle = theme.rim ?? 'rgba(150,240,110,.7)'; c.lineWidth = 9; c.stroke(); c.strokeStyle = theme.line ?? '#3c2f55'; c.lineWidth = 2.4; c.stroke();
  c.restore();
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  patches(c, theme.patches, 0.6, Math.ceil(((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / (260 * 260)), [Math.min(...xs) + 60, Math.min(...ys) + 40, Math.max(...xs) - Math.min(...xs) - 120, Math.max(...ys) - Math.min(...ys) - 100], r, 300);
}
/** A shallow crossing: bright water with stepping stones. */
function ford(c: C, pts: Pt[], width: number, r: () => number) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  strokePts(c, pts); c.strokeStyle = 'rgba(150,225,255,.4)'; c.lineWidth = Math.min(width, 60); c.stroke(); c.restore();
  along(pts, 58, (x, y) => { const id = r() < 0.7 ? 'mv-stones' : 'mv-stone-c'; drawSprite(c, id, x + (r() - 0.5) * 12, y + (r() - 0.5) * 14 + 8, SCALE[id] ?? 0.5, r() < 0.5); });
}
function peeks(def: LocationDef, field: Field): Peek[] {
  const out: Peek[] = [], r = rng(`peek:${def.id}`);
  def.zones.forEach((z, zi) => {
    const poly = z.poly; if (!z.pool.length) return;
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), n = z.rare ? 1 : 2;
    for (let i = 0, tries = 0; i < n && tries < 60; tries++) {
      const x = Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys));
      if (!pointInPoly(x, y, poly) || field.isBlocked(x, y)) continue;
      out.push({ x, y, id: z.pool[(i + zi) % z.pool.length], ph: r() * 20 }); i++;
    }
  });
  return out;
}

/** Loads the pictures one theme needs (plus the villagers) and makes it the active theme. */
export async function loadStory(name = 'village'): Promise<void> {
  const th = THEMES[name] ?? THEMES.village;
  const sprites = Object.keys(SCALE).filter((id) => th.sprites(id) || id.startsWith('npc-'));
  await loadStoryAssets({ ground: th.ground, sprites, anims: th.anims });
  placedCache.clear(); spriteCache.clear(); tileCache.clear();
}
const npcIds: Record<string, string> = { guide: 'npc-elder', scholar: 'npc-shopkeeper', villager: 'npc-gardener' };
hook.npc = (kind) => scaled(npcIds[kind] ?? 'npc-fisher', SCALE[npcIds[kind] ?? 'npc-fisher'] ?? 0.33, 0.97);
const enter = (def: LocationDef) => { theme = THEMES[def.theme ?? 'village'] ?? THEMES.village; };
export const story = { bridgeRails, hook, place, shadow, ground, plaza, path, liquid, bridge, zone, tuftSprites, peeks, plateau, ford, enter };
