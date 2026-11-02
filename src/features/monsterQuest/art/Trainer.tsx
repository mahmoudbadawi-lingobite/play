import { renderToStaticMarkup } from 'react-dom/server';

export type Facing = 'down' | 'up' | 'side';
export interface TrainerPose { facing: Facing; step: 0 | 1 | 2; cheer?: boolean }

const SKIN = '#f6c9a0', HAIR = '#5b3a29', CAP = '#2563eb', CAP2 = '#1d4ed8', JACKET = '#1e90ff', SHIRT = '#fff6d6', PANTS = '#34495e', SHOE = '#f59e0b', PACK = '#f4b400';

/** Original trainer character, drawn in SVG. `step` selects an idle / walk frame so the same art works in the canvas world and in UI. */
export function Trainer({ facing = 'down', step = 0, cheer = false, size = 96 }: Partial<TrainerPose> & { size?: number }) {
  const swing = step === 0 ? 0 : step === 1 ? 14 : -14;
  const bob = step === 0 ? 0 : -2;
  const legL = `rotate(${swing} 86 138)`, legR = `rotate(${-swing} 114 138)`;
  const armL = cheer ? 'rotate(150 72 98)' : `rotate(${-swing} 72 98)`, armR = cheer ? 'rotate(-150 128 98)' : `rotate(${swing} 128 98)`;
  const back = facing === 'up';
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} overflow="visible">
      <ellipse cx="100" cy="176" rx="34" ry="8" fill="#000" opacity=".18" />
      <g transform={`translate(0 ${bob})`}>
        {back && <rect x="68" y="86" width="64" height="56" rx="14" fill={PACK} stroke="#b7791f" strokeWidth="3" />}
        <g transform={legL}><rect x="76" y="132" width="20" height="36" rx="8" fill={PANTS} /><ellipse cx="86" cy="168" rx="14" ry="7" fill={SHOE} /></g>
        <g transform={legR}><rect x="104" y="132" width="20" height="36" rx="8" fill={PANTS} /><ellipse cx="114" cy="168" rx="14" ry="7" fill={SHOE} /></g>
        <g transform={armL}><rect x="62" y="92" width="16" height="36" rx="8" fill={JACKET} /><circle cx="70" cy="128" r="8" fill={SKIN} /></g>
        <g transform={armR}><rect x="122" y="92" width="16" height="36" rx="8" fill={JACKET} /><circle cx="130" cy="128" r="8" fill={SKIN} /></g>
        <rect x="70" y="88" width="60" height="52" rx="16" fill={JACKET} stroke="#1864ab" strokeWidth="3" />
        {!back && <rect x="88" y="92" width="24" height="44" rx="8" fill={SHIRT} />}
        {!back && <rect x="96" y="92" width="8" height="46" fill="#ffd43b" opacity=".7" />}
        {facing === 'side' && <rect x="50" y="92" width="24" height="40" rx="10" fill={PACK} stroke="#b7791f" strokeWidth="3" />}
        <circle cx="100" cy="60" r="34" fill={SKIN} />
        {back ? <circle cx="100" cy="62" r="34" fill={HAIR} /> : <path d="M66,56 Q70,34 100,32 Q130,34 134,56 Q120,44 100,46 Q80,44 66,56Z" fill={HAIR} />}
        {!back && (<g>
          <ellipse cx={facing === 'side' ? 112 : 88} cy="62" rx="5" ry="7" fill="#22223b" /><circle cx={facing === 'side' ? 114 : 90} cy="59" r="2" fill="#fff" />
          {facing === 'down' && (<g><ellipse cx="112" cy="62" rx="5" ry="7" fill="#22223b" /><circle cx="114" cy="59" r="2" fill="#fff" /></g>)}
          <path d={facing === 'side' ? 'M106,76 q6,5 12,0' : 'M92,76 q8,7 16,0'} fill="none" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
          <circle cx={facing === 'side' ? 120 : 80} cy="72" r="5" fill="#ff8787" opacity=".6" />{facing === 'down' && <circle cx="120" cy="72" r="5" fill="#ff8787" opacity=".6" />}
        </g>)}
        <path d="M64,50 Q68,18 100,16 Q132,18 136,50 Z" fill={CAP} stroke={CAP2} strokeWidth="3" />
        <path d={back ? 'M64,50 H136' : facing === 'side' ? 'M104,48 Q140,44 150,56 Q130,56 104,54Z' : 'M70,50 H130 Q134,60 100,58 Q66,60 70,50Z'} fill={CAP2} stroke={CAP2} strokeWidth="3" strokeLinejoin="round" />
        {!back && <polygon points="100,24 103,32 111,32 105,37 107,45 100,40 93,45 95,37 89,32 97,32" fill="#ffd43b" />}
      </g>
    </svg>
  );
}

const cache = new Map<string, string>();
/** Data-URL of a trainer pose, for drawing into the canvas world. */
export function trainerDataUrl(p: TrainerPose, size = 96): string {
  const key = `${p.facing}-${p.step}-${p.cheer ? 1 : 0}-${size}`;
  let url = cache.get(key);
  if (!url) {
    const svg = renderToStaticMarkup(<Trainer facing={p.facing} step={p.step} cheer={p.cheer} size={size} />)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    cache.set(key, url);
  }
  return url;
}
