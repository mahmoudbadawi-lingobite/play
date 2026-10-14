import * as THREE from 'three';
import { GLOW, HEAD, LEG_H, ball, box, cone, cyl, group, torus } from './kit';
import type { Rig } from './model3d';

type Spec = Record<string, string | number | boolean>;
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);
const T = HEAD / 2;

// ---------------------------------------------------------------- hats (parent = head group)
export function buildHat(head: THREE.Group, spec: Spec) {
  const style = str(spec.style, 'cap');
  const c = str(spec.color, '#E8453C');
  const a = str(spec.accent, '#FFFFFF');
  switch (style) {
    case 'cap':
      box(head, 1.66, 0.6, 1.66, c, 0, T + 0.18, 0, { r: 0.22 });
      box(head, 1.5, 0.1, 0.85, a, 0, T - 0.02, 1.0, { r: 0.05 });
      ball(head, 0.1, a, 0, T + 0.5, 0);
      break;
    case 'beanie':
      box(head, 1.68, 0.72, 1.68, c, 0, T + 0.2, 0, { r: 0.25 });
      box(head, 1.74, 0.3, 1.74, a, 0, T - 0.02, 0, { r: 0.1 });
      ball(head, 0.26, a, 0, T + 0.76, 0);
      break;
    case 'party': {
      cone(head, 0.62, 1.35, c, 0, T + 0.7, 0, 14);
      ball(head, 0.17, a, 0, T + 1.4, 0);
      for (const [x, y, z] of [[0, 0.3, 0.47], [0.28, 0.5, 0.27], [-0.3, 0.55, 0.21], [0.05, 0.8, 0.14]]) ball(head, 0.07, a, x, T + y, z);
      break;
    }
    case 'explorer':
      cyl(head, 1.15, 1.15, 0.08, c, 0, T + 0.03, 0, 24);
      cyl(head, 0.84, 0.92, 0.55, c, 0, T + 0.3, 0, 24);
      cyl(head, 0.94, 0.94, 0.15, a, 0, T + 0.14, 0, 24);
      break;
    case 'catears':
      box(head, 1.62, 0.14, 0.3, c, 0, T + 0.05, 0.05);
      for (const sd of [-1, 1]) {
        cone(head, 0.3, 0.55, c, sd * 0.5, T + 0.4, 0, 4).rotation.y = Math.PI / 4;
        cone(head, 0.17, 0.4, a, sd * 0.5, T + 0.35, 0.06, 4).rotation.y = Math.PI / 4;
      }
      break;
    case 'wizard':
      cyl(head, 1.1, 1.1, 0.1, c, 0, T + 0.03, 0, 24);
      cone(head, 0.7, 1.1, c, 0, T + 0.6, 0, 16);
      cone(head, 0.4, 0.9, c, 0.12, T + 1.45, 0, 14).rotation.z = -0.3;
      cyl(head, 0.74, 0.74, 0.18, a, 0, T + 0.2, 0, 16);
      ball(head, 0.12, a, 0, T + 0.62, 0.38, 1, 1, 1, { m: GLOW });
      break;
    case 'crown': {
      cyl(head, 0.82, 0.86, 0.42, c, 0, T + 0.18, 0, 8, { m: { rough: 0.25, metal: 0.6, emissive: c, ei: 0.15 } });
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        cone(head, 0.15, 0.42, c, Math.cos(ang) * 0.72, T + 0.58, Math.sin(ang) * 0.72, 4, { m: { rough: 0.25, metal: 0.6, emissive: c, ei: 0.15 } });
      }
      ball(head, 0.11, a, 0, T + 0.2, 0.86, 1, 1, 1, { m: GLOW });
      break;
    }
    case 'helmet':
      box(head, 1.85, 1.8, 1.85, c, 0, 0.05, 0, { r: 0.6, m: { rough: 0.3, metal: 0.1 } });
      box(head, 1.35, 0.62, 0.4, a, 0, 0.0, 0.82, { r: 0.18, m: { rough: 0.15, opacity: 0.62 } });
      for (const sd of [-1, 1]) cyl(head, 0.25, 0.25, 0.2, a, sd * 0.95, 0, 0, 14, { rz: Math.PI / 2 });
      cyl(head, 0.04, 0.04, 0.4, '#8A93A8', 0.45, T + 0.55, 0, 8);
      ball(head, 0.09, '#FF5F5F', 0.45, T + 0.8, 0, 1, 1, 1, { m: GLOW });
      break;
  }
}

