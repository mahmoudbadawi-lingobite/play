import * as THREE from 'three';
import type { Gate } from '../../components/games/blockQuest/engine';
import { LANE_W, canvasTex, rippleTexture, type Tick } from './common';
import { ball, box, cyl, group, torus } from '../avatar/kit';

/** 3D versions of the Block Quest gates, coins and obstacles. */

export const LANE_COLORS = ['#7B61FF', '#1FB5A0', '#FF7A59'] as const;
const LANE_LIGHT = ['#EFEAFF', '#E3F8F3', '#FFF0EA'] as const;

export interface GateView {
  wrongIds: string[];
  glowLane: number | null;
  placed: number;
}

export interface GateObject {
  group: THREE.Group;
  /** z offset of the object relative to the gate position (bridges sit in front of it) */
  zOffset: number;
  update: (t: number, dt: number, v: GateView, pass: number) => void;
}

// ------------------------------------------------------------------ textures
const labelCache = new Map<string, THREE.Texture>();
function labelTexture(text: string) {
  const hit = labelCache.get(text);
  if (hit) return hit;
  const t = canvasTex(512, 160, (g, w, h) => {
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.roundRect(6, 6, w - 12, h - 12, 34);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = '#2B2B5E';
    g.stroke();
    g.fillStyle = '#2B2B5E';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const words = text.split(' ');
    let lines = [text];
    let size = 78;
    g.font = `800 ${size}px "Baloo 2", "Nunito", Arial, sans-serif`;
    if (g.measureText(text).width > w - 60 && words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      size = 54;
    }
    g.font = `800 ${size}px "Baloo 2", "Nunito", Arial, sans-serif`;
    while (size > 22 && Math.max(...lines.map((l) => g.measureText(l).width)) > w - 60) {
      size -= 3;
      g.font = `800 ${size}px "Baloo 2", "Nunito", Arial, sans-serif`;
    }
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05 + 3));
  });
  labelCache.set(text, t);
  return t;
}

const glyphCache: Record<string, THREE.Texture> = {};
function glyphTexture(lane: number, wrong: boolean) {
  const key = `${lane}${wrong}`;
  if (glyphCache[key]) return glyphCache[key];
  const t = canvasTex(256, 460, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, wrong ? '#EDEBF2' : LANE_LIGHT[lane]);
    grad.addColorStop(1, wrong ? '#CFCCDA' : '#FFFFFF');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = wrong ? '#9A98A8' : LANE_COLORS[lane];
    const cx = w / 2;
    const cy = h / 2;
    if (wrong) {
      g.strokeStyle = '#8A86A0';
      g.lineWidth = 28;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 56, cy - 56); g.lineTo(cx + 56, cy + 56); g.moveTo(cx + 56, cy - 56); g.lineTo(cx - 56, cy + 56); g.stroke();
    } else if (lane === 0) {
      g.beginPath(); g.arc(cx, cy, 76, 0, Math.PI * 2); g.fill();
    } else if (lane === 1) {
      g.beginPath(); g.moveTo(cx, cy - 84); g.lineTo(cx + 84, cy + 66); g.lineTo(cx - 84, cy + 66); g.closePath(); g.fill();
    } else {
      g.beginPath(); g.roundRect(cx - 68, cy - 68, 136, 136, 16); g.fill();
    }
  });
  glyphCache[key] = t;
  return t;
}

