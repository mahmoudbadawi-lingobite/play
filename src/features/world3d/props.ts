import * as THREE from 'three';
import { GLOW, ball, box, canvasTex, cone, cyl, glowSprite, group, mat, plane, rippleTexture, torus, type SegCtx } from './common';

/** Reusable voxel-style props. `p` = where to add; static ones are merged ("baked") later. */

export function grassBlock(p: THREE.Object3D, x: number, z: number, w: number, h: number, d: number, top = '#6BCB5B', side = '#8A5A33') {
  box(p, w, h, d, side, x, h / 2 - 0.3, z, { r: 0.25 });
  box(p, w + 0.15, 0.45, d + 0.15, top, x, h - 0.3, z, { r: 0.2 });
}

export function tree(p: THREE.Object3D, x: number, z: number, s = 1, leaf = '#4CAF50', leaf2 = '#3E9A38', trunk = '#7A4B24') {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  box(g, 1.1, 3.4, 1.1, trunk, 0, 1.7, 0, { r: 0.2 });
  box(g, 5.2, 2.6, 5.2, leaf, 0, 4.2, 0, { r: 0.8 });
  box(g, 4.2, 2.4, 4.2, leaf2, 0, 6.2, 0, { r: 0.7 });
  box(g, 2.8, 2.0, 2.8, leaf, 0, 7.9, 0, { r: 0.6 });
}

export function pine(p: THREE.Object3D, x: number, z: number, s = 1, snow = false, leaf = '#2F7D4A') {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  box(g, 1, 2, 1, '#6B4223', 0, 1, 0, { r: 0.15 });
  const tiers: [number, number, number][] = [[5.2, 1.9, 2.8], [4.2, 1.9, 4.5], [3.2, 1.8, 6.1], [2.2, 1.7, 7.6]];
  tiers.forEach(([w, h, y], i) => {
    box(g, w, h, w, leaf, 0, y, 0, { r: 0.45 });
    if (snow) box(g, w * 0.92, 0.55, w * 0.92, '#FFFFFF', 0, y + h / 2 - 0.1, 0, { r: 0.25 });
    if (i === 3 && snow) box(g, 1.3, 0.8, 1.3, '#FFFFFF', 0, y + 1.1, 0, { r: 0.3 });
  });
}

export function palmTrunk(p: THREE.Object3D, x: number, z: number, s = 1, lean = 0.15) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  for (let i = 0; i < 5; i++) box(g, 1.1 - i * 0.07, 1.5, 1.1 - i * 0.07, i % 2 ? '#B98A4E' : '#A9783F', Math.sin(lean * i) * i * 0.35, 0.75 + i * 1.45, 0, { r: 0.18 });
  return { top: new THREE.Vector3(x + Math.sin(lean * 5) * 5 * 0.35 * s, 7.4 * s, z), s };
}

export function palmLeaves(parent: THREE.Object3D, s = 1, color = '#2E9E4B') {
  const g = group(parent, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const arm = group(g, 0, 0, 0);
    arm.rotation.y = (i / 7) * Math.PI * 2;
    box(arm, 4.4 * s, 0.35 * s, 1.5 * s, i % 2 ? color : '#37B058', 2.3 * s, -0.4 * s, 0, { r: 0.1, rz: -0.35 });
  }
  ball(g, 0.5 * s, '#8A5A33', 0.3, -0.3, 0.2);
  return g;
}

/** A palm tree; the leaves sway when `ctx` is given. */
export function palm(p: THREE.Object3D, x: number, z: number, s = 1, ctx?: SegCtx, color = '#2E9E4B') {
  const { top } = palmTrunk(p, x, z, s);
  if (ctx) {
    const lv = palmLeaves(ctx.a, s, color);
    lv.position.copy(top);
    const ph = x * 0.3 + z;
    ctx.anim((t) => {
      lv.rotation.z = Math.sin(t * 1.3 + ph) * 0.05;
      lv.rotation.x = Math.cos(t * 1.1 + ph) * 0.04;
    });
  } else {
    const lv = palmLeaves(p, s, color);
    lv.position.copy(top);
  }
}

