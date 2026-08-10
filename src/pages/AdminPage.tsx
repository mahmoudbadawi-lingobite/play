import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveTeacher, listPendingTeacherRequests, rejectTeacher,
  listReportedContentSets, unpublishContentSet, dismissReports,
  republishContentSet, deleteContentSet,
  getActiveAnnouncement, setAnnouncement, clearAnnouncement,
  getActiveHeroMedia, setHeroMedia, clearHeroMedia,
  searchProfilesByEmail, listAdmins, promoteToAdmin, demoteAdmin,
  type Announcement, type AnnouncementType, type HeroMedia, type HeroMediaType, type SimpleProfile,
} from '../lib/services';
import { uploadToCloudinary } from '../lib/cloudinary';
import { linkify } from '../lib/linkify';
import {
  listReportedEscapeRooms, unpublishEscapeRoom, republishEscapeRoom, dismissEscapeRoomReports, deleteEscapeRoom,
} from '../lib/escapeRoomService';
import { useAuth } from '../contexts/AuthContext';
import type { ContentSet, EscapeRoom } from '../types';

export function AdminPage() {
  const { profile } = useAuth();
  const [admins, setAdmins] = useState<SimpleProfile[]>([]);
  const [emailQuery, setEmailQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<any[]>([]);
  const [reported, setReported] = useState<ContentSet[]>([]);
  const [reportedRooms, setReportedRooms] = useState<EscapeRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement bar (text/image)
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [annType, setAnnType] = useState<AnnouncementType>('text');
  const [annText, setAnnText] = useState('');
  const [annColor, setAnnColor] = useState('');
  const annTextareaRef = useRef<HTMLTextAreaElement>(null);

  const COLOR_SWATCHES = [
    { label: 'Default', value: '' },
    { label: 'Navy', value: '#0d1b2a' },
    { label: 'Gold', value: '#c9993f' },
    { label: 'Success', value: '#38a169' },
    { label: 'Red', value: '#dc2626' },
    { label: 'Blue', value: '#2563eb' },
  ];
  const EMOJI_OPTIONS = ['📢', '🎉', '⭐', '🔥', '✅', '⚠️', '📚', '🎮', '❤️', '👏', '🚀', '🏆'];

  const insertEmoji = (emoji: string) => {
    const el = annTextareaRef.current;
    if (!el) {
      setAnnText((t) => t + emoji);
      return;
    }
    const start = el.selectionStart ?? annText.length;
    const end = el.selectionEnd ?? annText.length;
    const next = annText.slice(0, start) + emoji + annText.slice(end);
    setAnnText(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  };
  const [annUploading, setAnnUploading] = useState(false);
  const [annPublishing, setAnnPublishing] = useState(false);
  const [annUploadError, setAnnUploadError] = useState<string | null>(null);
  const [annPendingMediaUrl, setAnnPendingMediaUrl] = useState<string | null>(null);
  const [annPublishError, setAnnPublishError] = useState<string | null>(null);

  // Homepage hero banner (image/video, under the header)
  const [heroCurrent, setHeroCurrent] = useState<HeroMedia | null>(null);
  const [heroType, setHeroType] = useState<HeroMediaType>('image');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroPublishing, setHeroPublishing] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [heroPendingMediaUrl, setHeroPendingMediaUrl] = useState<string | null>(null);
  const [heroPublishError, setHeroPublishError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [pendingList, reportedList, reportedRoomsList, announcement, hero, adminList] = await Promise.all([
      listPendingTeacherRequests(),
      listReportedContentSets(),
      listReportedEscapeRooms(),
      getActiveAnnouncement(),
      getActiveHeroMedia(),
      listAdmins(),
    ]);
    setPending(pendingList);
    setReported(reportedList);
    setReportedRooms(reportedRoomsList);
    setCurrent(announcement);
    setHeroCurrent(hero);
    setAdmins(adminList);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const handleSearch = async () => {
    setSearching(true);
    const results = await searchProfilesByEmail(emailQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handlePromote = async (uid: string) => {
    await promoteToAdmin(uid);
    setSearchResults([]);
    setEmailQuery('');
    refresh();
  };

  const handleDemote = async (uid: string) => {
    if (!confirm('Remove admin access from this account?')) return;
    try {
      await demoteAdmin(uid);
      refresh();
    } catch (err: any) {
      alert(err.message ?? 'Could not remove admin access.');
    }
  };

  const handleAnnMediaUpload = async (file: File | undefined) => {
    if (!file) return;
    setAnnUploading(true);
    setAnnUploadError(null);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setAnnPendingMediaUrl(url);
    } catch (err: any) {
      setAnnUploadError(err.message ?? 'Upload failed');
    } finally {
      setAnnUploading(false);
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!profile) return;
    setAnnPublishing(true);
    setAnnPublishError(null);
    try {
      await setAnnouncement({
        type: annType,
        textContent: annType === 'text' ? annText : undefined,
        textColor: annType === 'text' && annColor ? annColor : undefined,
        mediaUrl: annType === 'image' ? (annPendingMediaUrl ?? undefined) : undefined,
        createdBy: profile.uid,
      });
      setAnnText('');
      setAnnColor('');
      setAnnPendingMediaUrl(null);
      await refresh();
    } catch (err: any) {
      setAnnPublishError(err.message ?? 'Failed to publish - please try again.');
    } finally {
      setAnnPublishing(false);
    }
  };

  const handleClearAnnouncement = async () => {
    await clearAnnouncement();
    refresh();
  };

  const handleHeroMediaUpload = async (file: File | undefined) => {
    if (!file) return;
    setHeroUploading(true);
    setHeroUploadError(null);
    try {
      const url = await uploadToCloudinary(file, heroType);
      setHeroPendingMediaUrl(url);
    } catch (err: any) {
      setHeroUploadError(err.message ?? 'Upload failed');
    } finally {
      setHeroUploading(false);
    }
  };

  const handlePublishHero = async () => {
    if (!profile || !heroPendingMediaUrl) return;
    setHeroPublishing(true);
    setHeroPublishError(null);
    try {
      await setHeroMedia({ type: heroType, mediaUrl: heroPendingMediaUrl, createdBy: profile.uid });
      setHeroPendingMediaUrl(null);
      await refresh();
    } catch (err: any) {
      setHeroPublishError(err.message ?? 'Failed to publish - please try again.');
    } finally {
      setHeroPublishing(false);
    }
  };

  const handleClearHero = async () => {
    await clearHeroMedia();
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

  const handleUnpublishRoom = async (id: string) => {
    await unpublishEscapeRoom(id);
    refresh();
  };

  const handleReactivateRoom = async (id: string) => {
    await republishEscapeRoom(id);
    refresh();
  };

  const handleDeleteRoom = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This can't be undone.`)) return;
    await deleteEscapeRoom(id);
    refresh();
  };

  const handleDismissRoom = async (id: string) => {
    await dismissEscapeRoomReports(id);
    refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Admin</h1>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-primary">Manage admins</h2>

        {admins.length > 0 && (
          <div className="mt-3 space-y-2">
            {admins.map((a) => (
              <div key={a.uid} className="card-surface flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  {a.photoURL && <img src={a.photoURL} alt="" className="h-8 w-8 rounded-full" />}
                  <div>
                    <p className="flex items-center gap-1 text-sm font-semibold text-primary">
                      {a.displayName}
                      {a.isProtected && <span title="Protected - cannot be demoted through the app">🔒</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                </div>
                {a.uid === profile?.uid ? (
                  <span className="text-xs text-muted-foreground">(you)</span>
                ) : a.isProtected ? (
                  <span className="text-xs text-muted-foreground">Protected</span>
                ) : profile?.isProtected ? (
                  <button onClick={() => handleDemote(a.uid)} className="rounded-lg border border-destructive px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10">
                    Remove admin
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Only the main admin can remove</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="card-surface mt-4 flex flex-wrap gap-2 p-4">
          <input
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by email to add a new admin..."
            className="flex-1 rounded-lg border border-border px-4 py-2 outline-none focus:border-secondary"
          />
          <button onClick={handleSearch} disabled={!emailQuery.trim() || searching} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-40">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((r) => (
              <div key={r.uid} className="card-surface flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  {r.photoURL && <img src={r.photoURL} alt="" className="h-8 w-8 rounded-full" />}
                  <div>
                    <p className="text-sm font-semibold text-primary">{r.displayName}</p>
                    <p className="text-xs text-muted-foreground">{r.email} · currently {r.role}</p>
                  </div>
                </div>
                {r.role === 'admin' ? (
                  <span className="text-xs text-success">Already admin</span>
                ) : (
                  <button onClick={() => handlePromote(r.uid)} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    Make admin
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-primary">Announcement bar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A thin strip above the header on every page, to every visitor - even signed-out guests.
          Text or a photo.
        </p>

        {current && (
          <div className="card-surface mt-4 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Currently live</p>
            {current.type === 'text' && (
              <p className="text-primary" style={{ color: current.textColor || undefined }}>
                {current.textContent ? linkify(current.textContent) : null}
              </p>
            )}
            {current.type === 'image' && current.mediaUrl && (
              <img src={current.mediaUrl} alt="" className="max-h-40 w-full rounded-lg object-contain sm:max-h-56" />
            )}
            <button onClick={handleClearAnnouncement} className="mt-3 rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
              Remove announcement
            </button>
          </div>
        )}

        <div className="card-surface mt-4 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {(['text', 'image'] as AnnouncementType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setAnnType(t); setAnnPendingMediaUrl(null); setAnnUploadError(null); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                  annType === t ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {annType === 'text' && (
            <div className="mt-4">
              <textarea
                ref={annTextareaRef}
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                placeholder="Write the announcement text... you can paste a link too"
                rows={3}
                className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
              />

              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold text-primary">Text color</p>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setAnnColor(c.value)}
                      title={c.label}
                      className={`h-7 w-7 rounded-full border-2 ${annColor === c.value ? 'border-primary' : 'border-border'}`}
                      style={{ backgroundColor: c.value || '#0d1b2a' }}
                    />
                  ))}
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="color"
                      value={annColor || '#0d1b2a'}
                      onChange={(e) => setAnnColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
                    />
                    Custom
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold text-primary">Add an emoji</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-lg hover:border-secondary"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {annText.trim() && (
                <div className="mt-3 rounded-lg border border-dashed border-border p-3">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Preview</p>
                  <p className="text-center text-sm font-medium sm:text-base" style={{ color: annColor || undefined }}>
                    {annText}
                  </p>
                </div>
              )}
            </div>
          )}

          {annType === 'image' && (
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAnnMediaUpload(e.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
              />
              {annUploading && <p className="mt-2 text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
              {annUploadError && <p className="mt-2 text-sm text-destructive">{annUploadError}</p>}
              {annPendingMediaUrl && !annUploading && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-semibold text-success">✓ Uploaded - preview:</p>
                  <img src={annPendingMediaUrl} alt="" className="max-h-40 w-full rounded-lg object-contain sm:max-h-56" />
                </div>
              )}
            </div>
          )}

          {annPublishError && <p className="mt-3 text-sm text-destructive">⚠ {annPublishError}</p>}

          <button
            onClick={handlePublishAnnouncement}
            disabled={
              annPublishing ||
              annUploading ||
              (annType === 'text' ? !annText.trim() : !annPendingMediaUrl)
            }
            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40 sm:w-auto sm:px-8"
          >
            {annPublishing ? 'Publishing...' : 'Publish announcement'}
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Homepage banner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A large centered photo or auto-playing video right below the header, on every page.
        </p>

        {heroCurrent && (
          <div className="card-surface mt-4 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Currently live</p>
            <div className="mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-xl">
              {heroCurrent.type === 'image' ? (
                <img src={heroCurrent.mediaUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <video src={heroCurrent.mediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
              )}
            </div>
            <button onClick={handleClearHero} className="mt-3 rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
              Remove banner
            </button>
          </div>
        )}

        <div className="card-surface mt-4 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {(['image', 'video'] as HeroMediaType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setHeroType(t); setHeroPendingMediaUrl(null); setHeroUploadError(null); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                  heroType === t ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <input
              type="file"
              accept={heroType === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => handleHeroMediaUpload(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
            />
            {heroUploading && <p className="mt-2 text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
            {heroUploadError && <p className="mt-2 text-sm text-destructive">{heroUploadError}</p>}
            {heroPendingMediaUrl && !heroUploading && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold text-success">✓ Uploaded - preview:</p>
                <div className="mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-xl">
                  {heroType === 'image' ? (
                    <img src={heroPendingMediaUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={heroPendingMediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
            )}
          </div>

          {heroPublishError && <p className="mt-3 text-sm text-destructive">⚠ {heroPublishError}</p>}

          <button
            onClick={handlePublishHero}
            disabled={heroPublishing || heroUploading || !heroPendingMediaUrl}
            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40 sm:w-auto sm:px-8"
          >
            {heroPublishing ? 'Publishing...' : 'Publish banner'}
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

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Reported escape rooms</h2>
        {loading ? (
          <p className="mt-4 text-muted-foreground">Loading...</p>
        ) : reportedRooms.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nothing reported. 👍</p>
        ) : (
          <div className="mt-4 space-y-3">
            {reportedRooms.map((room) => (
              <div key={room.id} className="card-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">{room.title}</p>
                    <p className="text-sm text-muted-foreground">by {room.teacherName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${room.visibility === 'public' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {room.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      {room.reportCount} report{room.reportCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.visibility === 'public' ? (
                    <button onClick={() => handleUnpublishRoom(room.id)} className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-semibold text-white">
                      Unpublish (make private)
                    </button>
                  ) : (
                    <button onClick={() => handleReactivateRoom(room.id)} className="rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-white">
                      Reactivate (make public)
                    </button>
                  )}
                  <button onClick={() => handleDismissRoom(room.id)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary">
                    Dismiss reports
                  </button>
                  <Link to={`/escape-room/edit/${room.id}`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary hover:border-secondary">
                    Edit
                  </Link>
                  <button onClick={() => handleDeleteRoom(room.id, room.title)} className="rounded-lg border border-destructive px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
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
