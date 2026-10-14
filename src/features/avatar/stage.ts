import * as THREE from 'three';
import type { Gender, Look } from './catalog';
import { cyl, torus } from './kit';
import { lowPowerDevice } from './webgl';
import { buildAvatar, type AvatarHandle } from './model3d';

export type View = 'full' | 'body' | 'outfit' | 'bust' | 'head' | 'feet' | 'back' | 'pet';

export const VIEWS: Record<View, { target: [number, number, number]; dist: number; rotY: number }> = {
  full: { target: [0, 2.55, 0], dist: 15, rotY: -0.3 },
  body: { target: [0, 2.4, 0], dist: 12.5, rotY: -0.3 },
  outfit: { target: [0, 2.35, 0], dist: 9.8, rotY: -0.3 },
  bust: { target: [0, 3.75, 0], dist: 8, rotY: -0.25 },
  head: { target: [0, 4.1, 0], dist: 5.8, rotY: -0.3 },
  feet: { target: [0, 0.75, 0], dist: 5.2, rotY: -0.45 },
  back: { target: [0, 2.8, 0], dist: 10, rotY: Math.PI - 0.3 },
  pet: { target: [0, 1.05, 0], dist: 5.2, rotY: -0.5 },
};

export function addLights(scene: THREE.Scene, shadows: boolean) {
  scene.add(new THREE.HemisphereLight('#CFE6FF', '#FFE9C9', 1.1));
  const sun = new THREE.DirectionalLight('#FFF3D6', 2.4);
  sun.position.set(5, 11, 8);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const c = sun.shadow.camera;
    c.left = -6;
    c.right = 6;
    c.top = 8;
    c.bottom = -4;
    c.near = 1;
    c.far = 30;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
  }
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#8FB4FF', 1.1);
  rim.position.set(-6, 5, -8);
  scene.add(rim);
  const fill = new THREE.DirectionalLight('#FFD1F0', 0.6);
  fill.position.set(-6, 2, 6);
  scene.add(fill);
}

function makePlatform() {
  const g = new THREE.Group();
  const top = cyl(g, 3.3, 3.3, 0.3, '#F2F0FF', 0, -0.15, 0, 40, { m: { rough: 0.4, emissive: '#D9D4FF', ei: 0.25 } });
  top.receiveShadow = true;
  top.castShadow = false;
  const inner = cyl(g, 2.85, 2.85, 0.02, '#E4F1FF', 0, 0.005, 0, 40, { m: { rough: 0.35, emissive: '#BFD8FF', ei: 0.35 } });
  inner.receiveShadow = true;
  inner.castShadow = false;
  cyl(g, 3.45, 3.5, 0.22, '#8E7CFF', 0, -0.4, 0, 40, { m: { rough: 0.5 } }).castShadow = false;
  const ring = torus(g, 3.05, 0.08, '#7DB4FF', 0, 0.02, 0, Math.PI * 2, { m: { rough: 0.3, emissive: '#5BA0FF', ei: 1.2 } });
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;
  return { group: g, ring };
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function makeSparkles() {
  const n = 46;
  const pos = new Float32Array(n * 3);
  const seeds: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * 2.6;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 0.5 + Math.random() * 5.5;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seeds.push(Math.random() * 10);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFFFFF', map: dotTexture(), size: 0.42, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  return { pts, pos, seeds, n };
}

export interface StageOptions {
  platform?: boolean;
  interactive?: boolean;
  autoRotate?: boolean;
  sparkles?: boolean;
  view?: View;
  pose?: 'idle' | 'run';
}

export interface StageApi {
  setLook: (gender: Gender, look: Look) => void;
  setView: (view: View) => void;
  setPose: (pose: 'idle' | 'run') => void;
  rotateBy: (rad: number) => void;
  zoomBy: (factor: number) => void;
  dispose: () => void;
}

export function createStage(container: HTMLElement, opts: StageOptions = {}): StageApi {
  const low = lowPowerDevice();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !low;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.cssText = `display:block;width:100%;height:100%;touch-action:${opts.interactive ? 'pan-y' : 'auto'};`;
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  addLights(scene, !low);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const plat = opts.platform !== false ? makePlatform() : null;
  if (plat) scene.add(plat.group);
  const sp = opts.sparkles !== false ? makeSparkles() : null;
  if (sp) scene.add(sp.pts);

  let view = VIEWS[opts.view ?? 'full'];
  let dist = view.dist;
  let zoom = 1;
  let pose: 'idle' | 'run' = opts.pose ?? 'idle';
  let avatar: AvatarHandle | null = null;
  let rotY = view.rotY;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let idleUntil = 0;

  const applyCamera = () => {
    const [tx, ty, tz] = view.target;
    camera.position.set(tx, ty + dist * zoom * 0.18, tz + dist * zoom);
    camera.lookAt(tx, ty, tz);
  };

  const resize = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  applyCamera();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let visible = true;
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  io.observe(container);

  // drag to rotate, wheel / pinch to zoom
  const pointers = new Map<number, number>();
  let pinch = 0;
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, e.clientX);
    canvas.setPointerCapture?.(e.pointerId);
    dragging = true;
    lastX = e.clientX;
    velocity = 0;
  };
  const onMove = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e.clientX);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.abs(a - b);
      if (pinch) zoom = Math.min(1.5, Math.max(0.55, zoom * (pinch / Math.max(d, 1))));
      pinch = d;
      applyCamera();
      return;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    rotY += dx * 0.012;
    velocity = dx * 0.012;
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinch = 0;
    if (pointers.size === 0) {
      dragging = false;
      idleUntil = performance.now() + 2500;
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    zoom = Math.min(1.5, Math.max(0.55, zoom * (e.deltaY > 0 ? 1.06 : 0.94)));
    applyCamera();
  };
  if (opts.interactive) {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.cursor = 'grab';
  }

  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    if (!dragging) {
      rotY += velocity;
      velocity *= 0.92;
      if (opts.autoRotate !== false && now > idleUntil && Math.abs(velocity) < 0.002) rotY += dt * 0.5;
    }
    if (avatar) {
      avatar.rotation.y = rotY;
      avatar.userData.tick(t, pose);
    }
    if (plat) (plat.ring.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 + Math.sin(t * 2.2) * 0.35;
    if (sp) {
      for (let i = 0; i < sp.n; i++) {
        sp.pos[i * 3 + 1] += dt * 0.35;
        if (sp.pos[i * 3 + 1] > 6.2) sp.pos[i * 3 + 1] = 0.4;
      }
      sp.pts.geometry.attributes.position.needsUpdate = true;
      (sp.pts.material as THREE.PointsMaterial).opacity = 0.65 + Math.sin(t * 3) * 0.2;
    }
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  return {
    setLook(gender, look) {
      if (avatar) scene.remove(avatar);
      avatar = buildAvatar(gender, look);
      avatar.rotation.y = rotY;
      scene.add(avatar);
    },
    setView(v) {
      view = VIEWS[v];
      dist = view.dist;
      applyCamera();
    },
    setPose(p) {
      pose = p;
    },
    rotateBy(rad) {
      velocity = 0;
      rotY += rad;
      idleUntil = performance.now() + 2500;
    },
    zoomBy(factor) {
      zoom = Math.min(1.5, Math.max(0.55, zoom * factor));
      applyCamera();
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