export function cactus(p: THREE.Object3D, x: number, z: number, s = 1) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  const c = '#3E9E4B';
  box(g, 1.2, 4, 1.2, c, 0, 2, 0, { r: 0.5 });
  box(g, 1.6, 0.9, 0.9, c, -1.1, 2.1, 0, { r: 0.35 });
  box(g, 0.9, 1.7, 0.9, c, -1.7, 2.9, 0, { r: 0.35 });
  box(g, 1.4, 0.9, 0.9, c, 0.95, 1.5, 0, { r: 0.35 });
  box(g, 0.9, 1.5, 0.9, c, 1.5, 2.2, 0, { r: 0.35 });
}

export function rock(p: THREE.Object3D, x: number, z: number, s = 1, color = '#8A8F99', color2 = '#767B85') {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  box(g, 3, 1.8, 2.6, color, 0, 0.8, 0, { r: 0.5, ry: 0.4 });
  box(g, 1.8, 1.4, 1.6, color2, 0.8, 1.8, 0.2, { r: 0.4, ry: 0.9 });
}

export interface HouseOpts {
  w: number;
  d: number;
  h: number;
  wall: string;
  roof: string;
  /** +1 = faces +x (house on the left of the path), -1 = faces -x */
  face: 1 | -1;
  trim?: string;
  lit?: string;
  chimney?: boolean;
  floors?: number;
}

export function house(p: THREE.Object3D, x: number, z: number, o: HouseOpts) {
  const g = group(p, x, 0, z);
  const { w, d, h } = o;
  box(g, w, h, d, o.wall, 0, h / 2, 0, { r: 0.2 });
  box(g, w + 0.3, 0.5, d + 0.3, o.trim ?? '#F4EFE4', 0, 0.25, 0, { r: 0.1 });
  const rh = Math.min(w, 8) * 0.55;
  // gable roof with the ridge along z (parallel to the path)
  const a = Math.atan2(rh, w / 2);
  const len = Math.hypot(w / 2, rh) + 0.7;
  for (const sd of [-1, 1]) box(g, len, 0.55, d + 1.2, o.roof, sd * (w / 4), h + rh / 2 + 0.1, 0, { r: 0.12, rz: -sd * a });
  for (let k = 0; k < 4; k++) box(g, w * (1 - (k + 0.5) / 4) * 0.98, rh / 4, d + 0.05, o.wall, 0, h + (k + 0.5) * (rh / 4), 0, { r: 0.05 });
  if (o.chimney) box(g, 1.1, rh * 0.9, 1.1, '#8A3F2E', w * 0.22, h + rh * 0.6, d * 0.2, { r: 0.1 });
  const floors = o.floors ?? Math.max(1, Math.round(h / 4.2));
  const lit = o.lit ?? '#FFD98A';
  const cols = Math.max(1, Math.floor(d / 3.4));
  for (let f = 0; f < floors; f++)
    for (let c = 0; c < cols; c++) {
      if (f === 0 && c === Math.floor(cols / 2)) continue;
      const wz = (c - (cols - 1) / 2) * (d / cols);
      box(g, 0.2, 1.5, 1.4, '#F4EFE4', o.face * (w / 2 + 0.05), 2.2 + f * 3.8, wz, { r: 0.04 });
      box(g, 0.15, 1.2, 1.1, lit, o.face * (w / 2 + 0.12), 2.2 + f * 3.8, wz, { r: 0.04, m: { emissive: lit, ei: 0.55, rough: 0.4 } });
    }
  box(g, 0.2, 2.6, 1.5, '#7A4B24', o.face * (w / 2 + 0.07), 1.3, 0, { r: 0.05 });
}