// ------------------------------------------------------------------ portal gate (portal + listen)
function portalGate(gate: Gate): GateObject {
  const g = new THREE.Group();
  const post = '#4B3F8F';
  for (const sd of [-1, 1]) box(g, 0.8, 8, 0.8, post, sd * 6.3, 4, 0, { r: 0.2 });
  box(g, 13.6, 1.0, 1.0, post, 0, 7.6, 0, { r: 0.25 });
  for (const sd of [-1, 1]) ball(g, 0.55, '#FFC83D', sd * 6.3, 8.4, 0);
  type P = { inner: THREE.Mesh; label: THREE.Mesh; glow: THREE.Mesh; ring: THREE.Mesh; id: string };
  const portals: P[] = gate.options.map((opt, l) => {
    const x = (l - 1) * LANE_W;
    box(g, 3.3, 5.9, 0.7, LANE_COLORS[l], x, 3.0, 0, { r: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: '#FFE066', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7), glowMat);
    glow.position.set(x, 3.2, -0.4);
    g.add(glow);
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 5.1), new THREE.MeshBasicMaterial({ map: glyphTexture(l, false), color: '#D4D4D4', toneMapped: false }));
    inner.position.set(x, 3.0, 0.38);
    g.add(inner);
    const ring = torus(g, 1.15, 0.09, LANE_COLORS[l], x, 3.0, 0.5, Math.PI * 2, { m: { emissive: LANE_COLORS[l], ei: 0.9 } });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.34), new THREE.MeshBasicMaterial({ map: labelTexture(opt.label), color: '#D4D4D4', toneMapped: false, transparent: true }));
    label.position.set(x, 6.6, 0.6);
    g.add(label);
    return { inner, label, glow, ring, id: opt.id };
  });
  return {
    group: g,
    zOffset: 0,
    update: (t, _dt, v) => {
      portals.forEach((p, l) => {
        const wrong = v.wrongIds.includes(p.id);
        const m = p.inner.material as THREE.MeshBasicMaterial;
        const want = glyphTexture(l, wrong);
        if (m.map !== want) {
          m.map = want;
          m.needsUpdate = true;
        }
        (p.label.material as THREE.MeshBasicMaterial).opacity = wrong ? 0.45 : 1;
        p.ring.visible = !wrong;
        p.ring.rotation.z = t * 1.6 * (l % 2 ? -1 : 1);
        p.ring.scale.setScalar(1 + Math.sin(t * 3 + l) * 0.06);
        (p.glow.material as THREE.MeshBasicMaterial).opacity = v.glowLane === l ? 0.45 + Math.sin(t * 6) * 0.3 : 0;
      });
    },
  };
}

// ------------------------------------------------------------------ letter bridge
function bridgeGate(gate: Gate, anims: Tick[]): GateObject {
  const g = new THREE.Group();
  const n = gate.letters.length;
  const len = 13;
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(60, len + 2),
    (() => {
      const tex = rippleTexture('#2E9BE8', '#CDEBFF');
      tex.repeat.set(5, 1.4);
      anims.push((_t, dt) => (tex.offset.x += dt * 0.08));
      return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, emissive: '#2E9BE8', emissiveIntensity: 0.2 });
    })(),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.08, -len / 2 - 0.5);
  g.add(water);
  for (const z of [0.9, -len - 1.1]) box(g, 60, 0.7, 2.4, '#8A7A66', 0, -0.25, z, { r: 0.2 });
  for (const sd of [-1, 1]) for (let k = 0; k <= 4; k++) {
    box(g, 0.4, 2.2, 0.4, '#6B4223', sd * 5.7, 1.0, -0.4 - k * (len / 4), { r: 0.08 });
    if (k < 4) box(g, 0.2, 0.25, len / 4, '#E8D8B8', sd * 5.7, 1.7, -0.4 - k * (len / 4) - len / 8, { r: 0.05 });
  }
  const planks: THREE.Mesh[] = [];
  const marks: THREE.Mesh[] = [];
  const ph = (len - 1.4) / n;
  for (let k = 0; k < n; k++) {
    const z = -1.2 - k * ph - ph / 2;
    const mk = new THREE.Mesh(new THREE.PlaneGeometry(10.4, ph - 0.25), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false }));
    mk.rotation.x = -Math.PI / 2;
    mk.position.set(0, 0.08, z);
    g.add(mk);
    marks.push(mk);
    const p = box(g, 10.4, 0.34, ph - 0.12, k % 2 ? '#B56B35' : '#A35F2D', 0, 0.0, z, { r: 0.06 });
    p.visible = false;
    planks.push(p);
  }
  const shown: number[] = Array.from({ length: n }, () => 0);
  return {
    group: g,
    zOffset: 11,
    update: (_t, dt, v) => {
      planks.forEach((p, k) => {
        const on = k < v.placed;
        shown[k] = Math.min(1, Math.max(0, shown[k] + (on ? dt * 6 : -dt * 6)));
        p.visible = shown[k] > 0.01;
        p.scale.set(1, shown[k], 1);
        p.position.y = 0.0 + (1 - shown[k]) * 0.6;
        marks[k].visible = !on;
      });
    },
  };
}

