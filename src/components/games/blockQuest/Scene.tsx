import { AvatarBody } from './Avatar';
import type { AvatarLook } from './avatarStore';
import type { Gate, Phase } from './engine';
import type { SceneryKind, World } from './worlds';

export const VB_W = 680;
export const VB_H = 440;
const CX = 340;
const HY = 150; // horizon
const BY = 440; // bottom of the scene
const TRACK_W = 520; // track width at the bottom edge

/** Depth values: 0 = horizon, 1 = bottom edge. */
export const S_FAR = 0.2;
export const S_NEAR = 0.7;
const S_PLAYER = 0.92;

const yAt = (s: number) => HY + (BY - HY) * s;
const laneX = (lane: number, s: number) => CX + (lane - 1) * (TRACK_W / 3) * s;

export const LANE_COLORS = ['#7B61FF', '#1FB5A0', '#FF7A59'] as const;
const LANE_LIGHT = ['#EFEAFF', '#E3F8F3', '#FFF0EA'] as const;

/** Circle / triangle / square, so lanes differ by shape as well as colour. */
export function LaneGlyph({ lane, cx, cy, r, fill }: { lane: number; cx: number; cy: number; r: number; fill: string }) {
  if (lane === 0) return <circle cx={cx} cy={cy} r={r} fill={fill} />;
  if (lane === 1) {
    return <polygon points={`${cx},${cy - r} ${cx + r},${cy + r * 0.8} ${cx - r},${cy + r * 0.8}`} fill={fill} strokeLinejoin="round" />;
  }
  return <rect x={cx - r * 0.85} y={cy - r * 0.85} width={r * 1.7} height={r * 1.7} rx={r * 0.15} fill={fill} />;
}

function Scenery({ kind }: { kind: SceneryKind }) {
  switch (kind) {
    case 'islands':
      return (
        <g>
          <rect x="600" y="26" width="40" height="40" fill="#FFE066" />
          <g className="bq-cloud">
            <rect x="40" y="40" width="90" height="24" rx="12" fill="#fff" />
            <rect x="62" y="26" width="46" height="22" rx="11" fill="#fff" />
          </g>
          <g className="bq-cloud" style={{ animationDelay: '-4s' }}>
            <rect x="430" y="58" width="84" height="22" rx="11" fill="#fff" />
            <rect x="452" y="46" width="40" height="20" rx="10" fill="#fff" />
          </g>
          <rect x="60" y="104" width="96" height="12" fill="#6BCB5B" />
          <rect x="72" y="116" width="72" height="16" fill="#A9754A" />
          <rect x="520" y="94" width="116" height="12" fill="#6BCB5B" />
          <rect x="534" y="106" width="88" height="18" fill="#A9754A" />
        </g>
      );
    case 'candy':
      return (
        <g>
          <g className="bq-cloud">
            <rect x="50" y="36" width="90" height="24" rx="12" fill="#fff" />
            <rect x="72" y="22" width="46" height="22" rx="11" fill="#fff" />
          </g>
          <g className="bq-cloud" style={{ animationDelay: '-5s' }}>
            <rect x="470" y="52" width="90" height="24" rx="12" fill="#fff" />
          </g>
          {[90, 190, 500, 590].map((x, i) => (
            <g key={x}>
              <rect x={x - 2} y="108" width="4" height="40" fill="#fff" />
              <circle cx={x} cy="100" r={i % 2 ? 16 : 20} fill={i % 2 ? '#7BDFF2' : '#FF8AC0'} />
              <circle cx={x} cy="100" r={i % 2 ? 9 : 12} fill="#fff" />
              <circle cx={x} cy="100" r={i % 2 ? 4 : 6} fill={i % 2 ? '#7BDFF2' : '#FF8AC0'} />
            </g>
          ))}
        </g>
      );
    case 'lava':
      return (
        <g>
          <polygon points="40,150 130,70 220,150" fill="#2A1030" />
          <polygon points="112,86 130,70 148,86" fill="#FF6A2E" />
          <polygon points="470,150 570,56 670,150" fill="#2A1030" />
          <polygon points="546,76 570,56 594,76" fill="#FF6A2E" />
          {[[130, 52], [150, 38], [566, 36], [590, 24], [548, 28]].map(([x, y], i) => (
            <rect key={i} className="bq-twinkle" x={x} y={y} width="6" height="6" fill="#FFC83D" style={{ animationDelay: `${-i * 0.5}s` }} />
          ))}
        </g>
      );
    case 'sea':
      return (
        <g>
          {[[60, 40, 10], [120, 80, 7], [520, 34, 12], [580, 70, 8], [300, 50, 6], [400, 90, 9]].map(([x, y, r], i) => (
            <circle key={i} className="bq-twinkle" cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeWidth="3" style={{ animationDelay: `${-i * 0.4}s` }} />
          ))}
          {[70, 150, 520, 610].map((x, i) => (
            <g key={x}>
              <rect x={x} y={150 - (i % 2 ? 34 : 46)} width="10" height={i % 2 ? 34 : 46} fill="#FF7A59" />
              <rect x={x - 10} y={150 - (i % 2 ? 24 : 32)} width="10" height="12" fill="#FF9BD1" />
              <rect x={x + 10} y={150 - (i % 2 ? 28 : 20)} width="10" height="12" fill="#FF9BD1" />
            </g>
          ))}
        </g>
      );
    case 'space':
      return (
        <g>
          {Array.from({ length: 26 }, (_, i) => (
            <rect
              key={i}
              className="bq-twinkle"
              x={(i * 53 + 17) % 660}
              y={(i * 37 + 11) % 120}
              width={i % 3 === 0 ? 4 : 3}
              height={i % 3 === 0 ? 4 : 3}
              fill="#fff"
              style={{ animationDelay: `${-(i % 7) * 0.4}s` }}
            />
          ))}
          <circle cx="120" cy="84" r="30" fill="#FF9F43" />
          <rect x="82" y="80" width="76" height="6" fill="#FFC83D" fillOpacity="0.7" />
          <circle cx="560" cy="60" r="18" fill="#C9D1FF" />
          <circle cx="554" cy="56" r="4" fill="#9AA4E6" />
        </g>
      );
  }
}