export function lamp(ctx: SegCtx, x: number, z: number, color = '#FFD27F', h = 6) {
  box(ctx.s, 0.3, h, 0.3, '#2B2B3A', x, h / 2, z, { r: 0.1 });
  box(ctx.s, 0.9, 0.35, 0.9, '#2B2B3A', x, 0.18, z, { r: 0.1 });
  box(ctx.s, 1.0, 1.0, 1.0, color, x, h + 0.5, z, { r: 0.2, m: { emissive: color, ei: 0.9, rough: 0.3 } });
  box(ctx.s, 1.3, 0.3, 1.3, '#2B2B3A', x, h + 1.15, z, { r: 0.1 });
  if (!ctx.low) {
    const g = glowSprite(color, 4.5, 0.55);
    g.position.set(x, h + 0.5, z);
    ctx.a.add(g);
  }
}

export function fenceRun(p: THREE.Object3D, x: number, z0: number, z1: number, color = '#8A5A33', rail = '#A06A3C') {
  const n = Math.max(2, Math.round(Math.abs(z1 - z0) / 2.4));
  for (let i = 0; i <= n; i++) box(p, 0.4, 2.2, 0.4, color, x, 1.1, z0 + ((z1 - z0) * i) / n, { r: 0.08 });
  box(p, 0.25, 0.3, Math.abs(z1 - z0), rail, x, 1.7, (z0 + z1) / 2, { r: 0.05 });
  box(p, 0.25, 0.3, Math.abs(z1 - z0), rail, x, 0.9, (z0 + z1) / 2, { r: 0.05 });
}

/** A flag that waves. */
export function flagPole(ctx: SegCtx, x: number, z: number, h: number, map: THREE.Texture | null, color = '#E8453C', w = 3.2, fh = 2.1) {
  box(ctx.s, 0.25, h, 0.25, '#D9D9E0', x, h / 2, z, { r: 0.1 });
  ball(ctx.s, 0.3, '#FFC83D', x, h + 0.2, z);
  const geo = new THREE.PlaneGeometry(w, fh, 10, 1);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: map ? '#FFFFFF' : color, map: map ?? undefined, side: THREE.DoubleSide, roughness: 0.8 }));
  m.position.set(x + w / 2 + 0.1, h - fh / 2 - 0.2, z);
  ctx.a.add(m);
  const base = (geo.attributes.position.array as Float32Array).slice();
  const ph = x + z;
  ctx.anim((t) => {
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const u = (base[i] + w / 2) / w;
      arr[i + 2] = Math.sin(t * 4 + u * 5 + ph) * 0.35 * u;
      arr[i + 1] = base[i + 1] + Math.sin(t * 3 + u * 3 + ph) * 0.08 * u;
    }
    geo.attributes.position.needsUpdate = true;
  });
}

export function torch(ctx: SegCtx, x: number, z: number, h = 4) {
  box(ctx.s, 0.5, h, 0.5, '#6B4A2B', x, h / 2, z, { r: 0.1 });
  box(ctx.s, 1.1, 0.7, 1.1, '#3A2B22', x, h + 0.2, z, { r: 0.12 });
  const f = cone(ctx.a, 0.55, 1.5, '#FF8A1F', x, h + 1.2, z, 6, { m: { emissive: '#FF7A00', ei: 1.4, rough: 0.4 } });
  const f2 = cone(ctx.a, 0.3, 0.9, '#FFE066', x, h + 1.0, z, 6, { m: { emissive: '#FFD23F', ei: 1.6, rough: 0.4 } });
  f.castShadow = f2.castShadow = false;
  if (!ctx.low) {
    const g = glowSprite('#FFA040', 7, 0.6);
    g.position.set(x, h + 1.3, z);
    ctx.a.add(g);
  }
  const ph = x * 1.7 + z;
  ctx.anim((t) => {
    const k = 1 + Math.sin(t * 11 + ph) * 0.14 + Math.sin(t * 17 + ph) * 0.08;
    f.scale.set(1 + (k - 1) * 0.5, k, 1 + (k - 1) * 0.5);
    f2.scale.set(1, 1 + (k - 1) * 1.2, 1);
  });
}

