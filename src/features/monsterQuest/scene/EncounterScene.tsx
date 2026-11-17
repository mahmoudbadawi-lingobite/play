import type { CSSProperties } from 'react';
import './scene.css';

/**
 * Painted backdrops for wild encounters and arena battles, built from the same pictures as the world
 * (public/monster-quest/world/). Everything is sized from the box it sits in (--u = 1% of its width, or a bit more in tall boxes), so it fits a phone, a tablet or the arena panel.
 */
export type SceneKind = 'village' | 'valley' | 'arena' | 'ruins' | 'caverns' | 'grove' | 'roots' | 'sand' | 'tomb' | 'frost' | 'frostcave' | 'coast' | 'grotto';
const BASE = `${import.meta.env.BASE_URL}monster-quest/world/`;
interface Item { id: string; x: number; b: number; w: number; z?: number; flip?: boolean; sway?: number; delay?: number }
interface Strip { id: string; x: number; b: number; w: number; fw: number; fh: number; n: number; fps: number; z?: number }
interface Def { sky: string; ground: string; groundK: number; groundTint: string; items: Item[]; strips: Strip[]; fx: 'pollen' | 'fireflies' | 'embers' }

const VILLAGE: Def = {
  sky: 'linear-gradient(180deg,#78c8ff 0%,#bfe8ff 36%,#fff2cc 56%)', ground: 'grass1', groundK: 24, groundTint: 'rgba(255,240,170,.08)', fx: 'pollen', strips: [],
  items: [
    { id: 'tree-green', x: 4, b: 41, w: 15, z: 1 }, { id: 'pine', x: 17, b: 42, w: 11, z: 1 }, { id: 'tree-orange', x: 31, b: 40, w: 14, z: 1 }, { id: 'tree-green', x: 47, b: 41, w: 13, z: 1 },
    { id: 'tree-pink', x: 62, b: 40, w: 15, z: 1 }, { id: 'pine', x: 77, b: 42, w: 11, z: 1 }, { id: 'tree-green', x: 92, b: 41, w: 16, z: 1 },
    { id: 'house-red', x: 11, b: 36, w: 19, z: 2 }, { id: 'house-blue', x: 87, b: 36, w: 18, z: 2 }, { id: 'lamp-a', x: 25, b: 32, w: 5, z: 2 }, { id: 'fence-wood', x: 71, b: 33, w: 14, z: 2 },
    { id: 'bush-big', x: -2, b: -3, w: 28, z: 4, sway: 1 }, { id: 'flowers-white', x: 20, b: 1, w: 9, z: 4, sway: 3 }, { id: 'grass-big', x: 33, b: -4, w: 16, z: 4, sway: 2 },
    { id: 'grass-mid', x: 62, b: -4, w: 14, z: 4, sway: 1 }, { id: 'tulips', x: 71, b: 2, w: 8, z: 4, sway: 3 }, { id: 'flowers-purple', x: 82, b: 2, w: 9, z: 4, sway: 2 }, { id: 'bush-mid', x: 100, b: -3, w: 26, z: 4, sway: 2 },
  ],
};
const VALLEY: Def = {
  sky: 'linear-gradient(180deg,#140e44 0%,#382784 38%,#8e5dc4 54%,#ffb6dd 63%)', ground: 'mv-grass', groundK: 26, groundTint: 'rgba(70,50,160,.22)', fx: 'fireflies',
  strips: [{ id: 'mv-fireflies', x: 26, b: 22, w: 9, fw: 307, fh: 380, n: 6, fps: 5, z: 5 }, { id: 'mv-fireflies', x: 78, b: 30, w: 8, fw: 307, fh: 380, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'mv-giant-blue', x: 6, b: 40, w: 17, z: 1 }, { id: 'mv-giant-teal', x: 22, b: 41, w: 14, z: 1 }, { id: 'pine', x: 35, b: 40, w: 10, z: 1 }, { id: 'mv-giant-purple', x: 50, b: 40, w: 15, z: 1 },
    { id: 'mv-giant-pink', x: 66, b: 41, w: 15, z: 1 }, { id: 'pine', x: 78, b: 40, w: 10, z: 1 }, { id: 'mv-giant-orange', x: 91, b: 40, w: 14, z: 1 },
    { id: 'mv-treehouse', x: 13, b: 35, w: 19, z: 2 }, { id: 'mv-fairy-ring', x: 86, b: 33, w: 13, z: 2 },
    { id: 'mv-fern-big', x: -1, b: -2, w: 24, z: 4, sway: 1 }, { id: 'mv-bluebell-big', x: 17, b: 1, w: 11, z: 4, sway: 3 }, { id: 'mv-fern-small', x: 36, b: -3, w: 14, z: 4, sway: 2 },
    { id: 'mv-jar', x: 62, b: 2, w: 6, z: 4 }, { id: 'mv-bluebell-small', x: 76, b: 2, w: 9, z: 4, sway: 3 }, { id: 'mv-crystal-big', x: 90, b: 2, w: 12, z: 4 }, { id: 'mv-berry-bush', x: 104, b: -3, w: 24, z: 4, sway: 2 },
  ],
};
const ARENA: Def = {
  sky: 'linear-gradient(180deg,#16205f 0%,#4b3597 46%,#e98f6a 60%,#ffd38a 66%)', ground: 'cobble', groundK: 30, groundTint: 'rgba(40,30,90,.18)', fx: 'embers',
  strips: [{ id: 'torch', x: 19, b: 31, w: 4.5, fw: 129, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'torch', x: 81, b: 31, w: 4.5, fw: 129, fh: 420, n: 6, fps: 9, z: 3 },
    { id: 'brazier', x: 31, b: 29, w: 8, fw: 217, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'brazier', x: 69, b: 29, w: 8, fw: 217, fh: 420, n: 6, fps: 9, z: 3 }],
  items: [
    { id: 'arch-stone', x: 50, b: 40, w: 30, z: 1 }, { id: 'pillar', x: 12, b: 38, w: 7, z: 1 }, { id: 'pillar', x: 88, b: 38, w: 7, z: 1 },
    { id: 'banner-post', x: 6, b: 30, w: 9, z: 2 }, { id: 'banner-post', x: 94, b: 30, w: 9, z: 2 },
    { id: 'crystal-pillar', x: 4, b: 2, w: 9, z: 4 }, { id: 'barrel', x: 94, b: 2, w: 9, z: 4 }, { id: 'crate', x: 85, b: 0, w: 8, z: 4 },
  ],
};
const RUINS: Def = {
  sky: 'linear-gradient(180deg,#3a1a4a 0%,#c4503a 42%,#ffb066 60%,#ffd9a0 66%)', ground: 'em-sandstone', groundK: 26, groundTint: 'rgba(255,140,60,.10)', fx: 'embers',
  strips: [{ id: 'torch', x: 30, b: 33, w: 4.5, fw: 135, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'torch', x: 70, b: 33, w: 4.5, fw: 135, fh: 420, n: 6, fps: 9, z: 3 }],
  items: [
    { id: 'em-dead-tree', x: 12, b: 41, w: 12, z: 1 }, { id: 'em-pillar', x: 24, b: 40, w: 7, z: 1 }, { id: 'em-wall', x: 36, b: 38, w: 16, z: 1 }, { id: 'em-statue', x: 50, b: 40, w: 22, z: 1 },
    { id: 'em-wall', x: 64, b: 38, w: 16, z: 1, flip: true }, { id: 'em-pillar-broken', x: 77, b: 39, w: 9, z: 1 }, { id: 'em-pillar', x: 88, b: 40, w: 7, z: 1 }, { id: 'em-pillar', x: 98, b: 41, w: 7, z: 1 },
    { id: 'em-crystal-big', x: 6, b: 1, w: 11, z: 4, delay: 0 }, { id: 'em-crystal-small', x: 21, b: 1, w: 8, z: 4 }, { id: 'em-rocks', x: 66, b: 2, w: 9, z: 4 },
    { id: 'em-boulder', x: 94, b: -2, w: 14, z: 4 }, { id: 'em-rocks', x: 80, b: 0, w: 8, z: 4, flip: true },
  ],
};
const CAVERNS: Def = {
  sky: 'linear-gradient(180deg,#0e0612 0%,#2a1030 45%,#7a2a22 60%,#ff8a3a 66%)', ground: 'em-cave', groundK: 26, groundTint: 'rgba(120,40,120,.12)', fx: 'embers',
  strips: [{ id: 'torch', x: 27, b: 32, w: 4.5, fw: 135, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'torch', x: 73, b: 32, w: 4.5, fw: 135, fh: 420, n: 6, fps: 9, z: 3 }],
  items: [
    { id: 'em-stal-a', x: 7, b: 40, w: 16, z: 1 }, { id: 'em-spire', x: 20, b: 41, w: 10, z: 1 }, { id: 'em-stal-c', x: 36, b: 40, w: 12, z: 1 }, { id: 'em-cave-arch', x: 52, b: 41, w: 18, z: 1 },
    { id: 'em-stal-b', x: 68, b: 40, w: 12, z: 1 }, { id: 'em-spire', x: 81, b: 41, w: 10, z: 1 }, { id: 'em-stal-a', x: 94, b: 40, w: 16, z: 1, flip: true },
    { id: 'em-crystal-orange', x: 6, b: 1, w: 12, z: 4 }, { id: 'em-crystal-teal', x: 20, b: 1, w: 8, z: 4 }, { id: 'em-mushroom', x: 75, b: 2, w: 7, z: 4, sway: 1 },
    { id: 'em-cave-rocks', x: 88, b: 0, w: 12, z: 4 }, { id: 'em-cave-boulder', x: 101, b: -3, w: 14, z: 4 },
  ],
};
const GROVE: Def = {
  sky: 'linear-gradient(180deg,#8fe0ff 0%,#d4f5c8 38%,#fff3b8 58%)', ground: 'gr-grass', groundK: 24, groundTint: 'rgba(255,246,170,.08)', fx: 'pollen',
  strips: [{ id: 'gr-fireflies', x: 24, b: 24, w: 10, fw: 204, fh: 145, n: 6, fps: 5, z: 5 }, { id: 'gr-fireflies', x: 76, b: 30, w: 9, fw: 204, fh: 145, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'gr-oak', x: 5, b: 40, w: 17, z: 1 }, { id: 'gr-birch', x: 20, b: 41, w: 12, z: 1 }, { id: 'gr-willow', x: 34, b: 40, w: 15, z: 1 }, { id: 'gr-hollow-tree', x: 50, b: 41, w: 14, z: 1 },
    { id: 'gr-oak', x: 65, b: 40, w: 16, z: 1, flip: true }, { id: 'gr-birch', x: 79, b: 41, w: 12, z: 1 }, { id: 'gr-oak', x: 93, b: 40, w: 17, z: 1 },
    { id: 'gr-burrow', x: 13, b: 35, w: 17, z: 2 }, { id: 'gr-treehouse', x: 86, b: 35, w: 16, z: 2 }, { id: 'gr-lantern', x: 28, b: 31, w: 4.5, z: 2 },
    { id: 'gr-fern-big', x: -1, b: -2, w: 22, z: 4, sway: 1 }, { id: 'gr-foxglove', x: 18, b: 1, w: 9, z: 4, sway: 3 }, { id: 'gr-daisies', x: 33, b: -3, w: 14, z: 4, sway: 2 },
    { id: 'gr-glowcaps', x: 64, b: 2, w: 8, z: 4 }, { id: 'gr-foxglove', x: 76, b: 2, w: 8, z: 4, sway: 3 }, { id: 'gr-bigleaf', x: 90, b: 1, w: 12, z: 4, sway: 2 }, { id: 'gr-fern-big', x: 104, b: -3, w: 22, z: 4, sway: 1, flip: true },
  ],
};
const ROOTS: Def = {
  sky: 'linear-gradient(180deg,#04120e 0%,#0f3a35 44%,#2a8a6a 60%,#9dffc8 67%)', ground: 'gr-cave', groundK: 26, groundTint: 'rgba(20,90,70,.16)', fx: 'fireflies',
  strips: [{ id: 'gr-crystal-glow', x: 26, b: 30, w: 8, fw: 199, fh: 181, n: 6, fps: 5, z: 3 }, { id: 'gr-crystal-glow', x: 72, b: 30, w: 8, fw: 199, fh: 181, n: 6, fps: 5, z: 3 },
    { id: 'gr-fireflies', x: 45, b: 22, w: 10, fw: 204, fh: 145, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'gr-root-a', x: 6, b: 40, w: 14, z: 1 }, { id: 'gr-root-b', x: 20, b: 41, w: 13, z: 1 }, { id: 'gr-root-a', x: 36, b: 40, w: 12, z: 1, flip: true }, { id: 'gr-root-arch', x: 52, b: 41, w: 19, z: 1 },
    { id: 'gr-root-b', x: 68, b: 40, w: 13, z: 1, flip: true }, { id: 'gr-root-a', x: 82, b: 41, w: 14, z: 1 }, { id: 'gr-root-b', x: 95, b: 40, w: 13, z: 1 },
    { id: 'gr-crystal', x: 6, b: 1, w: 11, z: 4 }, { id: 'gr-glowcaps', x: 21, b: 1, w: 8, z: 4 }, { id: 'gr-glowcaps', x: 76, b: 2, w: 8, z: 4, flip: true },
    { id: 'gr-boulder', x: 88, b: 0, w: 12, z: 4 }, { id: 'gr-crystal', x: 101, b: -2, w: 13, z: 4 },
  ],
};
const SAND: Def = {
  sky: 'linear-gradient(180deg,#7fd6f2 0%,#ffe9b0 40%,#ffcf7a 60%)', ground: 'sr-sand', groundK: 24, groundTint: 'rgba(255,200,90,.08)', fx: 'pollen',
  strips: [{ id: 'sr-dust', x: 24, b: 24, w: 10, fw: 179, fh: 166, n: 6, fps: 5, z: 5 }, { id: 'sr-dust', x: 76, b: 30, w: 9, fw: 179, fh: 166, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'sr-palm', x: 5, b: 40, w: 15, z: 1 }, { id: 'sr-hoodoo', x: 20, b: 41, w: 12, z: 1 }, { id: 'sr-palm2', x: 34, b: 40, w: 14, z: 1 }, { id: 'sr-arch', x: 50, b: 41, w: 15, z: 1 },
    { id: 'sr-palm', x: 65, b: 40, w: 15, z: 1, flip: true }, { id: 'sr-hoodoo', x: 79, b: 41, w: 12, z: 1, flip: true }, { id: 'sr-palm2', x: 93, b: 40, w: 15, z: 1 },
    { id: 'sr-house', x: 13, b: 35, w: 16, z: 2 }, { id: 'sr-tent', x: 86, b: 35, w: 16, z: 2 }, { id: 'sr-lantern', x: 28, b: 31, w: 4.5, z: 2 },
    { id: 'sr-saguaro', x: 2, b: -1, w: 12, z: 4, sway: 1 }, { id: 'sr-flowers', x: 18, b: 1, w: 9, z: 4, sway: 3 }, { id: 'sr-drygrass', x: 33, b: -3, w: 13, z: 4, sway: 2 },
    { id: 'sr-bones', x: 64, b: 2, w: 10, z: 4 }, { id: 'sr-barrel-cactus', x: 76, b: 2, w: 8, z: 4 }, { id: 'sr-prickly', x: 90, b: 1, w: 11, z: 4, sway: 2 }, { id: 'sr-saguaro', x: 104, b: -3, w: 12, z: 4, flip: true },
  ],
};
const TOMB: Def = {
  sky: 'linear-gradient(180deg,#120804 0%,#3a1e0c 44%,#a8601e 60%,#ffcf70 67%)', ground: 'sr-tomb', groundK: 26, groundTint: 'rgba(60,24,0,.16)', fx: 'embers',
  strips: [{ id: 'sr-crystal-glow', x: 26, b: 30, w: 8, fw: 180, fh: 194, n: 6, fps: 5, z: 3 }, { id: 'sr-crystal-glow', x: 72, b: 30, w: 8, fw: 180, fh: 194, n: 6, fps: 5, z: 3 },
    { id: 'sr-dust', x: 45, b: 22, w: 10, fw: 179, fh: 166, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'sr-pillar', x: 6, b: 40, w: 8, z: 1 }, { id: 'sr-obelisk', x: 20, b: 41, w: 10, z: 1 }, { id: 'sr-pillar', x: 36, b: 40, w: 7, z: 1, flip: true }, { id: 'sr-tomb-door', x: 52, b: 41, w: 19, z: 1 },
    { id: 'sr-pillar', x: 68, b: 40, w: 8, z: 1 }, { id: 'sr-obelisk', x: 82, b: 41, w: 10, z: 1, flip: true }, { id: 'sr-pillar', x: 95, b: 40, w: 8, z: 1 },
    { id: 'sr-lantern', x: 12, b: 33, w: 5, z: 2 }, { id: 'sr-lantern', x: 90, b: 33, w: 5, z: 2 },
    { id: 'sr-crystal', x: 6, b: 1, w: 10, z: 4 }, { id: 'sr-pots', x: 21, b: 1, w: 8, z: 4 }, { id: 'sr-bones', x: 76, b: 2, w: 10, z: 4, flip: true },
    { id: 'sr-boulder', x: 88, b: 0, w: 12, z: 4 }, { id: 'sr-crystal', x: 101, b: -2, w: 12, z: 4 },
  ],
};
const FROST: Def = {
  sky: 'linear-gradient(180deg,#a9d8ff 0%,#e4f3ff 42%,#ffffff 62%)', ground: 'fg-snow', groundK: 24, groundTint: 'rgba(200,230,255,.08)', fx: 'pollen',
  strips: [{ id: 'fg-snow-fall', x: 24, b: 24, w: 10, fw: 182, fh: 175, n: 6, fps: 5, z: 5 }, { id: 'fg-snow-fall', x: 76, b: 30, w: 9, fw: 182, fh: 175, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'fg-pine', x: 5, b: 40, w: 14, z: 1 }, { id: 'fg-pine2', x: 20, b: 41, w: 14, z: 1 }, { id: 'fg-birch', x: 34, b: 40, w: 12, z: 1 }, { id: 'fg-arch', x: 50, b: 41, w: 15, z: 1 },
    { id: 'fg-pine', x: 65, b: 40, w: 15, z: 1, flip: true }, { id: 'fg-pine2', x: 79, b: 41, w: 14, z: 1 }, { id: 'fg-pine', x: 93, b: 40, w: 15, z: 1 },
    { id: 'fg-cabin', x: 13, b: 35, w: 16, z: 2 }, { id: 'fg-tent', x: 86, b: 35, w: 16, z: 2 }, { id: 'fg-lantern', x: 28, b: 31, w: 4.5, z: 2 },
    { id: 'fg-bush', x: 2, b: -1, w: 14, z: 4 }, { id: 'fg-flowers', x: 18, b: 1, w: 9, z: 4, sway: 3 }, { id: 'fg-frostgrass', x: 33, b: -3, w: 13, z: 4, sway: 2 },
    { id: 'fg-snowman', x: 64, b: 2, w: 9, z: 4 }, { id: 'fg-skis', x: 76, b: 2, w: 7, z: 4 }, { id: 'fg-boulder', x: 90, b: 1, w: 11, z: 4 }, { id: 'fg-bush', x: 104, b: -3, w: 14, z: 4, flip: true },
  ],
};
const FROSTCAVE: Def = {
  sky: 'linear-gradient(180deg,#030a1a 0%,#0c2a5a 44%,#2a78c8 60%,#9fe8ff 67%)', ground: 'fg-cave', groundK: 26, groundTint: 'rgba(0,30,90,.16)', fx: 'fireflies',
  strips: [{ id: 'fg-crystal-glow', x: 26, b: 30, w: 8, fw: 171, fh: 160, n: 6, fps: 5, z: 3 }, { id: 'fg-crystal-glow', x: 72, b: 30, w: 8, fw: 171, fh: 160, n: 6, fps: 5, z: 3 },
    { id: 'fg-snow-fall', x: 45, b: 22, w: 10, fw: 182, fh: 175, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'fg-spire', x: 6, b: 40, w: 12, z: 1 }, { id: 'fg-pillar', x: 20, b: 41, w: 8, z: 1 }, { id: 'fg-spire', x: 36, b: 40, w: 11, z: 1, flip: true }, { id: 'fg-cave-door', x: 52, b: 41, w: 19, z: 1 },
    { id: 'fg-spire', x: 68, b: 40, w: 12, z: 1, flip: true }, { id: 'fg-pillar', x: 82, b: 41, w: 8, z: 1 }, { id: 'fg-spire', x: 95, b: 40, w: 12, z: 1 },
    { id: 'fg-crystal', x: 6, b: 1, w: 10, z: 4 }, { id: 'fg-rocks', x: 21, b: 1, w: 9, z: 4 }, { id: 'fg-crystal', x: 76, b: 2, w: 9, z: 4, flip: true },
    { id: 'fg-boulder', x: 88, b: 0, w: 12, z: 4 }, { id: 'fg-crystal', x: 101, b: -2, w: 12, z: 4 },
  ],
};
const COAST: Def = {
  sky: 'linear-gradient(180deg,#7fd8f5 0%,#d8f4ff 40%,#8fe0e0 58%)', ground: 'tc-sand', groundK: 24, groundTint: 'rgba(255,225,150,.08)', fx: 'pollen',
  strips: [{ id: 'tc-bubbles', x: 24, b: 24, w: 10, fw: 183, fh: 164, n: 6, fps: 5, z: 5 }, { id: 'tc-bubbles', x: 76, b: 30, w: 9, fw: 183, fh: 164, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'tc-palm', x: 5, b: 40, w: 15, z: 1 }, { id: 'tc-palm2', x: 20, b: 41, w: 14, z: 1 }, { id: 'tc-palm3', x: 34, b: 40, w: 14, z: 1 }, { id: 'tc-arch', x: 50, b: 41, w: 15, z: 1 },
    { id: 'tc-palm', x: 65, b: 40, w: 15, z: 1, flip: true }, { id: 'tc-palm2', x: 79, b: 41, w: 14, z: 1 }, { id: 'tc-palm3', x: 93, b: 40, w: 15, z: 1, flip: true },
    { id: 'tc-cottage', x: 13, b: 35, w: 16, z: 2 }, { id: 'tc-tent', x: 86, b: 35, w: 15, z: 2 }, { id: 'tc-lantern', x: 28, b: 31, w: 4.5, z: 2 },
    { id: 'tc-bush', x: 2, b: -1, w: 14, z: 4 }, { id: 'tc-flowers', x: 18, b: 1, w: 9, z: 4, sway: 3 }, { id: 'tc-seagrass', x: 33, b: -3, w: 13, z: 4, sway: 2 },
    { id: 'tc-sandcastle', x: 64, b: 2, w: 10, z: 4 }, { id: 'tc-boards', x: 76, b: 2, w: 8, z: 4 }, { id: 'tc-boulder', x: 90, b: 1, w: 11, z: 4 }, { id: 'tc-bush', x: 104, b: -3, w: 14, z: 4, flip: true },
  ],
};
const GROTTO: Def = {
  sky: 'linear-gradient(180deg,#02080f 0%,#07303f 44%,#14788c 60%,#9ff0ff 67%)', ground: 'tc-cave', groundK: 26, groundTint: 'rgba(0,30,50,.16)', fx: 'fireflies',
  strips: [{ id: 'tc-crystal-glow', x: 26, b: 30, w: 8, fw: 184, fh: 168, n: 6, fps: 5, z: 3 }, { id: 'tc-crystal-glow', x: 72, b: 30, w: 8, fw: 184, fh: 168, n: 6, fps: 5, z: 3 },
    { id: 'tc-bubbles', x: 45, b: 22, w: 10, fw: 183, fh: 164, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'tc-spire', x: 6, b: 40, w: 11, z: 1 }, { id: 'tc-pillar', x: 20, b: 41, w: 9, z: 1 }, { id: 'tc-spire', x: 36, b: 40, w: 11, z: 1, flip: true }, { id: 'tc-cave-door', x: 52, b: 41, w: 19, z: 1 },
    { id: 'tc-spire', x: 68, b: 40, w: 11, z: 1, flip: true }, { id: 'tc-pillar', x: 82, b: 41, w: 9, z: 1 }, { id: 'tc-spire', x: 95, b: 40, w: 11, z: 1 },
    { id: 'tc-crystal', x: 6, b: 1, w: 10, z: 4 }, { id: 'tc-rocks', x: 21, b: 1, w: 9, z: 4 }, { id: 'tc-crystal', x: 76, b: 2, w: 9, z: 4, flip: true },
    { id: 'tc-boulder', x: 88, b: 0, w: 12, z: 4 }, { id: 'tc-crystal', x: 101, b: -2, w: 12, z: 4 },
  ],
};
const DEFS: Record<SceneKind, Def> = { village: VILLAGE, valley: VALLEY, arena: ARENA, ruins: RUINS, caverns: CAVERNS, grove: GROVE, roots: ROOTS, sand: SAND, tomb: TOMB, frost: FROST, frostcave: FROSTCAVE, coast: COAST, grotto: GROTTO };
const dots = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 11) % 100, y: 8 + ((i * 53 + 7) % 70), d: 4 + (i % 5) * 1.3, s: 0.5 + (i % 4) * 0.25 }));

