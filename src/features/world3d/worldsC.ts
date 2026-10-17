import * as THREE from 'three';
import { PATH_W, SEG, ball, box, canvasTex, cone, cyl, group, makeFlakes, plane, torus, type SegCtx } from './common';
import { pathAndGround, type WorldDef } from './build';
import { balloon, flagPole, flowers, lamp, rock, stall, tree, waterPlane, waterfall } from './props';
import { GLOW } from '../avatar/kit';

const rnd = (r: () => number, a: number, b: number) => a + r() * (b - a);
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];
const side = (r: () => number) => (r() < 0.5 ? -1 : 1);
const CANDY = ['#FF6B9A', '#FFC83D', '#3D9BFF', '#7BE0A5', '#B07BFF', '#FF8A3D'];

// =================================================================== 7. Play Learn Achieve (theme park)
function bunting(ctx: SegCtx, z: number, y = 7.5, w = 15) {
  const g = group(ctx.a, 0, y, z);
  box(g, w, 0.1, 0.1, '#3A2B22', 0, 0, 0, { shadow: false });
  const flags: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const f = cone(g, 0.5, 1.1, CANDY[i % CANDY.length], -w / 2 + 0.5 + i * ((w - 1) / 13), -0.6, 0, 3, { rx: Math.PI });
    flags.push(f);
  }
  ctx.anim((t) => flags.forEach((f, i) => (f.rotation.z = Math.sin(t * 3 + i * 0.7) * 0.18)));
}

function carousel(ctx: SegCtx, x: number, z: number) {
  const { s } = ctx;
  cyl(s, 5.4, 5.8, 0.8, '#FFC2DD', x, 0.4, z, 16);
  cyl(s, 5.0, 5.0, 0.2, '#FFFFFF', x, 0.9, z, 16);
  cone(s, 6.4, 3.4, '#FF6B9A', x, 8.4, z, 16);
  ball(s, 0.5, '#FFC83D', x, 10.4, z);
  cyl(s, 5.6, 5.6, 0.5, '#B07BFF', x, 6.4, z, 16);
  const spin = group(ctx.a, x, 0, z);
  cyl(spin, 0.7, 0.7, 6, '#FFD98A', 0, 3.4, 0, 10);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const h = group(spin, Math.cos(a) * 3.4, 0, Math.sin(a) * 3.4);
    h.rotation.y = -a;
    box(h, 0.2, 5, 0.2, '#FFD98A', 0, 3.4, 0, { shadow: false });
    box(h, 0.9, 1.1, 1.8, CANDY[i], 0, 2.2, 0, { r: 0.3 });
    box(h, 0.5, 0.9, 0.7, CANDY[i], 0, 3.0, 0.9, { r: 0.2 });
    ctx.anim((t) => (h.position.y = Math.sin(t * 2.4 + i * 1.1) * 0.5));
  }
  ctx.anim((t) => (spin.rotation.y = t * 0.8));
}

function themeSegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  const tiles = ['#FFC2DD', '#BDE0FF', '#FFF0A6', '#C8F5DD'];
  pathAndGround(ctx, { ground: '#7ED65F', path: '#F4EEFF', edge: '#FFFFFF', sidewalk: '#E8DFFF', tile: (c, r) => tiles[(c + r * 2 + ctx.i) % 4] });
  for (const sd of [-1, 1] as const) {
    lamp(ctx, sd * 6.6, -8, '#FFE08A', 6.5);
    lamp(ctx, sd * 6.6, -32, '#FFE08A', 6.5);
    stall(s, sd * 12.5, -rnd(rng, 10, 18), (sd === 1 ? 1 : -1) as 1 | -1, pick(rng, CANDY), '#FFFFFF');
    stall(s, sd * 12.5, -rnd(rng, 30, 40), (sd === 1 ? 1 : -1) as 1 | -1, pick(rng, CANDY), '#FFFFFF');
    // pastel buildings
    for (let k = 0; k < 2; k++) {
      const w = rnd(rng, 7, 10);
      const h = rnd(rng, 8, 14);
      const bx = sd * rnd(rng, 20, 28);
      const bz = -rnd(rng, 6, 44);
      const wall = pick(rng, ['#FF9EC4', '#9ED0FF', '#FFE08A', '#A8EBC8', '#D2B4FF']);
      box(s, w, h, w, wall, bx, h / 2, bz, { r: 0.5 });
      box(s, w + 1, 1, w + 1, '#FFFFFF', bx, h, bz, { r: 0.3 });
      cone(s, w * 0.7, 5, pick(rng, CANDY), bx, h + 3.4, bz, 6);
      for (let wy = 3; wy < h - 2; wy += 3.6) box(s, 0.2, 1.6, 1.8, '#FFF8D0', bx - sd * (w / 2 + 0.05), wy + 0.4, bz, { r: 0.05, m: { emissive: '#FFE08A', ei: 0.6 } });
    }
    for (let k = 0; k < 4; k++) tree(s, sd * rnd(rng, 16, 40), -rnd(rng, 2, 46), rnd(rng, 0.9, 1.4), pick(rng, ['#55C26A', '#7BD65F']), '#3DAE63');
    flowers(s, rng, sd * 9.4, -rnd(rng, 6, 40), 10, 3);
    balloon(ctx, sd * rnd(rng, 10, 16), rnd(rng, 10, 20), -rnd(rng, 6, 40), 0.5, pick(rng, CANDY), pick(rng, CANDY));
  }
  bunting(ctx, -8);
  bunting(ctx, -32);
  if (ctx.i % 3 === 1) carousel(ctx, -(rng() < 0.5 ? 1 : -1) * 22, -24);
  // spinning pinwheels
  for (let i = 0; i < 3; i++) {
    const px = side(rng) * rnd(rng, 8, 10);
    const pz = -rnd(rng, 4, 44);
    box(ctx.s, 0.15, 3, 0.15, '#FFFFFF', px, 1.5, pz);
    const wh = group(ctx.a, px, 3.1, pz);
    for (let k = 0; k < 4; k++) box(wh, 0.9, 0.9, 0.08, CANDY[k], Math.cos((k * Math.PI) / 2) * 0.6, Math.sin((k * Math.PI) / 2) * 0.6, 0.1, { r: 0.05, rz: k * 0.8 });
    ctx.anim((t) => (wh.rotation.z = t * 3 + i));
  }
}

function ferrisWheel(ctx: SegCtx, x: number, z: number, r: number) {
  const { s } = ctx;
  const hubY = r + 5;
  for (const dz of [-3, 3]) {
    box(s, 2, hubY + 2, 1.5, '#FFFFFF', x - r * 0.45, hubY / 2, z + dz, { r: 0.3, rz: -0.25 });
    box(s, 2, hubY + 2, 1.5, '#FFFFFF', x + r * 0.45, hubY / 2, z + dz, { r: 0.3, rz: 0.25 });
  }
  const wheel = group(ctx.a, x, hubY, z);
  const cabs: THREE.Group[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    box(wheel, 0.5, r * 2, 0.5, '#FFD1E6', 0, 0, 0, { r: 0.1, rz: a });
    const cab = group(wheel, Math.cos(a) * r, Math.sin(a) * r, 0);
    box(cab, 3, 2.6, 3.4, CANDY[i % 6], 0, -1.6, 0, { r: 0.5 });
    box(cab, 0.15, 1.8, 0.15, '#3A2B22', 0, -0.2, 0);
    cabs.push(cab);
  }
  for (const dz of [-1.8, 1.8]) torus(wheel, r, 0.6, dz < 0 ? '#FF6B9A' : '#FFC83D', 0, 0, dz);
  ball(wheel, 1.6, '#FFC83D', 0, 0, 0);
  ctx.anim((t) => {
    wheel.rotation.z = t * 0.18;
    cabs.forEach((c) => (c.rotation.z = -wheel.rotation.z));
  });
}

