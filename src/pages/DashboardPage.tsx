import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { requestTeacherAccess, listMyEnrolledClasses } from '../lib/services';

export function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState<{ id: string; name: string }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (!profile || profile.role !== 'student') return;
    listMyEnrolledClasses(profile.uid)
      .then(setEnrolledClasses)
      .finally(() => setLoadingClasses(false));
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">
        Welcome back, {profile.displayName?.split(' ')[0] ?? 'there'}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
            disabled={profile.teacherStatus === 'pending'}
            onClick={() => requestTeacherAccess(profile.uid)}
            className="rounded-xl border border-border bg-card px-5 py-3 font-semibold text-primary hover:border-secondary disabled:opacity-50"
          >
            {profile.teacherStatus === 'pending' ? t('teacherPending') : t('requestTeacherAccess')}
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