export function EncounterScene({ kind }: { kind: SceneKind }) {
  const d = DEFS[kind];
  return (
    <div className={`mq-scene mq-scene-${kind}`} aria-hidden="true">
      <div className="mq-scene-sky" style={{ background: d.sky }} />
      <div className="mq-scene-sun" />
      {d.items.filter((i) => (i.z ?? 1) <= 3).map((i, k) => <Obj key={'b' + k} i={i} />)}
      {d.strips.filter((s) => (s.z ?? 1) <= 3).map((s, k) => <StripObj key={'sb' + k} s={s} />)}
      <div className="mq-scene-ground" style={{ backgroundImage: `url(${BASE}ground/${d.ground}.jpg)`, backgroundSize: `calc(${d.groundK} * var(--u)) auto` }}><div style={{ position: 'absolute', inset: 0, background: d.groundTint }} /></div>
      <div className="mq-scene-fx">{dots.map((p, k) => <i key={k} className={`mq-fx-${d.fx}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${p.d} * var(--u))`, height: `calc(${p.d} * var(--u))`, animationDelay: `${-k * 0.7}s`, animationDuration: `${5 + (k % 5)}s` }} />)}</div>
      {d.items.filter((i) => (i.z ?? 1) > 3).map((i, k) => <Obj key={'f' + k} i={i} />)}
      {d.strips.filter((s) => (s.z ?? 1) > 3).map((s, k) => <StripObj key={'sf' + k} s={s} />)}
    </div>
  );
}
function Obj({ i }: { i: Item }) {
  return (
    <div className="mq-scene-obj" style={{ left: `${i.x}%`, bottom: `${i.b}%`, width: `calc(${i.w} * var(--u))`, zIndex: i.z ?? 1 }}>
      <img src={`${BASE}sprites/${i.id}.webp`} alt="" draggable={false} className={i.sway ? 'mq-scene-sway' : undefined} style={{ transform: i.flip ? 'scaleX(-1)' : undefined, animationDuration: `${3 + (i.sway ?? 0) * 0.9}s`, animationDelay: `${-(i.x % 7) * 0.5}s` }} />
    </div>
  );
}
function StripObj({ s }: { s: Strip }) {
  const style = { left: `${s.x}%`, bottom: `${s.b}%`, width: `calc(${s.w} * var(--u))`, aspectRatio: `${s.fw} / ${s.fh}`, zIndex: s.z ?? 1, backgroundImage: `url(${BASE}anim/${s.id}.webp)`, '--w': `calc(${s.w} * var(--u))`, '--n': s.n, animationDuration: `${s.n / s.fps}s` } as CSSProperties;
  return <div className="mq-scene-obj mq-scene-strip" style={style} />;
}
