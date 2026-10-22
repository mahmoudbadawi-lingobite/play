import * as THREE from 'three';
import { TEXT_SIZE_DEFAULT, getItem, hairColor, skinColor, textOfSpec, type Gender, type Look, type OutfitText } from './catalog';
import { ARM_H, GLOW, HEAD, HEAD_Y, LEG_H, SHOULDER_Y, TORSO_D, TORSO_W, TORSO_Y, ball, box, cone, cyl, group, torus } from './kit';
import { buildAccessory, buildBackpack, buildHat, buildPet, buildShoes, type HoldInfo } from './items3d';
import { buildCharacter } from './characters3d';

/** Everything a builder needs to attach parts to the right place. */
export interface Rig {
  root: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  gender: Gender;
  skin: string;
  hair: string;
}

const H2 = HEAD / 2;

function makeRig(gender: Gender, look: Look): Rig {
  const skin = skinColor(look.skin);
  const root = group(null);
  const torso = group(root, 0, TORSO_Y, 0);
  box(torso, TORSO_W, 1.75, TORSO_D, skin);

  const mkLeg = (side: number) => {
    const g = group(root, side * 0.4, LEG_H, 0);
    box(g, 0.72, LEG_H, 0.8, skin, 0, -LEG_H / 2, 0);
    return g;
  };
  const mkArm = (side: number) => {
    const g = group(root, side * 1.13, SHOULDER_Y, 0);
    box(g, 0.56, ARM_H, 0.62, skin, 0, -ARM_H / 2 + 0.15, 0);
    return g;
  };
  const head = group(root, 0, HEAD_Y, 0);
  box(head, HEAD, HEAD, HEAD, skin, 0, 0, 0, { r: 0.22 });

  // face
  const eye = '#22223B';
  for (const s of [-1, 1]) {
    box(head, 0.2, 0.3, 0.06, eye, s * 0.36, 0.02, H2 + 0.005, { r: 0.04 });
    box(head, 0.07, 0.07, 0.03, '#FFFFFF', s * 0.36 + 0.04, 0.12, H2 + 0.035, { r: 0.02, shadow: false });
    if (gender === 'girl') {
      box(head, 0.16, 0.05, 0.04, eye, s * 0.5, 0.2, H2 + 0.01, { r: 0.02, rz: s * -0.5, shadow: false }); // lashes
      ball(head, 0.13, '#FF8FA3', s * 0.55, -0.2, H2 - 0.01, 1, 0.7, 0.2, { m: { rough: 0.9 }, shadow: false }); // blush
    } else {
      box(head, 0.3, 0.06, 0.04, '#3A2B22', s * 0.36, 0.3, H2 + 0.01, { r: 0.02, rz: s * 0.12, shadow: false }); // brows
    }
  }
  box(head, 0.36, 0.08, 0.04, '#22223B', 0, -0.3, H2 + 0.005, { r: 0.03 });
  box(head, 0.09, 0.09, 0.04, '#22223B', -0.2, -0.26, H2 + 0.005, { r: 0.03 });
  box(head, 0.09, 0.09, 0.04, '#22223B', 0.2, -0.26, H2 + 0.005, { r: 0.03 });

  return { root, head, torso, armL: mkArm(-1), armR: mkArm(1), legL: mkLeg(-1), legR: mkLeg(1), gender, skin, hair: hairColor(look.hairColor) };
}

// ---------------------------------------------------------------- outfits
type Spec = Record<string, string | number | boolean>;
const s = (v: unknown, d: string) => (typeof v === 'string' ? v : d);

function addBottoms(rig: Rig, kind: string, color: string, accent: string) {
  if (kind === 'pants') {
    for (const leg of [rig.legL, rig.legR]) {
      box(leg, 0.78, 1.25, 0.86, color, 0, -0.62, 0);
      box(leg, 0.8, 0.12, 0.88, accent, 0, -1.25, 0, { m: { rough: 0.7 } });
    }
  } else if (kind === 'shorts') {
    for (const leg of [rig.legL, rig.legR]) box(leg, 0.8, 0.75, 0.88, color, 0, -0.37, 0);
  } else if (kind === 'skirt') {
    const sk = cyl(rig.root, 0.9, 1.3, 0.8, color, 0, 1.2, 0, 4);
    sk.rotation.y = Math.PI / 4;
    sk.scale.z = 0.85;
  }
}

