import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { t, i18n } = useTranslation();
  const { profile, isGuest, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const navLinks = (
    <>
      <Link to="/library" onClick={() => setMenuOpen(false)} className="hover:text-secondary">{t('nav_library')}</Link>
      <Link to="/escape-rooms" onClick={() => setMenuOpen(false)} className="hover:text-secondary">Escape Rooms</Link>
      {profile && (
        <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-secondary">{t('nav_dashboard')}</Link>
      )}
      {profile?.role === 'teacher' && (
        <Link to="/teacher/classes" onClick={() => setMenuOpen(false)} className="hover:text-secondary">{t('nav_classes')}</Link>
      )}
      {profile?.role === 'admin' && (
        <Link to="/admin" onClick={() => setMenuOpen(false)} className="hover:text-secondary">{t('nav_admin')}</Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <Link to="/" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-2">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl object-cover sm:h-[72px] sm:w-[72px]"
          />
          <span className="truncate font-display text-base font-semibold text-primary sm:text-lg">{t('appName')}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-primary/80 md:flex">
          {navLinks}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={toggleLanguage}
            className="rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-primary/70 hover:border-secondary hover:text-secondary sm:px-2.5"
            aria-label="Toggle language"
          >
            {i18n.language.startsWith('ar') ? 'EN' : 'AR'}
          </button>

          {profile || isGuest ? (
            <button
              onClick={async () => { await signOut(); navigate('/'); setMenuOpen(false); }}
              className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 sm:px-3 sm:text-sm"
            >
              {t('nav_signOut')}
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90 sm:px-3 sm:text-sm"
            >
              {t('nav_signIn')}
            </button>
          )}

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary md:hidden"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 text-sm font-medium text-primary/80 md:hidden">
          {navLinks}
        </nav>
      )}
    </header>
  );
}
