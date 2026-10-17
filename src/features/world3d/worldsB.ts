import * as THREE from 'three';
import { PATH_W, SEG, ball, box, canvasTex, cone, cyl, group, makeFlakes, plane, torus, type SegCtx } from './common';
import { pathAndGround, type WorldDef } from './build';
import { balloon, flagPole, floatIsland, flowers, lamp, palm, pine, rock, tree, waterPlane, waterfall } from './props';
import { GLOW } from '../avatar/kit';

const rnd = (r: () => number, a: number, b: number) => a + r() * (b - a);
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];
const side = (r: () => number) => (r() < 0.5 ? -1 : 1);

// =================================================================== 4. Keep Going (snowy mountains)
function snowman(p: THREE.Object3D, x: number, z: number, s = 1) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  ball(g, 1.5, '#FFFFFF', 0, 1.3, 0, 1, 0.95, 1);
  ball(g, 1.1, '#FFFFFF', 0, 3.1, 0);
  ball(g, 0.8, '#FFFFFF', 0, 4.4, 0);
  cyl(g, 0.55, 0.55, 0.9, '#23232F', 0, 5.4, 0, 14);
  cyl(g, 0.95, 0.95, 0.15, '#23232F', 0, 4.95, 0, 14);
  torus(g, 0.75, 0.2, '#E8453C', 0, 3.7, 0).rotation.x = Math.PI / 2;
  cone(g, 0.15, 0.9, '#FF8A1F', 0, 4.4, 0.85, 6, { rx: Math.PI / 2 });
  for (const sx of [-0.25, 0.25]) ball(g, 0.09, '#23232F', sx, 4.6, 0.7);
  for (const sx of [-1, 1]) box(g, 1.6, 0.14, 0.14, '#6B4223', sx * 1.5, 3.4, 0, { rz: sx * 0.4 });
  for (let i = 0; i < 3; i++) ball(g, 0.1, '#23232F', 0, 3.4 - i * 0.5, 0.95);
}

function cabin(ctx: SegCtx, x: number, z: number, face: 1 | -1) {
  const { s } = ctx;
  const g = group(s, x, 0, z);
  const w = 9, d = 11, h = 6;
  for (let i = 0; i < 8; i++) box(g, w, 0.78, d, i % 2 ? '#8A5A33' : '#7A4B24', 0, 0.4 + i * 0.75, 0, { r: 0.25 });
  const rh = 5;
  const a = Math.atan2(rh, w / 2);
  const len = Math.hypot(w / 2, rh) + 0.8;
  for (const sd of [-1, 1]) {
    box(g, len, 0.7, d + 1.6, '#6B4223', sd * (w / 4), h + rh / 2 + 0.1, 0, { r: 0.12, rz: -sd * a });
    box(g, len * 0.96, 0.7, d + 1.5, '#F4F9FF', sd * (w / 4), h + rh / 2 + 0.6, 0, { r: 0.3, rz: -sd * a });
  }
  for (let k = 0; k < 4; k++) box(g, w * (1 - (k + 0.5) / 4), rh / 4, d, '#7A4B24', 0, h + (k + 0.5) * (rh / 4), 0, { r: 0.05 });
  box(g, 1.4, 5, 1.4, '#8A5A33', w * 0.25, h + 3.5, -d * 0.25, { r: 0.1 });
  box(g, 1.8, 0.7, 1.8, '#F4F9FF', w * 0.25, h + 6.2, -d * 0.25, { r: 0.3 });
  for (const wz of [-3, 3]) {
    box(g, 0.2, 2, 1.8, '#4A3220', face * (w / 2 + 0.05), 3.2, wz, { r: 0.05 });
    box(g, 0.15, 1.6, 1.4, '#FFD98A', face * (w / 2 + 0.12), 3.2, wz, { r: 0.05, m: { emissive: '#FFC060', ei: 0.9 } });
  }
  box(g, 0.25, 3.2, 2, '#4A3220', face * (w / 2 + 0.07), 1.6, 0, { r: 0.05 });
  // smoke puffs (animated)
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const m = ball(ctx.a, 0.9, '#F4F6FA', x + w * 0.25, 0, z - d * 0.25, 1, 1, 1, { m: { rough: 1, opacity: 0.7 } });
    puffs.push(m);
  }
  ctx.anim((t) => {
    puffs.forEach((m, i) => {
      const u = (t * 0.18 + i / 5) % 1;
      m.position.y = h + 7 + u * 8;
      m.position.x = x + w * 0.25 + Math.sin(u * 5 + i) * 0.8 + u * 2;
      m.scale.setScalar(0.5 + u * 1.5);
      (m.material as THREE.MeshStandardMaterial).opacity = 0.75 * (1 - u);
    });
  });
}