function Castle() {
  return (
    <g>
      <rect x="316" y="118" width="48" height="32" fill="#B9A7F2" stroke="#3C3489" strokeWidth="2" />
      {[316, 330, 344, 358].map((x) => (
        <rect key={x} x={x} y="110" width="8" height="8" fill="#B9A7F2" stroke="#3C3489" strokeWidth="2" />
      ))}
      <rect x="334" y="134" width="12" height="16" fill="#6C58C9" />
      <rect x="339" y="92" width="2" height="18" fill="#3C3489" />
      <polygon points="341,92 355,97 341,102" fill="#E8453C" />
    </g>
  );
}

interface GateProps {
  gate: Gate;
  s: number;
  wrongIds: string[];
  glowLane: number | null;
  placed: number;
  pass: number;
  hazard: string;
  onPickLane?: (lane: number) => void;
}

function PortalGate({ gate, s, wrongIds, glowLane, onPickLane }: GateProps) {
  const base = yAt(s);
  const pw = (TRACK_W / 3) * s * 0.8;
  const ph = 150 * s;
  const sw = Math.max(1.5, 3 * s);
  const x0 = laneX(0, s) - pw * 0.7;
  const x1 = laneX(2, s) + pw * 0.7;
  const archY = base - ph - 18 * s;
  return (
    <g>
      <rect x={x0} y={archY} width={x1 - x0} height={16 * s} rx={4 * s} fill="#4B3F8F" stroke="#2B2B5E" strokeWidth={sw} />
      <rect x={x0} y={archY} width={10 * s} height={ph + 18 * s} fill="#4B3F8F" stroke="#2B2B5E" strokeWidth={sw} />
      <rect x={x1 - 10 * s} y={archY} width={10 * s} height={ph + 18 * s} fill="#4B3F8F" stroke="#2B2B5E" strokeWidth={sw} />
      {gate.options.map((opt, l) => {
        const cx = laneX(l, s);
        const wrong = wrongIds.includes(opt.id);
        return (
          <g key={opt.id} onClick={() => onPickLane?.(l)} style={{ cursor: wrong ? 'default' : 'pointer' }}>
            {glowLane === l && (
              <rect
                className="bq-glow"
                x={cx - pw / 2 - 7 * s}
                y={base - ph - 7 * s}
                width={pw + 14 * s}
                height={ph + 14 * s}
                rx={12 * s}
                fill="none"
                stroke="#FFE066"
                strokeWidth={7 * s}
              />
            )}
            <rect x={cx - pw / 2} y={base - ph} width={pw} height={ph} rx={8 * s} fill={wrong ? '#9A98A8' : LANE_COLORS[l]} stroke="#2B2B5E" strokeWidth={sw} />
            <rect x={cx - pw / 2 + 6 * s} y={base - ph + 6 * s} width={pw - 12 * s} height={ph - 12 * s} rx={5 * s} fill={wrong ? '#E5E3EE' : LANE_LIGHT[l]} />
            {wrong ? (
              <g stroke="#8A86A0" strokeWidth={7 * s} strokeLinecap="round">
                <line x1={cx - pw * 0.18} y1={base - ph / 2 - pw * 0.18} x2={cx + pw * 0.18} y2={base - ph / 2 + pw * 0.18} />
                <line x1={cx + pw * 0.18} y1={base - ph / 2 - pw * 0.18} x2={cx - pw * 0.18} y2={base - ph / 2 + pw * 0.18} />
              </g>
            ) : (
              <LaneGlyph lane={l} cx={cx} cy={base - ph / 2} r={pw * 0.22} fill={LANE_COLORS[l]} />
            )}
          </g>
        );
      })}
    </g>
  );
}

