import type { CSSProperties } from 'react';
import './scene.css';

/**
 * Painted backdrops for wild encounters and arena battles, built from the same pictures as the world
 * (public/monster-quest/world/). Everything is sized from the box it sits in (--u = 1% of its width, or a bit more in tall boxes), so it fits a phone, a tablet or the arena panel.
 */
export type SceneKind = 'village' | 'valley' | 'arena';
const BASE = `${import.meta.env.BASE_URL}monster-quest/world/`;
interface Item { id: string; x: number; b: number; w: number; z?: number; flip?: boolean; sway?: number; delay?: number }
interface Strip { id: string; x: number; b: number; w: number; fw: number; fh: number; n: number; fps: number; z?: number }
interface Def { sky: string; ground: string; groundK: number; groundTint: string; items: Item[]; strips: Strip[]; fx: 'pollen' | 'fireflies' | 'embers' }

const VILLAGE: Def = {
  sky: 'linear-gradient(180deg,#78c8ff 0%,#bfe8ff 36%,#fff2cc 56%)', ground: 'grass1', groundK: 24, groundTint: 'rgba(255,240,170,.08)', fx: 'pollen', strips: [],
  items: [
    { id: 'tree-green', x: 4, b: 41, w: 15, z: 1 }, { id: 'pine', x: 17, b: 42, w: 11, z: 1 }, { id: 'tree-orange', x: 31, b: 40, w: 14, z: 1 }, { id: 'tree-green', x: 47, b: 41, w: 13, z: 1 },
    { id: 'tree-pink', x: 62, b: 40, w: 15, z: 1 }, { id: 'pine', x: 77, b: 42, w: 11, z: 1 }, { id: 'tree-green', x: 92, b: 41, w: 16, z: 1 },
    { id: 'house-red', x: 11, b: 36, w: 19, z: 2 }, { id: 'house-blue', x: 87, b: 36, w: 18, z: 2 }, { id: 'lamp-a', x: 25, b: 32, w: 5, z: 2 }, { id: 'fence-wood', x: 71, b: 33, w: 14, z: 2 },
    { id: 'bush-big', x: -2, b: -3, w: 28, z: 4, sway: 1 }, { id: 'flowers-white', x: 20, b: 1, w: 9, z: 4, sway: 3 }, { id: 'grass-big', x: 33, b: -4, w: 16, z: 4, sway: 2 },
    { id: 'grass-mid', x: 62, b: -4, w: 14, z: 4, sway: 1 }, { id: 'tulips', x: 71, b: 2, w: 8, z: 4, sway: 3 }, { id: 'flowers-purple', x: 82, b: 2, w: 9, z: 4, sway: 2 }, { id: 'bush-mid', x: 100, b: -3, w: 26, z: 4, sway: 2 },
  ],
};
const VALLEY: Def = {
  sky: 'linear-gradient(180deg,#140e44 0%,#382784 38%,#8e5dc4 54%,#ffb6dd 63%)', ground: 'mv-grass', groundK: 26, groundTint: 'rgba(70,50,160,.22)', fx: 'fireflies',
  strips: [{ id: 'mv-fireflies', x: 26, b: 22, w: 9, fw: 307, fh: 380, n: 6, fps: 5, z: 5 }, { id: 'mv-fireflies', x: 78, b: 30, w: 8, fw: 307, fh: 380, n: 6, fps: 4, z: 5 }],
  items: [
    { id: 'mv-giant-blue', x: 6, b: 40, w: 17, z: 1 }, { id: 'mv-giant-teal', x: 22, b: 41, w: 14, z: 1 }, { id: 'pine', x: 35, b: 40, w: 10, z: 1 }, { id: 'mv-giant-purple', x: 50, b: 40, w: 15, z: 1 },
    { id: 'mv-giant-pink', x: 66, b: 41, w: 15, z: 1 }, { id: 'pine', x: 78, b: 40, w: 10, z: 1 }, { id: 'mv-giant-orange', x: 91, b: 40, w: 14, z: 1 },
    { id: 'mv-treehouse', x: 13, b: 35, w: 19, z: 2 }, { id: 'mv-fairy-ring', x: 86, b: 33, w: 13, z: 2 },
    { id: 'mv-fern-big', x: -1, b: -2, w: 24, z: 4, sway: 1 }, { id: 'mv-bluebell-big', x: 17, b: 1, w: 11, z: 4, sway: 3 }, { id: 'mv-fern-small', x: 36, b: -3, w: 14, z: 4, sway: 2 },
    { id: 'mv-jar', x: 62, b: 2, w: 6, z: 4 }, { id: 'mv-bluebell-small', x: 76, b: 2, w: 9, z: 4, sway: 3 }, { id: 'mv-crystal-big', x: 90, b: 2, w: 12, z: 4 }, { id: 'mv-berry-bush', x: 104, b: -3, w: 24, z: 4, sway: 2 },
  ],
};
const ARENA: Def = {
  sky: 'linear-gradient(180deg,#16205f 0%,#4b3597 46%,#e98f6a 60%,#ffd38a 66%)', ground: 'cobble', groundK: 30, groundTint: 'rgba(40,30,90,.18)', fx: 'embers',
  strips: [{ id: 'torch', x: 19, b: 31, w: 4.5, fw: 129, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'torch', x: 81, b: 31, w: 4.5, fw: 129, fh: 420, n: 6, fps: 9, z: 3 },
    { id: 'brazier', x: 31, b: 29, w: 8, fw: 217, fh: 420, n: 6, fps: 9, z: 3 }, { id: 'brazier', x: 69, b: 29, w: 8, fw: 217, fh: 420, n: 6, fps: 9, z: 3 }],
  items: [
    { id: 'arch-stone', x: 50, b: 40, w: 30, z: 1 }, { id: 'pillar', x: 12, b: 38, w: 7, z: 1 }, { id: 'pillar', x: 88, b: 38, w: 7, z: 1 },
    { id: 'banner-post', x: 6, b: 30, w: 9, z: 2 }, { id: 'banner-post', x: 94, b: 30, w: 9, z: 2 },
    { id: 'crystal-pillar', x: 4, b: 2, w: 9, z: 4 }, { id: 'barrel', x: 94, b: 2, w: 9, z: 4 }, { id: 'crate', x: 85, b: 0, w: 8, z: 4 },
  ],
};
const DEFS: Record<SceneKind, Def> = { village: VILLAGE, valley: VALLEY, arena: ARENA };
const dots = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 11) % 100, y: 8 + ((i * 53 + 7) % 70), d: 4 + (i % 5) * 1.3, s: 0.5 + (i % 4) * 0.25 }));