function coaster(ctx: SegCtx, x: number, z: number) {
  const { s } = ctx;
  const pts: THREE.Vector3[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    pts.push(new THREE.Vector3(x + (u - 0.5) * 110, 14 + Math.sin(u * Math.PI * 3) * 11 + Math.sin(u * Math.PI * 7) * 2, z + Math.sin(u * Math.PI * 2) * 6));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const samples = curve.getPoints(110);
  samples.forEach((p, i) => {
    if (i % 2 === 0) {
      box(s, 0.9, 0.7, 6, '#3D9BFF', p.x, p.y, p.z, { r: 0.1 });
      if (i % 8 === 0) box(s, 0.9, p.y, 0.9, '#FFFFFF', p.x, p.y / 2, p.z, { r: 0.2 });
    }
  });
  for (const dz of [-2.4, 2.4]) {
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      const m = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b);
      const seg = box(s, len + 0.15, 0.4, 0.4, '#FF6B9A', m.x, m.y + 0.5, m.z + dz, { r: 0.1 });
      seg.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    }
  }
  const cart = group(ctx.a, 0, 0, 0);
  for (let i = 0; i < 3; i++) box(cart, 2.4, 1.6, 4, i % 2 ? '#FFC83D' : '#E8453C', 0, 0, -i * 4.6, { r: 0.4 });
  ctx.anim((t) => {
    const u = (t * 0.045) % 1;
    const p = curve.getPoint(u);
    const q = curve.getPoint((u + 0.01) % 1);
    cart.position.set(p.x, p.y + 1.4, p.z);
    cart.rotation.y = Math.atan2(q.x - p.x, q.z - p.z) - Math.PI / 2 + Math.PI;
    cart.rotation.z = Math.atan2(q.y - p.y, Math.hypot(q.x - p.x, q.z - p.z)) * 0.8;
  });
}

function themeBackdrop(ctx: SegCtx) {
  ferrisWheel(ctx, -52, -110, 26);
  coaster(ctx, 50, -150);
  balloon(ctx, -20, 70, -160, 2.2, '#FF6B9A', '#FFFFFF');
  balloon(ctx, 78, 90, -120, 2.6, '#3D9BFF', '#FFC83D');
  for (let i = 0; i < 16; i++) {
    const x = (i - 8) * 24;
    tree(ctx.s, x, -200, 2.2, '#55C26A', '#3DAE63');
  }
}

export const THEME_WORLD: WorldDef = {
  id: 'play-learn-achieve',
  title: 'Play Learn Achieve',
  signLines: ['Play', 'Learn', 'Achieve'],
  signStyle: 'blue',
  sky: { top: '#3A93F2', mid: '#8CCBFF', horizon: '#EAF6FF', fog: '#D6ECFF', fogNear: 95, fogFar: 290 },
  light: { sky: '#D8E8FF', ground: '#FFE9F4', hemi: 1.2, sun: '#FFF3D8', sunI: 2.6, sunPos: [-12, 28, 16] },
  sunDisc: { color: '#FFF3B8', size: 55, pos: [-240, 300, -480] },
  clouds: { count: 12 },
  start: (ctx, signTex) => {
    // a big arch over the road
    const { s, a } = ctx;
    for (const sd of [-1, 1]) {
      box(s, 3.4, 16, 3.4, '#FFC83D', sd * 8.2, 8, -10, { r: 0.5 });
      for (let k = 0; k < 4; k++) box(s, 3.6, 1.2, 3.6, '#FF8A3D', sd * 8.2, 2 + k * 4, -10, { r: 0.3 });
      ball(s, 1.4, '#FFFFFF', sd * 8.2, 17, -10);
    }
    box(s, 20, 3.4, 3.4, '#FFC83D', 0, 16, -10, { r: 0.5 });
    box(s, 15, 5.6, 1.4, '#1F4FCC', 0, 20.6, -10, { r: 0.5 });
    const board = plane(a, 14, 5, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }), 0, 20.6, -9.2);
    board.castShadow = false;
    for (let i = 0; i < 9; i++) ball(s, 0.35, CANDY[i % 6], -8 + i * 2, 14, -8.2, 1, 1, 1, { m: { emissive: CANDY[i % 6], ei: 0.7 } });
  },
  segment: themeSegment,
  backdrop: themeBackdrop,
};