function BridgeGate({ gate, s, placed, hazard }: GateProps) {
  const frontS = s;
  const backS = s * 0.45;
  const yF = yAt(frontS);
  const yB = yAt(backS);
  const n = gate.letters.length;
  const plankH = ((yF - yB) / n) * 0.86;
  return (
    <g>
      <rect x={0} y={yB} width={VB_W} height={yF - yB} fill={hazard} />
      {[0.25, 0.5, 0.75].map((f) => (
        <rect key={f} x={0} y={yB + (yF - yB) * f} width={VB_W} height={Math.max(1, 3 * s)} fill="#fff" fillOpacity="0.25" />
      ))}
      <rect x={0} y={yF - Math.max(2, 4 * s)} width={VB_W} height={Math.max(2, 4 * s)} fill="#2B2B5E" fillOpacity="0.35" />
      {gate.letters.map((_, k) => {
        const sk = frontS - (frontS - backS) * ((k + 0.5) / n);
        const w = (TRACK_W / 3) * sk * 0.9;
        const filled = k < placed;
        return (
          <rect
            key={k}
            x={CX - w / 2}
            y={yAt(sk) - plankH / 2}
            width={w}
            height={plankH}
            rx={2}
            fill={filled ? '#C98A4B' : 'none'}
            stroke={filled ? '#7A4B1F' : '#fff'}
            strokeOpacity={filled ? 1 : 0.55}
            strokeDasharray={filled ? undefined : '6 4'}
            strokeWidth={Math.max(1, 2.5 * sk)}
          />
        );
      })}
    </g>
  );
}

function BossGate({ s, pass }: GateProps) {
  const base = yAt(s);
  const w = TRACK_W * s * 1.05;
  const h = 190 * s;
  const x = CX - w / 2;
  const y = base - h;
  const sw = Math.max(1.5, 3 * s);
  const doorW = w * 0.4;
  const doorH = h * 0.72;
  const doorX = CX - doorW / 2;
  const doorY = base - doorH;
  const lift = pass * doorH;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#8A7FB5" stroke="#2B2B5E" strokeWidth={sw} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + (w / 5) * i + w * 0.02} y={y - 12 * s} width={(w / 5) * 0.6} height={12 * s} fill="#8A7FB5" stroke="#2B2B5E" strokeWidth={sw} />
      ))}
      <rect x={doorX} y={doorY} width={doorW} height={doorH} fill="#241B4D" />
      <clipPath id="bq-door-clip">
        <rect x={doorX} y={doorY} width={doorW} height={doorH} />
      </clipPath>
      <g clipPath="url(#bq-door-clip)">
        <rect x={doorX} y={doorY - lift} width={doorW} height={doorH} fill="#C98A4B" stroke="#7A4B1F" strokeWidth={sw} />
        <rect x={doorX + doorW / 2 - 1} y={doorY - lift} width={2} height={doorH} fill="#7A4B1F" />
        <circle cx={CX} cy={doorY - lift + doorH * 0.55} r={7 * s} fill="#FFC83D" stroke="#8A5E00" strokeWidth={sw} />
      </g>
    </g>
  );
}