// ---------------------------------------------------------------- accessories
export function buildAccessory(rig: Rig, spec: Spec, wings: THREE.Object3D[]) {
  const style = str(spec.style, 'round');
  const c = str(spec.color, '#2B2B3A');
  const a = str(spec.accent, '#FFFFFF');
  const h = rig.head;
  const fz = T + 0.03;
  switch (style) {
    case 'round':
      for (const sd of [-1, 1]) {
        torus(h, 0.25, 0.045, c, sd * 0.36, 0.04, fz);
        box(h, 0.05, 0.05, 0.5, c, sd * 0.72, 0.1, T - 0.2);
      }
      box(h, 0.18, 0.05, 0.05, c, 0, 0.1, fz);
      break;
    case 'shades':
      for (const sd of [-1, 1]) {
        box(h, 0.52, 0.3, 0.08, c, sd * 0.36, 0.04, fz + 0.01, { r: 0.05 });
        box(h, 0.12, 0.04, 0.03, '#FFFFFF', sd * 0.36 - 0.1, 0.1, fz + 0.06, { shadow: false });
        box(h, 0.05, 0.05, 0.5, c, sd * 0.72, 0.1, T - 0.2);
      }
      box(h, 0.2, 0.06, 0.06, c, 0, 0.1, fz + 0.01);
      break;
    case 'goggles':
      box(h, 1.62, 0.16, 0.1, c, 0, 0.5, -T - 0.05);
      for (const sd of [-1, 1]) {
        box(h, 0.1, 0.16, 1.5, c, sd * 0.77, 0.5, 0);
        cyl(h, 0.36, 0.36, 0.14, c, sd * 0.38, 0.5, T + 0.07, 20, { rx: Math.PI / 2 });
        cyl(h, 0.28, 0.28, 0.17, a, sd * 0.38, 0.5, T + 0.09, 20, { rx: Math.PI / 2, m: { rough: 0.15, opacity: 0.8, emissive: a, ei: 0.2 } });
      }
      box(h, 0.14, 0.14, 0.12, c, 0, 0.5, T + 0.07);
      break;
    case 'headphones':
      torus(h, 0.86, 0.075, c, 0, 0.05, 0, Math.PI);
      for (const sd of [-1, 1]) {
        cyl(h, 0.34, 0.34, 0.26, c, sd * 0.88, 0, 0, 20, { rz: Math.PI / 2 });
        cyl(h, 0.28, 0.28, 0.1, a, sd * 1.0, 0, 0, 20, { rz: Math.PI / 2 });
      }
      break;
    case 'scarf':
      torus(rig.root, 0.8, 0.2, c, 0, 3.28, 0, Math.PI * 2).rotation.x = Math.PI / 2;
      box(rig.root, 0.5, 0.55, 0.4, c, 0.3, 3.0, 0.55);
      box(rig.root, 0.4, 1.15, 0.14, c, 0.3, 2.25, 0.62);
      box(rig.root, 0.42, 0.1, 0.16, a, 0.3, 1.9, 0.63);
      break;
    case 'medal':
      box(rig.root, 0.22, 0.75, 0.05, a, 0, 2.85, 0.53, { shadow: false });
      cyl(rig.root, 0.3, 0.3, 0.07, c, 0, 2.45, 0.55, 20, { rx: Math.PI / 2, m: { rough: 0.25, metal: 0.6 } });
      cyl(rig.root, 0.18, 0.18, 0.09, a, 0, 2.45, 0.56, 20, { rx: Math.PI / 2 });
      break;
    case 'wingsStar':
      for (const sd of [-1, 1]) {
        const w = group(rig.root, sd * 0.4, 3.0, -0.62);
        for (let i = 0; i < 3; i++) {
          box(w, 0.34, 1.6 - i * 0.35, 0.08, i === 0 ? c : a, sd * (0.55 + i * 0.42), 0.35 - i * 0.2, 0, { r: 0.12, rz: sd * (-0.55 - i * 0.22), m: { rough: 0.35, emissive: c, ei: 0.15 } });
        }
        ball(w, 0.14, a, sd * 0.45, 1.0, 0.02, 1, 1, 0.4, { m: GLOW });
        wings.push(w);
      }
      break;
    case 'wingsFairy':
      for (const sd of [-1, 1]) {
        const w = group(rig.root, sd * 0.4, 3.0, -0.62);
        const m = { rough: 0.2, opacity: 0.6, emissive: c, ei: 0.35 };
        ball(w, 0.6, c, sd * 0.85, 0.55, 0, 0.14, 1.15, 0.7, { m, rz: sd * -0.4 });
        ball(w, 0.45, c, sd * 0.7, -0.45, 0, 0.14, 0.85, 0.55, { m, rz: sd * 0.35 });
        ball(w, 0.1, a, sd * 1.2, 1.15, 0, 1, 1, 0.5, { m: GLOW });
        wings.push(w);
      }
      break;
  }
}

