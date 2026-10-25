import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminNotifications } from '../../contexts/AdminNotificationsContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAvatarState } from '../../features/avatar/avatarStore';
import { AvatarImage } from '../../features/avatar/AvatarImage';

/**
 * One sidebar / top-nav link.
 *  - `.kid-ic` is the icon slot (hidden in the classic look, drawn by the kid skin)
 *  - `.kid-label` is the text, so the collapsed icon rail can hide it
 *  - `aria-current="page"` marks the active page (the kid skin paints it yellow)
 */
function NavItem({
  to,
  nav,
  active,
  onClick,
  badge,
  children,
}: {
  to: string;
  nav: string;
  active: boolean;
  onClick: () => void;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      data-nav={nav}
      aria-current={active ? 'page' : undefined}
      className="kid-nav-item relative flex items-center gap-1 hover:text-secondary"
    >
      <span className="kid-ic" aria-hidden="true" />
      <span className="kid-label">{children}</span>
      {badge}
    </Link>
  );
}

export function Header() {
  const { t, i18n } = useTranslation();
  const { profile, isGuest, signInWithGoogle, signOut } = useAuth();
  const { unreadDmCount, pendingTeacherCount } = useAdminNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar = useAvatarState();

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  // Which nav item owns the current page
  const on = (...prefixes: string[]) =>
    prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const close = () => setMenuOpen(false);

  const navLinks = (
    <>
      <NavItem to="/library" nav="library" active={on('/library', '/play', '/hunt')} onClick={close}>
        {t('nav_library')}
      </NavItem>
      <NavItem
        to="/escape-rooms"
        nav="escape"
        active={on('/escape-rooms', '/escape-room', '/teacher/create-escape-room', '/teacher/my-escape-rooms')}
        onClick={close}
      >
        Escape Rooms
      </NavItem>
      <NavItem to="/store" nav="store" active={on('/store', '/avatar')} onClick={close}>
        <span className="classic-emoji">🛍️ </span>Style Store
      </NavItem>
      {profile && (
        <NavItem to="/dashboard" nav="dashboard" active={on('/dashboard')} onClick={close}>
          {t('nav_dashboard')}
        </NavItem>
      )}
      {profile?.role === 'teacher' && (
        <NavItem to="/teacher/classes" nav="classes" active={on('/teacher/classes')} onClick={close}>
          {t('nav_classes')}
        </NavItem>
      )}
      {profile?.role === 'admin' && (
        <>
          <NavItem
            to="/admin"
            nav="admin"
            active={pathname === '/admin'}
            onClick={close}
            badge={
              pendingTeacherCount > 0 && (
                <span className="kid-badge flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {pendingTeacherCount}
                </span>
              )
            }
          >
            <span className="classic-emoji">🔔 </span>{t('nav_admin')}
          </NavItem>
          <NavItem
            to="/admin/chat"
            nav="chat"
            active={on('/admin/chat')}
            onClick={close}
            badge={
              unreadDmCount > 0 && (
                <span className="kid-badge flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadDmCount}
                </span>
              )
            }
          >
            Admin Chat
          </NavItem>
          <NavItem to="/admin/store" nav="styleeditor" active={on('/admin/store')} onClick={close}>
            <span className="classic-emoji">🛍️ </span>Style Editor
          </NavItem>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <Link to="/" onClick={close} className="kid-logo flex min-w-0 shrink-0 items-center gap-2 sm:shrink">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl object-cover sm:h-[72px] sm:w-[72px]"
          />
          <span className="hidden truncate font-display text-base font-semibold text-primary min-[480px]:inline sm:text-lg">{t('appName')}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-primary/80 md:flex">
          {navLinks}
        </nav>

        <div className="kid-controls flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/avatar"
            aria-label="My Avatar"
            className="kid-profile flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pl-0.5 pr-2 text-xs font-bold text-primary hover:border-secondary"
          >
            <AvatarImage gender={avatar.gender} look={avatar.gender ? avatar.looks[avatar.gender] : null} size={32} />
            <span className="kid-coin"><span className="classic-emoji">🪙 </span>{avatar.coins}</span>
          </Link>
          <ThemeToggle className="hidden sm:inline-flex" />

          <button
            onClick={toggleLanguage}
            className="kid-lang inline-flex items-center rounded-lg border border-border px-2 py-1.5 text-xs font-semibold text-primary/70 hover:border-secondary hover:text-secondary sm:px-2.5"
            aria-label="Toggle language"
            title="Toggle language"
          >
            <span className="kid-btn-ic" aria-hidden="true" />
            <span className="kid-label">{i18n.language.startsWith('ar') ? 'EN' : 'AR'}</span>
          </button>

          {profile || isGuest ? (
            <button
              onClick={async () => { await signOut(); navigate('/'); setMenuOpen(false); }}
              className="kid-signout inline-flex items-center justify-center rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 sm:px-3 sm:text-sm"
            >
              <span className="kid-btn-ic" aria-hidden="true" />
              <span className="kid-label">{t('nav_signOut')}</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="kid-signin inline-flex items-center justify-center rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:opacity-90 sm:px-3 sm:text-sm"
            >
              <span className="kid-btn-ic" aria-hidden="true" />
              <span className="kid-label">{t('nav_signIn')}</span>
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
          <ThemeToggle className="mt-2 self-start sm:hidden" />
        </nav>
      )}
    </header>
  );
}
