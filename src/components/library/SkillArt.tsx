// Illustrations for the Game Library cards (one transparent image per skill).
// Images live in /public/kid/skill-<skill>.webp. Only shown in the Kid theme
// (the parent adds the `kid-only` class).

const KNOWN = new Set([
  'vocabulary',
  'grammar',
  'reading',
  'spelling',
  'listening',
  'speaking',
  'writing',
  'future',
  'revision',
]);

export function SkillArt({ skill, className }: { skill: string; className?: string }) {
  const key = KNOWN.has(skill) ? skill : 'vocabulary';
  return (
    <div className={className}>
      <img
        src={`${import.meta.env.BASE_URL}kid/skill-${key}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
