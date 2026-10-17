import * as THREE from 'three';
import { PATH_W, SEG, ball, box, canvasTex, cone, cyl, group, makeFlakes, plane, torus, windowTexture, type SegCtx } from './common';
import { pathAndGround, type WorldDef } from './build';
import { balloon, flagPole, floatIsland, flowers, house, lamp, palm, rock, torch, tree, waterPlane, cactus } from './props';
import { GLOW } from '../avatar/kit';

const rnd = (r: () => number, a: number, b: number) => a + r() * (b - a);
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];

function texBox(p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  p.add(mesh);
  return mesh;
}

// =================================================================== 1. English Village
let unionTex: THREE.Texture | null = null;
function unionFlag() {
  unionTex ??= canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#1D2F7A';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#FFFFFF';
    g.lineWidth = 34;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
    g.strokeStyle = '#D12A3A';
    g.lineWidth = 12;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
    g.fillStyle = '#FFFFFF';
    g.fillRect(w / 2 - 24, 0, 48, h);
    g.fillRect(0, h / 2 - 24, w, 48);
    g.fillStyle = '#D12A3A';
    g.fillRect(w / 2 - 14, 0, 28, h);
    g.fillRect(0, h / 2 - 14, w, 28);
  });
  return unionTex;
}

function clockFace() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#E8B94A';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFF8E7';
    g.beginPath(); g.arc(w / 2, h / 2, 108, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2B2B3A';
    g.lineWidth = 8;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * 88, h / 2 - Math.cos(a) * 88); g.lineTo(w / 2 + Math.sin(a) * 104, h / 2 - Math.cos(a) * 104); g.stroke();
    }
    g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 40, h / 2 - 30); g.stroke();
    g.lineWidth = 7;
    g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 8, h / 2 - 82); g.stroke();
  });
}

function englishSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  pathAndGround(ctx, { ground: '#6FC85A', path: '#B7B0A3', edge: '#8F8A7E', sidewalk: '#DCD6C9', tile: (c, r) => ['#C3BCAF', '#B3AC9F', '#CCC5B8'][(c * 5 + r * 3 + ctx.i) % 3] });
  // left side road with a bus
  box(s, 5.6, 0.3, SEG, '#4A4D57', -12.4, -0.15, -SEG / 2, { r: 0.1 });
  for (let z = 2; z < SEG; z += 6) box(s, 0.3, 0.06, 2.6, '#F4F0E0', -12.4, 0.02, -z, { r: 0.02 });
  for (const sd of [-1, 1]) box(s, 1.3, 1.2, SEG, '#4FB04A', sd * 9.9 + (sd === -1 ? -6.6 : 0), 0.3, -SEG / 2, { r: 0.4 });

  const walls = ['#B5543A', '#D98A5B', '#E8D8B8', '#C97B63', '#9AA9C4', '#E3B07A'];
  const roofs = ['#3E5C9A', '#4B4F63', '#A33A32', '#2F6F8F', '#6B4A7A'];
  for (let k = 0; k < 4; k++) {
    const z = -6.5 - k * 12;
    for (const sd of [-1, 1] as const) {
      const w = rnd(rng, 7, 10);
      const d = rnd(rng, 9, 11);
      const h = 7 + Math.floor(rng() * 4) * 2;
      const x = sd === 1 ? 12.4 + w / 2 : -(19.2 + w / 2);
      house(s, x, z, { w, d, h, wall: pick(rng, walls), roof: pick(rng, roofs), face: (sd === 1 ? -1 : 1) as 1 | -1, chimney: rng() < 0.6 });
    }
    lamp(ctx, 6.4, z + 4);
    lamp(ctx, -6.4, z + 4);
    if (rng() < 0.7) tree(s, rnd(rng, 30, 44) * (rng() < 0.5 ? -1 : 1), z, rnd(rng, 0.9, 1.3));
  }
  flagPole(ctx, 8.4, -14, 12, unionFlag());
  flagPole(ctx, -8.4, -34, 12, unionFlag());
  if (ctx.i % 2 === 0) {
    // red phone box
    const g = group(s, 8.6, 0, -26);
    box(g, 1.9, 3.8, 1.9, '#D62A2A', 0, 1.9, 0, { r: 0.1 });
    box(g, 2.1, 0.4, 2.1, '#D62A2A', 0, 3.9, 0, { r: 0.1 });
    box(g, 0.1, 2.4, 1.2, '#FFE9A8', -0.98, 2.0, 0, { m: { emissive: '#FFD98A', ei: 0.5 } });
    box(g, 1.2, 0.6, 0.1, '#FFFFFF', 0, 3.4, 0.98);
  }
  // benches
  box(s, 0.6, 0.5, 2.4, '#7A4B24', 8.2, 0.7, -41, { r: 0.1 });
  box(s, 0.2, 0.9, 2.4, '#7A4B24', 8.55, 1.2, -41, { r: 0.1 });
  flowers(s, rng, 11.2, -SEG / 2, 10, 20);
  rock(s, rnd(rng, 28, 40) * (rng() < 0.5 ? 1 : -1), rnd(rng, -SEG, -4), 1.6);

  // red double-decker bus driving by (animated)
  const bus = group(ctx.a, -12.4, 0.0, -10);
  box(bus, 3.4, 1.9, 9.8, '#D62A2A', 0, 1.5, 0, { r: 0.3 });
  box(bus, 3.4, 1.7, 9.4, '#D62A2A', 0, 3.5, 0, { r: 0.3 });
  for (let i = -3; i <= 3; i++) {
    box(bus, 3.5, 0.9, 0.9, '#9FD3F2', 0, 3.6, i * 1.25, { r: 0.1, m: { emissive: '#7FB8E0', ei: 0.3 } });
    if (i > -3) box(bus, 3.5, 0.8, 0.9, '#9FD3F2', 0, 1.7, i * 1.25, { r: 0.1 });
  }
  box(bus, 3.5, 0.5, 9.5, '#FFFFFF', 0, 2.4, 0, { r: 0.1 });
  for (const [wx, wz] of [[-1.5, 3.2], [1.5, 3.2], [-1.5, -3.2], [1.5, -3.2]]) cyl(bus, 0.7, 0.7, 0.5, '#23232F', wx, 0.7, wz, 12, { rz: Math.PI / 2 });
  const speed = 9 + ctx.i;
  ctx.anim((_t, dt) => {
    bus.position.z += dt * speed;
    if (bus.position.z > 14) bus.position.z = -SEG - 12;
  });
  if (rng() < 0.9) balloon(ctx, rnd(rng, 18, 36) * (rng() < 0.5 ? 1 : -1), rnd(rng, 28, 44), -rnd(rng, 4, 40), 1.1, pick(rng, ['#E8453C', '#3D7BFF', '#FFC83D']), '#FFFFFF');
}

