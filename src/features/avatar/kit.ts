import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Small helpers for building the blocky characters out of rounded boxes. */

export const HEAD = 1.45;
export const LEG_H = 1.5;
export const TORSO_W = 1.7;
export const TORSO_H = 1.75;
export const TORSO_D = 0.95;
export const TORSO_Y = 2.375; // centre of the torso
export const SHOULDER_Y = 3.1;
export const ARM_H = 1.55;
export const HEAD_Y = 4.025; // centre of the head

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: string;
  ei?: number;
  opacity?: number;
}
export interface Opt {
  r?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  m?: MatOpts;
  shadow?: boolean;
}

const geos = new Map<string, THREE.BufferGeometry>();
const mats = new Map<string, THREE.MeshStandardMaterial>();

function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geos.get(key);
  if (!g) {
    g = make();
    geos.set(key, g);
  }
  return g;
}

export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.rough ?? ''}|${o.metal ?? ''}|${o.emissive ?? ''}|${o.ei ?? ''}|${o.opacity ?? ''}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.55,
      metalness: o.metal ?? 0,
      emissive: o.emissive ?? '#000000',
      emissiveIntensity: o.ei ?? 0,
      transparent: o.opacity !== undefined && o.opacity < 1,
      opacity: o.opacity ?? 1,
    });
    mats.set(key, m);
  }
  return m;
}

function place(mesh: THREE.Mesh, p: THREE.Object3D, x: number, y: number, z: number, o: Opt) {
  mesh.position.set(x, y, z);
  if (o.rx) mesh.rotation.x = o.rx;
  if (o.ry) mesh.rotation.y = o.ry;
  if (o.rz) mesh.rotation.z = o.rz;
  mesh.castShadow = o.shadow !== false;
  p.add(mesh);
  return mesh;
}

export function box(p: THREE.Object3D, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, o: Opt = {}) {
  const r = Math.min(o.r ?? 0.08, w / 2.01, h / 2.01, d / 2.01);
  const g = geo(`b${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 2, r));
  return place(new THREE.Mesh(g, mat(color, o.m)), p, x, y, z, o);
}

export function ball(p: THREE.Object3D, r: number, color: string, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, o: Opt = {}) {
  const g = geo(`s${r}`, () => new THREE.SphereGeometry(r, 20, 14));
  const mesh = place(new THREE.Mesh(g, mat(color, o.m)), p, x, y, z, o);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

export function cone(p: THREE.Object3D, r: number, h: number, color: string, x = 0, y = 0, z = 0, segs = 4, o: Opt = {}) {
  const g = geo(`c${r}|${h}|${segs}`, () => new THREE.ConeGeometry(r, h, segs));
  return place(new THREE.Mesh(g, mat(color, o.m)), p, x, y, z, o);
}

export function cyl(p: THREE.Object3D, rt: number, rb: number, h: number, color: string, x = 0, y = 0, z = 0, segs = 18, o: Opt = {}) {
  const g = geo(`y${rt}|${rb}|${h}|${segs}`, () => new THREE.CylinderGeometry(rt, rb, h, segs));
  return place(new THREE.Mesh(g, mat(color, o.m)), p, x, y, z, o);
}

export function torus(p: THREE.Object3D, r: number, tube: number, color: string, x = 0, y = 0, z = 0, arc = Math.PI * 2, o: Opt = {}) {
  const g = geo(`t${r}|${tube}|${arc}`, () => new THREE.TorusGeometry(r, tube, 10, 28, arc));
  return place(new THREE.Mesh(g, mat(color, o.m)), p, x, y, z, o);
}

export function group(p: THREE.Object3D | null, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  p?.add(g);
  return g;
}

export const GLOW: MatOpts = { rough: 0.3, ei: 0.9 };