export function EncounterScene({ kind }: { kind: SceneKind }) {
  const d = DEFS[kind];
  return (
    <div className={`mq-scene mq-scene-${kind}`} aria-hidden="true">
      <div className="mq-scene-sky" style={{ background: d.sky }} />
      <div className="mq-scene-sun" />
      {d.items.filter((i) => (i.z ?? 1) <= 3).map((i, k) => <Obj key={'b' + k} i={i} />)}
      {d.strips.filter((s) => (s.z ?? 1) <= 3).map((s, k) => <StripObj key={'sb' + k} s={s} />)}
      <div className="mq-scene-ground" style={{ backgroundImage: `url(${BASE}ground/${d.ground}.jpg)`, backgroundSize: `calc(${d.groundK} * var(--u)) auto` }}><div style={{ position: 'absolute', inset: 0, background: d.groundTint }} /></div>
      <div className="mq-scene-fx">{dots.map((p, k) => <i key={k} className={`mq-fx-${d.fx}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${p.d} * var(--u))`, height: `calc(${p.d} * var(--u))`, animationDelay: `${-k * 0.7}s`, animationDuration: `${5 + (k % 5)}s` }} />)}</div>
      {d.items.filter((i) => (i.z ?? 1) > 3).map((i, k) => <Obj key={'f' + k} i={i} />)}
      {d.strips.filter((s) => (s.z ?? 1) > 3).map((s, k) => <StripObj key={'sf' + k} s={s} />)}
    </div>
  );
}
function Obj({ i }: { i: Item }) {
  return (
    <div className="mq-scene-obj" style={{ left: `${i.x}%`, bottom: `${i.b}%`, width: `calc(${i.w} * var(--u))`, zIndex: i.z ?? 1 }}>
      <img src={`${BASE}sprites/${i.id}.webp`} alt="" draggable={false} className={i.sway ? 'mq-scene-sway' : undefined} style={{ transform: i.flip ? 'scaleX(-1)' : undefined, animationDuration: `${3 + (i.sway ?? 0) * 0.9}s`, animationDelay: `${-(i.x % 7) * 0.5}s` }} />
    </div>
  );
}
function StripObj({ s }: { s: Strip }) {
  const style = { left: `${s.x}%`, bottom: `${s.b}%`, width: `calc(${s.w} * var(--u))`, aspectRatio: `${s.fw} / ${s.fh}`, zIndex: s.z ?? 1, backgroundImage: `url(${BASE}anim/${s.id}.webp)`, '--w': `calc(${s.w} * var(--u))`, '--n': s.n, animationDuration: `${s.n / s.fps}s` } as CSSProperties;
  return <div className="mq-scene-obj mq-scene-strip" style={style} />;
}
