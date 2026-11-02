import { useId } from 'react';

/** Original capture orb art. Colour comes from the item definition. */
export function Orb({ color = '#3b82f6', size = 48, className }: { color?: string; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs><radialGradient id={`o${id}`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
      <circle cx="32" cy="32" r="28" fill={color} stroke="#1b2a4a" strokeWidth="4" />
      <path d="M4,32 H60" stroke="#1b2a4a" strokeWidth="4" />
      <path d="M4,32 A28,28 0 0 0 60,32 Z" fill="#f8fafc" />
      <path d="M4,32 H60" stroke="#1b2a4a" strokeWidth="4" />
      <circle cx="32" cy="32" r="9" fill="#f8fafc" stroke="#1b2a4a" strokeWidth="4" />
      <polygon points="32,26 33.8,30.2 38,30.4 34.7,33 35.8,37.2 32,34.8 28.2,37.2 29.3,33 26,30.4 30.2,30.2" fill="#ffd43b" />
      <circle cx="32" cy="32" r="28" fill={`url(#o${id})`} />
    </svg>
  );
}