function englishBackdrop(ctx: SegCtx) {
  const { s, a } = ctx;
  // clock tower
  const tower = group(s, -38, 0, -178);
  const stone = '#CDBA8E';
  box(tower, 15, 34, 15, stone, 0, 17, 0, { r: 0.6 });
  box(tower, 12, 26, 12, '#C2AE80', 0, 47, 0, { r: 0.5 });
  box(tower, 13.5, 14, 13.5, stone, 0, 67, 0, { r: 0.5 });
  const ft = clockFace();
  for (const [x, z, ry] of [[0, 6.9, 0], [0, -6.9, Math.PI], [6.9, 0, Math.PI / 2], [-6.9, 0, -Math.PI / 2]] as const) {
    plane(a, 10, 10, new THREE.MeshStandardMaterial({ map: ft, roughness: 0.6 }), -38 + x, 67, -178 + z, 0, ry);
  }
  cone(tower, 7.4, 26, '#3E5C7A', 0, 87, 0, 4, { ry: Math.PI / 4 });
  for (const [x, z] of [[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]]) cone(tower, 1.4, 8, '#3E5C7A', x, 74, z, 4);
  ball(tower, 1.1, '#FFC83D', 0, 101, 0);
  // bridge with two towers
  const br = group(s, 34, 0, -150);
  for (const x of [-12, 12]) {
    box(br, 9, 36, 9, '#9FB0C8', x, 18, 0, { r: 0.5 });
    cone(br, 6.4, 12, '#3E5C7A', x, 42, 0, 4, { ry: Math.PI / 4 });
    for (const dx of [-3.4, 3.4]) cone(br, 1.4, 5, '#3E5C7A', x + dx, 38, dx, 4);
  }
  box(br, 20, 3, 6, '#4F7BD6', 0, 30, 0, { r: 0.3 });
  box(br, 30, 2.4, 7, '#8A93A8', 0, 8, 0, { r: 0.3 });
  for (let i = -4; i <= 4; i++) box(br, 0.5, 5, 0.5, '#4F7BD6', i * 1.9, 33, 0);
  waterPlane(ctx, 340, 26, 0, -1.4, -150, '#3E8FD6', '#BFE6FF', [0.03, 0.0]);
  // flags on the bridge towers
  // far town
  for (let i = 0; i < 14; i++) {
    const x = (i - 7) * 18 + ((i * 7) % 5);
    if (Math.abs(x) < 20) continue;
    box(s, 11, 14 + (i % 4) * 4, 11, ['#B5543A', '#D98A5B', '#E8D8B8'][i % 3], x, 8, -200, { r: 0.4 });
    cone(s, 8, 6, '#4B4F63', x, 18 + (i % 4) * 2, -200, 4, { ry: Math.PI / 4 });
  }
  balloon(ctx, -62, 62, -130, 2.4, '#E8453C', '#FFFFFF');
  balloon(ctx, 58, 78, -200, 2.8, '#FFC83D', '#3D7BFF');
}

export const ENGLISH_VILLAGE: WorldDef = {
  id: 'english-village',
  title: 'English Village',
  signLines: ['English', 'Village'],
  sky: { top: '#3E8EF0', mid: '#7FC1FF', horizon: '#DDF0FF', fog: '#D3EAFF', fogNear: 90, fogFar: 270 },
  light: { sky: '#CFE6FF', ground: '#E8D8B8', hemi: 1.15, sun: '#FFF3D6', sunI: 2.6, sunPos: [-14, 28, 16] },
  sunDisc: { color: '#FFF3B0', size: 60, pos: [-260, 330, -480] },
  segment: englishSegment,
  backdrop: englishBackdrop,
};

// =================================================================== 2. Adventure Awaits
function guardian(p: THREE.Object3D, x: number, z: number, face: 1 | -1) {
  const g = group(p, x, 0, z);
  g.rotation.y = face === 1 ? Math.PI / 2 : -Math.PI / 2;
  box(g, 3.4, 1.6, 3.4, '#B98B4A', 0, 0.8, 0, { r: 0.2 });
  box(g, 2.0, 5.2, 1.4, '#D9B778', 0, 4.2, 0, { r: 0.3 });
  box(g, 2.6, 0.8, 1.6, '#E8B94A', 0, 6.4, 0, { r: 0.2, m: { rough: 0.3, metal: 0.5 } });
  box(g, 1.6, 1.7, 1.6, '#4A4A58', 0, 7.5, 0, { r: 0.35 });
  box(g, 0.8, 0.8, 1.2, '#3A3A48', 0, 7.2, 1.2, { r: 0.2 });
  for (const sx of [-0.5, 0.5]) cone(g, 0.3, 1.6, '#4A4A58', sx, 9.0, 0, 4);
  for (const sx of [-1.4, 1.4]) box(g, 0.6, 3.6, 0.7, '#D9B778', sx, 4.4, 0.3, { r: 0.2 });
}

function adventureSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  const sand = ['#D9B778', '#CFA966', '#E0C088'];
  pathAndGround(ctx, { ground: '#E8C98A', path: '#D9B778', edge: '#B98B4A', tile: (c, r) => sand[(c * 3 + r * 5 + ctx.i) % 3] });
  for (const sd of [-1, 1] as const) {
    box(s, 2.2, 2.4, SEG, '#C99B55', sd * 8.4, 1.0, -SEG / 2, { r: 0.3 });
    box(s, 2.4, 0.5, SEG, '#E0B96A', sd * 8.4, 2.3, -SEG / 2, { r: 0.15 });
    for (let k = 0; k < 4; k++) {
      const z = -6 - k * 12;
      box(s, 2.8, 7, 2.8, '#D9B778', sd * 8.4, 3.5, z, { r: 0.3 });
      box(s, 3.2, 0.8, 3.2, '#E8B94A', sd * 8.4, 7.2, z, { r: 0.2, m: { rough: 0.3, metal: 0.5 } });
      box(s, 3.0, 0.5, 3.0, '#B98B4A', sd * 8.4, 1.8, z, { r: 0.1 });
    }
    // water channel behind the wall
    box(s, 5, 1.2, SEG, '#C99B55', sd * 13.5, -0.7, -SEG / 2, { r: 0.2 });
    waterPlane(ctx, 3.6, SEG, sd * 13.5, -0.05, -SEG / 2, '#2FA9E8', '#D6F3FF', [0.0, sd * 0.05]);
    guardian(s, sd * 11.0, -24, (sd === 1 ? -1 : 1) as 1 | -1);
    torch(ctx, sd * 6.9, -24 + 3.6);
    torch(ctx, sd * 6.9, -24 - 3.6);
    palm(s, sd * rnd(rng, 18, 24), -rnd(rng, 6, 20), rnd(rng, 1.1, 1.5), ctx);
    palm(s, sd * rnd(rng, 17, 26), -rnd(rng, 28, 44), rnd(rng, 1.0, 1.4), ctx);
    cactus(s, sd * rnd(rng, 22, 34), -rnd(rng, 4, 44), rnd(rng, 0.9, 1.4));
    // stepped sandstone hills
    const hx = sd * rnd(rng, 32, 48);
    const hz = -rnd(rng, 8, 40);
    for (let t = 0; t < 4; t++) box(s, 22 - t * 5, 3.2, 20 - t * 4.5, ['#E0C088', '#D9B778', '#CFA966', '#C99B55'][t], hx, 1.0 + t * 3.1, hz, { r: 0.3 });
  }
  if (rng() < 0.9) floatIsland(ctx, rnd(rng, 18, 34) * (rng() < 0.5 ? -1 : 1), rnd(rng, 18, 30), -rnd(rng, 6, 40), rnd(rng, 4, 6), { tree: true, top: '#7CCB5A' });
  rock(s, rnd(rng, 20, 38) * (rng() < 0.5 ? 1 : -1), -rnd(rng, 4, 44), 1.4, '#B9A27A', '#A38C63');
}

