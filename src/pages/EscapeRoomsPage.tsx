import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  listPublicEscapeRooms, reportEscapeRoom, deleteEscapeRoom,
} from '../lib/escapeRoomService';
import { shareLink } from '../lib/share';
import type { EscapeRoom } from '../types';

export function EscapeRoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<EscapeRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [shareStatus, setShareStatus] = useState<Record<string, 'copied' | 'shared'>>({});

  const refresh = () => {
    setLoading(true);
    listPublicEscapeRooms().then(setRooms).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleShare = async (room: EscapeRoom) => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}escape-room/${room.id}`;
    const result = await shareLink(url, room.title);
    if (result === 'shared' || result === 'copied') {
      setShareStatus((s) => ({ ...s, [room.id]: result }));
      setTimeout(() => setShareStatus((s) => { const next = { ...s }; delete next[room.id]; return next; }), 2000);
    }
  };

  const handleReport = async (id: string) => {
    if (!profile || reportedIds.includes(id)) return;
    await reportEscapeRoom(id, 'Reported by user from Escape Rooms');
    setReportedIds((r) => [...r, id]);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deleteEscapeRoom(id);
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Escape Rooms</h1>
      <p className="mt-1 text-muted-foreground">Solve picture clues in order to escape.</p>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Loading...</p>
      ) : rooms.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No public escape rooms yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room.id} className="card-surface flex flex-col overflow-hidden">
              <img src={room.imageUrl} alt="" className="h-40 w-full object-cover" />
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-lg font-semibold text-primary">{room.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">by {room.teacherName} · {room.playCount} plays</p>

                <Link
                  to={`/escape-room/${room.id}`}
                  className="mt-3 inline-block rounded-lg bg-secondary px-4 py-2 text-center text-sm font-semibold text-secondary-foreground hover:opacity-90"
                >
                  Play now →
                </Link>

                <button
                  onClick={() => handleShare(room)}
                  className="mt-2 rounded-lg border border-border px-4 py-1.5 text-center text-xs font-semibold text-primary hover:border-secondary"
                >
                  {shareStatus[room.id] === 'shared' ? '✓ Shared' : shareStatus[room.id] === 'copied' ? '✓ Link copied' : '🔗 Share'}
                </button>

                {profile && (
                  <button
                    onClick={() => handleReport(room.id)}
                    disabled={reportedIds.includes(room.id)}
                    className="mt-2 text-left text-xs text-muted-foreground hover:text-destructive disabled:text-success"
                  >
                    {reportedIds.includes(room.id) ? '✓ Reported - thanks' : '⚑ Report this content'}
                  </button>
                )}
                {profile && (profile.uid === room.teacherId || profile.role === 'admin') && (
                  <div className="mt-2 flex gap-2">
                    <Link to={`/escape-room/edit/${room.id}`} className="text-xs font-semibold text-primary hover:text-secondary">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(room.id, room.title)} className="text-xs font-semibold text-destructive hover:opacity-80">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