// ---------------------------------------------------------------- shoes (parent = leg group)
export function buildShoes(rig: Rig, spec: Spec) {
  const style = str(spec.style, 'sneaker');
  const c = str(spec.color, '#3D7BFF');
  const sole = str(spec.sole, '#FFFFFF');
  const a = str(spec.accent, '#FFC83D');
  const y0 = -LEG_H;
  for (const leg of [rig.legL, rig.legR]) {
    switch (style) {
      case 'sneaker':
        box(leg, 0.82, 0.5, 1.1, c, 0, y0 + 0.33, 0.14);
        box(leg, 0.86, 0.16, 1.14, sole, 0, y0 + 0.08, 0.14);
        box(leg, 0.78, 0.28, 0.32, sole, 0, y0 + 0.26, 0.56);
        box(leg, 0.84, 0.1, 0.5, a, 0, y0 + 0.42, 0.1);
        break;
      case 'hightop':
        box(leg, 0.82, 0.9, 1.0, c, 0, y0 + 0.55, 0.1);
        box(leg, 0.86, 0.16, 1.14, sole, 0, y0 + 0.08, 0.14);
        box(leg, 0.78, 0.28, 0.32, sole, 0, y0 + 0.26, 0.56);
        box(leg, 0.86, 0.14, 1.02, a, 0, y0 + 1.02, 0.1);
        break;
      case 'boot':
        box(leg, 0.86, 1.0, 1.05, c, 0, y0 + 0.58, 0.1);
        box(leg, 0.92, 0.2, 1.1, a, 0, y0 + 1.08, 0.1);
        box(leg, 0.9, 0.16, 1.14, sole, 0, y0 + 0.08, 0.12);
        break;
      case 'runner': {
        const m = { rough: 0.25, metal: 0.4, emissive: a, ei: 0.25 };
        box(leg, 0.82, 0.5, 1.1, c, 0, y0 + 0.33, 0.14, { m });
        box(leg, 0.86, 0.16, 1.14, sole, 0, y0 + 0.08, 0.14);
        box(leg, 0.78, 0.28, 0.32, a, 0, y0 + 0.26, 0.56, { m });
        box(leg, 0.12, 0.34, 0.5, a, 0.44, y0 + 0.45, -0.2, { rz: -0.4, m });
        box(leg, 0.12, 0.34, 0.5, a, -0.44, y0 + 0.45, -0.2, { rz: 0.4, m });
        break;
      }
      case 'cloud':
        ball(leg, 0.42, c, 0, y0 + 0.35, 0.05, 1.05, 0.8, 1.2);
        ball(leg, 0.3, c, 0.26, y0 + 0.3, 0.5);
        ball(leg, 0.3, c, -0.26, y0 + 0.3, 0.5);
        ball(leg, 0.2, sole, 0, y0 + 0.12, 0.2, 2, 0.5, 2.4, { shadow: false });
        break;
      case 'space':
        box(leg, 0.9, 1.0, 1.1, c, 0, y0 + 0.58, 0.1, { m: { rough: 0.3 } });
        box(leg, 0.94, 0.12, 1.14, a, 0, y0 + 0.8, 0.1, { m: GLOW });
        box(leg, 0.96, 0.22, 1.16, sole, 0, y0 + 1.1, 0.1);
        box(leg, 0.94, 0.18, 1.2, sole, 0, y0 + 0.09, 0.14);
        break;
    }
  }
}

