import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Gate, Phase } from '../../components/games/blockQuest/engine';
import type { Gender, Look } from '../avatar/catalog';
import { buildAvatar, type AvatarHandle } from '../avatar/model3d';
import { lowPowerDevice } from '../avatar/webgl';
import { buildWorld, type BuiltWorld } from './build';
import { LANE_W, makeRng, type Tick } from './common';
import { buildGateObject, makeCoin, makeObstacle, type GateObject } from './gates3d';
import { WORLD_DEFS } from './registry';

/**
 * The 3D "Learn & Run" scene. React owns the game rules and writes the latest values into
 * `stateRef`; this file only draws them (world scrolling, hero, gates, coins, obstacles).
 */

export interface RunnerState {
  worldId: string;
  gender: Gender;
  look: Look;
  phase: Phase;
  /** gate depth while approaching / waiting (sFar..sNear) */
  s: number;
  sFar: number;
  sNear: number;
  /** 0 -> 1 while the hero runs through the gate */
  pass: number;
  lane: number;
  gate: Gate | null;
  gateKey: string;
  wrongIds: string[];
  glowLane: number | null;
  placed: number;
  bonkKey: number;
}

export interface RunnerCallbacks {
  onCoin: () => void;
  onWorldReady?: (id: string) => void;
}

const FAR_Z = -72;
const NEAR_Z = -15;
const PASS_DIST = 42;
const HERO_SCALE = 0.58;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerpAngle = (a: number, b: number, k: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};

interface Pickup {
  obj: THREE.Object3D;
  off: number;
  x: number;
  prev: number;
  done: boolean;
}

