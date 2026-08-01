import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTeacher, listPendingTeacherRequests, rejectTeacher,
  listReportedContentSets, unpublishContentSet, dismissReports,
  republishContentSet, deleteContentSet,
  getActiveAnnouncement, setAnnouncement, clearAnnouncement,
  type Announcement, type AnnouncementType,
} from '../lib/services';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import type { ContentSet } from '../types';

export function AdminPage() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [reported, setReported] = useState<ContentSet[]>([]);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState<Announcement | null>(null);
  const [annType, setAnnType] = useState<AnnouncementType>('text');
  const [annText, setAnnText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingMediaUrl, setPendingMediaUrl] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [pendingList, reportedList, announcement] = await Promise.all([
      listPendingTeacherRequests(),
      listReportedContentSets(),
      getActiveAnnouncement(),
    ]);
    setPending(pendingList);
    setReported(reportedList);
    setCurrent(announcement);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleMediaUpload = async (file: File | undefined, resourceType: 'image' | 'video') => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file, resourceType);
      setPendingMediaUrl(url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!profile) return;
    setPublishing(true);
    await setAnnouncement({
      type: annType,
      textContent: annType === 'text' ? annText : undefined,
      mediaUrl: annType !== 'text' ? (pendingMediaUrl ?? undefined) : undefined,
      createdBy: profile.uid,
    });
    setPublishing(false);
    setAnnText('');
    setPendingMediaUrl(null);
    refresh();
  };

  const handleClearAnnouncement = async () => {
    await clearAnnouncement();
    refresh();
  };

  const handleTeacher = async (uid: string, approve: boolean) => {
    if (approve) await approveTeacher(uid); else await rejectTeacher(uid);
    refresh();
  };

  const handleUnpublish = async (id: string) => {
    await unpublishContentSet(id);
    refresh();
  };

  const handleReactivate = async (id: string) => {
    await republishContentSet(id);
    refresh();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This can't be undone.`)) return;
    await deleteContentSet(id);
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
        <h2 className="font-display text-xl font-semibold text-primary">Announcement bar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown above the header on every page, to every visitor - even signed-out guests.
        </p>

        {current && (
          <div className="card-surface mt-4 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Currently live</p>
            {current.type === 'text' && <p className="text-primary">{current.textContent}</p>}
            {current.type === 'image' && current.mediaUrl && (
              <img src={current.mediaUrl} alt="" className="max-h-40 w-full rounded-lg object-contain sm:max-h-56" />
            )}
            {current.type === 'video' && current.mediaUrl && (
              <video src={current.mediaUrl} controls className="max-h-40 w-full rounded-lg sm:max-h-56" />
            )}
            <button onClick={handleClearAnnouncement} className="mt-3 rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
              Remove announcement
            </button>
          </div>
        )}

        <div className="card-surface mt-4 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {(['text', 'image', 'video'] as AnnouncementType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setAnnType(t); setPendingMediaUrl(null); setUploadError(null); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                  annType === t ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {annType === 'text' && (
            <textarea
              value={annText}
              onChange={(e) => setAnnText(e.target.value)}
              placeholder="Write the announcement text..."
              rows={3}
              className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
            />
          )}

          {(annType === 'image' || annType === 'video') && (
            <div className="mt-4">
              <input
                type="file"
                accept={annType === 'image' ? 'image/*' : 'video/*'}
                onChange={(e) => handleMediaUpload(e.target.files?.[0], annType)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
              />
              {uploading && <p className="mt-2 text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
              {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
              {pendingMediaUrl && !uploading && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold text-success">✓ Uploaded - preview:</p>
                  {annType === 'image' ? (
                    <img src={pendingMediaUrl} alt="" className="max-h-40 w-full rounded-lg object-contain sm:max-h-56" />
                  ) : (
                    <video src={pendingMediaUrl} controls className="max-h-40 w-full rounded-lg sm:max-h-56" />
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={
              publishing ||
              uploading ||
              (annType === 'text' ? !annText.trim() : !pendingMediaUrl)
            }
            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40 sm:w-auto sm:px-8"
          >
            {publishing ? 'Publishing...' : 'Publish announcement'}
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Teacher requests</h2>
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No pending requests.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map((u) => (
              <div key={u.uid} className="card-surface flex flex-wrap items-center justify-between gap-3 p-4">
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">{set.title}</p>
                    <p className="text-sm text-muted-foreground">by {set.teacherName} · {set.skill} · {set.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${set.visibility === 'public' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {set.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      {set.reportCount} report{set.reportCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {set.visibility === 'public' ? (
                    <button onClick={() => handleUnpublish(set.id)} className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-white">
                      Unpublish (make private)
                    </button>
                  ) : (
                    <button onClick={() => handleReactivate(set.id)} className="rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-white">
                      Reactivate (make public)
                    </button>
                  )}
                  <button onClick={() => handleDismiss(set.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary">
                    Dismiss reports
                  </button>
                  <Link to={`/teacher/edit/${set.id}`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary hover:border-secondary">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(set.id, set.title)} className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
                    Delete permanently
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
