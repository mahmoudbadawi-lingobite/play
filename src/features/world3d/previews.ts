import * as THREE from 'three';
import { buildWorld } from './build';
import { WORLD_DEFS } from './registry';

/**
 * Renders a world once into a picture (used by the "Pick your world" cards).
 * One shared renderer, one job at a time, results cached.
 */

let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();

export function snapshotWorld(worldId: string, width = 480, height = 300): Promise<string> {
  const key = `${worldId}|${width}x${height}`;
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const run = queue.then(
    () =>
      new Promise<string>((resolve, reject) =>
        setTimeout(() => {
          try {
            const def = WORLD_DEFS[worldId];
            if (!def) throw new Error('unknown world');
            renderer ??= new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
            renderer.setPixelRatio(1);
            renderer.setSize(width, height, false);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = def.light.exposure ?? 1.05;
            const scene = new THREE.Scene();
            scene.fog = new THREE.Fog(def.sky.fog, def.sky.fogNear, def.sky.fogFar);
            const world = buildWorld(def, { low: false });
            scene.add(world.root);
            // let the animated pieces settle into a nice pose
            world.update(1.7, 0.016, 0);
            const camera = new THREE.PerspectiveCamera(58, width / height, 0.5, 1400);
            camera.position.set(1.5, 9.5, 14);
            camera.lookAt(-1, 10, -80);
            renderer.render(scene, camera);
            const url = renderer.domElement.toDataURL('image/jpeg', 0.88);
            cache.set(key, url);
            scene.remove(world.root);
            world.dispose();
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }, 0),
      ),
  );
  queue = run.catch(() => undefined);
  return run;
}