function gondolaLine(ctx: SegCtx, x: number) {
  const { s } = ctx;
  const y = 22;
  for (const z of [-6, -30]) {
    box(s, 1.2, y, 1.2, '#6B7A94', x, y / 2, z, { r: 0.2 });
    box(s, 4.2, 0.8, 1, '#6B7A94', x, y, z, { r: 0.1 });
  }
  box(s, 0.18, 0.18, SEG + 2, '#2B2B3A', x, y + 0.2, -SEG / 2, { shadow: false });
  const cab = group(ctx.a, x, y - 2.8, 0);
  box(cab, 0.12, 2.6, 0.12, '#2B2B3A', 0, 2.6, 0);
  box(cab, 3.4, 2.8, 3.4, '#3D7BFF', 0, 1.0, 0, { r: 0.3 });
  box(cab, 3.5, 0.8, 3.5, '#9FD3F2', 0, 1.3, 0, { r: 0.15, m: { rough: 0.15, emissive: '#7FB8E0', ei: 0.3 } });
  box(cab, 3.6, 0.5, 3.6, '#F4F9FF', 0, 2.4, 0, { r: 0.2 });
  const sp = 5 + ctx.i * 0.4;
  ctx.anim((t, dt) => {
    cab.position.z += dt * sp;
    if (cab.position.z > 8) cab.position.z = -SEG - 8;
    cab.rotation.x = Math.sin(t * 1.7) * 0.05;
  });
}

function snowSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  pathAndGround(ctx, { ground: '#F3F8FF', path: '#DCE8F7', edge: '#B8CCE6', tile: (c, r) => ['#E6EFFA', '#D4E3F4', '#ECF3FC'][(c * 2 + r * 5 + ctx.i) % 3] });
  // icy patches and snow mounds
  for (let i = 0; i < 3; i++) box(s, rnd(rng, 4, 8), 0.1, rnd(rng, 3, 6), '#BFE3FF', rnd(rng, -3.5, 3.5), 0.03, -rnd(rng, 4, 44), { r: 0.05, m: { rough: 0.1, metal: 0.2 } });
  for (let i = 0; i < 6; i++) {
    const sd = side(rng);
    box(s, rnd(rng, 6, 14), rnd(rng, 1.5, 4), rnd(rng, 6, 12), '#FFFFFF', sd * rnd(rng, 12, 40), 0.3, -rnd(rng, 2, 46), { r: 1.1 });
  }
  for (const sd of [-1, 1] as const) {
    for (let k = 0; k < (ctx.low ? 5 : 9); k++) pine(s, sd * rnd(rng, 11, 42), -rnd(rng, 1, 47), rnd(rng, 0.9, 1.7), true, pick(rng, ['#2F7D4A', '#2A6E43', '#38905A']));
    for (let z = -4; z > -SEG; z -= 12) {
      box(s, 0.4, 2.2, 0.4, '#8A5A33', sd * 6.9, 1.1, z, { r: 0.08 });
      if (z < -4) box(s, 0.25, 0.3, 12, '#A06A3C', sd * 6.9, 1.8, z + 6, { r: 0.05 });
      box(s, 0.6, 0.3, 0.6, '#FFFFFF', sd * 6.9, 2.3, z, { r: 0.1 });
    }
  }
  const cs = ctx.i % 2 === 0 ? -1 : 1;
  cabin(ctx, cs * 19, -rnd(rng, 12, 36), (cs === -1 ? 1 : -1) as 1 | -1);
  snowman(s, -side(rng) * 8.6, -rnd(rng, 8, 40), 1.1);
  // ice pond
  box(s, 14, 0.3, 11, '#FFFFFF', -cs * 24, 0, -rnd(rng, 10, 38), { r: 0.4 });
  box(s, 12, 0.2, 9, '#8FD0FF', -cs * 24, 0.2, -24, { r: 0.3, m: { rough: 0.08, metal: 0.25, emissive: '#6FB4FF', ei: 0.15 } });
  gondolaLine(ctx, -cs * 14);
  rock(s, side(rng) * rnd(rng, 15, 30), -rnd(rng, 4, 44), 1.5, '#9AA8BF', '#8795AC');
}