// =================================================================== 8. Reach Higher (moon base)
let earthTex: THREE.Texture | null = null;
function earthTexture() {
  earthTex ??= canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#2E78D8';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#4CB058';
    const blobs: [number, number, number, number][] = [[90, 100, 70, 40], [140, 150, 40, 50], [300, 90, 90, 40], [340, 150, 50, 34], [430, 80, 50, 36], [220, 200, 60, 20]];
    blobs.forEach(([x, y, rw, rh]) => { g.beginPath(); g.ellipse(x, y, rw, rh, 0.3, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse((i * 83) % w, (i * 47) % h, 40, 9, i, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#F4FAFF';
    g.fillRect(0, 0, w, 16);
    g.fillRect(0, h - 16, w, 16);
  });
  return earthTex;
}

function dome(ctx: SegCtx, x: number, z: number, r: number) {
  const { s } = ctx;
  ball(s, r, '#EEF3FF', x, 0, z, 1, 0.78, 1, { m: { rough: 0.35, metal: 0.1 } });
  torus(s, r * 0.98, 0.5, '#4AA8FF', x, 0.2, z).rotation.x = Math.PI / 2;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    box(s, 1.6, 1.8, 0.4, '#FFE08A', x + Math.cos(a) * r * 0.97, r * 0.35, z + Math.sin(a) * r * 0.97, { r: 0.15, ry: -a, m: { emissive: '#FFD27F', ei: 0.9 } });
  }
  cyl(s, 0.2, 0.2, 5, '#9FB0C8', x, r * 0.78 + 2.4, z, 8);
  ball(s, 0.35, '#FF5F5F', x, r * 0.78 + 5, z, 1, 1, 1, { m: GLOW });
}

function spaceSegment(ctx: SegCtx) {
  const { s, a, rng } = ctx;
  pathAndGround(ctx, { ground: '#7C7E8E', path: '#59607A', edge: '#2B3044', tile: (c, r) => ['#626A86', '#566079', '#6B7390'][(c + r * 2 + ctx.i) % 3] });
  const edge = new THREE.MeshStandardMaterial({ color: '#4A3A10', emissive: '#FFC83D', emissiveIntensity: 1, roughness: 0.4 });
  for (const sd of [-1, 1]) for (let z = 2; z < SEG; z += 4) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 1.6), edge);
    m.position.set(sd * 5.1, 0.1, -z);
    a.add(m);
  }
  ctx.anim((t) => (edge.emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.6));
  for (let i = 0; i < 8; i++) {
    const cx = side(rng) * rnd(rng, 10, 46);
    const cz = -rnd(rng, 2, 46);
    const r = rnd(rng, 2.5, 6);
    cyl(s, r, r, 0.12, '#7B7D8B', cx, -0.28, cz, 18);
    torus(s, r, 0.35, '#B3B5C2', cx, -0.2, cz).rotation.x = Math.PI / 2;
  }
  for (const sd of [-1, 1] as const) {
    rock(s, sd * rnd(rng, 12, 40), -rnd(rng, 2, 46), rnd(rng, 1.2, 2.2), '#8A8C9A', '#767888');
    rock(s, sd * rnd(rng, 20, 50), -rnd(rng, 2, 46), rnd(rng, 1.6, 3), '#7B7D8B', '#6B6D7B');
  }
  const ds = rng() < 0.5 ? -1 : 1;
  dome(ctx, ds * 20, -14, 7);
  dome(ctx, -ds * 26, -34, 5);
  box(s, 14, 1.6, 2.4, '#C9D1E6', ds * 13, 0.6, -14, { r: 0.5 });
  // solar panel field
  const sx = -ds * 16;
  for (let k = 0; k < 4; k++) {
    box(s, 0.5, 2.2, 0.5, '#9FB0C8', sx, 1.1, -4 - k * 5, { r: 0.1 });
    const panel = box(ctx.a, 6, 0.3, 3.6, '#2F6BFF', sx, 2.6, -4 - k * 5, { r: 0.1, m: { rough: 0.2, metal: 0.4, emissive: '#1F4FCC', ei: 0.35 } });
    panel.rotation.x = -0.45;
    ctx.anim((t) => (panel.rotation.z = Math.sin(t * 0.3 + k) * 0.08));
  }
  // rotating dish
  const dishBase = -ds * 14;
  box(s, 1.2, 8, 1.2, '#C9D1E6', dishBase, 4, -42, { r: 0.2 });
  const dish = group(ctx.a, dishBase, 8.5, -42);
  cone(dish, 3.4, 2.2, '#F4F6FF', 0, 0, 0.6, 20, { rx: -Math.PI / 2, m: { rough: 0.3, metal: 0.2 } });
  cyl(dish, 0.1, 0.1, 3, '#9FB0C8', 0, 0, 2.2, 6, { rx: Math.PI / 2 });
  ball(dish, 0.25, '#FF5F5F', 0, 0, 3.7, 1, 1, 1, { m: GLOW });
  ctx.anim((t) => {
    dish.rotation.y = t * 0.5 + ctx.i;
    dish.rotation.x = -0.4 + Math.sin(t * 0.4) * 0.1;
  });
  // drifting asteroids
  for (let i = 0; i < (ctx.low ? 2 : 4); i++) {
    const ast = group(ctx.a, rnd(rng, -45, 45), rnd(rng, 14, 42), -rnd(rng, 6, 44));
    box(ast, rnd(rng, 2, 4), rnd(rng, 2, 3.4), rnd(rng, 2, 4), '#8A8C9A', 0, 0, 0, { r: 0.7 });
    box(ast, 1.8, 1.6, 1.8, '#767888', 0.8, 0.9, 0.4, { r: 0.5 });
    const bx = ast.position.x;
    const by = ast.position.y;
    const ph = rng() * 6;
    ctx.anim((t) => {
      ast.rotation.x = t * 0.3 + ph;
      ast.rotation.y = t * 0.4 + ph;
      ast.position.x = bx + Math.sin(t * 0.25 + ph) * 3;
      ast.position.y = by + Math.sin(t * 0.5 + ph) * 1.4;
    });
  }
}

