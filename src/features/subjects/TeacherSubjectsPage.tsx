import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dropSubject, requestSubject } from './api';
import { useSubjects } from './useSubjects';

import { tr } from '../../i18n/tr';
const badge: Record<string, string> = {
  approved: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', rejected: 'bg-red-100 text-red-800',
};

/** A teacher chooses the subjects they teach. An admin approves each one before it can be used. */
export function TeacherSubjectsPage() {
  const { profile } = useAuth();
  const { subjects, mine, loading, error, reload, typesFor } = useSubjects();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (id: string, fn: () => Promise<void>, ok: string) => {
    setBusy(id); setMsg(null);
    try { await fn(); await reload(); setMsg(ok); } catch (e) { setMsg((e as Error).message); } finally { setBusy(null); }
  };
  if (!profile) return null;
  const status = (id: string) => mine.find((m) => m.subjectId === id)?.status;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">{tr('My subjects')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tr('Choose the subjects you teach. After an admin approves one, you can create questions and games for it, and you will only see the question types and skills that belong to your subjects.')}</p>
      {msg && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm font-semibold" role="status">{msg}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-800" role="alert">{error}. The subjects tables may not be installed yet (run supabase/subjects_skills_patch.sql).</p>}
      {loading && <p className="mt-6 text-sm text-muted-foreground">{tr('Loading…')}</p>}
      <div className="mt-6 grid gap-3">
        {subjects.filter((s) => s.active).map((s) => {
          const st = status(s.id); const skillCount = s.domains.reduce((n, d) => n + d.skills.length, 0);
          return (
            <div key={s.id} className="card-surface flex flex-wrap items-center gap-3 p-4">
              <span className="text-3xl" aria-hidden>{s.icon ?? '📚'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-primary">{s.name}</p>
                <p className="text-xs text-muted-foreground">{tr('{d} domains · {s} skills · {q} question types', { d: s.domains.length, s: skillCount, q: typesFor(s.id).length })}</p>
              </div>
              {st && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge[st]}`}>{st === 'approved' ? tr('Approved') : st === 'pending' ? tr('Waiting for approval') : tr('Not approved')}</span>}
              {(!st || st === 'rejected') && (
                <button disabled={busy === s.id} onClick={() => run(s.id, () => requestSubject(profile.uid, s.id), tr('Requested {n}. An admin will review it.', { n: s.name }))}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground disabled:opacity-40">{st === 'rejected' ? tr('Ask again') : tr('Request')}</button>
              )}
              {st && (
                <button disabled={busy === s.id} onClick={() => run(s.id, () => dropSubject(profile.uid, s.id), st === 'approved' ? tr('{n} removed.', { n: s.name }) : tr('Request cancelled.'))}
                  className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:border-secondary hover:text-secondary">{st === 'approved' ? tr('Remove') : tr('Cancel')}</button>
              )}
            </div>
          );
        })}
        {!loading && subjects.filter((s) => s.active).length === 0 && !error && <p className="text-sm text-muted-foreground">{tr('No subjects have been set up yet. Ask an admin to add them.')}</p>}
      </div>
    </div>
  );
}
