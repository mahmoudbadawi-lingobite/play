import type { ReactElement } from 'react';

// Illustrations for the Game Library cards (one per skill).
// Pure inline SVG so they stay sharp on every screen and need no extra files.
// Only shown in the Kid theme (parent adds the `kid-only` class).

const Star = ({ x, y, s = 1, c = '#ffd23d' }: { x: number; y: number; s?: number; c?: string }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    fill={c}
    d="M0-8 2.4-2.6 8-2 3.8 2 5 8 0 5-5 8-3.8 2-8-2-2.4-2.6Z"
  />
);

function Vocabulary() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <path d="M6 58 L6 98 Q33 88 60 102 Q87 88 114 98 L114 58Z" fill="#2a4bc0" />
      <path d="M10 52 Q34 42 60 54 L60 97 Q34 86 10 95Z" fill="#fff8e8" />
      <path d="M60 54 Q86 40 110 50 L110 93 Q86 84 60 97Z" fill="#ffeec8" />
      <g stroke="#c9b48a" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M18 62 Q30 58 48 64M18 70 Q30 66 48 72M18 78 Q30 74 48 80" />
        <path d="M72 62 Q88 56 100 60M72 70 Q88 64 100 68" />
      </g>
      <g transform="rotate(-8 34 40)">
        <rect x="10" y="28" width="46" height="20" rx="4" fill="#fff" stroke="#bcd6ff" strokeWidth="1.5" />
        <text x="33" y="43" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1b2f7a">apple</text>
      </g>
      <g transform="rotate(6 76 28)">
        <rect x="56" y="18" width="44" height="18" rx="4" fill="#fff" stroke="#bcd6ff" strokeWidth="1.5" />
        <text x="78" y="31" textAnchor="middle" fontSize="12" fontWeight="800" fill="#4a6fd8">happy</text>
      </g>
      <g transform="rotate(-6 92 52)">
        <rect x="76" y="42" width="40" height="16" rx="4" fill="#ffb13d" stroke="#ffd58c" strokeWidth="1.5" />
        <text x="96" y="54" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">school</text>
      </g>
      <Star x={10} y={22} s={1.1} />
      <Star x={30} y={10} s={1.4} />
      <Star x={112} y={20} s={0.9} />
    </svg>
  );
}

function Grammar() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <linearGradient id="gr-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff5d6" />
          <stop offset="1" stopColor="#f2d9a0" />
        </linearGradient>
      </defs>
      <rect x="22" y="14" width="64" height="84" rx="7" fill="url(#gr-paper)" stroke="#d6b36e" strokeWidth="2" />
      <ellipse cx="54" cy="14" rx="34" ry="8" fill="#f0d08a" stroke="#d6b36e" strokeWidth="2" />
      <ellipse cx="54" cy="98" rx="34" ry="8" fill="#e9c677" stroke="#d6b36e" strokeWidth="2" />
      <g fill="none" stroke="#1ea84a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 36 38 43 50 29" />
        <path d="M32 58 38 65 50 51" />
        <path d="M32 80 38 87 50 73" />
      </g>
      <g stroke="#cfa95f" strokeWidth="3" strokeLinecap="round">
        <path d="M58 36H78M58 58H78M58 80H72" />
      </g>
      <g transform="rotate(38 88 40)">
        <rect x="80" y="-8" width="16" height="12" rx="3" fill="#ff7fa6" />
        <rect x="80" y="2" width="16" height="6" fill="#c9ced8" />
        <rect x="80" y="8" width="16" height="52" fill="#ffc933" />
        <rect x="80" y="8" width="5" height="52" fill="#ffe27a" />
        <path d="M80 60H96L88 78Z" fill="#f6d9a8" />
        <path d="M85 71H91L88 78Z" fill="#3b3b4f" />
      </g>
      <Star x={14} y={26} s={0.9} />
    </svg>
  );
}

