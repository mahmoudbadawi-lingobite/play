import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listMyEscapeRooms, deleteEscapeRoom } from '../lib/escapeRoomService';
import type { EscapeRoom } from '../types';

export function MyEscapeRoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<EscapeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = async () => {
    if (!profile) return;
    setLoading(true);
    const list = await listMyEscapeRooms(profile.uid);
    setRooms(list);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [profile]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deleteEscapeRoom(id);
    refresh();
  };

  const handleShare = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}escape-room/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-primary">My Escape Rooms</h1>
        <Link to="/teacher/create-escape-room" className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground hover:opacity-90">
          + Create escape room
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="mt-8 text-muted-foreground">You haven't created any escape rooms yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room.id} className="card-surface flex flex-col overflow-hidden">
              <img src={room.imageUrl} alt="" className="h-40 w-full object-cover" />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${room.visibility === 'public' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {room.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-primary">{room.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{room.playCount} plays</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to={`/escape-room/${room.id}`} className="rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground hover:opacity-90">
                    Play
                  </Link>
                  <Link to={`/escape-room/edit/${room.id}`} className="rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-primary hover:border-secondary">
                    Edit
                  </Link>
                  <button onClick={() => handleShare(room.id)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary">
                    {copiedId === room.id ? '✓ Copied' : 'Copy link'}
                  </button>
                  <button onClick={() => handleDelete(room.id, room.title)} className="rounded-lg border border-destructive px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
