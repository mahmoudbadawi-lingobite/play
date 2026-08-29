import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CloudLayer, StudyMascot } from '../components/common/decorations';

export function HomePage() {
  const { t } = useTranslation();
  const { profile, signInWithGoogle, continueAsGuest } = useAuth();
  const { theme } = useTheme();
  const isKid = theme === 'kid';
  const navigate = useNavigate();

  if (profile) {
    return <Navigate to="/dashboard" replace />;
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
