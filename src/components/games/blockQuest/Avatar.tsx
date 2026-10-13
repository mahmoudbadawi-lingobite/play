import { SHIRT_COLORS, SKIN_COLORS, type AvatarLook } from './avatarStore';

const OUTLINE = '#1B1B3A';

function Hat({ hat }: { hat: string }) {
  switch (hat) {
    case 'cap':
      return (
        <g>
          <rect x="14" y="-2" width="32" height="12" rx="6" fill="#E8453C" stroke={OUTLINE} strokeWidth="2" />
          <rect x="14" y="7" width="40" height="5" rx="2" fill="#B72F28" stroke={OUTLINE} strokeWidth="2" />
        </g>
      );
    case 'party':
      return (
        <g>
          <polygon points="30,-18 17,6 43,6" fill="#FF5FA2" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="30" cy="-18" r="4" fill="#FFE066" stroke={OUTLINE} strokeWidth="1.5" />
          <circle cx="27" cy="-2" r="2" fill="#FFE066" />
          <circle cx="34" cy="2" r="2" fill="#7BDFF2" />
        </g>
      );
    case 'wizard':
      return (
        <g>
          <polygon points="30,-26 18,4 42,4" fill="#7B61FF" stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <rect x="8" y="2" width="44" height="6" rx="3" fill="#5B3FD0" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="30" cy="-6" r="3" fill="#FFE066" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <polygon
            points="15,4 15,-8 23,-1 30,-12 37,-1 45,-8 45,4"
            fill="#FFC83D"
            stroke="#8A5E00"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="30" cy="-1" r="2.5" fill="#E8453C" />
        </g>
      );
    case 'helmet':
      return (
        <g>
          <rect x="29" y="-12" width="3" height="9" fill={OUTLINE} />
          <circle cx="30.5" cy="-13" r="3" fill="#FF5F5F" stroke={OUTLINE} strokeWidth="1.5" />
          <rect x="11" y="-4" width="38" height="32" rx="14" fill="#E6EAF2" stroke={OUTLINE} strokeWidth="2" />
          <rect x="16" y="8" width="28" height="14" rx="6" fill="#4AA8FF" fillOpacity="0.55" stroke={OUTLINE} strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

/** Blocky character drawn in a 60 x 100 box (hats reach up to y = -26). */
export function AvatarBody({ look, running = false }: { look: AvatarLook; running?: boolean }) {
  const skin = SKIN_COLORS[look.skin] ?? SKIN_COLORS.tone1;
  const shirt = SHIRT_COLORS[look.shirt] ?? SHIRT_COLORS.blue;
  return (
    <g className={running ? 'bq-run' : undefined}>
      <ellipse cx="30" cy="98" rx="20" ry="4" fill="#000" fillOpacity="0.2" />
      <g className="bq-bob">
        <rect className="bq-limb bq-leg-a" x="16" y="66" width="12" height="30" rx="2" fill="#2B3A67" stroke={OUTLINE} strokeWidth="2" />
        <rect className="bq-limb bq-leg-b" x="32" y="66" width="12" height="30" rx="2" fill="#2B3A67" stroke={OUTLINE} strokeWidth="2" />
        <rect className="bq-limb bq-arm-a" x="3" y="38" width="11" height="26" rx="2" fill={skin} stroke={OUTLINE} strokeWidth="2" />
        <rect className="bq-limb bq-arm-b" x="46" y="38" width="11" height="26" rx="2" fill={skin} stroke={OUTLINE} strokeWidth="2" />
        <rect x="14" y="36" width="32" height="32" rx="3" fill={shirt} stroke={OUTLINE} strokeWidth="2" />
        <rect x="15" y="4" width="30" height="30" rx="4" fill={skin} stroke={OUTLINE} strokeWidth="2" />
        <rect x="23" y="16" width="4" height="5" fill={OUTLINE} />
        <rect x="33" y="16" width="4" height="5" fill={OUTLINE} />
        <rect x="25" y="25" width="10" height="3" rx="1" fill={OUTLINE} />
        <Hat hat={look.hat} />
      </g>
    </g>
  );
}

export function AvatarPreview({ look, className }: { look: AvatarLook; className?: string }) {
  return (
    <svg viewBox="-2 -30 64 134" className={className} aria-hidden="true">
      <AvatarBody look={look} />
    </svg>
  );
}
