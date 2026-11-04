import { useId, type CSSProperties } from 'react';
import type { ArtSpec } from '../types';
import { ANIM_NAMES } from '../world/monsterSprites';
import '../world/monsterAnimations.css';

/** Sprite paths saved in the database are relative to the site root (e.g. monster-quest/sprites/flamora.png). */
export const spriteSrc = (u: string) => (/^(https?:|data:|\/)/.test(u) ? u : `${import.meta.env.BASE_URL}${u.replace(/^\.?\//, '')}`);
/** The supplied animation for a sprite, picked from its file name (flamora.png -> a-flamora). */
const spriteAnim = (u: string) => { const n = u.split('/').pop()?.replace(/\.\w+$/, '') ?? ''; return (ANIM_NAMES as readonly string[]).includes(n) ? n : null; };

const BODY = {
  round: { cy: 122, rx: 58, ry: 52 },
  tall: { cy: 116, rx: 44, ry: 64 },
  wide: { cy: 130, rx: 68, ry: 44 },
  bean: { cy: 118, rx: 48, ry: 58 },
} as const;

/** Original monster artwork, drawn from a data spec (stored per species in the database). */
export function MonsterArt({
  spec, size = 120, spriteUrl, flip, anim = 'idle', silhouette, className, style,
}: {
  spec: ArtSpec; size?: number; spriteUrl?: string | null; flip?: boolean;
  anim?: 'idle' | 'none' | 'hit' | 'attack'; silhouette?: boolean; className?: string; style?: CSSProperties;
}) {
  const uid = useId().replace(/:/g, '');
  const wrap: CSSProperties = {
    width: size, height: size, display: 'inline-block', lineHeight: 0,
    transform: flip ? 'scaleX(-1)' : undefined,
    filter: silhouette ? 'brightness(0) opacity(.35)' : undefined, ...style,
  };
  const cls = `${anim === 'idle' ? 'mq-idle' : anim === 'hit' ? 'mq-hit' : anim === 'attack' ? 'mq-attack' : ''} ${className ?? ''}`;
  if (spriteUrl) {
    // the supplied keyframe animation runs on an inner wrapper so the flip transform on the outer span is kept
    const an = anim === 'idle' ? spriteAnim(spriteUrl) : null;
    const img = <img src={spriteSrc(spriteUrl)} alt="" width={size} height={size} style={{ objectFit: 'contain' }} />;
    return <span style={wrap} className={an ? (className ?? '') : cls}>{an ? <span className={`mon a-${an}`} style={{ display: 'inline-block', lineHeight: 0 }}>{img}</span> : img}</span>;
  }
  const { cy, rx, ry } = BODY[spec.body];
  const top = cy - ry;
  const faceY = cy - ry * 0.18;
  const { c1, c2, belly } = spec;
  const dark = '#22223b';

  const ears = (() => {
    const x1 = 100 - rx * 0.55, x2 = 100 + rx * 0.55;
    switch (spec.ears) {
      case 'pointy': return (<g fill={c1} stroke={c2} strokeWidth="3" strokeLinejoin="round">
        <polygon points={`${x1 - 14},${top + 14} ${x1 - 6},${top - 26} ${x1 + 16},${top + 6}`} />
        <polygon points={`${x2 + 14},${top + 14} ${x2 + 6},${top - 26} ${x2 - 16},${top + 6}`} /></g>);
      case 'round': return (<g fill={c1} stroke={c2} strokeWidth="3"><circle cx={x1} cy={top + 6} r="15" /><circle cx={x2} cy={top + 6} r="15" />
        <circle cx={x1} cy={top + 6} r="7" fill={belly} stroke="none" /><circle cx={x2} cy={top + 6} r="7" fill={belly} stroke="none" /></g>);
      case 'long': return (<g fill={c1} stroke={c2} strokeWidth="3">
        <ellipse cx={x1 - 4} cy={top - 8} rx="10" ry="30" transform={`rotate(-14 ${x1 - 4} ${top - 8})`} />
        <ellipse cx={x2 + 4} cy={top - 8} rx="10" ry="30" transform={`rotate(14 ${x2 + 4} ${top - 8})`} /></g>);
      case 'horn': return (<g fill={belly} stroke={c2} strokeWidth="3" strokeLinejoin="round">
        <path d={`M${x1 - 6},${top + 12} Q${x1 - 14},${top - 20} ${x1 + 6},${top - 26} Q${x1 + 6},${top - 4} ${x1 + 14},${top + 6} Z`} />
        <path d={`M${x2 + 6},${top + 12} Q${x2 + 14},${top - 20} ${x2 - 6},${top - 26} Q${x2 - 6},${top - 4} ${x2 - 14},${top + 6} Z`} /></g>);
      default: return null;
    }
  })();

  const tail = (() => {
    const tx = 100 + rx - 6, ty = cy + ry * 0.25;
    switch (spec.tail) {
      case 'flame': return (<g><path d={`M${tx},${ty} C${tx + 30},${ty - 6} ${tx + 34},${ty - 44} ${tx + 14},${ty - 62} C${tx + 14},${ty - 40} ${tx + 2},${ty - 38} ${tx - 6},${ty - 14} Z`} fill="#ff922b" stroke="#e8590c" strokeWidth="3" strokeLinejoin="round" />
        <path d={`M${tx + 4},${ty - 6} C${tx + 20},${ty - 12} ${tx + 22},${ty - 34} ${tx + 12},${ty - 44} C${tx + 10},${ty - 28} ${tx + 2},${ty - 24} ${tx},${ty - 10} Z`} fill="#ffe066" /></g>);
      case 'leaf': return (<g><ellipse cx={tx + 16} cy={ty - 10} rx="24" ry="11" transform={`rotate(-40 ${tx + 16} ${ty - 10})`} fill="#69db7c" stroke="#2b8a3e" strokeWidth="3" />
        <path d={`M${tx + 4},${ty - 2} L${tx + 28},${ty - 24}`} stroke="#2b8a3e" strokeWidth="2.5" strokeLinecap="round" /></g>);
      case 'fin': return (<path d={`M${tx - 2},${ty + 6} Q${tx + 34},${ty - 4} ${tx + 26},${ty - 40} Q${tx + 6},${ty - 20} ${tx - 8},${ty - 14} Z`} fill={c2} stroke={dark} strokeOpacity=".35" strokeWidth="3" strokeLinejoin="round" />);
      case 'bolt': return (<polygon points={`${tx - 4},${ty + 6} ${tx + 16},${ty - 4} ${tx + 8},${ty - 14} ${tx + 34},${ty - 34} ${tx + 22},${ty - 46} ${tx + 44},${ty - 70} ${tx + 6},${ty - 50} ${tx + 16},${ty - 38} ${tx - 6},${ty - 20}`} fill="#ffd43b" stroke="#e67700" strokeWidth="3" strokeLinejoin="round" />);
      case 'curl': return (<path d={`M${tx},${ty + 4} C${tx + 36},${ty + 10} ${tx + 44},${ty - 30} ${tx + 18},${ty - 34} C${tx + 4},${ty - 36} ${tx + 6},${ty - 18} ${tx + 16},${ty - 20}`} fill="none" stroke={c2} strokeWidth="11" strokeLinecap="round" />);
      default: return null;
    }
  })();

  const back = (() => {
    if (spec.extra === 'wings') return (<g fill={belly} stroke={c2} strokeWidth="3">
      <ellipse cx={100 - rx - 8} cy={cy - 8} rx="22" ry="38" transform={`rotate(24 ${100 - rx - 8} ${cy - 8})`} />
      <ellipse cx={100 + rx + 8} cy={cy - 8} rx="22" ry="38" transform={`rotate(-24 ${100 + rx + 8} ${cy - 8})`} /></g>);
    if (spec.extra === 'shell') return (<g><ellipse cx="100" cy={cy - 6} rx={rx + 12} ry={ry + 10} fill={c2} stroke={dark} strokeOpacity=".3" strokeWidth="3" />
      <path d={`M${100 - rx + 6},${cy - 6} H${100 + rx - 6} M100,${cy - ry - 4} V${cy + ry}`} stroke={belly} strokeOpacity=".5" strokeWidth="3" /></g>);
    return null;
  })();

  const eyeOffset = rx * 0.38;
  const eyes = (() => {
    const lx = 100 - eyeOffset, rxp = 100 + eyeOffset;
    if (spec.eyes === 'sleepy') return (<g stroke={dark} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${lx - 9},${faceY} Q${lx},${faceY + 8} ${lx + 9},${faceY}`} /><path d={`M${rxp - 9},${faceY} Q${rxp},${faceY + 8} ${rxp + 9},${faceY}`} /></g>);
    const fierce = spec.eyes === 'fierce';
    return (<g>
      {[lx, rxp].map((x, i) => (<g key={i}><ellipse cx={x} cy={faceY} rx="9" ry={fierce ? 10 : 12} fill={dark} />
        <circle cx={x + 3} cy={faceY - 4} r="3.6" fill="#fff" /><circle cx={x - 3} cy={faceY + 4} r="1.8" fill="#fff" /></g>))}
      {fierce && <g stroke={dark} strokeWidth="4.5" strokeLinecap="round"><path d={`M${lx - 12},${faceY - 16} L${lx + 8},${faceY - 8}`} /><path d={`M${rxp + 12},${faceY - 16} L${rxp - 8},${faceY - 8}`} /></g>}
    </g>);
  })();

  const mouth = spec.eyes === 'fierce'
    ? <path d={`M${100 - 12},${faceY + 24} Q100,${faceY + 36} ${100 + 12},${faceY + 24}`} fill="#fff" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
    : <path d={`M${100 - 9},${faceY + 22} Q100,${faceY + 32} ${100 + 9},${faceY + 22}`} fill="none" stroke={dark} strokeWidth="3.5" strokeLinecap="round" />;

  const mark = (() => {
    switch (spec.mark) {
      case 'cheeks': return (<g fill="#ff8787" opacity=".85"><circle cx={100 - rx * 0.62} cy={faceY + 16} r="8" /><circle cx={100 + rx * 0.62} cy={faceY + 16} r="8" /></g>);
      case 'stripes': return (<g stroke={c2} strokeWidth="6" strokeLinecap="round"><path d={`M${100 - 22},${top + 10} l4,14`} /><path d={`M100,${top + 6} v16`} /><path d={`M${100 + 22},${top + 10} l-4,14`} /></g>);
      case 'spots': return (<g fill={c2} opacity=".55"><circle cx={100 - rx * 0.6} cy={cy + ry * 0.2} r="7" /><circle cx={100 + rx * 0.55} cy={cy + ry * 0.05} r="5" /><circle cx={100 + rx * 0.3} cy={top + 14} r="5" /></g>);
      case 'gem': return (<polygon points={`100,${top + 4} ${100 + 9},${top + 17} 100,${top + 30} ${100 - 9},${top + 17}`} fill="#e7f5ff" stroke={c2} strokeWidth="3" strokeLinejoin="round" />);
      default: return null;
    }
  })();

  const crest = spec.extra === 'crest' && (
    <g fill={c2} stroke={dark} strokeOpacity=".3" strokeWidth="2" strokeLinejoin="round">
      <polygon points={`${100 - 14},${top + 6} ${100 - 8},${top - 14} ${100 - 1},${top + 4}`} />
      <polygon points={`${100 - 6},${top + 4} 100,${top - 22} ${100 + 6},${top + 4}`} />
      <polygon points={`${100 + 1},${top + 4} ${100 + 8},${top - 14} ${100 + 14},${top + 6}`} /></g>
  );

  return (
    <span style={wrap} className={cls} aria-hidden="true">
      <svg viewBox="0 0 200 200" width={size} height={size} overflow="visible">
        <defs>
          <radialGradient id={`g${uid}`} cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".55" stopColor="#fff" stopOpacity="0" /></radialGradient>
        </defs>
        <ellipse cx="100" cy="184" rx={rx * 0.9} ry="9" fill="#000" opacity=".16" />
        {back}{tail}{ears}
        <ellipse cx={100 - rx * 0.46} cy={cy + ry - 4} rx="17" ry="11" fill={c2} /><ellipse cx={100 + rx * 0.46} cy={cy + ry - 4} rx="17" ry="11" fill={c2} />
        <ellipse cx="100" cy={cy} rx={rx} ry={ry} fill={c1} stroke={c2} strokeWidth="4" />
        <ellipse cx="100" cy={cy + ry * 0.38} rx={rx * 0.58} ry={ry * 0.5} fill={belly} opacity=".95" />
        <ellipse cx={100 - rx - 2} cy={cy + 6} rx="11" ry="16" fill={c1} stroke={c2} strokeWidth="3.5" transform={`rotate(14 ${100 - rx} ${cy})`} />
        <ellipse cx={100 + rx + 2} cy={cy + 6} rx="11" ry="16" fill={c1} stroke={c2} strokeWidth="3.5" transform={`rotate(-14 ${100 + rx} ${cy})`} />
        <ellipse cx="100" cy={cy} rx={rx} ry={ry} fill={`url(#g${uid})`} />
        {crest}{mark}{eyes}{mouth}
      </svg>
    </span>
  );
}
