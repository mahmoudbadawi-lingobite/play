import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createClass, listMyClasses, getClassRoster, type RosterEntry } from '../lib/services';
import type { SchoolClass } from '../types';

export function TeacherClassesPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rosters, setRosters] = useState<Record<string, RosterEntry[]>>({});
  const [rosterLoading, setRosterLoading] = useState<string | null>(null);

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    const list = await listMyClasses(profile.uid);
    setClasses(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [profile]);

  const handleCreate = async () => {
    if (!profile || !name.trim()) return;
    await createClass(profile.uid, name.trim());
    setName('');
    refresh();
  };

  const toggleRoster = async (classId: string) => {
    if (expandedId === classId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(classId);
    if (!rosters[classId]) {
      setRosterLoading(classId);
      const roster = await getClassRoster(classId);
      setRosters((r) => ({ ...r, [classId]: roster }));
      setRosterLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">My Classes</h1>

      <div className="card-surface mt-6 flex gap-2 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New class name, e.g. Grade 5 - Section A"
          className="flex-1 rounded-lg border border-border px-4 py-2 outline-none focus:border-secondary"
        />
        <button onClick={handleCreate} className="rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground">
          Create class
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-muted-foreground">Loading...</p>
      ) : classes.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No classes yet - create your first one above.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="card-surface p-4">
              <button onClick={() => toggleRoster(c.id)} className="flex w-full items-center justify-between text-left">
                <div>
                  <p className="font-display font-semibold text-primary">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.studentIds.length} students</p>
                </div>
                <p className="rounded-md bg-secondary/10 px-2 py-1 font-mono text-sm font-bold tracking-widest text-secondary">
                  {c.joinCode}
                </p>
              </button>

              {expandedId === c.id && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Stats reflect each student's overall activity across LingoBite Play, not only games played for this class.
                  </p>
                  {rosterLoading === c.id ? (
                    <p className="text-sm text-muted-foreground">Loading roster...</p>
                  ) : (rosters[c.id]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No students have joined yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-muted-foreground">
                            <th className="pb-2">Student</th>
                            <th className="pb-2">Total XP</th>
                            <th className="pb-2">Games played</th>
                            <th className="pb-2">Avg accuracy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rosters[c.id]
                            .slice()
                            .sort((a, b) => b.totalXP - a.totalXP)
                            .map((r) => (
                              <tr key={r.studentId} className="border-t border-border/50">
                                <td className="flex items-center gap-2 py-2">
                                  {r.photoURL && <img src={r.photoURL} alt="" className="h-6 w-6 rounded-full" />}
                                  {r.displayName}
                                </td>
                                <td className="py-2 font-semibold text-secondary">{r.totalXP}</td>
                                <td className="py-2">{r.gamesPlayed}</td>
                                <td className="py-2">{r.avgAccuracy}%</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
