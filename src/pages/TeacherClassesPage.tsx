import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createClass, listMyClasses } from '../lib/services';
import type { SchoolClass } from '../types';

export function TeacherClassesPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

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
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {classes.map((c) => (
            <div key={c.id} className="card-surface p-4">
              <p className="font-display font-semibold text-primary">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.studentIds.length} students</p>
              <p className="mt-2 inline-block rounded-md bg-secondary/10 px-2 py-1 font-mono text-sm font-bold tracking-widest text-secondary">
                {c.joinCode}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