function snowBackdrop(ctx: SegCtx) {
  const { s, a } = ctx;
  const peaks = [[-150, 62, 120], [-90, 80, 150], [-30, 92, 190], [40, 76, 160], [100, 90, 200], [160, 70, 130], [10, 60, 110], [-190, 55, 100]];
  peaks.forEach(([x, h, w], i) => {
    cone(s, w * 0.62, h, '#8FA4C8', x, h / 2 - 2, -230 - (i % 3) * 26, 4, { ry: Math.PI / 4 + i * 0.1 });
    cone(s, w * 0.62 * 0.42, h * 0.42, '#FFFFFF', x, h * 0.8 - 2, -230 - (i % 3) * 26, 4, { ry: Math.PI / 4 + i * 0.1 });
  });
  // ski lodge
  const g = group(s, 36, 0, -150);
  box(g, 34, 14, 20, '#8A5A33', 0, 7, 0, { r: 0.5 });
  box(g, 38, 3, 24, '#F4F9FF', 0, 15.5, 0, { r: 0.8 });
  box(g, 24, 12, 18, '#F4F9FF', 0, 21, 0, { r: 1.2 });
  for (let i = -3; i <= 3; i++) box(g, 3, 3.4, 0.3, '#FFD98A', i * 4.2, 8, 10.2, { r: 0.1, m: { emissive: '#FFC060', ei: 0.9 } });
  for (let i = 0; i < 9; i++) pine(s, -40 + (i % 4) * 8 + (i > 4 ? 90 : 0), -140 - (i % 3) * 12, 2, true);
  floatIsland(ctx, 0, 0, 0, 0.001); // keeps the animation hook count consistent
  void a;
}

export const SNOW_WORLD: WorldDef = {
  id: 'keep-going',
  title: 'Keep Going',
  signLines: ['Keep', 'Going'],
  sky: { top: '#4F9CEE', mid: '#9CCBFF', horizon: '#EAF5FF', fog: '#E4F1FF', fogNear: 80, fogFar: 260 },
  light: { sky: '#D4E8FF', ground: '#FFFFFF', hemi: 1.25, sun: '#FFF6E0', sunI: 2.4, sunPos: [-14, 26, 16] },
  sunDisc: { color: '#FFF6C8', size: 50, pos: [-240, 300, -480] },
  segment: snowSegment,
  backdrop: snowBackdrop,
  ambient: (ctx, add) => {
    const fl = makeFlakes(ctx.rng, ctx.low ? 160 : 420, { color: '#FFFFFF', size: 0.55, fall: 3.2, area: [45, 34, 70] });
    add(fl.pts, fl.update);
  },
};