function spaceBackdrop(ctx: SegCtx) {
  const { s, a } = ctx;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 20), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.8, emissive: '#1B4A9A', emissiveIntensity: 0.35, fog: false } as THREE.MeshStandardMaterialParameters));
  earth.position.set(-130, 190, -420);
  a.add(earth);
  ctx.anim((t) => (earth.rotation.y = t * 0.08));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(101, 24, 14), new THREE.MeshBasicMaterial({ color: '#7FC8FF', transparent: true, opacity: 0.16, fog: false, side: THREE.BackSide }));
  atmo.position.copy(earth.position);
  a.add(atmo);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(22, 20, 12), new THREE.MeshStandardMaterial({ color: '#FFB067', emissive: '#C86A2A', emissiveIntensity: 0.4, fog: false } as THREE.MeshStandardMaterialParameters));
  planet.position.set(160, 150, -380);
  a.add(planet);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(36, 2.2, 6, 40), new THREE.MeshBasicMaterial({ color: '#FFE0A8', fog: false }));
  ring.position.copy(planet.position);
  ring.rotation.x = 1.2;
  a.add(ring);
  // rocket on a launch pad
  const g = group(s, 30, 0, -150);
  cyl(g, 12, 13, 2.4, '#7A8094', 0, 1.2, 0, 16);
  cyl(g, 5.2, 5.6, 40, '#F4F6FF', 0, 22, 0, 20, { m: { rough: 0.3 } });
  cone(g, 5.2, 14, '#E8453C', 0, 49, 0, 20);
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    box(g, 1, 12, 8, '#E8453C', Math.cos(ang) * 6.2, 8, Math.sin(ang) * 6.2, { r: 0.3, ry: -ang });
  }
  ball(g, 1.6, '#4AA8FF', 0, 34, 5.2, 1, 1, 0.5, { m: GLOW });
  ball(g, 1.6, '#4AA8FF', 0, 26, 5.4, 1, 1, 0.5, { m: GLOW });
  box(g, 4, 54, 4, '#8A93A8', -14, 27, 0, { r: 0.3 });
  for (let k = 0; k < 6; k++) box(g, 10, 0.8, 1, '#8A93A8', -9, 6 + k * 8, 0, { r: 0.1 });
  const flame = cone(ctx.a, 3.6, 9, '#FF9A2E', 30, 1.5, -150, 12, { rx: Math.PI, m: { emissive: '#FF8A1F', ei: 1.5, rough: 0.5 } });
  const flame2 = cone(ctx.a, 2, 6, '#FFE08A', 30, 2, -150, 12, { rx: Math.PI, m: { emissive: '#FFE08A', ei: 1.8, rough: 0.5 } });
  ctx.anim((t) => {
    const k = 1 + Math.sin(t * 13) * 0.18;
    flame.scale.set(1, k, 1);
    flame2.scale.set(1, k * 1.1, 1);
  });
  dome(ctx, -34, -165, 18);
  dome(ctx, -62, -150, 11);
  box(s, 40, 3, 6, '#C9D1E6', -48, 1.4, -158, { r: 0.5 });
  for (let i = 0; i < 12; i++) rock(s, (i - 6) * 40, -230 - (i % 3) * 14, 4 + (i % 4), '#8A8C9A', '#767888');
}