/** A floating block island that bobs. */
export function floatIsland(ctx: SegCtx | { a: THREE.Group; anim: (fn: (t: number, dt: number) => void) => void }, x: number, y: number, z: number, r: number, o: { top?: string; dirt?: string; tree?: boolean; waterfall?: boolean; house?: boolean } = {}) {
  const g = group(ctx.a, x, y, z);
  cyl(g, r, r * 0.95, 1.1, o.top ?? '#6BCB5B', 0, 0, 0, 8, { m: { rough: 0.8 } });
  cone(g, r * 0.95, r * 1.2, o.dirt ?? '#8A5A33', 0, -r * 0.65, 0, 8, { rx: Math.PI, m: { rough: 0.9 } });
  box(g, r * 0.5, r * 0.5, r * 0.5, '#7B7F88', r * 0.35, -r * 1.05, 0, { r: 0.4 });
  if (o.tree) {
    box(g, 0.8, 2.2, 0.8, '#7A4B24', -r * 0.15, 1.9, 0, { r: 0.15 });
    box(g, 3.6, 2.2, 3.6, '#4CAF50', -r * 0.15, 4.0, 0, { r: 0.6 });
    box(g, 2.4, 1.6, 2.4, '#3E9A38', -r * 0.15, 5.6, 0, { r: 0.5 });
  }
  if (o.house) {
    box(g, 3, 2.4, 3, '#E8D8B8', r * 0.2, 1.9, 0, { r: 0.15 });
    cone(g, 2.6, 1.8, '#B5543A', r * 0.2, 3.9, 0, 4, { ry: Math.PI / 4 });
  }
  if (o.waterfall) {
    const tex = rippleTexture('#7FC8FF', '#FFFFFF');
    tex.repeat.set(1, 2);
    const fall = plane(g, 2.2, r * 3, new THREE.MeshStandardMaterial({ map: tex, color: '#FFFFFF', roughness: 0.3, emissive: '#6FB4FF', emissiveIntensity: 0.3 }), r * 0.9, -r * 1.2, 0, 0, Math.PI / 2);
    fall.castShadow = false;
    ctx.anim((_t, dt) => (tex.offset.y -= dt * 1.6));
  }
  const ph = x * 0.37 + z * 0.11;
  ctx.anim((t) => {
    g.position.y = y + Math.sin(t * 0.7 + ph) * 0.8;
    g.rotation.y = Math.sin(t * 0.25 + ph) * 0.12;
  });
  return g;
}

export function flowers(p: THREE.Object3D, rng: () => number, x: number, z: number, n = 6, spread = 3) {
  const cols = ['#FF6B9A', '#FFD23F', '#FFFFFF', '#B07BFF', '#FF8A3D'];
  for (let i = 0; i < n; i++) {
    const fx = x + (rng() - 0.5) * spread;
    const fz = z + (rng() - 0.5) * spread;
    box(p, 0.12, 0.7, 0.12, '#2E9E4B', fx, 0.35 - 0.3, fz);
    box(p, 0.5, 0.35, 0.5, cols[Math.floor(rng() * cols.length)], fx, 0.8 - 0.3, fz, { r: 0.12 });
  }
}