// =================================================================== 5. Big Dreams (castle kingdom)
const PASTEL = ['#FFB3D9', '#B8F0D8', '#FFE699', '#CDB8FF', '#FFC9A8', '#B3D9FF'];
let crownTex: THREE.Texture | null = null;
function crownBanner() {
  crownTex ??= canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#E8457C';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFC83D';
    g.beginPath();
    g.moveTo(24, 150); g.lineTo(24, 100); g.lineTo(48, 124); g.lineTo(64, 90); g.lineTo(80, 124); g.lineTo(104, 100); g.lineTo(104, 150); g.closePath(); g.fill();
    g.fillRect(24, 150, 80, 14);
    g.fillStyle = '#FFE9A0';
    g.fillRect(0, h - 28, w, 28);
  });
  return crownTex;
}

function banner(ctx: SegCtx, x: number, z: number) {
  box(ctx.s, 0.3, 10, 0.3, '#6B4A2B', x, 5, z, { r: 0.1 });
  box(ctx.s, 2.6, 0.3, 0.3, '#6B4A2B', x + (x < 0 ? 1.3 : -1.3), 9.8, z, { r: 0.1 });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), new THREE.MeshStandardMaterial({ map: crownBanner(), side: THREE.DoubleSide, roughness: 0.8 }));
  cloth.position.set(x + (x < 0 ? 1.3 : -1.3), 7, z);
  ctx.a.add(cloth);
  const ph = x + z;
  ctx.anim((t) => {
    cloth.rotation.y = Math.sin(t * 2.2 + ph) * 0.25;
    cloth.rotation.z = Math.sin(t * 1.7 + ph) * 0.05;
  });
}

function dreamSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  pathAndGround(ctx, { ground: '#7CD65F', path: '#F4EEFF', edge: '#FFFFFF', tile: (c, r) => PASTEL[(c * 2 + r + ctx.i * 3) % 6] });
  for (const sd of [-1, 1] as const) {
    for (let z = -2; z > -SEG; z -= 6) {
      box(s, 0.45, 2.4, 0.45, '#8A5A33', sd * 6.4, 1.2, z, { r: 0.1 });
      ball(s, 0.38, '#FFD98A', sd * 6.4, 2.7, z, 1, 1, 1, { m: { emissive: '#FFD98A', ei: 0.9 } });
      box(s, 0.12, 0.12, 6, '#FFC9D9', sd * 6.4, 1.8, z - 3, { shadow: false });
    }
    banner(ctx, sd * 8.2, -14);
    banner(ctx, sd * 8.2, -38);
    for (let k = 0; k < 4; k++) tree(s, sd * rnd(rng, 14, 34), -rnd(rng, 3, 46), rnd(rng, 0.9, 1.4), pick(rng, ['#55C26A', '#7BD65F', '#3DAE63']), '#3DAE63');
    flowers(s, rng, sd * 10.5, -rnd(rng, 4, 44), 12, 5);
    flowers(s, rng, sd * 14, -rnd(rng, 4, 44), 10, 6);
    for (let k = 0; k < 3; k++) ball(s, rnd(rng, 1.2, 2), pick(rng, ['#55C26A', '#3DAE63']), sd * rnd(rng, 9, 22), -rnd(rng, 3, 45), 1, 0.8, 1);
  }
  floatIsland(ctx, rnd(rng, 18, 34) * -1, rnd(rng, 18, 30), -rnd(rng, 6, 40), rnd(rng, 5, 8), { tree: true, waterfall: true });
  floatIsland(ctx, rnd(rng, 18, 36), rnd(rng, 22, 38), -rnd(rng, 6, 40), rnd(rng, 4, 7), { house: rng() < 0.6, tree: true, waterfall: rng() < 0.5 });
  if (!ctx.low) floatIsland(ctx, rnd(rng, -50, 50), rnd(rng, 40, 60), -rnd(rng, 30, 46), rnd(rng, 4, 6), { tree: true });
}