export interface SceneProps {
  world: World;
  gate: Gate | null;
  phase: Phase;
  /** Gate depth while it approaches / waits. */
  s: number;
  /** Ever-growing value that moves the floor stripes. */
  scroll: number;
  /** 0 -> 1 while the avatar runs through the gate. */
  pass: number;
  lane: number;
  wrongIds: string[];
  glowLane: number | null;
  placed: number;
  look: AvatarLook;
  bonkKey: number;
  label: string;
  onPickLane?: (lane: number) => void;
}

export function Scene(props: SceneProps) {
  const { world, gate, phase, s, scroll, pass, lane, wrongIds, glowLane, placed, look, bonkKey, label, onPickLane } = props;
  const running = phase === 'approach' || phase === 'passing';
  const showGate = !!gate && phase !== 'start' && phase !== 'done';

  const effLane = gate && (gate.kind === 'bridge' || gate.kind === 'boss') ? 1 : lane;
  const targetS = gate?.kind === 'bridge' ? S_NEAR * 0.5 : S_NEAR;
  const k = 0.95;
  const fx = laneX(effLane, S_PLAYER) + (laneX(effLane, targetS) - laneX(effLane, S_PLAYER)) * pass;
  const fy = yAt(S_PLAYER) + (yAt(targetS) - yAt(S_PLAYER)) * pass - Math.sin(pass * Math.PI) * 38;
  const sc = k * (1 + (targetS / S_PLAYER - 1) * pass);
  const fade = pass > 0.8 ? Math.max(0, 1 - (pass - 0.8) / 0.2) : 1;

  const stripes = Array.from({ length: 9 }, (_, i) => {
    const u = (i / 9 + scroll) % 1;
    return 0.04 + 0.96 * u * u;
  });

  const gateProps: GateProps | null = gate
    ? { gate, s, wrongIds, glowLane, placed, pass, hazard: world.hazard, onPickLane }
    : null;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-auto w-full touch-pan-y select-none" role="img" aria-label={label}>
      <rect width={VB_W} height={HY} fill={world.sky} />
      <rect y={100} width={VB_W} height={HY - 100} fill={world.skyFar} />
      <Scenery kind={world.scenery} />
      <rect y={HY} width={VB_W} height={VB_H - HY} fill={world.ground} />
      {stripes.map((sv, i) => (
        <rect key={`g${i}`} x={0} y={yAt(sv)} width={VB_W} height={10 * sv + 1} fill={world.groundDark} fillOpacity="0.55" />
      ))}
      <Castle />
      <polygon points={`${CX},${HY} ${CX + TRACK_W / 2},${BY} ${CX - TRACK_W / 2},${BY}`} fill={world.track} />
      <line x1={CX} y1={HY} x2={CX - TRACK_W / 6} y2={BY} stroke={world.trackLine} strokeWidth="3" />
      <line x1={CX} y1={HY} x2={CX + TRACK_W / 6} y2={BY} stroke={world.trackLine} strokeWidth="3" />
      {stripes.map((sv, i) => (
        <line
          key={`t${i}`}
          x1={CX - (TRACK_W / 2) * sv}
          x2={CX + (TRACK_W / 2) * sv}
          y1={yAt(sv)}
          y2={yAt(sv)}
          stroke={world.trackStripe}
          strokeWidth={1 + 3 * sv}
        />
      ))}

      {showGate && gateProps && gate.kind !== 'bridge' && gate.kind !== 'boss' && <PortalGate {...gateProps} />}
      {showGate && gateProps && gate.kind === 'bridge' && <BridgeGate {...gateProps} />}
      {showGate && gateProps && gate.kind === 'boss' && <BossGate {...gateProps} />}

      <g
        style={{
          transform: `translate(${fx - 30 * sc}px, ${fy - 98 * sc}px) scale(${sc})`,
          transition: phase === 'passing' ? 'none' : 'transform 160ms ease-out',
          opacity: fade,
        }}
      >
        <g key={bonkKey} className={bonkKey > 0 ? 'bq-bonk' : undefined}>
          <AvatarBody look={look} running={running} />
        </g>
      </g>
    </svg>
  );
}