function addSleeves(rig: Rig, long: boolean, color: string, cuff?: string) {
  for (const arm of [rig.armL, rig.armR]) {
    if (long) {
      box(arm, 0.62, 1.25, 0.68, color, 0, -0.42, 0);
      if (cuff) box(arm, 0.64, 0.14, 0.7, cuff, 0, -1.02, 0);
    } else {
      box(arm, 0.62, 0.6, 0.68, color, 0, -0.17, 0);
    }
  }
}

function addOutfit(rig: Rig, spec: Spec) {
  const kind = s(spec.kind, 'tee');
  const top = s(spec.top, '#3D7BFF');
  const bottom = s(spec.bottom, '#2B3A67');
  const accent = s(spec.accent, '#FFFFFF');
  const bk = s(spec.bottomKind, 'pants');
  const t = rig.torso;
  const shell = (color: string, w = 1.78) => box(t, w, 1.8, 1.0, color, 0, 0, 0);

  switch (kind) {
    case 'tee':
    case 'stripes': {
      shell(top);
      if (kind === 'stripes') for (let i = 0; i < 3; i++) box(t, 1.8, 0.16, 1.02, accent, 0, -0.55 + i * 0.5, 0);
      addSleeves(rig, false, top);
      addBottoms(rig, bk, bottom, accent);
      break;
    }
    case 'hoodie': {
      shell(top);
      addSleeves(rig, true, top, accent);
      box(t, 1.45, 0.65, 0.6, top, 0, 0.95, -0.4); // hood
      box(t, 1.0, 0.5, 0.08, accent, 0, -0.45, 0.52, { m: { rough: 0.8 } }); // pocket
      for (const sd of [-1, 1]) box(t, 0.07, 0.55, 0.05, '#FFFFFF', sd * 0.22, 0.45, 0.52);
      if (spec.spikes) for (let i = 0; i < 4; i++) cone(t, 0.18, 0.4, accent, 0, 1.25, -0.2 - i * 0.14, 4).rotation.x = -0.4;
      if (spec.ears) for (const sd of [-1, 1]) {
        box(t, 0.3, 0.95, 0.2, top, sd * 0.42, 1.55, -0.45, { rz: sd * -0.12 });
        box(t, 0.14, 0.7, 0.04, accent, sd * 0.42, 1.55, -0.34, { rz: sd * -0.12, shadow: false });
      }
      addBottoms(rig, bk, bottom, accent);
      break;
    }
    case 'jacket': {
      shell(top);
      box(t, 0.7, 1.55, 0.06, accent, 0, -0.05, 0.52, { m: { rough: 0.8 } });
      box(t, 0.05, 1.7, 0.06, '#E8E8F0', 0, 0, 0.55, { shadow: false });
      const collar = s(spec.collar, accent);
      for (const sd of [-1, 1]) box(t, 0.55, 0.28, 0.9, collar, sd * 0.45, 0.95, 0.02, { rz: sd * -0.2 });
      addSleeves(rig, true, top, collar);
      addBottoms(rig, bk, bottom, accent);
      break;
    }
    case 'dress': {
      shell(top);
      box(t, 1.8, 0.2, 1.02, accent, 0, -0.5, 0, { m: { rough: 0.4 } });
      addSleeves(rig, false, top);
      const long = !!spec.long;
      const sk = cyl(rig.root, 0.95, long ? 1.65 : 1.45, long ? 1.45 : 1.05, top, 0, long ? 1.0 : 1.3, 0, 4);
      sk.rotation.y = Math.PI / 4;
      sk.scale.z = 0.8;
      const hem = cyl(rig.root, long ? 1.66 : 1.46, long ? 1.66 : 1.46, 0.12, accent, 0, long ? 0.33 : 0.82, 0, 4, { m: { rough: 0.4 } });
      hem.rotation.y = Math.PI / 4;
      hem.scale.z = 0.8;
      if (spec.dots) for (let i = 0; i < 8; i++) ball(t, 0.1, accent, -0.6 + (i % 4) * 0.4, 0.4 - Math.floor(i / 4) * 0.55, 0.52);
      break;
    }
    case 'robe': {
      shell(top);
      box(t, 1.9, 0.18, 1.1, accent, 0, 0.8, 0);
      box(t, 0.3, 1.8, 0.06, accent, 0, 0, 0.52);
      box(t, 1.8, 0.2, 1.02, accent, 0, -0.5, 0);
      addSleeves(rig, true, top, accent);
      const sk = cyl(rig.root, 0.95, 1.55, 1.5, top, 0, 1.0, 0, 4);
      sk.rotation.y = Math.PI / 4;
      sk.scale.z = 0.8;
      const hem = cyl(rig.root, 1.56, 1.56, 0.14, accent, 0, 0.3, 0, 4);
      hem.rotation.y = Math.PI / 4;
      hem.scale.z = 0.8;
      break;
    }
    case 'suit': {
      shell(top);
      box(t, 1.0, 0.6, 0.07, accent, 0, 0.3, 0.52, { m: { rough: 0.3 } });
      for (let i = 0; i < 3; i++) ball(t, 0.07, i === 0 ? '#FF5F5F' : '#FFE066', -0.3 + i * 0.3, 0.3, 0.58, 1, 1, 0.5, { m: GLOW });
      box(t, 1.82, 0.2, 1.04, accent, 0, -0.55, 0);
      torus(t, 0.62, 0.17, accent, 0, 0.95, 0).rotation.x = Math.PI / 2;
      addSleeves(rig, true, top, accent);
      for (const arm of [rig.armL, rig.armR]) box(arm, 0.64, 0.4, 0.7, accent, 0, -1.1, 0);
      addBottoms(rig, bk, bottom, accent);
      for (const leg of [rig.legL, rig.legR]) box(leg, 0.8, 0.25, 0.9, accent, 0, -0.65, 0);
      break;
    }
    case 'armor': {
      shell(top);
      box(t, 0.95, 0.75, 0.1, accent, 0, 0.2, 0.52, { m: { rough: 0.25, emissive: accent, ei: 0.8 } });
      box(t, 1.82, 0.2, 1.04, '#15101F', 0, -0.55, 0);
      for (const sd of [-1, 1]) {
        box(rig.torso, 0.85, 0.45, 1.05, '#15101F', sd * 1.0, 0.95, 0);
        cone(rig.torso, 0.14, 0.45, accent, sd * 1.0, 1.35, 0, 4, { m: GLOW });
      }
      addSleeves(rig, true, top, accent);
      addBottoms(rig, bk, bottom, accent);
      for (const leg of [rig.legL, rig.legR]) box(leg, 0.82, 0.3, 0.2, accent, 0, -0.78, 0.45, { m: { emissive: accent, ei: 0.6 } });
      break;
    }
    case 'candy': {
      shell(top);
      box(t, 0.05, 1.7, 0.06, accent, 0, 0, 0.55);
      for (let i = 0; i < 9; i++) ball(t, 0.1, i % 2 ? accent : '#7FE3C4', -0.65 + (i % 3) * 0.65, 0.5 - Math.floor(i / 3) * 0.5, 0.5);
      for (const sd of [-1, 1]) box(t, 0.55, 0.28, 0.9, '#FFFFFF', sd * 0.45, 0.95, 0.02, { rz: sd * -0.2 });
      addSleeves(rig, true, top, '#7FE3C4');
      addBottoms(rig, bk, bottom, accent);
      break;
    }
    default:
      shell(top);
      addSleeves(rig, false, top);
      addBottoms(rig, bk, bottom, accent);
  }
}