function castle(ctx: SegCtx, x: number, z: number, sc = 1) {
  const { s, a } = ctx;
  const g = group(s, x, 0, z);
  g.scale.setScalar(sc);
  const wall = '#CFCFE0';
  box(g, 64, 22, 16, wall, 0, 11, 0, { r: 0.6 });
  for (let i = -15; i <= 15; i++) if (i % 2 === 0) box(g, 2.2, 2.6, 2.2, wall, i * 2, 23.4, 7, { r: 0.2 });
  const tower = (tx: number, th: number, tw: number, roofH: number) => {
    box(g, tw, th, tw, '#E3E3F2', tx, th / 2, 2, { r: 0.6 });
    box(g, tw + 2, 2, tw + 2, '#BDBDD2', tx, th, 2, { r: 0.3 });
    cone(g, tw * 0.82, roofH, '#8A4FD6', tx, th + roofH / 2 + 0.5, 2, 4, { ry: Math.PI / 4 });
    ball(g, 0.7, '#FFC83D', tx, th + roofH + 1.5, 2);
    for (const wy of [th * 0.45, th * 0.72]) box(g, 1.8, 3, 0.4, '#FFD98A', tx, wy, 2 + tw / 2 + 0.1, { r: 0.1, m: { emissive: '#FFC060', ei: 0.8 } });
  };
  tower(-30, 34, 10, 18);
  tower(30, 34, 10, 18);
  tower(-14, 40, 9, 20);
  tower(14, 40, 9, 20);
  tower(0, 52, 14, 28);
  box(g, 12, 15, 2, '#2A1A3A', 0, 7.5, 8.2, { r: 0.4 });
  for (let i = -2; i <= 2; i++) box(g, 0.4, 14, 0.4, '#FFC83D', i * 2, 7.5, 9.3, { r: 0.1, m: { metal: 0.5, rough: 0.3 } });
  for (const bx of [-9, 9]) {
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(4, 10), new THREE.MeshStandardMaterial({ map: crownBanner(), side: THREE.DoubleSide }));
    cl.position.set(x + bx * sc, 12 * sc, z + 8.4 * sc);
    cl.scale.setScalar(sc);
    a.add(cl);
    ctx.anim((t) => (cl.rotation.y = Math.sin(t * 2 + bx) * 0.12));
  }
}

function dreamBackdrop(ctx: SegCtx) {
  const { s } = ctx;
  castle(ctx, 0, -190, 1.15);
  for (const sd of [-1, 1] as const) {
    const isl = floatIsland(ctx, sd * 80, 46, -165, 18, { tree: true, top: '#7CD65F' });
    waterfall(ctx, sd * 80 + 8, 6, -163, 5, 60);
    void isl;
    box(s, 14, 40, 14, '#B0B0C6', sd * 110, 20, -150, { r: 1 });
    waterfall(ctx, sd * 104.2, 22, -140, 7, 40, Math.PI / 2);
    balloon(ctx, sd * 55, 70 + sd * 6, -120, 2.4, sd === 1 ? '#E8457C' : '#8A4FD6', '#FFFFFF');
  }
  waterPlane(ctx, 260, 40, 0, -2, -170, '#58B8F5', '#E0F4FF', [0.02, 0.0]);
  for (let i = 0; i < 18; i++) tree(s, (i - 9) * 22, -150, 1.8, '#55C26A', '#3DAE63');
}

export const DREAM_WORLD: WorldDef = {
  id: 'big-dreams',
  title: 'Big Dreams',
  signLines: ['Big', 'Dreams'],
  sky: { top: '#3E8EF0', mid: '#8CC6FF', horizon: '#FFE3F1', fog: '#EAE4FF', fogNear: 100, fogFar: 300 },
  light: { sky: '#D8E8FF', ground: '#FFE0F0', hemi: 1.2, sun: '#FFF1DC', sunI: 2.5, sunPos: [12, 26, 14] },
  sunDisc: { color: '#FFF3B8', size: 55, pos: [220, 300, -480] },
  clouds: { count: 16, y: [35, 90] },
  segment: dreamSegment,
  backdrop: dreamBackdrop,
  ambient: (ctx, add) => {
    const fl = makeFlakes(ctx.rng, ctx.low ? 30 : 80, { color: '#FFD8F0', size: 1.1, fall: -0.8, additive: true, area: [34, 24, 70] });
    add(fl.pts, fl.update);
  },
};