export const SPACE_WORLD: WorldDef = {
  id: 'reach-higher',
  title: 'Reach Higher',
  signLines: ['Reach', 'Higher'],
  signStyle: 'blue',
  sky: { top: '#03030F', mid: '#0A0F30', horizon: '#1B2250', fog: '#0B1030', fogNear: 120, fogFar: 340, stars: 520 },
  light: { sky: '#8FA8FF', ground: '#3A3F5C', hemi: 0.75, sun: '#FFF6E0', sunI: 3.4, sunPos: [20, 22, 10], exposure: 1.1 },
  bloom: 0.7,
  clouds: null,
  signPos: [-8.6, 4.2, 0],
  segment: spaceSegment,
  backdrop: spaceBackdrop,
};

// =================================================================== 9. Small Steps Big Progress (waterfall valley)
function mill(ctx: SegCtx, x: number, z: number, face: 1 | -1) {
  const { s } = ctx;
  const g = group(s, x, 0, z);
  box(g, 8, 3.2, 9, '#B0A89A', 0, 1.6, 0, { r: 0.3 });
  box(g, 7.6, 5.6, 8.6, '#C48A4E', 0, 6, 0, { r: 0.3 });
  const rh = 4.4;
  const a = Math.atan2(rh, 3.8);
  const len = Math.hypot(3.8, rh) + 0.8;
  for (const sd of [-1, 1]) box(g, len, 0.6, 10, '#6B6F7A', sd * 1.9, 8.8 + rh / 2, 0, { r: 0.1, rz: -sd * a });
  for (let k = 0; k < 4; k++) box(g, 7.4 * (1 - (k + 0.5) / 4), rh / 4, 8.6, '#C48A4E', 0, 8.8 + (k + 0.5) * (rh / 4), 0, { r: 0.05 });
  box(g, 1.2, 3.4, 0.3, '#5A3516', face * -4.1, 1.7, 1.5, { r: 0.05 });
  box(g, 1.4, 1.4, 0.3, '#FFD98A', face * -4.1, 6.4, -1.5, { r: 0.05, m: { emissive: '#FFC060', ei: 0.8 } });
  box(g, 0.6, 3, 5, '#6B4223', face * 4.8, 3.6, 0, { r: 0.1 });
  const wheel = group(ctx.a, x + face * 5.6, 4.8, z);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    box(wheel, 0.4, 9, 0.4, '#8A5A33', 0, 0, 0, { r: 0.1, rz: ang });
    box(wheel, 0.5, 1.2, 3.2, '#A06A3C', 0, 0, 0, { r: 0.1 }).position.set(Math.cos(ang) * 4.5, Math.sin(ang) * 4.5, 0);
  }
  torus(wheel, 4.5, 0.3, '#6B4223', 0, 0, 1.5);
  torus(wheel, 4.5, 0.3, '#6B4223', 0, 0, -1.5);
  cyl(wheel, 0.6, 0.6, 3.6, '#5A3516', 0, 0, 0, 10, { rx: Math.PI / 2 });
  wheel.rotation.y = Math.PI / 2;
  ctx.anim((t) => (wheel.rotation.x = -t * 0.7 * face));
}

