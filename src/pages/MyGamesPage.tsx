import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listMyContentSets, deleteContentSet } from '../lib/services';
import { compatibleGames } from '../games/registry';
import type { ContentSet } from '../types';

export function MyGamesPage() {
  const { profile } = useAuth();
  const [sets, setSets] = useState<ContentSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    const list = await listMyContentSets(profile.uid);
    setSets(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [profile]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deleteContentSet(id);
    refresh();
  };

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}play/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-primary">My Games</h1>
        <Link to="/teacher/create" className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90">
          + Create a game
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : sets.length === 0 ? (
        <p className="mt-8 text-muted-foreground">You haven't created any games yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <div key={set.id} className="card-surface flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize text-muted-foreground">
                  {set.skill}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${set.visibility === 'public' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {set.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-primary">{set.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{set.items.length} items · {set.playCount} plays</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {compatibleGames(set.items).map((g) => (
                  <span key={g.key} title={g.name} className="text-lg">{g.icon}</span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to={`/play/${set.id}`} className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:opacity-90">
                  Play
                </Link>
                <Link to={`/teacher/edit/${set.id}`} className="rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-primary hover:border-secondary">
                  Edit
                </Link>
                <button onClick={() => handleShare(set.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary">
                  {copiedId === set.id ? '✓ Copied' : 'Copy link'}
                </button>
                <button onClick={() => handleDelete(set.id, set.title)} className="rounded-lg border border-destructive px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
