import { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * LingoBite Play mascot with a looping, game-style animation.
 * One of eight movements is picked at random every time `useLogoAnimation`
 * runs for a new key (page refresh, or a different user signing in) and it
 * never repeats the one shown last time. The app name under it gets a random
 * text effect the same way. Everything is CSS (see the "Animated logo" block
 * in kid-skin.css), only active in the kid skin, and switched off by
 * `prefers-reduced-motion`.
 */
export const VARIANTS = ['rumble', 'hop', 'coins', 'glitch', 'rainbow', 'flip', 'run', 'combo'] as const;
export type LogoVariant = (typeof VARIANTS)[number];

export const NAME_STYLES = ['wave', 'jelly', 'drop', 'shimmer', 'neon', 'rainbow', 'glitch'] as const;
export type NameStyle = (typeof NAME_STYLES)[number];
/** These split the text into letters, which would break joined Arabic script. */
const LETTER_STYLES: readonly string[] = ['wave', 'jelly', 'drop'];

function pickDifferent<T extends string>(list: readonly T[], storageKey: string): T {
  let last: string | null = null;
  try {
    last = localStorage.getItem(storageKey);
  } catch {
    /* storage blocked — plain random pick */
  }
  const pool = list.filter((v) => v !== last);
  const choice = pool[Math.floor(Math.random() * pool.length)] ?? list[0];
  try {
    localStorage.setItem(storageKey, choice);
  } catch {
    /* ignore */
  }
  return choice;
}

/** Re-picks whenever `key` changes (pass the signed-in user's id, or 'guest'). */
export function useLogoAnimation(key: string) {
  return useMemo(
    () => ({
      variant: pickDifferent(VARIANTS, 'pl-logo-variant'),
      nameStyle: pickDifferent(NAME_STYLES, 'pl-name-style'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
}

const STAR = 'M12 0C13 7 17 11 24 12 17 13 13 17 12 24 11 17 7 13 0 12 7 11 11 7 12 0Z';

export function AnimatedLogo({
  variant,
  className = '',
}: {
  variant: LogoVariant;
  /** Size classes for the classic look; the kid skin sizes it in CSS. */
  className?: string;
}) {
  const { theme } = useTheme();
  const anim = theme === 'kid';
  const src = `${import.meta.env.BASE_URL}logo.png`;

  return (
    <span
      className={`pl-stage ${anim ? `pl-anim pl-v-${variant}` : ''} relative inline-block shrink-0 ${className}`}
      style={{ ['--pl-logo' as string]: `url(${src})` }}
      aria-hidden="true"
    >
      {anim && variant === 'rumble' && (
        <>
          <span className="pl-x pl-bar l" />
          <span className="pl-x pl-bar l2" />
          <span className="pl-x pl-bar r" />
          <span className="pl-x pl-bar r2" />
        </>
      )}
      {anim && variant === 'hop' && (
        <>
          <span className="pl-x pl-ground" />
          <span className="pl-x pl-ring" />
        </>
      )}
      {anim && variant === 'rainbow' && <span className="pl-x pl-halo" />}
      {anim && variant === 'combo' && <span className="pl-x pl-shock" />}
      <img src={src} alt="" draggable={false} className="pl-logo" />
      {anim && variant === 'glitch' && (
        <>
          <span className="pl-x pl-ghost" />
          <span className="pl-x pl-lines" />
        </>
      )}
      {anim && variant === 'hop' && <span className="pl-x pl-up">+1</span>}
      {anim && variant === 'coins' &&
        [-46, 40, -18, 56, 6].map((dx, i) => (
          <span key={i} className="pl-x pl-coin" style={{ ['--dx' as string]: `${dx / 118}`, animationDelay: `${i * 0.5}s` }} />
        ))}
      {anim && variant === 'run' && (
        <>
          <span className="pl-x pl-sl pl-sl1" />
          <span className="pl-x pl-sl pl-sl2" />
          <span className="pl-x pl-sl pl-sl3" />
        </>
      )}
      {anim && variant === 'combo' &&
        Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="pl-x pl-bs" style={{ ['--a' as string]: `${i * 45}deg` }}>
            <svg viewBox="0 0 24 24">
              <path d={STAR} fill="#ffd02a" />
            </svg>
          </span>
        ))}
    </span>
  );
}

/** The app name with a random text effect (letter-based ones only in Latin script). */
export function AnimatedName({
  text,
  style,
  isArabic,
  className = '',
  as: Tag = 'span',
}: {
  text: string;
  style: NameStyle;
  isArabic: boolean;
  className?: string;
  as?: 'span' | 'h1';
}) {
  const { theme } = useTheme();
  if (theme !== 'kid') return <Tag className={className}>{text}</Tag>;

  const effect = isArabic && LETTER_STYLES.includes(style) ? 'bob' : style;
  const letters = LETTER_STYLES.includes(effect);
  return (
    <Tag className={`pl-name pl-n-${effect} ${className}`} aria-label={text}>
      {letters
        ? Array.from(text).map((c, i) => (
            <span key={i} aria-hidden="true" style={{ ['--i' as string]: i }}>
              {c === ' ' ? ' ' : c}
            </span>
          ))
        : text}
    </Tag>
  );
}