// ---------------------------------------------------------------- backpacks (parent = root)
export function buildBackpack(rig: Rig, spec: Spec) {
  const style = str(spec.style, 'school');
  const c = str(spec.color, '#E8453C');
  const a = str(spec.accent, '#FFC83D');
  const r = rig.root;
  const straps = () => {
    for (const sd of [-1, 1]) {
      box(r, 0.22, 0.12, 1.15, '#2B2B3A', sd * 0.5, 3.28, -0.05, { r: 0.04 });
      box(r, 0.22, 1.35, 0.06, '#2B2B3A', sd * 0.5, 2.65, 0.52, { r: 0.03 });
    }
  };
  switch (style) {
    case 'school':
      box(r, 1.3, 1.5, 0.55, c, 0, 2.55, -0.8, { r: 0.15 });
      box(r, 1.0, 0.6, 0.2, a, 0, 2.15, -1.12, { r: 0.08 });
      straps();
      break;
    case 'explorer':
      box(r, 1.3, 1.5, 0.6, c, 0, 2.55, -0.82, { r: 0.15 });
      box(r, 1.34, 0.5, 0.66, a, 0, 3.12, -0.82, { r: 0.12 });
      for (const sd of [-1, 1]) box(r, 0.25, 0.7, 0.4, a, sd * 0.78, 2.3, -0.82);
      cyl(r, 0.22, 0.22, 1.3, '#F4E9D2', 0, 1.7, -0.95, 16, { rz: Math.PI / 2 });
      straps();
      break;
    case 'star':
      box(r, 1.3, 1.5, 0.55, c, 0, 2.55, -0.8, { r: 0.15 });
      box(r, 0.55, 0.55, 0.06, a, 0, 2.6, -1.1, { m: { rough: 0.3, emissive: '#FFFFFF', ei: 0.2 } });
      box(r, 0.55, 0.55, 0.06, a, 0, 2.6, -1.1, { rz: Math.PI / 4, m: { rough: 0.3, emissive: '#FFFFFF', ei: 0.2 } });
      straps();
      break;
    case 'dino':
      box(r, 1.3, 1.5, 0.55, c, 0, 2.55, -0.8, { r: 0.15 });
      for (let i = 0; i < 4; i++) cone(r, 0.17, 0.42, a, 0, 3.15 - i * 0.38, -1.12, 4, { rx: -Math.PI / 2 });
      box(r, 0.34, 0.34, 1.0, c, 0, 1.95, -1.3, { rx: 0.3 });
      straps();
      break;
    case 'candy':
      box(r, 1.3, 1.5, 0.55, c, 0, 2.55, -0.8, { r: 0.15 });
      cyl(r, 0.05, 0.05, 1.1, '#FFFFFF', 0.45, 3.7, -0.95, 8);
      cyl(r, 0.4, 0.4, 0.1, '#FF5FA2', 0.45, 4.35, -0.95, 20, { rx: Math.PI / 2 });
      cyl(r, 0.26, 0.26, 0.12, '#FFFFFF', 0.45, 4.35, -0.95, 20, { rx: Math.PI / 2 });
      cyl(r, 0.12, 0.12, 0.14, a, 0.45, 4.35, -0.95, 20, { rx: Math.PI / 2 });
      straps();
      break;
    case 'jet':
      box(r, 1.3, 1.2, 0.3, '#8A93A8', 0, 2.6, -0.75);
      for (const sd of [-1, 1]) {
        cyl(r, 0.38, 0.38, 1.6, c, sd * 0.45, 2.6, -1.0, 18, { m: { rough: 0.25, metal: 0.5 } });
        cone(r, 0.38, 0.45, a, sd * 0.45, 3.62, -1.0, 18);
        cyl(r, 0.3, 0.34, 0.2, '#3A3F5C', sd * 0.45, 1.7, -1.0, 16);
        cone(r, 0.26, 0.8, '#FF9A1F', sd * 0.45, 1.2, -1.0, 12, { rx: Math.PI, m: GLOW });
        cone(r, 0.14, 0.5, '#FFE066', sd * 0.45, 1.35, -1.0, 12, { rx: Math.PI, m: GLOW });
      }
      straps();
      break;
  }
}