function butterflies(ctx: SegCtx, n: number) {
  for (let i = 0; i < n; i++) {
    const g = group(ctx.a, 0, 0, 0);
    const c = pick(ctx.rng, ['#FFB3D9', '#FFE066', '#9FD3FF', '#FFFFFF']);
    const l = group(g, -0.05, 0, 0);
    const r = group(g, 0.05, 0, 0);
    box(l, 0.6, 0.05, 0.5, c, -0.3, 0, 0, { r: 0.02 });
    box(r, 0.6, 0.05, 0.5, c, 0.3, 0, 0, { r: 0.02 });
    const cx = rnd(ctx.rng, -26, 26);
    const cz = -rnd(ctx.rng, 4, 44);
    const ph = ctx.rng() * 6;
    ctx.anim((t) => {
      g.position.set(cx + Math.sin(t * 0.7 + ph) * 3, 2.2 + Math.sin(t * 1.3 + ph) * 0.8, cz + Math.cos(t * 0.6 + ph) * 3);
      g.rotation.y = t * 0.7 + ph;
      l.rotation.z = Math.sin(t * 16 + ph) * 0.9;
      r.rotation.z = -Math.sin(t * 16 + ph) * 0.9;
    });
  }
}

function valleySegment(ctx: SegCtx) {
  const { s, rng } = ctx;
  pathAndGround(ctx, { ground: '#62C24E', path: '#8A5A33', edge: '#5A3B1F', tile: (_c, r) => (r % 2 ? '#B56B35' : '#A35F2D') });
  for (let r = 0; r < Math.round(SEG / 1.6); r++) box(s, PATH_W - 0.4, 0.18, 0.12, '#6B4223', 0, 0.1, -0.8 - r * 1.6, { shadow: false });
  for (const sd of [-1, 1] as const) {
    // river with banks
    box(s, 7.4, 1.4, SEG, '#7A5B3A', sd * 13, -1.1, -SEG / 2, { r: 0.2 });
    waterPlane(ctx, 6, SEG, sd * 13, -0.25, -SEG / 2, '#3FAEF0', '#D6F1FF', [0.0, sd * 0.07]);
    // small wooden bridge over the river
    for (let k = 0; k < 6; k++) box(s, 1.5, 0.3, 4, k % 2 ? '#B56B35' : '#A35F2D', sd * (8.4 + k * 1.5), 0.15, -20, { r: 0.05 });
    for (const dz of [-2, 2]) box(s, 9.6, 0.3, 0.3, '#6B4223', sd * 13, 1.6, -20 + dz, { r: 0.05 });
    // hills & cliffs
    for (let k = 0; k < 3; k++) {
      const hx = sd * rnd(rng, 24, 52);
      const hz = -rnd(rng, 6, 44);
      for (let t = 0; t < 3; t++) {
        const w = 16 - t * 4.5;
        box(s, w, 3.2, w * 0.85, t === 0 ? '#8F9499' : '#62C24E', hx, 1.2 + t * 3, hz, { r: 0.6 });
        box(s, w + 0.3, 0.6, w * 0.85 + 0.3, '#4FB343', hx, 3 + t * 3, hz, { r: 0.4 });
      }
      tree(s, hx, hz, 1.4, '#4FB343', '#3E9A38');
    }
    for (let k = 0; k < (ctx.low ? 3 : 6); k++) tree(s, sd * rnd(rng, 18, 46), -rnd(rng, 2, 47), rnd(rng, 0.9, 1.5), pick(rng, ['#4FB343', '#62C24E', '#3E9A38']), '#3E9A38');
    flowers(s, rng, sd * 8.6, -rnd(rng, 4, 44), 12, 3);
    flowers(s, rng, sd * 18, -rnd(rng, 4, 44), 14, 6);
    // mushrooms
    const mx = sd * rnd(rng, 9, 11);
    const mz = -rnd(rng, 6, 44);
    box(s, 0.5, 0.9, 0.5, '#F4EFE4', mx, 0.4, mz, { r: 0.15 });
    ball(s, 0.8, '#E8453C', mx, 1.0, mz, 1, 0.6, 1);
  }
  const ms = ctx.i % 2 === 0 ? 1 : -1;
  mill(ctx, ms * 24, -30, (ms === 1 ? -1 : 1) as 1 | -1);
  rock(s, side(rng) * rnd(rng, 10, 12), -rnd(rng, 4, 44), 1.1, '#8A8F99', '#767B85');
  butterflies(ctx, ctx.low ? 2 : 5);
}