// ------------------------------------------------------------------ castle gate (boss)
function bossGate(): GateObject {
  const g = new THREE.Group();
  const stone = '#9A95B8';
  const doorW = 6;
  const doorH = 7.6;
  for (const sd of [-1, 1]) {
    box(g, 5.2, 11, 2.2, stone, sd * (doorW / 2 + 2.6), 5.5, 0, { r: 0.3 });
    box(g, 4.4, 16, 4.4, '#B3AED0', sd * 9.4, 8, 0, { r: 0.4 });
    for (let i = 0; i < 3; i++) box(g, 1.2, 1.4, 1.2, '#B3AED0', sd * 9.4 + (i - 1) * 1.6, 16.7, 0, { r: 0.1 });
    box(g, 1.2, 2.2, 0.3, '#FFD98A', sd * 9.4, 10, 2.25, { r: 0.1, m: { emissive: '#FFC060', ei: 0.9 } });
  }
  box(g, doorW + 0.6, 3.6, 2.2, stone, 0, doorH + 1.8, 0, { r: 0.3 });
  for (let i = -3; i <= 3; i++) box(g, 1.2, 1.4, 1.2, '#B3AED0', i * 1.9, doorH + 4.4, 0, { r: 0.1 });
  const door = group(g, 0, 0, 0.2);
  for (let i = 0; i < 6; i++) box(door, doorW / 6 - 0.06, doorH, 0.6, i % 2 ? '#8A5A33' : '#7A4B24', -doorW / 2 + (i + 0.5) * (doorW / 6), doorH / 2, 0, { r: 0.1 });
  for (const y of [1.6, doorH - 1.6]) box(door, doorW, 0.45, 0.7, '#3A2B22', 0, y, 0.05, { r: 0.08 });
  ball(door, 0.5, '#FFC83D', 0, doorH * 0.5, 0.5);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9), new THREE.MeshStandardMaterial({ color: '#E8457C', side: THREE.DoubleSide }));
  flag.position.set(9.4 + 1.8, 19.2, 0);
  g.add(flag);
  box(g, 0.2, 5, 0.2, '#D9D9E0', 9.4, 18.4, 0);
  return {
    group: g,
    zOffset: 0,
    update: (t, _dt, _v, pass) => {
      door.position.y = Math.min(1, pass / 0.22) * (doorH + 0.4);
      flag.rotation.y = Math.sin(t * 4) * 0.35;
    },
  };
}

export function buildGateObject(gate: Gate, anims: Tick[]): GateObject {
  if (gate.kind === 'bridge') return bridgeGate(gate, anims);
  if (gate.kind === 'boss') return bossGate();
  return portalGate(gate);
}

// ------------------------------------------------------------------ coins and obstacles
const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 24);
const coinMat = new THREE.MeshStandardMaterial({ color: '#FFC83D', metalness: 0.7, roughness: 0.25, emissive: '#FF9A1F', emissiveIntensity: 0.55 });
export function makeCoin() {
  const c = new THREE.Mesh(coinGeo, coinMat);
  c.rotation.x = Math.PI / 2;
  const holder = new THREE.Group();
  holder.add(c);
  const rim = torus(holder, 0.8, 0.07, '#FFE08A', 0, 0, 0, Math.PI * 2, { m: { emissive: '#FFC83D', ei: 0.5 } });
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1, 1, 1.2);
  holder.userData.spin = c;
  holder.userData.rim = rim;
  return holder;
}

export function makeObstacle(color = '#B5763F') {
  const g = new THREE.Group();
  box(g, 2.2, 2.2, 2.2, color, 0, 1.1, 0, { r: 0.2 });
  box(g, 2.3, 0.3, 2.3, '#6B4223', 0, 0.3, 0, { r: 0.05 });
  box(g, 2.3, 0.3, 2.3, '#6B4223', 0, 1.9, 0, { r: 0.05 });
  box(g, 0.3, 2.3, 2.3, '#6B4223', 0, 1.1, 0, { r: 0.05 });
  cyl(g, 0.35, 0.35, 0.2, '#FFC83D', 0, 2.3, 0, 8);
  return g;
}