function adventureBackdrop(ctx: SegCtx) {
  const { s, a } = ctx;
  const g = group(s, 0, 0, -200);
  const tiers = ['#E8CC95', '#E0C088', '#D9B778', '#CFA966', '#C99B55', '#BE8F4C'];
  for (let k = 0; k < 6; k++) box(g, 84 - k * 12.5, 9.5, 74 - k * 11, tiers[k], 0, 4.7 + k * 9.5, 0, { r: 0.5 });
  for (let k = 0; k < 11; k++) box(g, 16, 0.9, 4.2, k % 2 ? '#D9B778' : '#E0C088', 0, 0.45 + k * 0.9, 36 - k * 2.4, { r: 0.1 });
  box(g, 11, 15, 3.2, '#2A1A0E', 0, 8, 16, { r: 0.3 });
  box(g, 8.4, 12.6, 3.6, '#FF9A2E', 0, 7.2, 16.4, { r: 0.3, m: { emissive: '#FF8A1F', ei: 1.1, rough: 0.5 } });
  for (const sd of [-1, 1]) {
    box(g, 3.4, 18, 3.4, '#E8B94A', sd * 7.6, 9, 17, { r: 0.4, m: { metal: 0.4, rough: 0.35 } });
    for (let t = 0; t < 4; t++) box(g, 5 - t * 0.6, 3, 5 - t * 0.6, '#CFA966', sd * 38, 1.5 + t * 3.1, 28, { r: 0.4 });
    guardian(g, sd * 22, 38, (sd === 1 ? -1 : 1) as 1 | -1);
    g.children[g.children.length - 1].scale.setScalar(2.6);
    box(g, 12, 40, 12, '#D9B778', sd * 46, 20, 8, { r: 0.5 });
    box(g, 14, 3, 14, '#E8B94A', sd * 46, 40.5, 8, { r: 0.3, m: { metal: 0.4 } });
  }
  const glow = new THREE.PointLight('#FF9A2E', 0, 0);
  void glow;
  // far dunes
  for (let i = 0; i < 12; i++) box(s, 40, 5 + (i % 4) * 2, 30, i % 2 ? '#E8C98A' : '#E0BE7C', (i - 6) * 44, 1.2, -260, { r: 0.8 });
  const sunG = group(a, 120, 0, -150);
  floatIsland(ctx, -70, 52, -120, 9, { tree: true });
  floatIsland(ctx, 80, 62, -170, 11, { house: true });
  void sunG;
}

export const ADVENTURE_AWAITS: WorldDef = {
  id: 'adventure-awaits',
  title: 'Adventure Awaits',
  signLines: ['Adventure', 'Awaits'],
  sky: { top: '#2F86E8', mid: '#6FB8F5', horizon: '#FFE9BE', fog: '#F6E2B8', fogNear: 80, fogFar: 250 },
  light: { sky: '#CFE6FF', ground: '#F2D49B', hemi: 1.05, sun: '#FFE2A8', sunI: 2.9, sunPos: [16, 24, 12] },
  sunDisc: { color: '#FFE9A0', size: 70, pos: [220, 190, -480] },
  clouds: { count: 9, y: [60, 100] },
  signPos: [-13, 7.5, 0],
  segment: adventureSegment,
  backdrop: adventureBackdrop,
};