function Reading() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <path d="M6 56 L6 98 Q32 90 58 102 Q84 90 108 98 L108 56Z" fill="#4a2bb5" />
      <path d="M10 50 Q32 42 58 52 L58 96 Q32 86 10 94Z" fill="#f5f1ff" />
      <path d="M58 52 Q82 42 104 48 L104 92 Q82 84 58 96Z" fill="#e6dcff" />
      <g stroke="#9d8bd6" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M18 60 Q30 57 48 62M18 69 Q30 66 48 71M18 78 Q30 75 48 80" />
        <path d="M68 60Q80 56 94 58M68 69Q80 65 94 67" />
      </g>
      <circle cx="82" cy="36" r="22" fill="#cfe9ff" fillOpacity=".75" stroke="#2f7be8" strokeWidth="7" />
      <path d="M72 28 Q78 22 88 24" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M66 52 52 70" stroke="#1f58b8" strokeWidth="9" strokeLinecap="round" />
      <Star x={14} y={28} s={0.9} c="#ffb13d" />
    </svg>
  );
}

function Spelling() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <g transform="rotate(-9 26 78)">
        <rect x="6" y="62" width="40" height="40" rx="8" fill="#1f9a2e" />
        <rect x="6" y="58" width="40" height="40" rx="8" fill="#4ed04a" />
        <text x="26" y="88" textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff">A</text>
      </g>
      <g transform="rotate(4 60 52)">
        <rect x="38" y="30" width="40" height="40" rx="8" fill="#1a52c8" />
        <rect x="38" y="26" width="40" height="40" rx="8" fill="#3d8bff" />
        <text x="58" y="57" textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff">B</text>
      </g>
      <g transform="rotate(9 92 80)">
        <rect x="72" y="62" width="40" height="40" rx="8" fill="#b81f2a" />
        <rect x="72" y="58" width="40" height="40" rx="8" fill="#ff4b55" />
        <text x="92" y="88" textAnchor="middle" fontSize="30" fontWeight="900" fill="#fff">C</text>
      </g>
      <Star x={14} y={34} s={1.1} />
      <Star x={36} y={18} s={1.2} />
      <Star x={96} y={34} s={0.9} />
    </svg>
  );
}

function Listening() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <path d="M22 66 V54 A38 38 0 0 1 98 54 V66" fill="none" stroke="#1a45b8" strokeWidth="11" strokeLinecap="round" />
      <path d="M22 66 V54 A38 38 0 0 1 98 54 V66" fill="none" stroke="#3d7bff" strokeWidth="6" strokeLinecap="round" />
      <rect x="10" y="56" width="26" height="42" rx="12" fill="#1a45b8" />
      <rect x="12" y="58" width="22" height="38" rx="10" fill="#3d7bff" />
      <rect x="84" y="56" width="26" height="42" rx="12" fill="#1a45b8" />
      <rect x="86" y="58" width="22" height="38" rx="10" fill="#3d7bff" />
      <circle cx="23" cy="77" r="6" fill="#1ee0d2" />
      <circle cx="97" cy="77" r="6" fill="#1ee0d2" />
      <g stroke="#1ee0d2" strokeWidth="4" strokeLinecap="round">
        <path d="M46 78V76M54 84V68M62 90V62M70 84V68M78 78V76" />
      </g>
    </svg>
  );
}

function Speaking() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <g transform="rotate(-16 62 44)">
        <rect x="42" y="8" width="40" height="58" rx="20" fill="#3a2a9a" />
        <rect x="44" y="10" width="36" height="44" rx="18" fill="#7b86a8" />
        <g fill="#c4cbe0">
          <circle cx="54" cy="22" r="2" /><circle cx="62" cy="22" r="2" /><circle cx="70" cy="22" r="2" />
          <circle cx="50" cy="31" r="2" /><circle cx="58" cy="31" r="2" /><circle cx="66" cy="31" r="2" /><circle cx="74" cy="31" r="2" />
          <circle cx="54" cy="40" r="2" /><circle cx="62" cy="40" r="2" /><circle cx="70" cy="40" r="2" />
        </g>
        <rect x="42" y="52" width="40" height="22" rx="8" fill="#5a3ad6" />
        <rect x="42" y="54" width="40" height="5" fill="#2a1d7a" />
      </g>
      <path d="M34 70 Q34 94 62 94 Q90 94 90 70" fill="none" stroke="#3a2a9a" strokeWidth="6" strokeLinecap="round" />
      <rect x="58" y="92" width="8" height="10" fill="#3a2a9a" />
      <ellipse cx="62" cy="104" rx="22" ry="6" fill="#2a1d7a" />
      <g stroke="#ffd23d" strokeWidth="4" strokeLinecap="round">
        <path d="M16 20 24 28M10 34 22 36M26 8 30 18" />
      </g>
    </svg>
  );
}

