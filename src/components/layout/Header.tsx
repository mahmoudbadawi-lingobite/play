import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { t, i18n } = useTranslation();
  const { profile, isGuest, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-lg text-primary-foreground">🎮</span>
          <span className="font-display text-lg font-semibold text-primary">{t('appName')}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-primary/80 md:flex">
          <Link to="/library" className="hover:text-secondary">{t('nav_library')}</Link>
          {profile && (
            <Link to="/dashboard" className="hover:text-secondary">{t('nav_dashboard')}</Link>
          )}
          {profile?.role === 'teacher' && (
            <Link to="/teacher/classes" className="hover:text-secondary">{t('nav_classes')}</Link>
          )}
          {profile?.role === 'admin' && (
            <Link to="/admin" className="hover:text-secondary">{t('nav_admin')}</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-primary/70 hover:border-secondary hover:text-secondary"
            aria-label="Toggle language"
          >
            {i18n.language.startsWith('ar') ? 'EN' : 'AR'}
          </button>

          {profile || isGuest ? (
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t('nav_signOut')}
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground hover:opacity-90"
            >
              {t('nav_signIn')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
