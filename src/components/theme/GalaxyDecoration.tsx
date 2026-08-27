/**
 * Small, original abstract "planet + orbit" decoration used on Galaxy Quest
 * hero/welcome areas. Pure vector, no external assets, themed via CSS
 * variables so it stays in sync with the active palette.
 */
export function GalaxyDecoration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="gq-planet" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="hsl(var(--gq-electric-violet))" />
          <stop offset="100%" stopColor="hsl(var(--gq-galaxy-purple))" />
        </radialGradient>
        <linearGradient id="gq-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--gq-neon-blue))" stopOpacity="0.1" />
          <stop offset="50%" stopColor="hsl(var(--gq-neon-blue))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="hsl(var(--gq-neon-blue))" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="95" r="150" fill="hsl(var(--gq-galaxy-purple))" opacity="0.06" />

      <ellipse cx="120" cy="95" rx="72" ry="20" fill="none" stroke="url(#gq-ring)" strokeWidth="2" transform="rotate(-12 120 95)" />

      <circle cx="120" cy="95" r="46" fill="url(#gq-planet)" />
      <circle cx="106" cy="80" r="10" fill="hsl(var(--gq-soft-white))" opacity="0.08" />

      <circle cx="34" cy="34" r="2.5" fill="hsl(var(--gq-star-gold))" />
      <circle cx="188" cy="30" r="2" fill="hsl(var(--gq-soft-white))" opacity="0.7" />
      <circle cx="200" cy="120" r="3" fill="hsl(var(--gq-aurora-green))" />
      <circle cx="20" cy="130" r="2" fill="hsl(var(--gq-pink-nebula))" />
      <circle cx="60" cy="15" r="1.5" fill="hsl(var(--gq-soft-white))" opacity="0.6" />
    </svg>
  );
}