// =================================================================== 3. Explore Learn Grow (neon city)
const winMats: THREE.MeshStandardMaterial[] = [];
function windowMat(i: number) {
  if (!winMats.length) {
    const sets: string[][] = [['#6FF1FF', '#8A7BFF', '#FF6BD6'], ['#FFE76B', '#6FF1FF', '#B28BFF'], ['#6BFFB8', '#6FA8FF', '#FF8BC8']];
    sets.forEach((lit, k) => {
      const t = windowTexture('#141B4A', lit, 6, 18, 11 + k);
      winMats.push(new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#FFFFFF', emissiveIntensity: 0.95, roughness: 0.5 }));
    });
  }
  return winMats[i % winMats.length];
}

function skyscraper(ctx: SegCtx, x: number, z: number, w: number, d: number, h: number, neon: string) {
  const { s } = ctx;
  texBox(s, w, h, d, windowMat(Math.floor(Math.abs(x + z))), x, h / 2, z);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(s, 0.4, h, 0.4, neon, x + (dx * w) / 2, h / 2, z + (dz * d) / 2, { r: 0.1, m: GLOW });
  box(s, w + 0.6, 0.8, d + 0.6, neon, x, h, z, { r: 0.2, m: GLOW });
  box(s, w * 0.6, 2, d * 0.6, '#2A2F6B', x, h + 1.4, z, { r: 0.2 });
  box(s, 0.35, 7, 0.35, '#9FB0E8', x, h + 5.5, z);
  box(s, 0.9, 0.9, 0.9, '#FF4F7A', x, h + 9, z, { r: 0.3, m: GLOW });
}

function ufo(ctx: SegCtx, cx: number, cy: number, cz: number, r: number, speed: number, ph: number) {
  const g = group(ctx.a, cx, cy, cz);
  cyl(g, 1.4, 3.8, 0.9, '#C9D1E6', 0, 0, 0, 18, { m: { metal: 0.6, rough: 0.25 } });
  cyl(g, 3.8, 1.8, 0.7, '#8A93C8', 0, -0.7, 0, 18, { m: { metal: 0.6, rough: 0.3 } });
  ball(g, 1.7, '#7FE3FF', 0, 0.6, 0, 1, 0.85, 1, { m: { rough: 0.1, opacity: 0.7, emissive: '#4AE3FF', ei: 0.6 } });
  const lights = group(g, 0, -0.2, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ball(lights, 0.2, i % 2 ? '#FF4FD8' : '#4AE3FF', Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4, 1, 1, 1, { m: GLOW });
  }
  cone(g, 3.2, 14, '#9FE8FF', 0, -8, 0, 18, { rx: Math.PI, m: { rough: 0.5, opacity: 0.16, emissive: '#6FE3FF', ei: 0.8 } }).castShadow = false;
  ctx.anim((t) => {
    g.position.set(cx + Math.cos(t * speed + ph) * r, cy + Math.sin(t * 1.3 + ph) * 1.2, cz + Math.sin(t * speed + ph) * r * 0.6);
    g.rotation.z = Math.cos(t * speed + ph) * 0.12;
    lights.rotation.y = t * 2;
  });
}

function billboard(ctx: SegCtx, x: number, y: number, z: number, text: string, color: string, ry: number) {
  const tex = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#0A1450';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = color;
    g.font = '800 54px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3);
  });
  const m = plane(ctx.a, 12, 6, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), x, y, z, 0, ry);
  const ph = x + z;
  ctx.anim((t) => (m.position.y = y + Math.sin(t * 1.1 + ph) * 0.6));
}

function neonSegment(ctx: SegCtx) {
  const { s, a, rng } = ctx;
  pathAndGround(ctx, { ground: '#161338', path: '#232059', edge: '#4AE3FF', line: '#3A3799' });
  for (const sd of [-1, 1]) box(s, 0.3, 0.2, SEG, '#4AE3FF', sd * 4.9, 0.05, -SEG / 2, { r: 0.05, m: GLOW });
  const pulse = new THREE.MeshStandardMaterial({ color: '#2A1850', emissive: '#FF4FD8', emissiveIntensity: 1, roughness: 0.4 });
  for (let z = 4; z < SEG; z += 8) {
    for (const sx of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.5), pulse);
      c.position.set(sx * 1.4, 0.06, -z);
      c.rotation.y = sx * 0.6;
      a.add(c);
    }
  }
  ctx.anim((t) => (pulse.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.5));
  const neons = ['#4AE3FF', '#FF4FD8', '#8A7BFF', '#6BFFB8'];
  for (let k = 0; k < 3; k++) {
    const z = -8 - k * 15;
    for (const sd of [-1, 1] as const) {
      skyscraper(ctx, sd * rnd(rng, 17, 24), z, rnd(rng, 9, 13), rnd(rng, 9, 12), rnd(rng, 26, 60), pick(rng, neons));
      if (rng() < 0.6) skyscraper(ctx, sd * rnd(rng, 34, 50), z + rnd(rng, -4, 4), rnd(rng, 10, 16), rnd(rng, 10, 14), rnd(rng, 40, 85), pick(rng, neons));
    }
  }
  for (const sd of [-1, 1] as const) {
    box(s, 0.5, 6, 0.5, '#9FB0E8', sd * 6.6, 3, -10, { r: 0.1 });
    ball(s, 0.6, '#4AE3FF', sd * 6.6, 6.3, -10, 1, 1, 1, { m: GLOW });
    box(s, 0.5, 6, 0.5, '#9FB0E8', sd * 6.6, 3, -34, { r: 0.1 });
    ball(s, 0.6, '#FF4FD8', sd * 6.6, 6.3, -34, 1, 1, 1, { m: GLOW });
  }
  ufo(ctx, rnd(rng, -22, 22), rnd(rng, 26, 40), -rnd(rng, 14, 40), rnd(rng, 7, 13), rnd(rng, 0.5, 1.0), rng() * 6);
  if (!ctx.low) ufo(ctx, rnd(rng, -30, 30), rnd(rng, 34, 50), -rnd(rng, 8, 40), rnd(rng, 9, 16), rnd(rng, 0.3, 0.7), rng() * 6);
  billboard(ctx, -13, 15, -22, pick(rng, ['EXPLORE', 'LEARN', 'GROW', 'PLAY']), pick(rng, ['#4AE3FF', '#FF4FD8', '#6BFFB8']), 0.5);
  billboard(ctx, 13, 18, -38, pick(rng, ['ENGLISH', 'WORDS', 'DREAM', 'LEVEL UP']), pick(rng, ['#FFE76B', '#8A7BFF', '#4AE3FF']), -0.5);
  floatIsland(ctx, rnd(rng, 16, 28) * (rng() < 0.5 ? -1 : 1), rnd(rng, 12, 22), -rnd(rng, 6, 40), rnd(rng, 3.5, 5), { tree: true, top: '#2EE6D6', dirt: '#3A2A7A' });
}

