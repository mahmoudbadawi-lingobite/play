import * as THREE from 'three';
import {
  PATH_W,
  SEG,
  SEG_COUNT,
  bake,
  box,
  glowSprite,
  group,
  makeClouds,
  makeRng,
  makeSkyDome,
  makeStars,
  plane,
  signTexture,
  type CloudOpts,
  type SegCtx,
  type SkyDef,
  type Tick,
} from './common';
import { getBoxQuality, mat, setBoxQuality } from '../avatar/kit';

export interface WorldDef {
  id: string;
  title: string;
  signLines: string[];
  signStyle?: 'wood' | 'neon' | 'blue';
  sky: SkyDef & { fog: string; fogNear: number; fogFar: number; stars?: number };
  light: { sky: string; ground: string; hemi: number; sun: string; sunI: number; sunPos: [number, number, number]; exposure?: number };
  /** soft glow strength (only on devices that can afford it) */
  bloom?: number;
  clouds?: Partial<CloudOpts> | null;
  sunDisc?: { color: string; size: number; pos: [number, number, number] } | null;
  /** one repeating piece of road + scenery, built along z from -SEG to 0 */
  segment: (ctx: SegCtx) => void;
  /** big far-away things (landmarks) that never move */
  backdrop: (ctx: SegCtx) => void;
  /** world-level particles etc. */
  ambient?: (ctx: SegCtx, add: (obj: THREE.Object3D, tick?: Tick) => void) => void;
  /** where the start sign stands: [x, y, z] (z is the offset from the start) */
  signPos?: [number, number, number];
  /** decorations at the very start (defaults to a wooden sign) */
  start?: (ctx: SegCtx, signTex: THREE.Texture) => void;
}

export interface BuiltWorld {
  root: THREE.Group;
  sun: THREE.DirectionalLight;
  def: WorldDef;
  update: (t: number, dt: number, scroll: number) => void;
  dispose: () => void;
}

function makeCtx(i: number, low: boolean, seed: number, anims: Tick[]): SegCtx {
  return { s: new THREE.Group(), a: new THREE.Group(), rng: makeRng(seed), i, low, anim: (fn) => anims.push(fn) };
}

/** Standard road + ground for a segment. */
export function pathAndGround(ctx: SegCtx, o: { ground: string; groundSide?: string; path: string; edge: string; line?: string; tile?: (col: number, row: number) => string; sidewalk?: string }) {
  const { s } = ctx;
  for (const sd of [-1, 1]) {
    box(s, 80, 1.2, SEG, o.ground, sd * (PATH_W / 2 + 40), -0.9, -SEG / 2, { r: 0.3 });
    box(s, 0.6, 0.5, SEG, o.edge, sd * (PATH_W / 2 + 0.3), -0.05, -SEG / 2, { r: 0.12 });
    if (o.sidewalk) box(s, 3.2, 0.45, SEG, o.sidewalk, sd * (PATH_W / 2 + 2.3), -0.1, -SEG / 2, { r: 0.1 });
  }
  box(s, PATH_W, 0.7, SEG, o.path, 0, -0.35, -SEG / 2, { r: 0.1 });
  if (o.tile) {
    const cols = 3;
    const rows = Math.round(SEG / 3.2);
    const cw = (PATH_W - 0.6) / cols;
    const rh = SEG / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) box(s, cw - 0.12, 0.08, rh - 0.12, o.tile(c, r), -PATH_W / 2 + 0.3 + cw * (c + 0.5), 0.0, -rh * (r + 0.5), { r: 0.03 });
  } else if (o.line) {
    for (const x of [-LANE_W_HALF, LANE_W_HALF]) box(s, 0.12, 0.06, SEG, o.line, x, 0.0, -SEG / 2);
    for (let z = 0; z < SEG; z += 4) box(s, PATH_W, 0.06, 0.1, o.line, 0, 0.0, -z - 0.05);
  }
}
const LANE_W_HALF = 1.6;

export function buildWorld(def: WorldDef, opts: { low: boolean }): BuiltWorld {
  const prevQuality = getBoxQuality();
  setBoxQuality(opts.low ? 0 : 1);
  try {
    return buildWorldInner(def, opts);
  } finally {
    setBoxQuality(prevQuality);
  }
}

