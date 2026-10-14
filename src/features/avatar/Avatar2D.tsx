import { getItem, hairColor, skinColor, type Gender, type Look } from './catalog';

/**
 * Flat 2D version of the same character. Used (1) as the fallback when WebGL
 * isn't available, (2) while a 3D snapshot is still loading, and (3) as the
 * runner in the 2D Block Quest scene until the 3D run arrives.
 */

const OUTLINE = '#1B1B3A';
const str = (v: unknown, d: string) => (typeof v === 'string' ? v : d);

export interface Figure {
  gender: Gender;
  look: Look;
}

function Hair({ style, color, hideTop }: { style: string; color: string; hideTop: boolean }) {
  const o = { stroke: OUTLINE, strokeWidth: 1.5 };
  const topCap = !hideTop && <rect x="13" y="-1" width="34" height="11" rx="4" fill={color} {...o} />;
  const sides = (h: number) => (
    <>
      <rect x="12" y="4" width="6" height={h} rx="2" fill={color} {...o} />
      <rect x="42" y="4" width="6" height={h} rx="2" fill={color} {...o} />
    </>
  );
  switch (style) {
    case 'spiky':
      return <>{sides(10)}{!hideTop && <polygon points="13,8 16,-8 23,4 30,-10 37,4 44,-8 47,8" fill={color} {...o} strokeLinejoin="round" />}</>;
    case 'curly':
      return <>{sides(14)}{!hideTop && [18, 26, 34, 42].map((x) => <circle key={x} cx={x} cy={4} r={7} fill={color} {...o} />)}</>;
    case 'mohawk':
      return <>{!hideTop && <rect x="26" y="-12" width="8" height="20" rx="2" fill={color} {...o} />}</>;
    case 'messy':
    case 'long':
      return <><rect x="10" y="2" width="40" height="46" rx="4" fill={color} {...o} />{topCap}</>;
    case 'bob':
      return <><rect x="11" y="2" width="38" height="30" rx="4" fill={color} {...o} />{topCap}</>;
    case 'ponytail':
      return <>{topCap}{sides(10)}<rect x="46" y="6" width="9" height="30" rx="4" fill={color} {...o} /></>;
    case 'pigtails':
      return <>{topCap}{sides(10)}<rect x="4" y="8" width="8" height="26" rx="4" fill={color} {...o} /><rect x="48" y="8" width="8" height="26" rx="4" fill={color} {...o} /></>;
    case 'braid':
      return <>{topCap}{sides(10)}<rect x="45" y="8" width="7" height="36" rx="3" fill={color} {...o} /></>;
    case 'buns':
      return <>{topCap}{sides(10)}<circle cx="16" cy="-4" r="7" fill={color} {...o} /><circle cx="44" cy="-4" r="7" fill={color} {...o} /></>;
    default:
      return <>{topCap}{sides(10)}</>;
  }
}

function Hat({ spec }: { spec: Record<string, string | number | boolean> }) {
  const style = str(spec.style, 'cap');
  const c = str(spec.color, '#E8453C');
  const a = str(spec.accent, '#FFFFFF');
  const o = { stroke: OUTLINE, strokeWidth: 2, strokeLinejoin: 'round' as const };
  switch (style) {
    case 'beanie': return <><rect x="13" y="-4" width="34" height="14" rx="6" fill={c} {...o} /><rect x="12" y="6" width="36" height="6" rx="2" fill={a} {...o} /><circle cx="30" cy="-6" r="4" fill={a} {...o} /></>;
    case 'party': return <><polygon points="30,-24 17,6 43,6" fill={c} {...o} /><circle cx="30" cy="-24" r="4" fill={a} {...o} /></>;
    case 'wizard': return <><polygon points="30,-28 18,4 42,4" fill={c} {...o} /><rect x="8" y="2" width="44" height="6" rx="3" fill={c} {...o} /></>;
    case 'crown': return <polygon points="15,4 15,-8 23,-1 30,-12 37,-1 45,-8 45,4" fill={c} {...o} />;
    case 'helmet': return <><rect x="11" y="-4" width="38" height="32" rx="14" fill={c} {...o} /><rect x="16" y="8" width="28" height="14" rx="6" fill={a} fillOpacity="0.55" {...o} /></>;
    case 'explorer': return <><rect x="8" y="4" width="44" height="5" rx="2" fill={c} {...o} /><rect x="16" y="-6" width="28" height="12" rx="4" fill={c} {...o} /></>;
    case 'catears': return <><polygon points="14,4 16,-10 26,2" fill={c} {...o} /><polygon points="46,4 44,-10 34,2" fill={c} {...o} /></>;
    default: return <><rect x="14" y="-2" width="32" height="12" rx="6" fill={c} {...o} /><rect x="14" y="7" width="40" height="5" rx="2" fill={a} {...o} /></>;
  }
}