function valleyBackdrop(ctx: SegCtx) {
  const { s } = ctx;
  // tall cliff with a waterfall
  const g = group(s, 28, 0, -190);
  for (let t = 0; t < 7; t++) {
    const w = 90 - t * 9;
    box(g, w, 11, 50 - t * 3, t % 2 ? '#8F9499' : '#9AA0A6', 0, 5.5 + t * 11, 0, { r: 1 });
    box(g, w + 0.6, 1.2, 50 - t * 3 + 0.6, '#4FB343', 0, 11 + t * 11, 0, { r: 0.5 });
  }
  waterfall(ctx, 28, 36, -163, 12, 66);
  for (let i = 0; i < 8; i++) {
    const m = ball(ctx.a, 4, '#FFFFFF', 28 + (i - 4) * 2.4, 4, -160, 1, 0.6, 1, { m: { rough: 1, opacity: 0.5 } });
    const ph = i;
    ctx.anim((t) => {
      m.position.y = 4 + Math.abs(Math.sin(t * 1.3 + ph)) * 3;
      m.scale.setScalar(1 + Math.sin(t * 1.7 + ph) * 0.2);
    });
  }
  waterPlane(ctx, 60, 90, 28, -0.6, -125, '#3FAEF0', '#D6F1FF', [0.0, 0.07]);
  for (let i = 0; i < 12; i++) tree(s, -120 + i * 20, -185 - (i % 2) * 14, 2.4, '#4FB343', '#3E9A38');
  const hill = group(s, -60, 0, -170);
  for (let t = 0; t < 4; t++) box(hill, 70 - t * 14, 8, 40 - t * 7, t === 0 ? '#8F9499' : '#62C24E', 0, 4 + t * 8, 0, { r: 1 });
  box(hill, 14, 8, 12, '#C48A4E', -5, 36, 0, { r: 0.5 });
  cone(hill, 11, 7, '#6B6F7A', -5, 43, 0, 4, { ry: Math.PI / 4 });
  flagPole(ctx, -60, -170, 60, null, '#FF8A3D', 6, 4);
}

export const VALLEY_WORLD: WorldDef = {
  id: 'small-steps',
  title: 'Small Steps Big Progress',
  signLines: ['Small Steps', 'Big', 'Progress'],
  sky: { top: '#3F93F2', mid: '#8CC8FF', horizon: '#EAF6FF', fog: '#D6ECFF', fogNear: 90, fogFar: 280 },
  light: { sky: '#D4E8FF', ground: '#CFE8B8', hemi: 1.15, sun: '#FFF3D6', sunI: 2.6, sunPos: [14, 28, 16] },
  sunDisc: { color: '#FFF3B0', size: 52, pos: [220, 300, -480] },
  signPos: [-9.4, 4.4, 0],
  segment: valleySegment,
  backdrop: valleyBackdrop,
  ambient: (ctx, add) => {
    const fl = makeFlakes(ctx.rng, ctx.low ? 20 : 50, { color: '#FFF6B0', size: 0.8, fall: -0.4, additive: true, area: [30, 16, 60] });
    add(fl.pts, fl.update);
  },
};

export { balloon, canvasTex, lamp };