function buildWorldInner(def: WorldDef, opts: { low: boolean }): BuiltWorld {
  const { low } = opts;
  const root = new THREE.Group();
  const anims: Tick[] = [];
  const seed = def.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const rng0 = makeRng(seed);

  // sky, stars, sun, clouds
  root.add(makeSkyDome(def.sky));
  if (def.sky.stars) {
    const st = makeStars(rng0, low ? def.sky.stars / 2 : def.sky.stars);
    root.add(st.pts);
    anims.push((t) => st.update(t));
  }
  if (def.sunDisc) {
    const d = def.sunDisc;
    const core = new THREE.Mesh(new THREE.SphereGeometry(d.size * 0.35, 20, 12), new THREE.MeshBasicMaterial({ color: d.color, fog: false }));
    core.position.set(...d.pos);
    root.add(core);
    const gl = glowSprite(d.color, d.size * 2.4, 0.55);
    gl.position.set(...d.pos);
    root.add(gl);
  }
  if (def.clouds !== null) {
    const cl = makeClouds(rng0, { count: low ? 7 : 14, ...def.clouds });
    root.add(cl.group);
    anims.push(cl.update);
  }

  // lights
  root.add(new THREE.HemisphereLight(def.light.sky, def.light.ground, def.light.hemi));
  const sun = new THREE.DirectionalLight(def.light.sun, def.light.sunI);
  sun.position.set(...def.light.sunPos);
  sun.target.position.set(0, 0, 0);
  root.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#FFFFFF', 0.35);
  fill.position.set(-8, 6, 10);
  root.add(fill);

  // backdrop (landmarks, far scenery)
  const bctx = makeCtx(-1, low, seed + 99, anims);
  def.backdrop(bctx);
  root.add(bake(bctx.s), bctx.a);
  if (def.ambient) {
    const actx = makeCtx(-2, low, seed + 5, anims);
    def.ambient(actx, (obj, tick) => {
      root.add(obj);
      if (tick) anims.push(tick);
    });
  }

  // repeating road segments
  const segs: THREE.Group[] = [];
  for (let i = 0; i < SEG_COUNT; i++) {
    const ctx = makeCtx(i, low, seed + i * 131, anims);
    def.segment(ctx);
    const g = new THREE.Group();
    g.add(bake(ctx.s), ctx.a);
    root.add(g);
    segs.push(g);
  }

  // start decorations (sign) - scroll away once and are not repeated
  const startCtx = makeCtx(-3, low, seed + 7, anims);
  const signTex = signTexture(def.signLines, def.signStyle ?? 'wood');
  if (def.start) def.start(startCtx, signTex);
  else {
    const [sx, sy, sz] = def.signPos ?? [-9.2, 4.2, 0];
    const g = group(startCtx.s, sx, 0, sz);
    box(g, 0.5, sy + 0.4, 0.5, '#5A3516', -2.4, (sy + 0.4) / 2, 0, { r: 0.1 });
    box(g, 0.5, sy + 0.4, 0.5, '#5A3516', 2.4, (sy + 0.4) / 2, 0, { r: 0.1 });
    const board = plane(startCtx.a, 6.6, 4.1, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }), sx, sy, sz + 0.3, 0, 0.45);
    board.castShadow = true;
  }
  const startRoot = new THREE.Group();
  startRoot.add(bake(startCtx.s), startCtx.a);
  root.add(startRoot);

  const total = SEG * SEG_COUNT;
  const update = (t: number, dt: number, scroll: number) => {
    anims.forEach((f) => f(t, dt));
    for (let i = 0; i < SEG_COUNT; i++) {
      const p = (((i * SEG + scroll) % total) + total) % total;
      segs[i].position.z = p - total + SEG + 14;
    }
    startRoot.position.z = -10 + scroll;
    startRoot.visible = startRoot.position.z < 40;
  };

  return {
    root,
    sun,
    def,
    update,
    dispose: () => {
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && (m.geometry as THREE.BufferGeometry & { userData?: { shared?: boolean } })) {
          // geometries from the kit are shared; baked ones are ours - dispose only baked (unique) geometry
          if (m.geometry.userData?.baked) m.geometry.dispose();
        }
      });
    },
  };
}

export { mat };