export function createRunner(container: HTMLElement, stateRef: { current: RunnerState }, cb: RunnerCallbacks) {
  const low = lowPowerDevice();
  const renderer = new THREE.WebGLRenderer({ antialias: !low, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 1400);
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  let size = { w: 1, h: 1 };

  let world: BuiltWorld | null = null;
  let worldId = '';
  let hero: AvatarHandle | null = null;
  let heroKey = '';
  let gateObj: GateObject | null = null;
  let gateKey = '';
  const gateAnims: Tick[] = [];
  let coins: Pickup[] = [];
  let obstacle: Pickup | null = null;
  const pickupGroup = new THREE.Group();
  scene.add(pickupGroup);

  let t = 0;
  let tw = 0; // time for the ambient world animation (slowed for people who prefer reduced motion)
  const calm = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scroll = 0;
  let lastGateZ: number | null = null;
  let lastBonk = 0;
  let bonkT = 0;
  let hopT = 0;
  let camX = 0;
  let heroRot = Math.PI;
  let fov = 52;
  let camDist = 11;

  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    size = { w, h };
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    composer?.setSize(w, h);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let visible = true;
  const io = new IntersectionObserver((e) => (visible = e[0]?.isIntersecting ?? true));
  io.observe(container);

  // ------------------------------------------------------------ world / hero / gate loading
  function loadWorld(id: string) {
    const def = WORLD_DEFS[id] ?? WORLD_DEFS['english-village'];
    if (world) {
      scene.remove(world.root);
      world.dispose();
    }
    worldId = id;
    world = buildWorld(def, { low });
    scene.add(world.root);
    scene.fog = new THREE.Fog(def.sky.fog, def.sky.fogNear, def.sky.fogFar);
    renderer.toneMappingExposure = def.light.exposure ?? 1.05;
    if (!low) {
      world.sun.castShadow = true;
      world.sun.shadow.mapSize.set(1024, 1024);
      const c = world.sun.shadow.camera;
      c.left = -14;
      c.right = 14;
      c.top = 14;
      c.bottom = -14;
      c.near = 1;
      c.far = 90;
      world.sun.shadow.bias = -0.0005;
      world.sun.shadow.radius = 3;
    }
    if (def.bloom && !low) {
      if (!composer) {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        bloom = new UnrealBloomPass(new THREE.Vector2(size.w, size.h), def.bloom, 0.55, 0.85);
        composer.addPass(bloom);
        composer.addPass(new OutputPass());
        composer.setSize(size.w, size.h);
      }
      if (bloom) bloom.strength = def.bloom;
    } else if (composer) {
      composer.dispose();
      composer = null;
      bloom = null;
    }
    scroll = 0;
    lastGateZ = null;
    cb.onWorldReady?.(id);
  }

  function loadHero(st: RunnerState) {
    if (hero) scene.remove(hero);
    hero = buildAvatar(st.gender, st.look, { pet: true });
    hero.scale.setScalar(HERO_SCALE);
    hero.rotation.y = heroRot;
    hero.position.set((st.lane - 1) * LANE_W, 0, 0);
    scene.add(hero);
  }

  function clearGate() {
    if (gateObj) pickupGroup.remove(gateObj.group);
    gateObj = null;
    gateAnims.length = 0;
    coins.forEach((c) => pickupGroup.remove(c.obj));
    coins = [];
    if (obstacle) pickupGroup.remove(obstacle.obj);
    obstacle = null;
  }

  function loadGate(st: RunnerState) {
    clearGate();
    if (!st.gate) return;
    gateObj = buildGateObject(st.gate, gateAnims);
    pickupGroup.add(gateObj.group);
    const fixed = st.gate.kind === 'bridge' || st.gate.kind === 'boss';
    const r = makeRng(st.gateKey.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 3));
    const coinLane = fixed ? 1 : Math.floor(r() * 3);
    for (let k = 0; k < 5; k++) {
      const obj = makeCoin();
      pickupGroup.add(obj);
      coins.push({ obj, off: 16 + k * 5, x: (coinLane - 1) * LANE_W, prev: -999, done: false });
    }
    if (!fixed) {
      let ol = Math.floor(r() * 3);
      if (ol === coinLane) ol = (ol + 1) % 3;
      const obj = makeObstacle();
      pickupGroup.add(obj);
      obstacle = { obj, off: 21, x: (ol - 1) * LANE_W, prev: -999, done: false };
    }
  }

  // ------------------------------------------------------------ frame loop
  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    t += dt;
    tw += calm ? dt * 0.2 : dt;
    const st = stateRef.current;

    if (st.worldId !== worldId) loadWorld(st.worldId);
    const hk = JSON.stringify([st.gender, st.look]);
    if (hk !== heroKey) {
      heroKey = hk;
      loadHero(st);
    }
    if (st.gateKey !== gateKey) {
      gateKey = st.gateKey;
      loadGate(st);
      lastGateZ = null;
    }
    if (!world || !hero) return;

    // where is the gate?
    let gateZ: number | null = null;
    if (st.gate && (st.phase === 'approach' || st.phase === 'ask')) gateZ = FAR_Z + (NEAR_Z - FAR_Z) * clamp((st.s - st.sFar) / (st.sNear - st.sFar), 0, 1);
    else if (st.gate && st.phase === 'passing') gateZ = NEAR_Z + st.pass * PASS_DIST;

    // the world scrolls exactly as far as the gate moved
    if (gateZ !== null) {
      if (lastGateZ !== null) scroll += Math.max(0, gateZ - lastGateZ);
      lastGateZ = gateZ;
    } else {
      lastGateZ = null;
    }
    world.update(tw, calm ? dt * 0.2 : dt, scroll);

    // hero
    const running = st.phase === 'approach' || st.phase === 'passing';
    const facing = st.phase === 'start' || st.phase === 'done';
    const fixedLane = !!st.gate && (st.gate.kind === 'bridge' || st.gate.kind === 'boss');
    const targetX = (fixedLane ? 0 : st.lane - 1) * LANE_W;
    hero.position.x += (targetX - hero.position.x) * Math.min(1, dt * 10);
    heroRot = lerpAngle(heroRot, facing ? Math.PI * 0.08 : Math.PI, Math.min(1, dt * 6));
    hero.rotation.y = heroRot;
    if (st.bonkKey !== lastBonk) {
      lastBonk = st.bonkKey;
      bonkT = 0.5;
    }
    let y = 0;
    if (hopT > 0) {
      hopT = Math.max(0, hopT - dt / 0.7);
      y += Math.sin(Math.PI * (1 - hopT)) * 1.9;
    }
    if (st.phase === 'passing') y += Math.sin(Math.PI * clamp(st.pass * 1.4, 0, 1)) * 0.9;
    if (st.phase === 'done') y += Math.abs(Math.sin(t * 5)) * 1.1;
    if (bonkT > 0) {
      bonkT = Math.max(0, bonkT - dt);
      hero.rotation.z = Math.sin((0.5 - bonkT) * 36) * 0.3 * (bonkT / 0.5);
    } else hero.rotation.z = 0;
    hero.position.y = y;
    hero.userData.tick(t, running ? 'run' : 'idle');

    // gate, coins, obstacle
    if (gateObj) {
      gateObj.group.visible = gateZ !== null;
      if (gateZ !== null) {
        gateObj.group.position.z = gateZ + gateObj.zOffset;
        gateObj.update(t, dt, { wrongIds: st.wrongIds, glowLane: st.glowLane, placed: st.placed }, st.phase === 'passing' ? st.pass : 0);
      }
    }
    gateAnims.forEach((f) => f(t, dt));
    const move = (p: Pickup, isCoin: boolean) => {
      if (gateZ === null) {
        p.obj.visible = false;
        return;
      }
      const z = gateZ + p.off;
      p.obj.position.set(p.x, isCoin ? 2.3 + Math.sin(t * 3 + p.off) * 0.25 : 0, z);
      p.obj.visible = !p.done && z > -95 && z < (isCoin ? 3 : 5);
      if (isCoin) {
        p.obj.rotation.y = t * 3 + p.off;
      }
      if (!p.done && p.prev < -0.6 && z >= -0.6 && Math.abs(p.x - hero!.position.x) < 1.9) {
        if (isCoin) {
          p.done = true;
          p.obj.visible = false;
          cb.onCoin();
        } else if (hopT <= 0) {
          hopT = 1;
        }
      }
      p.prev = z;
    };
    coins.forEach((c) => move(c, true));
    if (obstacle) move(obstacle, false);

    // camera
    camX += (hero.position.x * 0.5 - camX) * Math.min(1, dt * 4);
    const wantDist = facing ? 8.2 : 11;
    camDist += (wantDist - camDist) * Math.min(1, dt * 3);
    const wantFov = st.phase === 'passing' || st.phase === 'approach' ? 56 : 52;
    fov += (wantFov - fov) * Math.min(1, dt * 3);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (facing) {
      camera.position.set(camX + 1.2, 3.6, camDist);
      camera.lookAt(camX * 0.6, 3.1, -8);
    } else {
      camera.position.set(camX, 6.1, camDist + 1.4);
      camera.lookAt(camX * 0.6, 3.5, -11);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (world) world.dispose();
      composer?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
