import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat, type MatOpts } from '../avatar/kit';

export { box, ball, cone, cyl, torus, group, mat, GLOW } from '../avatar/kit';

/** Everything in the world is measured in these units: the hero is about 3 tall, a lane is 3.2 wide. */
export const SEG = 48;
export const SEG_COUNT = 6;
export const PATH_W = 11;
export const LANE_W = 3.2;

export type Tick = (t: number, dt: number) => void;

/** What a world's segment builder receives. */
export interface SegCtx {
  /** static pieces - merged into a few big meshes for speed */
  s: THREE.Group;
  /** animated pieces - stay separate */
  a: THREE.Group;
  rng: () => number;
  /** index of this segment variant (0 = the very first one the player sees) */
  i: number;
  low: boolean;
  anim: (fn: Tick) => void;
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- shapes not in the avatar kit
const planeGeos = new Map<string, THREE.PlaneGeometry>();
export function plane(p: THREE.Object3D, w: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const key = `${w}|${h}`;
  let g = planeGeos.get(key);
  if (!g) {
    g = new THREE.PlaneGeometry(w, h);
    planeGeos.set(key, g);
  }
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  p.add(m);
  return m;
}

export const col = (c: string, o?: MatOpts) => mat(c, o);

// ---------------------------------------------------------------- textures
export function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A text sign (wooden or neon) used at the start of every world. */
export function signTexture(lines: string[], style: 'wood' | 'neon' | 'blue' = 'wood') {
  return canvasTex(512, 320, (g, w, h) => {
    if (style === 'wood') {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#9A6A3C');
      grad.addColorStop(1, '#7A4B24');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(60,30,10,.35)';
      g.lineWidth = 3;
      for (let y = 40; y < h; y += 62) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y + 6);
        g.stroke();
      }
      g.lineWidth = 14;
      g.strokeStyle = '#5A3516';
      g.strokeRect(7, 7, w - 14, h - 14);
    } else {
      g.fillStyle = style === 'neon' ? '#0A1850' : '#1F4FCC';
      g.fillRect(0, 0, w, h);
      g.lineWidth = 14;
      g.strokeStyle = style === 'neon' ? '#7A5BFF' : '#6FA8FF';
      g.strokeRect(9, 9, w - 18, h - 18);
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const size = lines.length > 2 ? 78 : 96;
    g.font = `800 ${size}px "Baloo 2", "Nunito", Arial, sans-serif`;
    lines.forEach((ln, i) => {
      const y = h / 2 + (i - (lines.length - 1) / 2) * (size * 1.02);
      g.lineWidth = 12;
      g.strokeStyle = style === 'wood' ? '#3B2008' : '#06103A';
      g.strokeText(ln, w / 2, y);
      g.fillStyle = '#FFFFFF';
      g.fillText(ln, w / 2, y);
    });
  });
}

/** Soft ripple stripes. Animate `.offset` to make water move. */
export function rippleTexture(base: string, light: string) {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = light;
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = (i * 97) % w;
      const y = (i * 53) % h;
      g.globalAlpha = 0.25 + (i % 4) * 0.08;
      g.lineWidth = 3 + (i % 3);
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x + 20, y - 8, x + 40, y + 8, x + 60, y);
      g.stroke();
      g.beginPath();
      g.moveTo(x - 256, y);
      g.bezierCurveTo(x - 236, y - 8, x - 216, y + 8, x - 196, y);
      g.stroke();
    }
  }, true);
  return t;
}

/** Windows of a tall building (lit at random). */
export function windowTexture(wall: string, lit: string[], cols = 6, rows = 18, seed = 1) {
  const r = makeRng(seed);
  return canvasTex(128, 512, (g, w, h) => {
    g.fillStyle = wall;
    g.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        g.fillStyle = r() < 0.62 ? lit[Math.floor(r() * lit.length)] : '#0C1430';
        g.fillRect(x * cw + cw * 0.18, y * ch + ch * 0.2, cw * 0.64, ch * 0.6);
      }
  }, true);
}

// ---------------------------------------------------------------- baking (merge static pieces)
/**
 * Merges every mesh under `root` into one mesh per material. The scene then needs a few draw calls
 * per segment instead of hundreds. Animated pieces must NOT be inside `root`.
 */
