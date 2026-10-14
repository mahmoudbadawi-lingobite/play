import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { requestTeacherAccess, listMyEnrolledClasses } from '../lib/services';
import { useAvatarState } from '../features/avatar/avatarStore';
import { AvatarImage } from '../features/avatar/AvatarImage';
import { levelInfo } from '../features/avatar/level';

export function DashboardPage() {
  const { t } = useTranslation();
  const { profile, refreshProfile } = useAuth();
  const avatar = useAvatarState();
  const [enrolledClasses, setEnrolledClasses] = useState<{ id: string; name: string }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== 'student') return;
    listMyEnrolledClasses(profile.uid)
      .then(setEnrolledClasses)
      .finally(() => setLoadingClasses(false));
  }, [profile]);

  const handleRequestTeacherAccess = async () => {
    if (!profile) return;
    setRequesting(true);
    await requestTeacherAccess(profile.uid);
    await refreshProfile();
    setRequesting(false);
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">
        Welcome back, {profile.displayName?.split(' ')[0] ?? 'there'}
      </h1>

      {profile.role === 'student' && (
      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-[#6C4DFF] via-[#5B7CFF] to-[#3FA9FF] p-4 shadow-lg">
        <span className="rounded-2xl border-2 border-white/80 bg-white/90 p-1">
          <AvatarImage gender={avatar.gender} look={avatar.gender ? avatar.looks[avatar.gender] : null} view="body" size={96} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-extrabold text-white">Level {levelInfo(profile.totalXP ?? 0).level}</p>
          <div className="mt-1 h-3 max-w-xs overflow-hidden rounded-full border border-white/70 bg-[#3B3B8F]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF7A1F]" style={{ width: `${Math.max(6, levelInfo(profile.totalXP ?? 0).pct)}%` }} />
          </div>
          <p className="mt-1 text-sm font-semibold text-white/90">🪙 {avatar.coins} coins</p>
        </div>
        <div className="flex gap-2">
          <Link to="/avatar" className="rounded-xl border-2 border-white/70 bg-white/90 px-4 py-2 text-sm font-extrabold text-primary">My Avatar</Link>
          <Link to="/store" className="rounded-xl bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] px-4 py-2 text-sm font-extrabold text-white shadow">🛍️ Style Store</Link>
        </div>
      </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-sm text-muted-foreground">Total XP</p>
          <p className="font-display text-3xl font-bold text-secondary">{profile.totalXP}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-muted-foreground">Current streak</p>
          <p className="font-display text-3xl font-bold text-primary">{profile.currentStreak} 🔥</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-sm text-muted-foreground">Badges</p>
          <p className="font-display text-3xl font-bold text-primary">{profile.badges.length} 🏅</p>
        </div>
      </div>

      {profile.role === 'student' && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-primary">My classes</p>
          {loadingClasses ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : enrolledClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't joined a class yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {enrolledClasses.map((c) => (
                <span key={c.id} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-primary">
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/library" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:opacity-90">
          {t('nav_library')}
        </Link>

        {profile.role === 'teacher' && (
          <>
            <Link to="/teacher/create" className="rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground hover:opacity-90">
              {t('createGame')}
            </Link>
            <Link to="/teacher/my-games" className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary">
              My Games
            </Link>
            <Link to="/teacher/create-escape-room" className="rounded-xl bg-secondary px-5 py-3 font-semibold text-secondary-foreground hover:opacity-90">
              Create Escape Room
            </Link>
            <Link to="/teacher/my-escape-rooms" className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary">
              My Escape Rooms
            </Link>
            <Link to="/teacher/classes" className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary">
              {t('nav_classes')}
            </Link>
          </>
        )}

        {profile.role === 'student' && (
          <Link to="/join" className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary">
            🔑 Join a class
          </Link>
        )}

        {profile.role === 'student' && profile.teacherStatus !== 'approved' && (
          <button
            disabled={requesting || profile.teacherStatus === 'pending'}
            onClick={handleRequestTeacherAccess}
            className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary transition hover:border-secondary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
          >
            {requesting ? 'Sending request...' : profile.teacherStatus === 'pending' ? t('teacherPending') : t('requestTeacherAccess')}
          </button>
        )}

        {profile.role === 'admin' && (
          <Link to="/admin" className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary">
            {t('nav_admin')}
          </Link>
        )}
      </div>
    </div>
  );
}
