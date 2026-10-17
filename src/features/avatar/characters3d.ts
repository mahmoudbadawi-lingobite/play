import * as THREE from 'three';
import { ARM_H, GLOW, HEAD, HEAD_Y, LEG_H, SHOULDER_Y, TORSO_D, TORSO_W, TORSO_Y, ball, box, cone, cyl, group, torus } from './kit';
import { attachModel, buildAccessory, buildHat } from './items3d';
import type { AvatarHandle, Rig } from './model3d';

/**
 * Character skins: original blocky animal / robot / mascot characters built from
 * rounded boxes. They share the hero's rig so they can run, idle and turn in the
 * store, My Avatar and the 3D runs.
 */

const T = HEAD / 2;
const DARK = '#1C1C2E';

interface Base {
  fur: string;
  torso?: string;
  belly?: string;
  arm?: string;
  hand?: string;
  leg?: string;
  foot?: string;
  head?: string;
  footH?: number;
}
interface Parts {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  /** extra per-frame motion (tails, tentacles...) */
  extras: ((t: number, run: boolean) => void)[];
}

function makeBase(o: Base): Parts {
  const root = group(null);
  const torso = group(root, 0, TORSO_Y, 0);
  box(torso, TORSO_W, 1.75, TORSO_D, o.torso ?? o.fur, 0, 0, 0, { r: 0.18 });
  if (o.belly) box(torso, 1.15, 1.25, 0.06, o.belly, 0, -0.1, TORSO_D / 2, { r: 0.3 });
  const mkLeg = (s: number) => {
    const g = group(root, s * 0.4, LEG_H, 0);
    box(g, 0.72, LEG_H, 0.8, o.leg ?? o.fur, 0, -LEG_H / 2, 0, { r: 0.12 });
    if (o.foot) box(g, 0.82, o.footH ?? 0.34, 1.05, o.foot, 0, -LEG_H + (o.footH ?? 0.34) / 2, 0.12, { r: 0.12 });
    return g;
  };
  const mkArm = (s: number) => {
    const g = group(root, s * 1.13, SHOULDER_Y, 0);
    box(g, 0.56, ARM_H, 0.62, o.arm ?? o.fur, 0, -ARM_H / 2 + 0.15, 0, { r: 0.14 });
    if (o.hand) box(g, 0.6, 0.42, 0.66, o.hand, 0, -ARM_H + 0.3, 0, { r: 0.16 });
    return g;
  };
  const head = group(root, 0, HEAD_Y, 0);
  box(head, HEAD, HEAD, HEAD, o.head ?? o.fur, 0, 0, 0, { r: 0.32 });
  return { root, head, torso, armL: mkArm(-1), armR: mkArm(1), legL: mkLeg(-1), legR: mkLeg(1), extras: [] };
}

// ---------------------------------------------------------------- face parts (head-local, front = +z)
function eyes(h: THREE.Group, o: { y?: number; x?: number; big?: number; pupil?: string; plain?: boolean } = {}) {
  const y = o.y ?? 0.12;
  const x = o.x ?? 0.34;
  const k = o.big ?? 1;
  for (const s of [-1, 1]) {
    if (!o.plain) ball(h, 0.2 * k, '#FFFFFF', s * x, y, T - 0.02, 1, 1.15, 0.45);
    ball(h, 0.12 * k, o.pupil ?? DARK, s * x + (o.plain ? 0 : s * -0.01), y - 0.01, T + 0.07, 1, 1.15, 0.4);
    ball(h, 0.045 * k, '#FFFFFF', s * x + 0.04, y + 0.06 * k, T + 0.12);
  }
}
function smile(h: THREE.Group, y = -0.32, w = 0.36, tongue = false) {
  box(h, w, 0.07, 0.05, DARK, 0, y, T + 0.02, { r: 0.03, shadow: false });
  for (const s of [-1, 1]) box(h, 0.07, 0.12, 0.05, DARK, s * (w / 2), y + 0.05, T + 0.02, { r: 0.03, rz: s * -0.3, shadow: false });
  if (tongue) box(h, 0.16, 0.12, 0.05, '#FF7A9A', 0, y - 0.08, T + 0.02, { r: 0.05, shadow: false });
}
function snout(h: THREE.Group, color: string, w: number, hh: number, d: number, y: number, nose = DARK, noseW = 0.2) {
  box(h, w, hh, d, color, 0, y, T + d / 2 - 0.12, { r: Math.min(0.14, hh / 2.2) });
  box(h, noseW, noseW * 0.7, 0.12, nose, 0, y + hh / 2 - 0.02, T + d - 0.1, { r: 0.05 });
  return T + d - 0.12;
}
function pointyEars(h: THREE.Group, color: string, inner: string | null, x = 0.5, y = 0.5, r = 0.32, ht = 0.65) {
  for (const s of [-1, 1]) {
    cone(h, r, ht, color, s * x, T + y - 0.2, -0.05, 4).rotation.y = Math.PI / 4;
    if (inner) cone(h, r * 0.55, ht * 0.7, inner, s * x, T + y - 0.25, 0.04, 4).rotation.y = Math.PI / 4;
  }
}
function roundEars(h: THREE.Group, color: string, inner: string | null, x = 0.66, y = 0.55, r = 0.34) {
  for (const s of [-1, 1]) {
    ball(h, r, color, s * x, y, -0.05, 1, 1, 0.5);
    if (inner) ball(h, r * 0.6, inner, s * x, y, 0.04, 1, 1, 0.4);
  }
}
function longEars(h: THREE.Group, color: string, inner: string, len = 1.9) {
  for (const s of [-1, 1]) {
    box(h, 0.34, len, 0.16, color, s * 0.38, T + len / 2 - 0.1, -0.05, { r: 0.1, rz: s * -0.08 });
    box(h, 0.16, len * 0.78, 0.04, inner, s * 0.38, T + len / 2 - 0.05, 0.04, { r: 0.05, rz: s * -0.08, shadow: false });
  }
}
function floppyEars(h: THREE.Group, color: string) {
  for (const s of [-1, 1]) box(h, 0.28, 1.0, 0.55, color, s * (T + 0.1), 0.0, -0.05, { r: 0.12, rz: s * 0.12 });
}
function whiskers(h: THREE.Group, y = -0.2, z = T + 0.2) {
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) box(h, 0.55, 0.025, 0.025, '#EDEDED', s * 0.62, y + k * 0.09, z, { rz: s * k * 0.12, shadow: false });
}
function tail(p: Parts, color: string, tip?: string, len = 3, thick = 0.4, y = 1.3) {
  const g = group(p.root, 0, y, -TORSO_D / 2 - 0.1);
  const segs: THREE.Group[] = [];
  let parent: THREE.Group = g;
  for (let i = 0; i < len; i++) {
    const s = group(parent, 0, 0, -thick * 0.9);
    box(s, thick, thick, thick * 1.05, tip && i === len - 1 ? tip : color, 0, 0, 0, { r: 0.12 });
    segs.push(s);
    parent = s;
  }
  p.extras.push((t, run) => segs.forEach((s, i) => (s.rotation.y = Math.sin(t * (run ? 9 : 2.4) - i * 0.7) * 0.28)));
  return g;
}
function bowTie(p: Parts, color: string) {
  box(p.torso, 0.3, 0.26, 0.2, color, -0.22, 0.85, TORSO_D / 2 + 0.05, { r: 0.06, rz: 0.3 });
  box(p.torso, 0.3, 0.26, 0.2, color, 0.22, 0.85, TORSO_D / 2 + 0.05, { r: 0.06, rz: -0.3 });
  box(p.torso, 0.14, 0.18, 0.22, color, 0, 0.85, TORSO_D / 2 + 0.06, { r: 0.04 });
}
function scarf(p: Parts, color: string) {
  torus(p.root, 0.78, 0.2, color, 0, 3.26, 0).rotation.x = Math.PI / 2;
  box(p.root, 0.42, 1.0, 0.14, color, 0.3, 2.45, 0.62, { r: 0.05 });
}