/** The character in a 60 x 100 box (hats reach up to y = -28). */
export function AvatarBody({ figure, running = false }: { figure: Figure; running?: boolean }) {
  const { gender, look } = figure;
  const skin = skinColor(look.skin);
  const outfit = getItem(look.outfit)?.spec ?? {};
  const top = str(outfit.top, '#3D7BFF');
  const bottom = str(outfit.bottom, '#2B3A67');
  const kind = str(outfit.kind, 'tee');
  const bk = str(outfit.bottomKind, 'pants');
  const longSleeves = !['tee', 'stripes', 'dress'].includes(kind);
  const shoes = getItem(look.shoes)?.spec ?? {};
  const hat = getItem(look.hat);
  const hairStyle = str(getItem(look.hair)?.spec.style, 'short');
  const acc = str(getItem(look.accessory)?.spec.style, '');
  const o = { stroke: OUTLINE, strokeWidth: 2 };
  const legColor = bk === 'pants' ? bottom : skin;
  return (
    <g className={running ? 'bq-run' : undefined}>
      <ellipse cx="30" cy="98" rx="20" ry="4" fill="#000" fillOpacity="0.2" />
      <g className="bq-bob">
        <rect className="bq-limb bq-leg-a" x="16" y="66" width="12" height="30" rx="2" fill={legColor} {...o} />
        <rect className="bq-limb bq-leg-b" x="32" y="66" width="12" height="30" rx="2" fill={legColor} {...o} />
        <rect x="14" y="88" width="15" height="9" rx="3" fill={str(shoes.color, '#3D7BFF')} {...o} />
        <rect x="31" y="88" width="15" height="9" rx="3" fill={str(shoes.color, '#3D7BFF')} {...o} />
        <rect className="bq-limb bq-arm-a" x="3" y="38" width="11" height="26" rx="2" fill={longSleeves ? top : skin} {...o} />
        <rect className="bq-limb bq-arm-b" x="46" y="38" width="11" height="26" rx="2" fill={longSleeves ? top : skin} {...o} />
        <rect x="14" y="36" width="32" height="32" rx="3" fill={top} {...o} />
        {(kind === 'dress' || kind === 'robe' || bk === 'skirt') && <polygon points="12,62 48,62 56,88 4,88" fill={kind === 'dress' || kind === 'robe' ? top : bottom} {...o} strokeLinejoin="round" />}
        {bk === 'shorts' && <><rect x="16" y="66" width="12" height="12" fill={bottom} {...o} /><rect x="32" y="66" width="12" height="12" fill={bottom} {...o} /></>}
        <rect x="15" y="4" width="30" height="30" rx="5" fill={skin} {...o} />
        <Hair style={hairStyle} color={hairColor(look.hairColor)} hideTop={!!hat} />
        <rect x="23" y="16" width="4" height="5" fill={OUTLINE} />
        <rect x="33" y="16" width="4" height="5" fill={OUTLINE} />
        <rect x="25" y="25" width="10" height="3" rx="1" fill={OUTLINE} />
        {gender === 'girl' && <><circle cx="21" cy="24" r="2.5" fill="#FF8FA3" fillOpacity="0.7" /><circle cx="39" cy="24" r="2.5" fill="#FF8FA3" fillOpacity="0.7" /></>}
        {(acc === 'round' || acc === 'shades' || acc === 'goggles') && <><rect x="20" y="14" width="9" height="8" rx="2" fill={acc === 'shades' ? OUTLINE : 'none'} stroke={OUTLINE} strokeWidth="1.5" /><rect x="31" y="14" width="9" height="8" rx="2" fill={acc === 'shades' ? OUTLINE : 'none'} stroke={OUTLINE} strokeWidth="1.5" /></>}
        {acc === 'headphones' && <><path d="M13 18 Q30 -6 47 18" fill="none" stroke="#3D7BFF" strokeWidth="3" /><rect x="9" y="14" width="7" height="12" rx="3" fill="#3D7BFF" {...o} /><rect x="44" y="14" width="7" height="12" rx="3" fill="#3D7BFF" {...o} /></>}
        {hat && <Hat spec={hat.spec} />}
      </g>
    </g>
  );
}

export function Avatar2D({ figure, className }: { figure: Figure; className?: string }) {
  return (
    <svg viewBox="-6 -34 72 138" className={className} aria-hidden="true">
      <AvatarBody figure={figure} />
    </svg>
  );
}
