import { renderToStaticMarkup } from 'react-dom/server';
import type { Look } from '../types';

export type Facing = 'down' | 'up' | 'side';
export interface TrainerPose { facing: Facing; step: 0 | 1 | 2; cheer?: boolean }

export const DEFAULT_LOOK: Look = {
  gender: 'boy', skin: '#f6c9a0', hair: '#5b3a29', hairStyle: 'short', hat: 'cap', hatColor: '#2563eb', top: '#1e90ff', pants: '#34495e',
  shoes: '#f59e0b', backpack: 'pack', packColor: '#f4b400', accessory: 'none', accColor: '#e03131',
};

const dark = (hex: string, f = 0.78) => {
  const h = hex.replace('#', ''); const n = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * f))));
  return `#${n.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** Original, customizable trainer. `look` comes from the equipped wardrobe items. `step` picks an idle/walk frame. */
export function Trainer({ facing = 'down', step = 0, cheer = false, size = 96, look = DEFAULT_LOOK }: Partial<TrainerPose> & { size?: number; look?: Look }) {
  const L = { ...DEFAULT_LOOK, ...look };
  const swing = step === 0 ? 0 : step === 1 ? 14 : -14;
  const bob = step === 0 ? 0 : -2;
  const back = facing === 'up', side = facing === 'side', girl = L.gender === 'girl';
  const legL = `rotate(${swing} 86 138)`, legR = `rotate(${-swing} 114 138)`;
  const armL = cheer ? 'rotate(150 72 98)' : `rotate(${-swing} 72 98)`, armR = cheer ? 'rotate(-150 128 98)' : `rotate(${swing} 128 98)`;
  const hairD = dark(L.hair, 0.8), topD = dark(L.top), hatD = dark(L.hatColor);
  const longHair = L.hairStyle === 'long', pony = L.hairStyle === 'ponytail';
  const hasCap = L.hat === 'cap', hatOn = L.hat !== 'none';

  const hairBack = (
    <g fill={L.hair} stroke={hairD} strokeWidth="2.5">
      {longHair && <path d="M64,56 Q60,110 74,118 L126,118 Q140,110 136,56 Z" />}
      {pony && <path d={side ? 'M70,50 Q38,60 46,100 Q56,84 70,76 Z' : back ? 'M92,70 Q86,118 100,126 Q114,118 108,70 Z' : 'M130,50 Q158,64 148,104 Q136,86 128,76 Z'} />}
      {L.hairStyle === 'bun' && <circle cx={side ? 76 : 100} cy="20" r="14" />}
    </g>
  );
  const hairFront = back ? <circle cx="100" cy="62" r="34" fill={L.hair} /> : (
    <g fill={L.hair}>
      {L.hairStyle === 'spiky'
        ? <path d="M64,56 L62,34 L76,42 L82,22 L96,38 L108,18 L118,38 L134,28 L134,56 Q120,44 100,46 Q80,44 64,56Z" />
        : <path d="M66,56 Q70,34 100,32 Q130,34 134,56 Q120,44 100,46 Q80,44 66,56Z" />}
      {(longHair || pony) && !side && <><path d="M64,50 Q60,80 70,92 L72,56Z" /><path d="M136,50 Q140,80 130,92 L128,56Z" /></>}
    </g>
  );
  const hat = (() => {
    if (L.hat === 'cap') return (<g><path d="M64,50 Q68,18 100,16 Q132,18 136,50 Z" fill={L.hatColor} stroke={hatD} strokeWidth="3" />
      <path d={back ? 'M64,50 H136' : side ? 'M104,48 Q140,44 150,56 Q130,56 104,54Z' : 'M70,50 H130 Q134,60 100,58 Q66,60 70,50Z'} fill={hatD} stroke={hatD} strokeWidth="3" strokeLinejoin="round" />
      {!back && <polygon points="100,24 103,32 111,32 105,37 107,45 100,40 93,45 95,37 89,32 97,32" fill="#ffd43b" />}</g>);
    if (L.hat === 'beanie') return (<g><path d="M63,52 Q64,16 100,14 Q136,16 137,52 Z" fill={L.hatColor} stroke={hatD} strokeWidth="3" /><rect x="62" y="44" width="76" height="12" rx="6" fill={hatD} /><circle cx="100" cy="12" r="8" fill={L.hatColor} stroke={hatD} strokeWidth="2.5" /></g>);
    if (L.hat === 'crown') return (<g><path d="M70,36 L76,12 L88,28 L100,8 L112,28 L124,12 L130,36 Z" fill={L.hatColor} stroke="#b7791f" strokeWidth="3" strokeLinejoin="round" /><circle cx="100" cy="24" r="4" fill="#e03131" /><circle cx="80" cy="28" r="3" fill="#3b82f6" /><circle cx="120" cy="28" r="3" fill="#3b82f6" /></g>);
    if (L.hat === 'wizard') return (<g><ellipse cx="100" cy="42" rx="46" ry="9" fill={hatD} /><path d="M72,42 Q96,-18 130,-6 Q112,6 128,42 Z" fill={L.hatColor} stroke={hatD} strokeWidth="3" strokeLinejoin="round" /><circle cx="104" cy="30" r="4" fill="#ffd43b" /></g>);
    return null;
  })();
  const acc = (() => {
    if (L.accessory === 'glasses' && !back) return (<g fill="none" stroke={L.accColor} strokeWidth="3"><circle cx={side ? 112 : 88} cy="62" r="9" />{!side && <circle cx="112" cy="62" r="9" />}{!side && <path d="M97,62 h6" />}</g>);
    if (L.accessory === 'scarf') return (<g fill={L.accColor} stroke={dark(L.accColor)} strokeWidth="2.5"><rect x="76" y="84" width="48" height="12" rx="6" />{!back && <path d="M108,92 L122,118 L108,114Z" />}</g>);
    if (L.accessory === 'headphones') return (<g><path d="M66,60 Q66,22 100,22 Q134,22 134,60" fill="none" stroke={L.accColor} strokeWidth="6" strokeLinecap="round" /><rect x="58" y="54" width="14" height="22" rx="6" fill={L.accColor} />{!side && <rect x="128" y="54" width="14" height="22" rx="6" fill={L.accColor} />}</g>);
    return null;
  })();
  const cape = L.accessory === 'cape' && (<path d="M72,90 L128,90 L142,152 Q100,166 58,152 Z" fill={L.accColor} stroke={dark(L.accColor)} strokeWidth="3" />);
  const wings = L.backpack === 'wings' && (<g fill="#fff" stroke="#adb5bd" strokeWidth="3"><path d="M72,96 Q22,60 28,128 Q50,112 72,118Z" /><path d="M128,96 Q178,60 172,128 Q150,112 128,118Z" /></g>);
  const pack = L.backpack === 'pack' && (side ? <rect x="50" y="92" width="24" height="40" rx="10" fill={L.packColor} stroke={dark(L.packColor)} strokeWidth="3" /> : null);
  const packBack = L.backpack === 'pack' && back && <rect x="68" y="86" width="64" height="56" rx="14" fill={L.packColor} stroke={dark(L.packColor)} strokeWidth="3" />;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} overflow="visible">
      <ellipse cx="100" cy="176" rx="34" ry="8" fill="#000" opacity=".18" />
      <g transform={`translate(0 ${bob})`}>
        {!back && cape}{wings}{hairBack}
        <g transform={legL}><rect x="76" y="132" width="20" height="36" rx="8" fill={L.pants} /><ellipse cx="86" cy="168" rx="14" ry="7" fill={L.shoes} /></g>
        <g transform={legR}><rect x="104" y="132" width="20" height="36" rx="8" fill={L.pants} /><ellipse cx="114" cy="168" rx="14" ry="7" fill={L.shoes} /></g>
        <g transform={armL}><rect x="62" y="92" width="16" height="36" rx="8" fill={L.top} /><circle cx="70" cy="128" r="8" fill={L.skin} /></g>
        <g transform={armR}><rect x="122" y="92" width="16" height="36" rx="8" fill={L.top} /><circle cx="130" cy="128" r="8" fill={L.skin} /></g>
        <rect x="70" y="88" width="60" height="52" rx="16" fill={L.top} stroke={topD} strokeWidth="3" />
        {girl && <path d="M68,132 L132,132 L142,152 L58,152 Z" fill={L.pants} stroke={dark(L.pants)} strokeWidth="2.5" />}
        {!back && <rect x="88" y="92" width="24" height="44" rx="8" fill="#fff6d6" />}
        {!back && <rect x="96" y="92" width="8" height="46" fill="#ffd43b" opacity=".7" />}
        {packBack}{pack}
        {back && cape}
        <circle cx="100" cy="60" r="34" fill={L.skin} />
        {hairFront}
        {!back && (<g>
          <ellipse cx={side ? 112 : 88} cy="62" rx="5" ry="7" fill="#22223b" /><circle cx={side ? 114 : 90} cy="59" r="2" fill="#fff" />
          {!side && (<g><ellipse cx="112" cy="62" rx="5" ry="7" fill="#22223b" /><circle cx="114" cy="59" r="2" fill="#fff" /></g>)}
          {girl && !side && <g stroke="#22223b" strokeWidth="2.5" strokeLinecap="round"><path d="M80,54 l-5,-3" /><path d="M120,54 l5,-3" /></g>}
          <path d={side ? 'M106,76 q6,5 12,0' : 'M92,76 q8,7 16,0'} fill="none" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
          <circle cx={side ? 120 : 80} cy="72" r="5" fill="#ff8787" opacity=".6" />{!side && <circle cx="120" cy="72" r="5" fill="#ff8787" opacity=".6" />}
        </g>)}
        {acc}{hatOn && hat}
        {!hasCap && L.hat === 'none' && null}
      </g>
    </svg>
  );
}

const cache = new Map<string, string>();
/** Data-URL of a trainer pose, for drawing into the canvas world. */
export function trainerDataUrl(p: TrainerPose, size = 96, look: Look = DEFAULT_LOOK): string {
  const key = `${p.facing}-${p.step}-${p.cheer ? 1 : 0}-${size}-${JSON.stringify(look)}`;
  let url = cache.get(key);
  if (!url) {
    const svg = renderToStaticMarkup(<Trainer facing={p.facing} step={p.step} cheer={p.cheer} size={size} look={look} />).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    cache.set(key, url);
  }
  return url;
}