// ---------------------------------------------------------------- pets (own group, feet at y = 0)
function fourLegs(g: THREE.Group, color: string, h = 0.5, x = 0.35, z = 0.55) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.28, h, 0.28, color, sx * x, h / 2, sz * z, { r: 0.06 });
}
function eyes(g: THREE.Group, y: number, z: number, x = 0.25, color = '#22223B') {
  for (const sd of [-1, 1]) {
    box(g, 0.12, 0.15, 0.05, color, sd * x, y, z, { r: 0.03, shadow: false });
    box(g, 0.04, 0.04, 0.03, '#FFFFFF', sd * x + 0.02, y + 0.04, z + 0.03, { shadow: false });
  }
}

export function buildPet(spec: Spec): THREE.Group {
  const style = str(spec.style, 'corgi');
  const c = str(spec.color, '#F29B3D');
  const a = str(spec.accent, '#FFFFFF');
  const g = group(null);
  switch (style) {
    case 'corgi':
      box(g, 1.1, 0.75, 1.7, c, 0, 0.95, 0, { r: 0.2 });
      box(g, 0.9, 0.3, 1.3, a, 0, 0.7, 0, { r: 0.1 });
      box(g, 0.9, 0.8, 0.85, c, 0, 1.55, 0.95, { r: 0.18 });
      box(g, 0.55, 0.38, 0.42, a, 0, 1.4, 1.42, { r: 0.1 });
      box(g, 0.18, 0.14, 0.1, '#22223B', 0, 1.52, 1.64, { r: 0.04 });
      box(g, 0.14, 0.14, 0.04, '#FF8FA3', 0, 1.26, 1.6, { shadow: false });
      eyes(g, 1.7, 1.38);
      for (const sd of [-1, 1]) cone(g, 0.22, 0.55, c, sd * 0.32, 2.15, 0.85, 4).rotation.y = Math.PI / 4;
      fourLegs(g, a);
      box(g, 0.28, 0.28, 0.28, a, 0, 1.25, -0.95, { r: 0.1 });
      break;
    case 'cat':
      box(g, 0.9, 0.7, 1.5, c, 0, 0.9, 0, { r: 0.2 });
      box(g, 0.85, 0.75, 0.8, c, 0, 1.55, 0.85, { r: 0.18 });
      box(g, 0.45, 0.3, 0.3, a, 0, 1.4, 1.28, { r: 0.1 });
      box(g, 0.12, 0.1, 0.06, '#FF8FA3', 0, 1.5, 1.45, { r: 0.03 });
      eyes(g, 1.68, 1.26, 0.23, '#2E8B57');
      for (const sd of [-1, 1]) {
        cone(g, 0.22, 0.45, c, sd * 0.3, 2.1, 0.8, 4).rotation.y = Math.PI / 4;
        box(g, 0.5, 0.03, 0.03, '#FFFFFF', sd * 0.55, 1.42, 1.3, { rz: sd * 0.1, shadow: false });
      }
      fourLegs(g, c, 0.5, 0.3, 0.5);
      box(g, 0.2, 0.2, 0.9, c, 0, 1.0, -1.1, { rx: 0.5 });
      box(g, 0.2, 0.2, 0.7, c, 0, 1.5, -1.45, { rx: 1.2 });
      break;
    case 'bunny':
      ball(g, 0.62, c, 0, 0.75, 0, 1, 0.95, 1.1);
      ball(g, 0.46, c, 0, 1.5, 0.45);
      for (const sd of [-1, 1]) {
        box(g, 0.2, 1.0, 0.13, c, sd * 0.2, 2.35, 0.35, { r: 0.06, rz: sd * -0.1 });
        box(g, 0.1, 0.8, 0.03, a, sd * 0.2, 2.35, 0.42, { shadow: false, rz: sd * -0.1 });
        ball(g, 0.2, c, sd * 0.35, 0.2, 0.45, 1, 0.7, 1.4);
      }
      ball(g, 0.08, a, 0, 1.45, 0.9, 1, 1, 1, { shadow: false });
      eyes(g, 1.6, 0.86, 0.2);
      ball(g, 0.22, '#FFFFFF', 0, 0.7, -0.7);
      break;
    case 'fox':
      box(g, 0.95, 0.7, 1.7, c, 0, 0.95, 0, { r: 0.2 });
      box(g, 0.7, 0.5, 0.6, a, 0, 0.9, 0.6, { r: 0.1 });
      box(g, 0.85, 0.75, 0.8, c, 0, 1.55, 0.95, { r: 0.18 });
      box(g, 0.4, 0.3, 0.5, a, 0, 1.4, 1.4, { r: 0.1 });
      box(g, 0.14, 0.12, 0.08, '#22223B', 0, 1.5, 1.66, { r: 0.03 });
      eyes(g, 1.7, 1.36, 0.24);
      for (const sd of [-1, 1]) {
        cone(g, 0.25, 0.6, c, sd * 0.3, 2.15, 0.85, 4).rotation.y = Math.PI / 4;
        cone(g, 0.12, 0.25, '#22223B', sd * 0.3, 2.35, 0.85, 4).rotation.y = Math.PI / 4;
      }
      fourLegs(g, '#3A2B22', 0.5, 0.3, 0.55);
      box(g, 0.5, 0.5, 1.1, c, 0, 1.2, -1.2, { r: 0.2, rx: -0.6 });
      box(g, 0.5, 0.5, 0.4, a, 0, 1.52, -1.7, { r: 0.18, rx: -0.6 });
      break;
    case 'robot':
      box(g, 0.95, 1.0, 0.8, c, 0, 0.95, 0, { r: 0.15, m: { rough: 0.3, metal: 0.4 } });
      box(g, 0.9, 0.7, 0.8, c, 0, 1.85, 0, { r: 0.15, m: { rough: 0.3, metal: 0.4 } });
      box(g, 0.7, 0.45, 0.06, '#102030', 0, 1.85, 0.4, { r: 0.05 });
      for (const sd of [-1, 1]) box(g, 0.14, 0.2, 0.04, a, sd * 0.2, 1.88, 0.44, { shadow: false, m: GLOW });
      box(g, 0.3, 0.1, 0.04, a, 0, 1.7, 0.44, { shadow: false, m: GLOW });
      cyl(g, 0.04, 0.04, 0.4, '#8A93A8', 0, 2.4, 0, 8);
      ball(g, 0.09, a, 0, 2.62, 0, 1, 1, 1, { m: GLOW });
      for (const sd of [-1, 1]) {
        cyl(g, 0.3, 0.3, 0.22, '#3A3F5C', sd * 0.55, 0.3, 0, 16, { rz: Math.PI / 2 });
        box(g, 0.2, 0.6, 0.2, c, sd * 0.62, 1.0, 0, { r: 0.06 });
      }
      box(g, 0.4, 0.4, 0.06, a, 0, 0.95, 0.42, { m: { emissive: a, ei: 0.5 }, shadow: false });
      break;
    case 'dragon':
      box(g, 1.0, 0.8, 1.5, c, 0, 0.95, 0, { r: 0.22 });
      box(g, 0.8, 0.5, 1.2, a, 0, 0.78, 0.05, { r: 0.12 });
      box(g, 0.85, 0.75, 0.9, c, 0, 1.7, 0.95, { r: 0.2 });
      box(g, 0.6, 0.4, 0.45, c, 0, 1.5, 1.5, { r: 0.12 });
      eyes(g, 1.85, 1.38, 0.24, '#FFE066');
      for (const sd of [-1, 1]) {
        cone(g, 0.12, 0.4, a, sd * 0.28, 2.25, 0.8, 4);
        const wing = box(g, 0.08, 0.95, 0.75, c, sd * 0.65, 1.6, -0.25, { r: 0.03, rz: sd * -0.7 });
        wing.castShadow = true;
        box(g, 0.05, 0.7, 0.55, a, sd * 0.7, 1.6, -0.25, { rz: sd * -0.7, shadow: false });
        ball(g, 0.07, '#FF8A3D', sd * 0.18, 1.45, 1.74, 1, 1, 1, { m: GLOW });
      }
      fourLegs(g, c, 0.5, 0.38, 0.5);
      for (let i = 0; i < 3; i++) {
        box(g, 0.4 - i * 0.1, 0.4 - i * 0.1, 0.5, c, 0, 0.95 - i * 0.1, -1.0 - i * 0.4, { r: 0.08 });
        cone(g, 0.1, 0.25, a, 0, 1.2 - i * 0.1, -1.0 - i * 0.4, 4);
      }
      break;
  }
  g.scale.setScalar(0.85);
  return g;
}