// ---------------------------------------------------------------- printed text (front / back), Arabic or English
// Each side holds one or two lines. Every line has its own size (percent of the normal size).
interface PrintLine {
  text: string;
  /** percent: 100 = the normal size */
  size: number;
}

const PRINT_PX = 640; // canvas is square; it is drawn on a square plane PRINT_UNITS wide
const PRINT_UNITS = 1.7;
const BASE_FONT = 143; // px at 100% (the same apparent size the single line always had)
const MAX_W = PRINT_PX * 0.95;
const MAX_H = PRINT_PX * 0.92;

const printCache = new Map<string, THREE.Texture>();
function printTexture(lines: PrintLine[], color: string) {
  const key = JSON.stringify([lines, color]);
  const hit = printCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = PRINT_PX;
  c.height = PRINT_PX;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const font = (n: number) => `800 ${n}px Cairo, "Noto Sans Arabic", "Baloo 2", Nunito, Tahoma, Arial, sans-serif`;

  // 1) the size of each line, shrunk only if it would not fit the width of the shirt
  const sized = lines.map((l) => {
    let px = Math.round((BASE_FONT * l.size) / TEXT_SIZE_DEFAULT);
    g.font = font(px);
    while (px > 14 && g.measureText(l.text).width > MAX_W) {
      px -= 4;
      g.font = font(px);
    }
    return { text: l.text, px };
  });
  // 2) shrink all lines together if the block is taller than the shirt
  const gap = 0.16;
  const blockH = () => sized.reduce((h, l) => h + l.px, 0) * (1 + gap);
  if (blockH() > MAX_H) {
    const k = MAX_H / blockH();
    for (const l of sized) l.px = Math.max(12, Math.floor(l.px * k));
  }

  const n = parseInt(color.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  g.lineJoin = 'round';
  g.strokeStyle = lum > 0.55 ? 'rgba(20,20,40,0.85)' : 'rgba(255,255,255,0.85)';
  g.fillStyle = color;

  // 3) draw the block centred on the canvas
  let y = PRINT_PX / 2 - blockH() / 2;
  for (const l of sized) {
    const h = l.px * (1 + gap);
    const cy = y + h / 2;
    g.font = font(l.px);
    g.direction = /[\u0600-\u06FF]/.test(l.text) ? 'rtl' : 'ltr';
    g.lineWidth = Math.max(5, l.px * 0.14);
    g.strokeText(l.text, PRINT_PX / 2, cy);
    g.fillText(l.text, PRINT_PX / 2, cy);
    y += h;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  printCache.set(key, t);
  return t;
}

function addPrint(rig: Rig, text: OutfitText | null) {
  if (!text) return;
  const lines = (main: string, mainSize: number | undefined, second: string | undefined, secondSize: number | undefined): PrintLine[] => {
    const out: PrintLine[] = [];
    if (main) out.push({ text: main, size: mainSize ?? TEXT_SIZE_DEFAULT });
    if (second) out.push({ text: second, size: secondSize ?? (main ? 70 : TEXT_SIZE_DEFAULT) });
    return out;
  };
  const make = (ls: PrintLine[]) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(PRINT_UNITS, PRINT_UNITS),
      new THREE.MeshStandardMaterial({ map: printTexture(ls, text.color), transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }),
    );
  const front = lines(text.front, text.frontSize, text.front2, text.front2Size);
  const back = lines(text.back, text.backSize, text.back2, text.back2Size);
  if (front.length) {
    const m = make(front);
    m.position.set(0, 0.1, TORSO_D / 2 + 0.1);
    rig.torso.add(m);
  }
  if (back.length) {
    const m = make(back);
    m.position.set(0, 0.1, -(TORSO_D / 2 + 0.1));
    m.rotation.y = Math.PI;
    rig.torso.add(m);
  }
}

// ---------------------------------------------------------------- hair
type Piece = [w: number, h: number, d: number, x: number, y: number, z: number, top?: boolean, rz?: number];

function addHair(rig: Rig, style: string, hideTop: boolean) {
  const c = rig.hair;
  const parts: Piece[] = [];
  const cap: Piece = [1.58, 0.34, 1.58, 0, H2 + 0.12, 0, true];
  const back = (h: number): Piece => [1.58, h, 0.34, 0, 0.8 - h / 2, -H2 - 0.07];
  const side = (h: number, sd: number, d = 1.0): Piece => [0.22, h, d, sd * (H2 + 0.07), 0.8 - h / 2, -0.12];
  const fringe = (h = 0.3): Piece => [1.5, h, 0.2, 0, 0.62, H2 + 0.04];
  const extras: (() => void)[] = [];

  switch (style) {
    case 'short': parts.push(cap, back(0.95), side(0.75, -1), side(0.75, 1), fringe()); break;
    case 'spiky':
      parts.push(back(0.85), side(0.65, -1), side(0.65, 1), fringe(0.22), [1.5, 0.2, 1.5, 0, H2 + 0.05, 0, true]);
      extras.push(() => {
        for (const [x, z] of [[-0.45, 0.3], [0.45, 0.3], [0, 0], [-0.45, -0.35], [0.45, -0.35]]) cone(rig.head, 0.3, 0.75, c, x, H2 + 0.5, z, 4).rotation.y = 0.3;
      });
      break;
    case 'sidepart':
      parts.push(cap, back(0.95), side(0.75, -1), side(0.75, 1), fringe(0.34), [0.95, 0.3, 0.55, -0.35, H2 + 0.28, 0.5, true, 0.3]);
      break;
    case 'curly':
      parts.push(back(0.7), side(0.6, -1), side(0.6, 1));
      extras.push(() => {
        const pts: [number, number, number][] = [[-0.5, 0.3, 0.45], [0.5, 0.3, 0.45], [0, 0.45, 0.5], [-0.62, 0.4, -0.2], [0.62, 0.4, -0.2], [-0.3, 0.55, -0.45], [0.3, 0.55, -0.45], [0, 0.6, 0], [-0.35, 0.58, 0.1], [0.35, 0.58, 0.1]];
        for (const [x, y, z] of pts) ball(rig.head, 0.4, c, x, H2 + y - 0.05, z);
      });
      break;
    case 'mohawk':
      parts.push([0.34, 0.75, 1.5, 0, H2 + 0.38, -0.05, true], [0.2, 0.45, 1.2, -0.78, 0.5, -0.1], [0.2, 0.45, 1.2, 0.78, 0.5, -0.1]);
      break;
    case 'messy':
      parts.push(cap, back(1.9), side(1.3, -1, 1.1), side(1.3, 1, 1.1), fringe(0.36), [0.4, 0.3, 0.3, -0.5, 0.45, H2 + 0.1, false, 0.4]);
      break;
    case 'ponytail':
      parts.push(cap, back(0.95), side(0.75, -1), side(0.75, 1), fringe());
      extras.push(() => {
        ball(rig.head, 0.2, '#FF5FA2', 0, 0.55, -H2 - 0.15);
        const tail = box(rig.head, 0.5, 1.6, 0.5, c, 0, -0.35, -H2 - 0.5);
        tail.rotation.x = 0.28;
      });
      break;
    case 'bob':
      parts.push(cap, [1.58, 1.15, 0.34, 0, 0.8 - 0.575, -H2 - 0.07], [0.3, 1.15, 1.2, -(H2 + 0.08), 0.8 - 0.575, -0.05], [0.3, 1.15, 1.2, H2 + 0.08, 0.8 - 0.575, -0.05], fringe(0.36));
      break;
    case 'pigtails':
      parts.push(cap, back(0.8), side(0.6, -1), side(0.6, 1), fringe());
      extras.push(() => {
        for (const sd of [-1, 1]) {
          ball(rig.head, 0.17, '#FF5FA2', sd * (H2 + 0.12), 0.45, -0.1);
          const tail = box(rig.head, 0.45, 1.3, 0.45, c, sd * (H2 + 0.3), -0.2, -0.1);
          tail.rotation.z = sd * -0.12;
        }
      });
      break;
    case 'long':
      parts.push(cap, [1.58, 2.7, 0.34, 0, 0.8 - 1.35, -H2 - 0.07], [0.32, 2.1, 0.9, -(H2 + 0.08), 0.8 - 1.05, -0.2], [0.32, 2.1, 0.9, H2 + 0.08, 0.8 - 1.05, -0.2], fringe(0.34));
      break;
    case 'braid':
      parts.push(cap, back(0.95), side(0.75, -1), side(0.75, 1), fringe());
      extras.push(() => {
        for (let i = 0; i < 4; i++) box(rig.head, 0.5 - i * 0.04, 0.5, 0.4, c, i % 2 ? 0.08 : -0.08, -0.2 - i * 0.5, -H2 - 0.3 - i * 0.02);
        ball(rig.head, 0.16, '#FF5FA2', 0, -2.15, -H2 - 0.36);
      });
      break;
    case 'buns':
      parts.push(back(0.8), side(0.6, -1), side(0.6, 1), fringe(), [1.5, 0.2, 1.5, 0, H2 + 0.05, 0, true]);
      extras.push(() => {
        for (const sd of [-1, 1]) {
          ball(rig.head, 0.42, c, sd * 0.6, H2 + 0.45, -0.05);
          ball(rig.head, 0.14, '#FF5FA2', sd * 0.6, H2 + 0.12, -0.05);
        }
      });
      break;
    default:
      parts.push(cap, back(0.9), fringe());
  }
  for (const [w, h, d, x, y, z, top, rz] of parts) {
    if (hideTop && top) continue;
    box(rig.head, w, h, d, c, x, y, z, { r: 0.1, rz: rz ?? 0 });
  }
  if (!hideTop) extras.forEach((f) => f());
  else if (style === 'ponytail' || style === 'pigtails' || style === 'braid') extras.forEach((f) => f());
}

// ---------------------------------------------------------------- avatar
export interface BuildOpts {
  /** Show the equipped pet next to the character. */
  pet?: boolean;
}

export interface AvatarHandle extends THREE.Group {
  userData: {
    tick: (t: number, pose: 'idle' | 'run') => void;
    pet?: THREE.Group;
  };
}

export function buildAvatar(gender: Gender, look: Look, opts: BuildOpts = {}): AvatarHandle {
  const character = getItem(look.character);
  if (character) return buildCharacter(String(character.spec.model ?? 'cookie'), character.spec);
  const rig = makeRig(gender, look);
  const outfitItem = getItem(look.outfit);
  addOutfit(rig, outfitItem?.spec ?? {});
  addPrint(rig, look.outfitText ?? (outfitItem ? textOfSpec(outfitItem.spec) : null));

  const hat = getItem(look.hat);
  const hairItem = getItem(look.hair);
  const hidesHair = hat?.spec.hidesHair === true;
  if (!hidesHair) addHair(rig, s(hairItem?.spec.style, 'short'), !!hat);
  if (hat) buildHat(rig.head, hat.spec);

  const acc = getItem(look.accessory);
  const wings: THREE.Object3D[] = [];
  const hold: HoldInfo = {};
  if (acc) buildAccessory(rig, acc.spec, wings, hold);
  const shoes = getItem(look.shoes);
  if (shoes) buildShoes(rig, shoes.spec);
  const pack = getItem(look.backpack);
  if (pack) buildBackpack(rig, pack.spec);

  if (hold.arm && hold.armAngle !== undefined) hold.arm.rotation.x = hold.armAngle; // raised from the first frame (thumbnails never tick)

  const avatar = new THREE.Group() as AvatarHandle;
  avatar.add(rig.root);

  let pet: THREE.Group | undefined;
  const petItem = getItem(look.pet);
  if (opts.pet !== false && petItem) {
    pet = buildPet(petItem.spec);
    pet.position.set(2.6, 0, 0.9);
    pet.rotation.y = -0.4;
    avatar.add(pet);
  }
  avatar.userData.pet = pet;

  avatar.userData.tick = (t, pose) => {
    const run = pose === 'run';
    const sw = run ? Math.sin(t * 11) * 0.9 : Math.sin(t * 1.6) * 0.04;
    rig.armL.rotation.x = sw;
    rig.armR.rotation.x = -sw;
    if (hold.arm && hold.armAngle !== undefined) {
      // holding a flag: the right arm stays raised (a tiny bob), the cloth waves
      hold.arm.rotation.x = hold.armAngle + (run ? Math.sin(t * 11) * 0.04 : Math.sin(t * 1.6) * 0.03);
      hold.wave?.(t);
    }
    rig.legL.rotation.x = run ? -sw : 0;
    rig.legR.rotation.x = run ? sw : 0;
    rig.root.position.y = run ? Math.abs(Math.sin(t * 11)) * 0.18 : Math.sin(t * 1.6) * 0.03;
    rig.head.rotation.y = run ? 0 : Math.sin(t * 0.8) * 0.12;
    wings.forEach((w, i) => {
      w.rotation.y = (i === 0 ? 1 : -1) * (0.45 + Math.sin(t * 3) * 0.18);
    });
    if (pet) pet.position.y = Math.abs(Math.sin(t * 2.4)) * 0.12;
  };
  return avatar;
}

/** A pet on its own (used for shop thumbnails). */
export { buildPet };
