import * as THREE from 'three';
import { STARTER, getItem, type Gender, type Look } from './catalog';
import { modelsReady } from './items3d';
import { buildAvatar, buildPet } from './model3d';
import { VIEWS, addLights, type View } from './stage';

/**
 * Renders a character (or a single item) once into a transparent PNG.
 * Used for the header chip, shop thumbnails, saved looks and reward screens,
 * so those places never need their own live 3D view. One shared renderer,
 * jobs run one at a time, results are cached.
 */

interface Shared {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

let shared: Shared | null = null;
const cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();

function ensure(): Shared {
  if (shared) return shared;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  addLights(scene, false);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  shared = { renderer, scene, camera };
  return shared;
}

async function frame(view: View, build: () => THREE.Object3D, size: number, rotY?: number): Promise<string> {
  const { renderer, scene, camera } = ensure();
  renderer.setSize(size, size, false);
  const v = VIEWS[view];
  const obj = build();
  obj.rotation.y = rotY ?? v.rotY;
  scene.add(obj);
  await modelsReady();
  const [tx, ty, tz] = v.target;
  camera.position.set(tx, ty + v.dist * 0.18, tz + v.dist);
  camera.lookAt(tx, ty, tz);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(obj);
  return url;
}

function enqueue<T>(job: () => T | Promise<T>): Promise<T> {
  const run = queue.then(() => new Promise<T>((resolve, reject) => setTimeout(() => { try { Promise.resolve(job()).then(resolve, reject); } catch (e) { reject(e); } }, 0)));
  queue = run.catch(() => undefined);
  return run;
}

export function snapshotLook(gender: Gender, look: Look, view: View = 'bust', size = 192, cancelled?: () => boolean): Promise<string> {
  const key = `L|${gender}|${view}|${size}|${JSON.stringify(look)}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return enqueue(async () => {
    if (cancelled?.()) throw new Error('cancelled');
    const url = await frame(view, () => buildAvatar(gender, look, { pet: view === 'full' || view === 'body' }), size);
    cache.set(key, url);
    return url;
  });
}

const WING_STYLES = new Set(['wingsStar', 'wingsFairy']);

/** A thumbnail that shows just one item on a default character. */
export function snapshotItem(gender: Gender, itemId: string, size = 176, cancelled?: () => boolean): Promise<string> {
  const key = `I|${gender}|${itemId}|${size}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const item = getItem(itemId);
  if (!item) return Promise.reject(new Error('unknown item'));
  return enqueue(async () => {
    if (cancelled?.()) throw new Error('cancelled');
    const base: Look = { ...STARTER[gender] };
    let view: View = 'outfit';
    let url: string;
    if (item.slot === 'pet') {
      url = await frame('pet', () => buildPet(item.spec), size);
    } else {
      if (item.slot === 'set') {
        for (const pid of item.pieces ?? []) {
          const piece = getItem(pid);
          if (piece && piece.slot !== 'set') (base as unknown as Record<string, string>)[piece.slot] = pid;
        }
        view = 'body';
      } else {
        (base as unknown as Record<string, string>)[item.slot] = item.id;
        if (item.slot === 'hat' || item.slot === 'hair') view = 'head';
        else if (item.slot === 'shoes') view = 'feet';
        else if (item.slot === 'character') view = 'body';
        else if (item.slot === 'backpack') view = 'back';
        else if (item.slot === 'accessory') view = WING_STYLES.has(String(item.spec.style)) ? 'back' : item.spec.style === 'scarf' || item.spec.style === 'medal' ? 'bust' : 'head';
      }
      url = await frame(view, () => buildAvatar(gender, base, { pet: false }), size);
    }
    cache.set(key, url);
    return url;
  });
}