// =================================================================== 6. Be Brave (pirate cove)
let skullTex: THREE.Texture | null = null;
function skullSail() {
  skullTex ??= canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = '#1B1B24';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#F4F4F4';
    g.beginPath(); g.arc(w / 2, h / 2 - 18, 52, 0, Math.PI * 2); g.fill();
    g.fillRect(w / 2 - 30, h / 2 + 20, 60, 36);
    g.fillStyle = '#1B1B24';
    g.beginPath(); g.arc(w / 2 - 20, h / 2 - 22, 13, 0, Math.PI * 2); g.arc(w / 2 + 20, h / 2 - 22, 13, 0, Math.PI * 2); g.fill();
    g.fillRect(w / 2 - 4, h / 2 + 6, 8, 12);
    for (let i = 0; i < 4; i++) g.fillRect(w / 2 - 24 + i * 16, h / 2 + 38, 6, 18);
    g.strokeStyle = '#F4F4F4';
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(40, h - 90); g.lineTo(w - 40, h - 20); g.moveTo(w - 40, h - 90); g.lineTo(40, h - 20); g.stroke();
  });
  return skullTex;
}

function pirateShip(ctx: SegCtx, x: number, z: number, sc: number) {
  const g = group(ctx.a, x, 0, z);
  g.scale.setScalar(sc);
  const hull = group(g, 0, 0, 0);
  box(hull, 10, 5, 34, '#6B4223', 0, 1.5, 0, { r: 1.2 });
  box(hull, 8, 2.4, 10, '#7A4B24', 0, 4.4, -13, { r: 0.5 });
  box(hull, 6, 4, 10, '#8A5A33', 0, 5.0, 14, { r: 0.5 });
  cone(hull, 3.2, 10, '#6B4223', 0, 3.5, 21, 4, { rx: Math.PI / 2, ry: Math.PI / 4 });
  box(hull, 10.6, 0.7, 34.6, '#3A2B22', 0, 3.4, 0, { r: 0.2 });
  for (let i = -6; i <= 6; i += 3) ball(hull, 0.6, '#23232F', 5.1, 2.6, i, 1, 1, 1);
  const sailMat = new THREE.MeshStandardMaterial({ map: skullSail(), side: THREE.DoubleSide, roughness: 0.9 });
  for (const mz of [-4, 7]) {
    box(hull, 0.9, 30, 0.9, '#5A3516', 0, 18, mz, { r: 0.2 });
    box(hull, 15, 0.7, 0.7, '#5A3516', 0, 28, mz, { r: 0.1 });
    box(hull, 18, 0.7, 0.7, '#5A3516', 0, 17, mz, { r: 0.1 });
    plane(hull, 14, 10, sailMat, 0, 22.5, mz + 0.2);
    plane(hull, 16, 11, sailMat, 0, 11.4, mz + 0.2);
  }
  box(hull, 0.3, 4, 0.3, '#2B2B3A', 0, 33, -4);
  const flag = plane(hull, 5, 2.4, new THREE.MeshStandardMaterial({ color: '#1B1B24', side: THREE.DoubleSide }), 2.8, 33, -4);
  ctx.anim((t) => {
    hull.rotation.z = Math.sin(t * 0.9) * 0.045;
    hull.rotation.x = Math.sin(t * 0.7 + 1) * 0.02;
    hull.position.y = Math.sin(t * 0.8) * 0.5;
    flag.rotation.y = Math.sin(t * 5) * 0.3;
  });
}

