import { useEffect, useState } from 'react';
import {
  approveTeacher, listPendingTeacherRequests, rejectTeacher,
  listReportedContentSets, unpublishContentSet, dismissReports,
} from '../lib/services';
import type { ContentSet } from '../types';

export function AdminPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [reported, setReported] = useState<ContentSet[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [pendingList, reportedList] = await Promise.all([
      listPendingTeacherRequests(),
      listReportedContentSets(),
    ]);
    setPending(pendingList);
    setReported(reportedList);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleTeacher = async (uid: string, approve: boolean) => {
    if (approve) await approveTeacher(uid); else await rejectTeacher(uid);
    refresh();
  };

  const handleUnpublish = async (id: string) => {
    await unpublishContentSet(id);
    refresh();
  };

  const handleDismiss = async (id: string) => {
    await dismissReports(id);
    refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Admin</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-primary">Teacher requests</h2>
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((u) => (
              <div key={u.uid} className="card-surface flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {u.photoURL && <img src={u.photoURL} alt="" className="h-9 w-9 rounded-full" />}
                  <div>
                    <p className="font-semibold text-primary">{u.displayName}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTeacher(u.uid, true)} className="rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-white">
                    Approve
                  </button>
                  <button onClick={() => handleTeacher(u.uid, false)} className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Reported content</h2>
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading...</p>
        ) : reported.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nothing reported. 👍</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reported.map((set) => (
              <div key={set.id} className="card-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary">{set.title}</p>
                    <p className="text-sm text-muted-foreground">by {set.teacherName} · {set.skill} · {set.items.length} items</p>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    {set.reportCount} report{set.reportCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleUnpublish(set.id)} className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-white">
                    Unpublish (make private)
                  </button>
                  <button onClick={() => handleDismiss(set.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary">
                    Dismiss reports
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