function neonBackdrop(ctx: SegCtx) {
  const { s, a } = ctx;
  const neons = ['#4AE3FF', '#FF4FD8', '#8A7BFF'];
  for (let i = 0; i < 20; i++) {
    const x = (i - 10) * 15;
    const h = 40 + ((i * 37) % 70);
    texBox(s, 12, h, 12, windowMat(i), x, h / 2, -215 - (i % 3) * 14);
    box(s, 12.6, 0.8, 12.6, neons[i % 3], x, h, -215 - (i % 3) * 14, { r: 0.2, m: GLOW });
  }
  const ring = torus(a, 22, 1.2, '#4AE3FF', 0, 24, -160, Math.PI * 2, { m: GLOW });
  const ring2 = torus(a, 18, 0.8, '#FF4FD8', 0, 24, -160, Math.PI * 2, { m: GLOW });
  for (const sd of [-1, 1]) box(s, 2.4, 24, 2.4, '#2A2F6B', sd * 22, 12, -160, { r: 0.3 });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(70, 24, 16), new THREE.MeshBasicMaterial({ color: '#B28BFF', fog: false }));
  planet.position.set(-190, 230, -500);
  a.add(planet);
  ctx.anim((t) => {
    ring.rotation.z = t * 0.3;
    ring2.rotation.z = -t * 0.45;
  });
  ufo(ctx, -20, 70, -130, 20, 0.35, 0);
  ufo(ctx, 40, 90, -180, 24, 0.28, 2);
}

export const NEON_CITY: WorldDef = {
  id: 'explore-learn-grow',
  title: 'Explore Learn Grow',
  signLines: ['Explore', 'Learn', 'Grow'],
  signStyle: 'neon',
  sky: { top: '#16135E', mid: '#4B3FD0', horizon: '#79D4FF', fog: '#4E58C8', fogNear: 55, fogFar: 230, stars: 160 },
  light: { sky: '#8FA8FF', ground: '#4B2A8A', hemi: 1.0, sun: '#B9C8FF', sunI: 1.6, sunPos: [-10, 26, 14], exposure: 1.1 },
  bloom: 0.9,
  clouds: null,
  segment: neonSegment,
  backdrop: neonBackdrop,
  ambient: (ctx, add) => {
    const fl = makeFlakes(ctx.rng, ctx.low ? 40 : 90, { color: '#7FE3FF', size: 0.9, fall: -1.2, additive: true, area: [40, 40, 90] });
    add(fl.pts, fl.update);
  },
};

export { SEG, PATH_W };