function seagull(ctx: SegCtx, cx: number, cy: number, cz: number, r: number, sp: number, ph: number) {
  const g = group(ctx.a, cx, cy, cz);
  box(g, 0.9, 0.5, 1.8, '#FFFFFF', 0, 0, 0, { r: 0.2 });
  const wl = group(g, -0.4, 0.1, 0);
  const wr = group(g, 0.4, 0.1, 0);
  box(wl, 2.4, 0.15, 0.9, '#F4F4F4', -1.2, 0, 0, { r: 0.05 });
  box(wr, 2.4, 0.15, 0.9, '#F4F4F4', 1.2, 0, 0, { r: 0.05 });
  ctx.anim((t) => {
    const a = t * sp + ph;
    g.position.set(cx + Math.cos(a) * r, cy + Math.sin(t * 0.7 + ph) * 2, cz + Math.sin(a) * r * 0.7);
    g.rotation.y = -a + Math.PI;
    wl.rotation.z = Math.sin(t * 7 + ph) * 0.5;
    wr.rotation.z = -Math.sin(t * 7 + ph) * 0.5;
  });
}

function pirateSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  // sea
  waterPlane(ctx, 140, SEG, 0, -1.6, -SEG / 2, '#2E9BE8', '#CDEBFF', [0.03, 0.045]);
  // pier planks
  for (let r = 0; r < Math.round(SEG / 1.8); r++) box(s, PATH_W, 0.4, 1.62, r % 2 ? '#B56B35' : '#A35F2D', 0, -0.2, -0.9 - r * 1.8, { r: 0.06 });
  for (const sd of [-1, 1] as const) {
    for (let z = -2; z > -SEG; z -= 6) {
      box(s, 0.7, 7, 0.7, '#6B4223', sd * 5.3, 1.6, z, { r: 0.12 });
      box(s, 0.9, 0.5, 0.9, '#4A2F18', sd * 5.3, 5.2, z, { r: 0.1 });
      ball(s, 0.35, '#FFD98A', sd * 5.3, 5.7, z, 1, 1, 1, { m: { emissive: '#FFC060', ei: 0.9 } });
      box(s, 0.15, 0.15, 6, '#E8D8B8', sd * 5.3, 3.8, z - 3, { shadow: false });
      box(s, 0.15, 0.15, 6, '#E8D8B8', sd * 5.3, 2.8, z - 3, { shadow: false });
    }
    // barrels and crates on the pier edge
    for (let k = 0; k < 2; k++) {
      const z = -rnd(rng, 4, 44);
      cyl(s, 1.0, 1.0, 2.2, '#8A5A33', sd * 4.2, 1.1, z, 14);
      cyl(s, 1.05, 1.05, 0.2, '#3A2B22', sd * 4.2, 0.5, z, 14);
      cyl(s, 1.05, 1.05, 0.2, '#3A2B22', sd * 4.2, 1.8, z, 14);
      box(s, 2, 2, 2, '#A06A3C', sd * 3.9, 1.0, z - 2.4, { r: 0.1, ry: 0.3 });
    }
    // small sand islands with palms
    if (rng() < 0.9) {
      const ix = sd * rnd(rng, 16, 30);
      const iz = -rnd(rng, 8, 40);
      cyl(s, rnd(rng, 5, 8), rnd(rng, 6, 9), 1.6, '#F0D79A', ix, -1.0, iz, 12);
      palm(s, ix, iz, rnd(rng, 1.1, 1.5), ctx);
      if (rng() < 0.5) palm(s, ix + 2.5, iz + 1.5, 1, ctx);
    }
    // rocks sticking out of the water
    rock(s, sd * rnd(rng, 34, 60), -rnd(rng, 6, 44), 2.4, '#7C8798', '#6A7586');
  }
  // buoys
  for (let i = 0; i < 2; i++) {
    const b = group(ctx.a, rnd(rng, 8, 14) * side(rng), -1.2, -rnd(rng, 6, 44));
    cyl(b, 0.7, 0.9, 1.6, '#E8453C', 0, 0.4, 0, 12);
    cyl(b, 0.72, 0.72, 0.4, '#FFFFFF', 0, 0.5, 0, 12);
    const ph = rng() * 6;
    ctx.anim((t) => {
      b.position.y = -1.2 + Math.sin(t * 1.4 + ph) * 0.25;
      b.rotation.z = Math.sin(t * 1.1 + ph) * 0.12;
    });
  }
  if (ctx.i % 2 === 0) {
    // lookout hut on stilts with a flag
    const hx = -22;
    const hz = -22;
    for (const [px, pz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(s, 0.8, 7, 0.8, '#6B4223', hx + px, 2, hz + pz, { r: 0.1 });
    box(s, 7, 0.6, 7, '#8A5A33', hx, 5.6, hz, { r: 0.1 });
    box(s, 5.4, 4, 5.4, '#B5763F', hx, 8, hz, { r: 0.2 });
    cone(s, 4.8, 3.6, '#A33A32', hx, 11.8, hz, 4, { ry: Math.PI / 4 });
    box(s, 1.2, 1.4, 0.2, '#FFD98A', hx + 2.75, 8.2, hz, { m: { emissive: '#FFC060', ei: 0.9 } });
    flagPole(ctx, hx, hz, 17, null, '#E8453C', 3, 2);
  }
  seagull(ctx, rnd(rng, -20, 20), rnd(rng, 16, 28), -rnd(rng, 10, 38), rnd(rng, 6, 12), rnd(rng, 0.6, 1.2), rng() * 6);
}

function pirateBackdrop(ctx: SegCtx) {
  const { s } = ctx;
  pirateShip(ctx, -44, -95, 1.0);
  pirateShip(ctx, 70, -190, 1.5);
  waterPlane(ctx, 900, 560, 0, -1.7, -320, '#2E9BE8', '#CDEBFF', [0.02, 0.03]);
  const isl = group(s, 40, 0, -120);
  cyl(isl, 22, 26, 3, '#F0D79A', 0, -0.5, 0, 14);
  cyl(isl, 14, 18, 8, '#8A8F99', 6, 3, -4, 10);
  box(isl, 8, 6, 8, '#B5763F', -6, 5, 4, { r: 0.4 });
  cone(isl, 7.2, 5, '#A33A32', -6, 10.5, 4, 4, { ry: Math.PI / 4 });
  box(isl, 6, 18, 6, '#E8D8B8', 10, 12, -4, { r: 0.4 });
  cone(isl, 5, 5, '#E8453C', 10, 23.5, -4, 4, { ry: Math.PI / 4 });
  for (let i = 0; i < 6; i++) palm(isl, -14 + i * 5, 8 - (i % 2) * 6, 1.8, ctx);
  for (let i = 0; i < 10; i++) rock(s, (i - 5) * 60, -250 - (i % 3) * 20, 5 + (i % 3) * 2, '#7C8798', '#6A7586');
}

export const PIRATE_WORLD: WorldDef = {
  id: 'be-brave',
  title: 'Be Brave',
  signLines: ['Be', 'Brave'],
  sky: { top: '#3A93F2', mid: '#86C5FF', horizon: '#E6F4FF', fog: '#CFE8FF', fogNear: 90, fogFar: 300 },
  light: { sky: '#CFE6FF', ground: '#BFDFFF', hemi: 1.1, sun: '#FFF2D0', sunI: 2.8, sunPos: [16, 28, 14] },
  sunDisc: { color: '#FFF3B0', size: 55, pos: [250, 300, -480] },
  signPos: [-8.4, 4.2, 0],
  segment: pirateSegment,
  backdrop: pirateBackdrop,
};

export { SEG, GLOW, lamp };