// ---------------------------------------------------------------- the characters
type Builder = () => { p: Parts; scale?: number };

const BUILDERS: Record<string, Builder> = {
  'gray-cat': () => {
    const p = makeBase({ fur: '#8E96A8', belly: '#F4F4F8', hand: '#F4F4F8', foot: '#F4F4F8' });
    pointyEars(p.head, '#8E96A8', '#FF9FB3');
    for (const x of [-0.25, 0, 0.25]) box(p.head, 0.1, 0.3, 0.04, '#5F667A', x, 0.62, T + 0.02, { r: 0.03, shadow: false });
    eyes(p.head, { pupil: '#2E8B57', big: 1.1 });
    snout(p.head, '#F4F4F8', 0.7, 0.42, 0.3, -0.2, '#FF8FA3', 0.16);
    smile(p.head, -0.4, 0.3);
    whiskers(p.head);
    tail(p, '#8E96A8', '#F4F4F8', 4, 0.36, 1.6);
    return { p };
  },
  'brown-mouse': () => {
    const p = makeBase({ fur: '#B87A3F', belly: '#F3D9B1', foot: '#F3D9B1', hand: '#F3D9B1' });
    roundEars(p.head, '#B87A3F', '#FF9FB3', 0.78, 0.5, 0.52);
    eyes(p.head, { big: 1.1 });
    snout(p.head, '#F3D9B1', 0.6, 0.38, 0.3, -0.2, '#FF7A9A', 0.22);
    box(p.head, 0.16, 0.2, 0.05, '#FFFFFF', -0.08, -0.42, T + 0.14, { r: 0.03, shadow: false });
    box(p.head, 0.16, 0.2, 0.05, '#FFFFFF', 0.08, -0.42, T + 0.14, { r: 0.03, shadow: false });
    tail(p, '#FFB3C1', undefined, 5, 0.2, 1.3);
    return { p };
  },
  jellyfish: () => {
    const p = makeBase({ fur: '#FFD84D', torso: '#FFD84D', leg: '#FFE98A', head: '#FFD84D' });
    ball(p.head, 1.02, '#FFE066', 0, 0.15, 0, 1.12, 0.95, 1.12, { m: { rough: 0.2, opacity: 0.55, emissive: '#FFC83D', ei: 0.45 } });
    eyes(p.head, { big: 1.15, y: 0.1 });
    smile(p.head, -0.3, 0.4, true);
    for (const s of [-1, 1]) ball(p.head, 0.14, '#FF8FA3', s * 0.55, -0.2, T - 0.01, 1, 0.7, 0.25, { shadow: false });
    box(p.head, 0.5, 0.2, 0.2, '#3D7BFF', 0, T + 0.55, 0, { r: 0.08 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const g = group(p.root, Math.cos(a) * 0.7, 1.5, Math.sin(a) * 0.5);
      box(g, 0.18, 1.3, 0.18, '#FFE98A', 0, -0.65, 0, { r: 0.08, m: { opacity: 0.8 } });
      p.extras.push((t) => (g.rotation.z = Math.sin(t * 2.4 + i) * 0.25));
    }
    return { p };
  },
  starfish: () => {
    const p = makeBase({ fur: '#FF8FB1', hand: '#FF8FB1', foot: '#FF8FB1', footH: 0.3 });
    cone(p.head, 0.62, 0.95, '#FF8FB1', 0, T + 0.4, 0, 5);
    for (const s of [-1, 1]) cone(p.head, 0.36, 0.7, '#FF8FB1', s * (T + 0.25), 0.25, 0, 5, { rz: s * -1.2 });
    for (const [x, y] of [[-0.45, 0.45], [0.4, 0.5], [0.1, 0.6], [-0.2, -0.45], [0.5, -0.4]]) ball(p.head, 0.09, '#FFC2D6', x, y, T - 0.02, 1, 1, 0.3, { shadow: false });
    eyes(p.head, { big: 1.15 });
    smile(p.head, -0.3, 0.4, true);
    box(p.head, 1.2, 0.5, 0.2, '#4AA8FF', 0, 0.55, T + 0.05, { r: 0.12, m: { opacity: 0.55, rough: 0.15 } });
    box(p.head, 1.5, 0.12, 1.5, '#FF9A1F', 0, 0.62, 0, { r: 0.05 });
    for (const [x, y] of [[-0.4, 0.2], [0.4, 0.35], [0, -0.3]]) ball(p.torso, 0.09, '#FFC2D6', x, y, TORSO_D / 2, 1, 1, 0.3, { shadow: false });
    return { p };
  },
  duck: () => {
    const p = makeBase({ fur: '#FFFFFF', torso: '#FFD23F', arm: '#FFD23F', hand: '#FFFFFF', foot: '#E8453C', footH: 0.6, leg: '#FFFFFF' });
    box(p.torso, 1.5, 0.7, 0.6, '#FFD23F', 0, 0.95, -0.4, { r: 0.2 });
    for (let i = 0; i < 3; i++) ball(p.torso, 0.07, '#E8A800', 0, 0.5 - i * 0.4, TORSO_D / 2 + 0.02, 1, 1, 0.5);
    eyes(p.head, { big: 1.05, y: 0.2 });
    box(p.head, 0.82, 0.2, 0.55, '#FF9A1F', 0, -0.1, T + 0.2, { r: 0.1 });
    box(p.head, 0.74, 0.14, 0.45, '#E8841A', 0, -0.26, T + 0.15, { r: 0.07 });
    box(p.head, 0.14, 0.5, 0.1, '#FFFFFF', 0, T + 0.2, 0, { r: 0.05, rz: 0.4 });
    box(p.root, 0.4, 0.4, 0.5, '#FFFFFF', 0, 1.7, -0.8, { r: 0.12, rx: 0.5 });
    return { p };
  },
  dog: () => {
    const p = makeBase({ fur: '#C98B4B', torso: '#E8453C', arm: '#E8453C', hand: '#C98B4B', leg: '#3D5A9E', foot: '#2B2B3A' });
    floppyEars(p.head, '#6B4423');
    ball(p.head, 0.3, '#6B4423', 0.32, 0.18, T - 0.02, 1, 1, 0.25, { shadow: false });
    eyes(p.head, { y: 0.2 });
    snout(p.head, '#E9C79A', 0.7, 0.48, 0.45, -0.2, DARK, 0.28);
    smile(p.head, -0.42, 0.34, true);
    box(p.torso, 1.0, 0.45, 0.08, '#C73A32', 0, -0.5, TORSO_D / 2 + 0.03, { r: 0.1 });
    box(p.torso, 1.5, 0.6, 0.55, '#E8453C', 0, 0.95, -0.4, { r: 0.2 });
    tail(p, '#C98B4B', undefined, 2, 0.36, 1.9);
    return { p };
  },
  rabbit: () => {
    const p = makeBase({ fur: '#D7DBE4', belly: '#FFFFFF', foot: '#FFFFFF', hand: '#FFFFFF' });
    longEars(p.head, '#D7DBE4', '#FFB3C8', 2.0);
    eyes(p.head, { big: 1.05 });
    snout(p.head, '#FFFFFF', 0.62, 0.38, 0.28, -0.2, '#FF8FA3', 0.16);
    box(p.head, 0.14, 0.22, 0.05, '#FFFFFF', -0.07, -0.44, T + 0.12, { r: 0.03 });
    box(p.head, 0.14, 0.22, 0.05, '#FFFFFF', 0.07, -0.44, T + 0.12, { r: 0.03 });
    scarf(p, '#2DB36B');
    ball(p.root, 0.38, '#FFFFFF', 0, 1.7, -0.65);
    return { p };
  },
  coyote: () => {
    const p = makeBase({ fur: '#C9A06A', belly: '#EAD7B4', torso: '#C9A06A', hand: '#C9A06A', foot: '#3A2B22' });
    box(p.torso, 1.74, 1.78, 0.1, '#8A5A33', 0, 0, TORSO_D / 2 - 0.04, { r: 0.1 });
    box(p.torso, 0.14, 1.7, 0.12, '#6B4423', 0, 0, TORSO_D / 2 + 0.02, { r: 0.04 });
    pointyEars(p.head, '#C9A06A', '#EAD7B4', 0.5, 0.55, 0.34, 0.8);
    eyes(p.head, { pupil: '#8A5A00', y: 0.16 });
    for (const s of [-1, 1]) box(p.head, 0.34, 0.07, 0.05, '#5A3B1F', s * 0.34, 0.4, T + 0.04, { r: 0.03, rz: s * -0.3, shadow: false });
    snout(p.head, '#EAD7B4', 0.62, 0.46, 0.6, -0.18, DARK, 0.24);
    smile(p.head, -0.42, 0.3);
    tail(p, '#C9A06A', '#5A3B1F', 4, 0.42, 1.5);
    return { p };
  },
  bluebird: () => {
    const p = makeBase({ fur: '#3D8BFF', belly: '#BFE0FF', arm: '#2F6BE0', leg: '#F29B1F', foot: '#E8453C', footH: 0.4, hand: '#2F6BE0' });
    for (const [x, r] of [[-0.25, 0.25], [0, 0], [0.25, -0.25]] as const) cone(p.head, 0.16, 0.8, '#2F6BE0', x, T + 0.3, 0, 4, { rz: r });
    eyes(p.head, { big: 1.2, y: 0.2, x: 0.38 });
    box(p.head, 0.34, 0.2, 0.5, '#FF9A1F', 0, -0.05, T + 0.22, { r: 0.08 });
    box(p.head, 0.3, 0.12, 0.4, '#E8841A', 0, -0.2, T + 0.18, { r: 0.06 });
    for (let i = 0; i < 3; i++) box(p.root, 0.3, 0.3, 1.6, '#2F6BE0', (i - 1) * 0.4, 1.8 + i * 0.1, -1.4, { r: 0.1, rx: 0.3 - i * 0.1 });
    for (const s of [-1, 1]) p.extras.push((t) => ((s < 0 ? p.armL : p.armR).rotation.z = s * (0.15 + Math.sin(t * 6) * 0.08)));
    return { p };
  },
  bulldog: () => {
    const p = makeBase({ fur: '#A89A8C', belly: '#E8DDD0', hand: '#A89A8C', foot: '#6B5B4B' });
    for (const s of [-1, 1]) box(p.head, 0.4, 0.4, 0.35, '#6B5B4B', s * 0.62, 0.55, 0.0, { r: 0.1, rz: s * 0.5 });
    for (const s of [-1, 1]) box(p.head, 0.5, 0.5, 0.5, '#A89A8C', s * 0.42, -0.28, T + 0.05, { r: 0.2 });
    eyes(p.head, { y: 0.14 });
    for (const s of [-1, 1]) box(p.head, 0.36, 0.09, 0.05, '#4B3F36', s * 0.34, 0.36, T + 0.04, { r: 0.03, rz: s * 0.35, shadow: false });
    box(p.head, 0.55, 0.3, 0.2, '#2B2B3A', 0, -0.05, T + 0.12, { r: 0.1 });
    for (const s of [-1, 1]) box(p.head, 0.1, 0.18, 0.06, '#FFFFFF', s * 0.2, -0.45, T + 0.12, { r: 0.03 });
    box(p.head, 0.5, 0.1, 0.05, DARK, 0, -0.36, T + 0.12, { r: 0.04, shadow: false });
    torus(p.root, 0.8, 0.14, '#3D7BFF', 0, 3.22, 0).rotation.x = Math.PI / 2;
    cyl(p.torso, 0.16, 0.16, 0.06, '#FFC83D', 0, 0.8, TORSO_D / 2 + 0.05, 14, { rx: Math.PI / 2 });
    tail(p, '#A89A8C', undefined, 1, 0.3, 1.4);
    return { p };
  },
  'tuxedo-cat': () => {
    const p = makeBase({ fur: '#25252F', belly: '#FFFFFF', hand: '#FFFFFF', foot: '#FFFFFF' });
    pointyEars(p.head, '#25252F', '#FF9FB3');
    box(p.head, 0.95, 0.85, 0.06, '#FFFFFF', 0, -0.2, T + 0.0, { r: 0.28 });
    eyes(p.head, { big: 1.15, pupil: '#2E8B57' });
    snout(p.head, '#FFFFFF', 0.55, 0.3, 0.25, -0.22, '#FF8FA3', 0.16);
    smile(p.head, -0.44, 0.5, false);
    whiskers(p.head, -0.25);
    bowTie(p, '#E8453C');
    tail(p, '#25252F', '#FFFFFF', 4, 0.36, 1.6);
    return { p };
  },
  chick: () => {
    const p = makeBase({ fur: '#FFE14D', belly: '#FFF2A0', leg: '#FF9A1F', foot: '#FF9A1F', footH: 0.3 });
    eyes(p.head, { big: 1.15, y: 0.16 });
    cone(p.head, 0.18, 0.4, '#FF9A1F', 0, -0.1, T + 0.25, 4, { rx: Math.PI / 2 });
    for (const x of [-0.18, 0, 0.18]) box(p.head, 0.1, 0.35, 0.1, '#FFE14D', x, T + 0.2, 0, { r: 0.04, rz: x });
    return { p, scale: 0.92 };
  },
  bear: () => {
    const p = makeBase({ fur: '#8A5A33', torso: '#C9A66B', hand: '#8A5A33', foot: '#5A3B1F', leg: '#6B4A2B' });
    roundEars(p.head, '#8A5A33', '#D9B38C');
    eyes(p.head, { big: 0.9, plain: true });
    snout(p.head, '#D9B38C', 0.7, 0.48, 0.32, -0.2, DARK, 0.24);
    smile(p.head, -0.42, 0.3);
    box(p.torso, 0.55, 0.5, 0.08, '#B8924F', 0.4, 0.3, TORSO_D / 2 + 0.03, { r: 0.08 });
    box(p.root, 1.2, 1.5, 0.55, '#3D7BFF', 0, 2.5, -0.85, { r: 0.15 });
    buildHat(p.head, { style: 'explorer', color: '#C9A66B', accent: '#6B4A2B' });
    return { p };
  },
  fox: () => {
    const p = makeBase({ fur: '#F2762E', belly: '#FFFFFF', torso: '#2F8F4E', hand: '#F2762E', leg: '#3A2B22', foot: '#3A2B22' });
    box(p.torso, 0.7, 1.6, 0.06, '#F4F0E0', 0, -0.05, TORSO_D / 2 + 0.02, { r: 0.05 });
    pointyEars(p.head, '#F2762E', '#FFFFFF', 0.5, 0.6, 0.34, 0.8);
    for (const s of [-1, 1]) cone(p.head, 0.14, 0.28, DARK, s * 0.5, T + 0.62, -0.05, 4).rotation.y = Math.PI / 4;
    box(p.head, 1.2, 0.5, 0.08, '#FFFFFF', 0, -0.3, T - 0.03, { r: 0.2 });
    eyes(p.head, { pupil: '#8A4A00', y: 0.16 });
    snout(p.head, '#FFFFFF', 0.5, 0.36, 0.5, -0.15, DARK, 0.2);
    smile(p.head, -0.4, 0.26);
    tail(p, '#F2762E', '#FFFFFF', 4, 0.5, 1.6);
    return { p };
  },
  wolf: () => {
    const p = makeBase({ fur: '#7F8794', belly: '#C9CED8', hand: '#7F8794', foot: '#4B5260' });
    pointyEars(p.head, '#7F8794', '#C9CED8', 0.5, 0.6, 0.36, 0.85);
    eyes(p.head, { pupil: '#B8860B', y: 0.16 });
    for (const s of [-1, 1]) box(p.head, 0.34, 0.07, 0.05, '#4B5260', s * 0.34, 0.4, T + 0.04, { r: 0.03, rz: s * 0.25, shadow: false });
    snout(p.head, '#C9CED8', 0.6, 0.5, 0.65, -0.2, DARK, 0.24);
    smile(p.head, -0.45, 0.3);
    box(p.torso, 1.0, 0.5, 0.1, '#C9CED8', 0, 0.55, TORSO_D / 2 + 0.01, { r: 0.2 });
    tail(p, '#7F8794', '#C9CED8', 4, 0.5, 1.5);
    return { p };
  },
  panda: () => {
    const p = makeBase({ fur: '#FFFFFF', arm: '#23232F', leg: '#23232F', foot: '#23232F', hand: '#23232F' });
    roundEars(p.head, '#23232F', null, 0.6, 0.6, 0.34);
    for (const s of [-1, 1]) ball(p.head, 0.3, '#23232F', s * 0.36, 0.12, T - 0.03, 1, 1.25, 0.3, { rz: s * 0.3 });
    eyes(p.head, { big: 0.7, plain: true, pupil: '#FFFFFF' });
    for (const s of [-1, 1]) ball(p.head, 0.07, DARK, s * 0.34, 0.12, T + 0.1);
    snout(p.head, '#F2F2F2', 0.5, 0.34, 0.28, -0.22, DARK, 0.22);
    smile(p.head, -0.42, 0.26);
    return { p };
  },
  elephant: () => {
    const p = makeBase({ fur: '#7FA6D9', belly: '#B7D0EE', hand: '#7FA6D9', foot: '#5D86BA' });
    for (const s of [-1, 1]) {
      ball(p.head, 0.85, '#7FA6D9', s * 1.0, 0.1, -0.1, 1, 1.1, 0.25);
      ball(p.head, 0.6, '#FFB3C8', s * 1.02, 0.1, -0.03, 1, 1.1, 0.2, { shadow: false });
    }
    eyes(p.head, { y: 0.22, big: 0.95 });
    for (let i = 0; i < 4; i++) box(p.head, 0.38 - i * 0.03, 0.4, 0.38 - i * 0.03, '#7FA6D9', 0, -0.05 - i * 0.34, T + 0.18 + (i > 1 ? (i - 1) * 0.1 : 0), { r: 0.12 });
    for (const s of [-1, 1]) cone(p.head, 0.1, 0.45, '#FFFFFF', s * 0.32, -0.3, T + 0.2, 5, { rx: 1.2 });
    smile(p.head, -0.62, 0.2);
    tail(p, '#7FA6D9', '#5D86BA', 2, 0.22, 1.5);
    return { p };
  },
  lion: () => {
    const p = makeBase({ fur: '#D9A441', belly: '#F2D49B', hand: '#D9A441', foot: '#9A5B1E' });
    box(p.head, 2.0, 2.0, 0.6, '#9A5B1E', 0, 0.05, -0.55, { r: 0.4 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ball(p.head, 0.36, '#B8742C', Math.cos(a) * 0.95, Math.sin(a) * 0.95 + 0.05, -0.1, 1, 1, 0.7);
    }
    roundEars(p.head, '#D9A441', '#F2D49B', 0.62, 0.62, 0.28);
    eyes(p.head, { y: 0.14, pupil: '#6B4423' });
    snout(p.head, '#F2D49B', 0.6, 0.42, 0.32, -0.2, '#6B4423', 0.24);
    smile(p.head, -0.4, 0.28);
    box(p.root, 1.8, 2.6, 0.12, '#D12E3A', 0, 2.1, -0.62, { r: 0.08, rx: 0.08 });
    box(p.root, 1.9, 0.2, 0.2, '#FFC83D', 0, 3.3, -0.55, { r: 0.08 });
    buildHat(p.head, { style: 'crown', color: '#FFC83D', accent: '#E8453C' });
    tail(p, '#D9A441', '#9A5B1E', 3, 0.3, 1.2);
    return { p };
  },
  penguin: () => {
    const p = makeBase({ fur: '#23233A', belly: '#FFFFFF', foot: '#FF9A1F', footH: 0.32, hand: '#23233A' });
    box(p.head, 0.95, 0.7, 0.06, '#FFFFFF', 0, -0.05, T - 0.01, { r: 0.25 });
    eyes(p.head, { big: 1.0, y: 0.15 });
    cone(p.head, 0.26, 0.5, '#FF9A1F', 0, -0.12, T + 0.24, 4, { rx: Math.PI / 2 });
    scarf(p, '#E8453C');
    return { p };
  },
  croc: () => {
    const p = makeBase({ fur: '#4CAF50', belly: '#E9E4A8', hand: '#4CAF50', foot: '#388E3C' });
    box(p.head, 0.95, 0.4, 1.0, '#4CAF50', 0, -0.05, T + 0.4, { r: 0.14 });
    box(p.head, 0.9, 0.22, 0.95, '#E9E4A8', 0, -0.35, T + 0.38, { r: 0.1 });
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) cone(p.head, 0.05, 0.12, '#FFFFFF', s * 0.42, -0.18, T + 0.15 + i * 0.22, 4, { rx: Math.PI });
    for (const s of [-1, 1]) {
      ball(p.head, 0.22, '#4CAF50', s * 0.34, 0.55, T - 0.1);
      ball(p.head, 0.14, '#FFFFFF', s * 0.34, 0.58, T + 0.04);
      ball(p.head, 0.08, DARK, s * 0.34, 0.58, T + 0.14);
      ball(p.head, 0.05, DARK, s * 0.2, 0.05, T + 0.85, 1, 1, 1);
    }
    for (let i = 0; i < 3; i++) cone(p.torso, 0.18, 0.4, '#388E3C', 0, 0.55 - i * 0.55, -TORSO_D / 2 - 0.1, 4, { rx: -Math.PI / 2 });
    tail(p, '#4CAF50', '#388E3C', 5, 0.42, 1.4);
    return { p };
  },
  monkey: () => {
    const p = makeBase({ fur: '#8A5A33', belly: '#D9B38C', hand: '#D9B38C', foot: '#5A3B1F' });
    roundEars(p.head, '#8A5A33', '#D9B38C', 0.8, 0.1, 0.4);
    box(p.head, 1.0, 0.85, 0.06, '#E9C9A0', 0, -0.12, T - 0.01, { r: 0.3 });
    ball(p.head, 0.34, '#E9C9A0', -0.3, 0.2, T - 0.01, 1, 1, 0.2);
    ball(p.head, 0.34, '#E9C9A0', 0.3, 0.2, T - 0.01, 1, 1, 0.2);
    eyes(p.head, { big: 0.9, y: 0.2 });
    snout(p.head, '#E9C9A0', 0.55, 0.3, 0.22, -0.28, DARK, 0.16);
    smile(p.head, -0.45, 0.3, true);
    const g = tail(p, '#8A5A33', undefined, 5, 0.3, 1.2);
    g.rotation.x = -0.9;
    return { p };
  },
  horse: () => {
    const p = makeBase({ fur: '#A9632D', hand: '#A9632D', foot: '#2B1B10', belly: '#B9733D' });
    box(p.head, 0.8, 1.0, 0.8, '#A9632D', 0, -0.4, T + 0.3, { r: 0.28 });
    box(p.head, 0.2, 1.2, 0.06, '#FFFFFF', 0, -0.2, T + 0.72, { r: 0.05, shadow: false });
    pointyEars(p.head, '#A9632D', '#6B3A18', 0.45, 0.45, 0.26, 0.6);
    eyes(p.head, { y: 0.28, x: 0.5, plain: true });
    for (const s of [-1, 1]) ball(p.head, 0.06, DARK, s * 0.2, -0.78, T + 0.72);
    for (let i = 0; i < 4; i++) box(p.head, 0.28, 0.45, 0.3, '#3A2216', 0, T - i * 0.35 + 0.05, -0.45 - i * 0.05, { r: 0.1 });
    box(p.head, 0.5, 0.2, 0.2, '#3A2216', 0, T + 0.1, 0.4, { r: 0.1 });
    tail(p, '#3A2216', undefined, 4, 0.32, 1.5);
    return { p };
  },
  cow: () => {
    const p = makeBase({ fur: '#FFFFFF', belly: '#FFFFFF', hand: '#23232F', foot: '#23232F' });
    for (const [x, y, z, w, h] of [[-0.5, 0.2, TORSO_D / 2, 0.7, 0.6], [0.45, -0.3, TORSO_D / 2, 0.6, 0.7], [0.2, 0.6, TORSO_D / 2, 0.45, 0.4]] as const) box(p.torso, w, h, 0.05, '#23232F', x, y, z + 0.0, { r: 0.18, shadow: false });
    box(p.head, 0.55, 0.5, 0.05, '#23232F', -0.4, 0.4, T + 0.0, { r: 0.18, shadow: false });
    for (const s of [-1, 1]) {
      box(p.head, 0.55, 0.3, 0.2, '#FFFFFF', s * 0.95, 0.2, -0.05, { r: 0.1, rz: s * -0.35 });
      cone(p.head, 0.1, 0.4, '#EAD9B8', s * 0.45, T + 0.2, -0.05, 6);
    }
    eyes(p.head, { y: 0.22 });
    box(p.head, 0.95, 0.5, 0.35, '#FFB3C8', 0, -0.33, T + 0.12, { r: 0.18 });
    for (const s of [-1, 1]) ball(p.head, 0.06, '#C97A93', s * 0.22, -0.3, T + 0.3, 1, 1.3, 0.5);
    torus(p.root, 0.78, 0.1, '#E8453C', 0, 3.2, 0).rotation.x = Math.PI / 2;
    ball(p.torso, 0.18, '#FFC83D', 0, 0.78, TORSO_D / 2 + 0.05, 1, 1, 0.9, { m: { metal: 0.6, rough: 0.3 } });
    tail(p, '#FFFFFF', '#23232F', 3, 0.22, 1.5);
    return { p };
  },
  'pilot-penguin': () => {
    const p = makeBase({ fur: '#23233A', belly: '#FFFFFF', foot: '#FF9A1F', footH: 0.32, hand: '#23233A' });
    box(p.head, 0.95, 0.7, 0.06, '#FFFFFF', 0, -0.1, T - 0.01, { r: 0.25 });
    eyes(p.head, { big: 1.0, y: 0.08 });
    cone(p.head, 0.26, 0.5, '#FF9A1F', 0, -0.2, T + 0.24, 4, { rx: Math.PI / 2 });
    box(p.head, 1.62, 0.7, 1.62, '#8A5A33', 0, T - 0.05, 0, { r: 0.3 });
    for (const s of [-1, 1]) box(p.head, 0.22, 0.6, 0.55, '#6B4223', s * 0.82, 0.2, 0.1, { r: 0.1 });
    buildAccessory({ head: p.head, root: p.root } as unknown as Rig, { style: 'goggles', color: '#6B4223', accent: '#4AA8FF' }, []);
    scarf(p, '#E8453C');
    return { p };
  },
  dino: () => {
    const p = makeBase({ fur: '#53B848', belly: '#F2E394', hand: '#53B848', foot: '#3E9A38' });
    box(p.head, 0.95, 0.6, 0.7, '#53B848', 0, -0.2, T + 0.3, { r: 0.22 });
    for (const s of [-1, 1]) ball(p.head, 0.05, DARK, s * 0.22, -0.02, T + 0.66);
    eyes(p.head, { y: 0.28, big: 1.05 });
    smile(p.head, -0.45, 0.5, false);
    for (let i = 0; i < 3; i++) cone(p.head, 0.14, 0.34, '#FF9A1F', 0, T + 0.05 - i * 0.38, -0.2 - i * 0.2, 4, { rx: -0.5 });
    for (let i = 0; i < 4; i++) cone(p.torso, 0.18, 0.4, '#FF9A1F', 0, 0.7 - i * 0.48, -TORSO_D / 2 - 0.08, 4, { rx: -Math.PI / 2 });
    tail(p, '#53B848', '#3E9A38', 5, 0.46, 1.3);
    return { p };
  },
  robot: () => {
    const p = makeBase({ fur: '#F4F6FF', hand: '#4AA8FF', foot: '#4AA8FF', leg: '#F4F6FF', arm: '#F4F6FF', head: '#F4F6FF' });
    box(p.head, 1.15, 0.8, 0.08, '#101A2E', 0, 0.05, T - 0.01, { r: 0.18 });
    for (const s of [-1, 1]) box(p.head, 0.2, 0.28, 0.05, '#4AE3FF', s * 0.3, 0.1, T + 0.05, { r: 0.08, m: GLOW, shadow: false });
    box(p.head, 0.4, 0.07, 0.05, '#4AE3FF', 0, -0.18, T + 0.05, { r: 0.03, m: GLOW, shadow: false });
    cyl(p.head, 0.04, 0.04, 0.5, '#8A93A8', 0, T + 0.2, 0, 8);
    ball(p.head, 0.12, '#FF5F5F', 0, T + 0.5, 0, 1, 1, 1, { m: GLOW });
    for (const s of [-1, 1]) cyl(p.head, 0.26, 0.26, 0.2, '#4AA8FF', s * (T + 0.05), 0, 0, 16, { rz: Math.PI / 2 });
    box(p.torso, 0.9, 0.6, 0.06, '#101A2E', 0, 0.2, TORSO_D / 2, { r: 0.1 });
    box(p.torso, 0.5, 0.12, 0.05, '#4AE3FF', 0, 0.2, TORSO_D / 2 + 0.04, { m: GLOW, shadow: false });
    for (const g of [p.armL, p.armR]) ball(g, 0.3, '#4AA8FF', 0, 0.05, 0);
    return { p };
  },
};

/** The LingoBite mascot: a golden cookie with chocolate chips, a happy face and a game controller. */
function cookie(): { p: Parts; scale?: number } {
  const root = group(null);
  const torso = group(root, 0, 3.15, 0);
  const disc = cyl(torso, 2.0, 2.0, 0.8, '#E39A3B', 0, 0, 0, 40, { rx: Math.PI / 2, m: { rough: 0.8 } });
  disc.castShadow = true;
  cyl(torso, 1.85, 1.85, 0.06, '#EDAA4F', 0, 0, 0.4, 40, { rx: Math.PI / 2, m: { rough: 0.9 } });
  for (const [x, y, r] of [[-1.1, 1.0, 0.24], [0.9, 1.2, 0.26], [1.35, -0.1, 0.22], [-1.4, -0.3, 0.26], [0.15, 1.55, 0.18], [-0.35, 0.95, 0.15], [1.15, -1.05, 0.2]] as const) {
    ball(torso, r, '#5A3220', x, y, 0.42, 1, 1, 0.35, { m: { rough: 0.6 } });
  }
  for (const s of [-1, 1]) {
    ball(torso, 0.3, '#FFFFFF', s * 0.62, 0.3, 0.45, 1, 1.15, 0.35);
    ball(torso, 0.2, DARK, s * 0.62, 0.28, 0.56, 1, 1.15, 0.35);
    ball(torso, 0.075, '#FFFFFF', s * 0.62 + 0.07, 0.38, 0.62);
    ball(torso, 0.2, '#FF7F7F', s * 1.15, -0.2, 0.44, 1, 0.7, 0.25, { shadow: false });
  }
  box(torso, 0.7, 0.1, 0.05, DARK, 0, -0.25, 0.45, { r: 0.04, shadow: false });
  box(torso, 0.55, 0.32, 0.05, '#C93A4F', 0, -0.45, 0.45, { r: 0.12, shadow: false });
  const mkLeg = (s: number) => {
    const g = group(root, s * 0.7, 1.4, 0);
    box(g, 0.6, 1.0, 0.6, '#E39A3B', 0, -0.5, 0, { r: 0.2 });
    box(g, 0.85, 0.42, 1.1, '#3D7BFF', 0, -1.2, 0.18, { r: 0.18 });
    box(g, 0.88, 0.1, 1.14, '#FFFFFF', 0, -1.38, 0.18, { r: 0.05 });
    return g;
  };
  const mkArm = (s: number) => {
    const g = group(root, s * 2.05, 2.4, 0.15);
    box(g, 0.5, 0.9, 0.5, '#E39A3B', 0, -0.4, 0.2, { r: 0.2, rx: -0.4 });
    ball(g, 0.34, '#E39A3B', 0, -0.85, 0.5);
    return g;
  };
  const pad = group(root, 0, 2.15, 1.05);
  box(pad, 1.6, 0.6, 0.35, '#2B2B3A', 0, 0, 0, { r: 0.2 });
  box(pad, 0.28, 0.08, 0.06, '#8A93A8', -0.5, 0.05, 0.19, { shadow: false });
  box(pad, 0.08, 0.28, 0.06, '#8A93A8', -0.5, 0.05, 0.19, { shadow: false });
  for (const [x, y, c] of [[0.45, 0.12, '#FFC83D'], [0.6, 0.0, '#E8453C'], [0.3, 0.0, '#3D7BFF'], [0.45, -0.12, '#2DB36B']] as const) ball(pad, 0.065, c, x, y, 0.2, 1, 1, 0.5, { shadow: false });
  const head = group(root, 0, 3.15, 0); // unused by the model, kept for the shared animation
  return { p: { root, head, torso, armL: mkArm(-1), armR: mkArm(1), legL: mkLeg(-1), legR: mkLeg(1), extras: [(t) => (torso.rotation.z = Math.sin(t * 1.4) * 0.04)] }, scale: 1 };
}

BUILDERS.cookie = cookie;

export const CHARACTER_MODELS = Object.keys(BUILDERS);

/** Builds a character skin. Unknown ids fall back to the cookie. */
export function buildCharacter(model: string, spec?: Record<string, string | number | boolean>): AvatarHandle {
  if (spec?.modelUrl) {
    // an admin-made character: any .glb model, standing on the platform and bobbing a little
    const root = new THREE.Group() as AvatarHandle;
    const holder = new THREE.Group();
    root.add(holder);
    attachModel(holder, spec, 4.8);
    root.userData.tick = (t, pose) => {
      const run = pose === 'run';
      holder.position.y = run ? Math.abs(Math.sin(t * 11)) * 0.2 : Math.sin(t * 1.6) * 0.04;
      holder.rotation.z = run ? Math.sin(t * 11) * 0.06 : 0;
    };
    return root;
  }
  const { p, scale } = (BUILDERS[model] ?? cookie)();
  const avatar = new THREE.Group() as AvatarHandle;
  p.root.scale.setScalar(scale ?? 1);
  avatar.add(p.root);
  const isCookie = model === 'cookie';
  if (!isCookie) {
    p.head.scale.setScalar(1.2); // bigger heads make the characters cuter
    p.head.position.y += 0.14;
  }
  avatar.userData.tick = (t, pose) => {
    const run = pose === 'run';
    const sw = run ? Math.sin(t * 11) * 0.9 : Math.sin(t * 1.6) * 0.04;
    p.armL.rotation.x = sw;
    p.armR.rotation.x = -sw;
    p.legL.rotation.x = run ? -sw : 0;
    p.legR.rotation.x = run ? sw : 0;
    p.root.position.y = run ? Math.abs(Math.sin(t * 11)) * 0.18 : Math.sin(t * 1.6) * 0.03;
    if (!isCookie) p.head.rotation.y = run ? 0 : Math.sin(t * 0.8) * 0.12;
    p.extras.forEach((f) => f(t, run));
  };
  return avatar;
}