/** A flat moving water surface with ripples. */
export function waterPlane(ctx: SegCtx | { a: THREE.Group; anim: (fn: (t: number, dt: number) => void) => void }, w: number, d: number, x: number, y: number, z: number, base = '#3EA8F5', light = '#BFE6FF', speed: [number, number] = [0.05, 0.02], opts: { opacity?: number; emissive?: string } = {}) {
  const tex = rippleTexture(base, light);
  tex.repeat.set(w / 12, d / 12);
  const m = new THREE.MeshStandardMaterial({ map: tex, color: '#FFFFFF', roughness: 0.25, metalness: 0.1, transparent: (opts.opacity ?? 1) < 1, opacity: opts.opacity ?? 1, emissive: opts.emissive ?? base, emissiveIntensity: 0.18 });
  const mesh = plane(ctx.a, w, d, m, x, y, z, -Math.PI / 2);
  mesh.receiveShadow = true;
  ctx.anim((_t, dt) => {
    tex.offset.x += dt * speed[0];
    tex.offset.y += dt * speed[1];
  });
  return mesh;
}

export function waterfall(ctx: { a: THREE.Group; anim: (fn: (t: number, dt: number) => void) => void }, x: number, y: number, z: number, w: number, h: number, ry = 0) {
  const tex = rippleTexture('#9ED6FF', '#FFFFFF');
  tex.repeat.set(Math.max(1, w / 6), h / 8);
  const mesh = plane(ctx.a, w, h, new THREE.MeshStandardMaterial({ map: tex, color: '#FFFFFF', roughness: 0.3, emissive: '#8FCBFF', emissiveIntensity: 0.35 }), x, y, z, 0, ry);
  mesh.castShadow = false;
  ctx.anim((_t, dt) => (tex.offset.y -= dt * 1.9));
  return mesh;
}

/** A simple striped market stall / tent. */
export function stall(p: THREE.Object3D, x: number, z: number, face: 1 | -1, c1: string, c2: string) {
  const g = group(p, x, 0, z);
  box(g, 5, 0.5, 4, '#A06A3C', 0, 0.25, 0, { r: 0.1 });
  for (const [px, pz] of [[-2.2, -1.7], [2.2, -1.7], [-2.2, 1.7], [2.2, 1.7]]) box(g, 0.3, 4.6, 0.3, '#6B4A2B', px, 2.6, pz, { r: 0.08 });
  for (let i = 0; i < 6; i++) box(g, 0.9, 0.35, 4.6, i % 2 ? c1 : c2, -2.25 + i * 0.9, 5.0 - (i === 0 || i === 5 ? 0.1 : 0), 0, { r: 0.08 });
  box(g, 4.2, 1.2, 1.2, '#E8D8B8', 0, 1.2, face * -1.3, { r: 0.1 });
  for (let i = 0; i < 4; i++) ball(g, 0.35, [c1, c2, '#FFD23F', '#7BE0A5'][i], -1.4 + i * 0.95, 2.05, face * -1.3);
}

export function balloon(ctx: { a: THREE.Group; anim: (fn: (t: number, dt: number) => void) => void }, x: number, y: number, z: number, s: number, c1: string, c2: string) {
  const g = group(ctx.a, x, y, z);
  g.scale.setScalar(s);
  ball(g, 3.4, c1, 0, 5, 0, 1, 1.15, 1);
  for (let i = 0; i < 4; i++) box(g, 0.9, 6.3, 3.9, i % 2 ? c2 : c1, 0, 5.0, 0, { r: 0.4, ry: i * 0.8, m: { rough: 0.7 } }).scale.set(0.05, 1, 1);
  box(g, 1.7, 1.2, 1.7, '#9A6A3C', 0, 0.2, 0, { r: 0.2 });
  for (const [px, pz] of [[-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]]) box(g, 0.1, 2.8, 0.1, '#5A3B1F', px * 1.1, 1.8, pz * 1.1, { shadow: false });
  const ph = x * 0.05 + y;
  ctx.anim((t) => {
    g.position.y = y + Math.sin(t * 0.8 + ph) * 1.2;
    g.position.x = x + Math.sin(t * 0.35 + ph) * 3;
    g.rotation.y = Math.sin(t * 0.3 + ph) * 0.3;
  });
}

export function windowGlow(c: string) {
  return { emissive: c, ei: 0.7, rough: 0.4 };
}

export { GLOW, torus, mat, canvasTex };
