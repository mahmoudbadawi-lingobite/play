import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedLogo, AnimatedName, useLogoAnimation } from '../components/common/AnimatedLogo';

const PENDING_JOIN_CODE_KEY = 'pendingJoinCode';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { profile, signInWithGoogle, continueAsGuest } = useAuth();
  const logoAnim = useLogoAnimation('home');
  const navigate = useNavigate();

  // Google sign-in always redirects back to "/". If the person got here via
  // a class join link, they were sent to sign in first (see JoinClassPage) -
  // resume that join now that they're authenticated instead of going to the
  // dashboard as usual.
  useEffect(() => {
    if (!profile) return;
    const pendingCode = localStorage.getItem(PENDING_JOIN_CODE_KEY);
    if (pendingCode) {
      localStorage.removeItem(PENDING_JOIN_CODE_KEY);
      navigate(`/join?code=${pendingCode}`, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  if (profile) {
    return null;
  }

  return (
    <div className="kid-home relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden px-4 py-16 text-center">
      <AnimatedLogo variant={logoAnim.variant} onLoop={logoAnim.nextVariant} className="kid-hero-logo relative z-10 mb-4 h-16 w-16" />
      <AnimatedName
        as="h1"
        text={t('appName')}
        style={logoAnim.nameStyle}
        onLoop={logoAnim.nextNameStyle}
        isArabic={i18n.language.startsWith('ar')}
        className="relative z-10 font-display text-4xl font-bold text-primary sm:text-5xl"
      />
      <p className="relative z-10 mt-3 text-lg text-muted-foreground">{t('tagline')}</p>

      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={signInWithGoogle}
          className="rounded-xl bg-secondary px-6 py-3 font-semibold text-secondary-foreground shadow hover:opacity-90"
        >
          {t('nav_signIn')}
        </button>
        <button
          onClick={() => { continueAsGuest(); navigate('/library'); }}
          className="rounded-xl border border-border bg-card px-6 py-3 font-semibold text-primary hover:border-secondary"
        >
          {t('nav_playAsGuest')}
        </button>
      </div>

      <div className="kid-home-grid relative z-10 mt-14 grid w-full gap-4 sm:grid-cols-3">
        {[
          { key: 'treasure-hunt', icon: '🗺️', title: 'Treasure Hunt' },
          { key: 'block-quest', icon: '🧱', title: 'Block Quest' },
          { key: 'memory-match', icon: '🧠', title: 'Memory Match' },
          { key: 'typing-race', icon: '⌨️', title: 'Typing Race' },
          { key: 'word-builder', icon: '🔤', title: 'Word Builder' },
          { key: 'crossword', icon: '🔳', title: 'Crossword' },
          { key: 'picture-match', icon: '🖼️', title: 'Picture Match' },
          { key: 'hangman', icon: '🎯', title: 'Hangman' },
        ].map((g) => (
          <div key={g.key} data-game={g.key} className="kid-game-card kid-mini card-surface flex items-center gap-3 px-4 py-3">
            <span className="kg-art" aria-hidden="true" />
            <span className="kg-emoji text-2xl">{g.icon}</span>
            <span className="kg-body">
              <span className="kg-title font-medium text-primary">{g.title}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
