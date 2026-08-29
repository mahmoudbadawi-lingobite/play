import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CloudLayer, StudyMascot } from '../components/common/decorations';

const PENDING_JOIN_CODE_KEY = 'pendingJoinCode';

export function HomePage() {
  const { t } = useTranslation();
  const { profile, signInWithGoogle, continueAsGuest } = useAuth();
  const { theme } = useTheme();
  const isKid = theme === 'kid';
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
    <div className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden px-4 py-16 text-center">
      {isKid && <CloudLayer className="pointer-events-none absolute inset-0 h-full w-full" />}
      {isKid && (
        <div className="relative z-10 mb-2 flex justify-center">
          <StudyMascot size={88} />
        </div>
      )}
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="relative z-10 mb-4 h-16 w-16 rounded-2xl object-cover" />
      <h1 className="relative z-10 font-display text-4xl font-bold text-primary sm:text-5xl">{t('appName')}</h1>
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

      <div className="relative z-10 mt-14 grid gap-4 sm:grid-cols-3">
        {[
          { icon: '🧠', title: 'Memory Match' },
          { icon: '⌨️', title: 'Typing Race' },
          { icon: '🔤', title: 'Word Builder' },
          { icon: '🔳', title: 'Crossword' },
          { icon: '🖼️', title: 'Picture Match' },
          { icon: '🎯', title: 'Hangman' },
        ].map((g) => (
          <div key={g.title} className="card-surface flex items-center gap-3 px-4 py-3">
            <span className="text-2xl">{g.icon}</span>
            <span className="font-medium text-primary">{g.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