export function bake(root: THREE.Object3D, receive = true): THREE.Group {
  root.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    const list = buckets.get(m.material as THREE.Material) ?? [];
    list.push(g);
    buckets.set(m.material as THREE.Material, list);
  });
  const out = new THREE.Group();
  for (const [material, geos] of buckets) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) continue;
    merged.userData.baked = true;
    const mesh = new THREE.Mesh(merged, material);
    mesh.receiveShadow = receive;
    mesh.castShadow = false;
    out.add(mesh);
  }
  return out;
}

// ---------------------------------------------------------------- sky
export interface SkyDef {
  top: string;
  mid: string;
  horizon: string;
}

export function makeSkyDome(sky: SkyDef) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color(sky.top) }, mid: { value: new THREE.Color(sky.mid) }, horizon: { value: new THREE.Color(sky.horizon) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: [
      'uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vP;',
      'void main(){',
      '  float h = clamp(vP.y, 0.0, 1.0);',
      '  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.28, h));',
      '  c = mix(c, top, smoothstep(0.25, 0.85, h));',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}',
    ].join('\n'),
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 14), m);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

function glowTexture() {
  return canvasTex(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}
let glowTex: THREE.Texture | null = null;
export function glowSprite(color: string, size: number, opacity = 0.8) {
  glowTex ??= glowTexture();
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.set(size, size, 1);
  return s;
}

export interface CloudOpts {
  count: number;
  color?: string;
  y?: [number, number];
  z?: [number, number];
  spread?: number;
  speed?: number;
}

/** Blocky clouds that drift sideways and wrap around. */
export function makeClouds(rng: () => number, o: CloudOpts) {
  const g = new THREE.Group();
  const color = o.color ?? '#FFFFFF';
  const m = mat(color, { rough: 1, emissive: color, ei: 0.5 });
  const spread = o.spread ?? 320;
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < o.count; i++) {
    const c = new THREE.Group();
    const parts = 3 + Math.floor(rng() * 3);
    for (let k = 0; k < parts; k++) {
      const w = 7 + rng() * 9;
      const m1 = new THREE.Mesh(new THREE.BoxGeometry(w, 3 + rng() * 3, 5 + rng() * 3), m);
      m1.position.set((k - parts / 2) * 6 + rng() * 3, rng() * 2.4, rng() * 3);
      c.add(m1);
    }
    c.position.set((rng() - 0.5) * spread * 2, (o.y?.[0] ?? 45) + rng() * ((o.y?.[1] ?? 85) - (o.y?.[0] ?? 45)), -(o.z?.[0] ?? 60) - rng() * ((o.z?.[1] ?? 320) - (o.z?.[0] ?? 60)));
    c.scale.setScalar(1.2 + rng() * 1.6);
    g.add(c);
    clouds.push(c);
  }
  const speed = o.speed ?? 1.2;
  return { group: g, update: (_t: number, dt: number) => clouds.forEach((c) => { c.position.x += dt * speed * (1 + c.scale.x * 0.2); if (c.position.x > spread) c.position.x = -spread; }) };
}

export function makeStars(rng: () => number, count: number, radius = 700) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rng() * Math.PI * 2;
    const v = Math.acos(0.05 + rng() * 0.95);
    pos[i * 3] = Math.cos(u) * Math.sin(v) * radius;
    pos[i * 3 + 1] = Math.cos(v) * radius;
    pos[i * 3 + 2] = Math.sin(u) * Math.sin(v) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mt = new THREE.PointsMaterial({ color: '#FFFFFF', size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
  const pts = new THREE.Points(g, mt);
  pts.frustumCulled = false;
  return { pts, update: (t: number) => (mt.opacity = 0.75 + Math.sin(t * 2.2) * 0.2) };
}

/** Falling particles (snow) or drifting sparkles around the camera. */
export function makeFlakes(rng: () => number, count: number, o: { color: string; size: number; fall: number; area?: [number, number, number]; additive?: boolean }) {
  const [ax, ay, az] = o.area ?? [40, 26, 60];
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rng() - 0.5) * ax * 2;
    pos[i * 3 + 1] = rng() * ay;
    pos[i * 3 + 2] = -rng() * az + 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  glowTex ??= glowTexture();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: o.color, map: glowTex, size: o.size, transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, opacity: 0.9 }));
  pts.frustumCulled = false;
  return {
    pts,
    update: (t: number, dt: number) => {
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= dt * o.fall * (0.6 + (i % 5) * 0.15);
        pos[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.8;
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = ay;
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}