function Writing() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <rect x="14" y="16" width="60" height="82" rx="8" fill="#e9dfff" stroke="#c4b2f0" strokeWidth="2" />
      <rect x="14" y="16" width="60" height="82" rx="8" fill="#fff" fillOpacity=".7" />
      <g stroke="#2a2a5c" strokeWidth="4" strokeLinecap="round">
        <path d="M26 12V22M38 12V22M50 12V22M62 12V22" />
      </g>
      <g stroke="#9db8ef" strokeWidth="3" strokeLinecap="round">
        <path d="M24 42H64M24 54H64M24 66H64M24 78H52" />
      </g>
      <path d="M24 34H44" stroke="#ff7fa6" strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(35 92 54)">
        <rect x="84" y="2" width="16" height="10" rx="4" fill="#1f3fb8" />
        <rect x="84" y="10" width="16" height="50" rx="3" fill="#3d6bff" />
        <rect x="84" y="10" width="5" height="50" fill="#7fa0ff" />
        <path d="M84 60H100L92 80Z" fill="#ffd23d" />
        <path d="M89 72H95L92 80Z" fill="#2a2a5c" />
      </g>
      <Star x={104} y={14} s={0.9} />
    </svg>
  );
}

function Future() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <linearGradient id="fu-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe46b" />
          <stop offset="1" stopColor="#f0a30e" />
        </linearGradient>
      </defs>
      <path d="M30 28 Q8 28 12 46 Q16 62 34 64" fill="none" stroke="#f0a30e" strokeWidth="7" strokeLinecap="round" />
      <path d="M90 28 Q112 28 108 46 Q104 62 86 64" fill="none" stroke="#f0a30e" strokeWidth="7" strokeLinecap="round" />
      <path d="M28 14 H92 V40 Q92 70 60 74 Q28 70 28 40Z" fill="url(#fu-gold)" stroke="#d98a06" strokeWidth="2" />
      <path d="M36 20V40Q36 58 48 66" fill="none" stroke="#fff6b8" strokeWidth="4" strokeLinecap="round" opacity=".8" />
      <path d="M60 28 64 38 75 39 66 46 69 57 60 51 51 57 54 46 45 39 56 38Z" fill="#fff6b8" stroke="#d98a06" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="52" y="74" width="16" height="12" fill="#e89a0a" />
      <rect x="36" y="86" width="48" height="14" rx="5" fill="#5a2db0" />
      <rect x="36" y="86" width="48" height="5" rx="3" fill="#8b5bf0" />
    </svg>
  );
}

function Revision() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 52 A38 38 0 0 1 92 36" stroke="#1a45b8" strokeWidth="16" />
        <path d="M96 58 A38 38 0 0 1 28 74" stroke="#1a45b8" strokeWidth="16" />
        <path d="M24 52 A38 38 0 0 1 92 36" stroke="#3d8bff" strokeWidth="10" />
        <path d="M96 58 A38 38 0 0 1 28 74" stroke="#3d8bff" strokeWidth="10" />
      </g>
      <path d="M98 14 104 48 72 40Z" fill="#3d8bff" stroke="#1a45b8" strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 96 16 62 48 70Z" fill="#3d8bff" stroke="#1a45b8" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

const ART: Record<string, () => ReactElement> = {
  vocabulary: Vocabulary,
  grammar: Grammar,
  reading: Reading,
  spelling: Spelling,
  listening: Listening,
  speaking: Speaking,
  writing: Writing,
  future: Future,
  revision: Revision,
};

export function SkillArt({ skill, className }: { skill: string; className?: string }) {
  const Art = ART[skill] ?? Vocabulary;
  return (
    <div className={className}>
      <Art />
    </div>
  );
}
