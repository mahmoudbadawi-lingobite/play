import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';
import { HotspotEditor } from '../components/escapeRoom/HotspotEditor';
import { PromptGeneratorPanel } from '../components/escapeRoom/PromptGeneratorPanel';
import { ESCAPE_ROOM_THEMES } from '../games/escapeRoomThemes';
import {
  getEscapeRoom, getEscapeRoomHotspots, updateEscapeRoom, type HotspotInput,
} from '../lib/escapeRoomService';
import type { EscapeRoom, Visibility } from '../types';

export function EditEscapeRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [original, setOriginal] = useState<EscapeRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<HotspotInput[]>([]);
  const [title, setTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [theme, setTheme] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showPromptGenerator, setShowPromptGenerator] = useState(false);

  useEffect(() => {
    if (!roomId || !profile) return;
    Promise.all([getEscapeRoom(roomId), getEscapeRoomHotspots(roomId)]).then(([room, spots]) => {
      if (!room) { setLoading(false); return; }
      if (room.teacherId !== profile.uid && profile.role !== 'admin') {
        setNotAllowed(true);
        setLoading(false);
        return;
      }
      setOriginal(room);
      setImageUrl(room.imageUrl);
      setTitle(room.title);
      setStoryText(room.storyText ?? '');
      setTheme(room.theme ?? null);
      setVisibility(room.visibility);
      setHotspots(spots.map((s) => ({
        xPercent: s.xPercent, yPercent: s.yPercent, radiusPercent: s.radiusPercent,
        locateHint: s.locateHint, clueText: s.clueText, answerMode: s.answerMode, correctAnswer: s.correctAnswer, choices: s.choices,
      })));
      setLoading(false);
    });
  }, [roomId, profile]);

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setImageUrl(url);
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const incompleteHotspot = hotspots.find(
    (h) => !h.locateHint.trim() || !h.clueText.trim() || !h.correctAnswer.trim() || (h.answerMode === 'choice' && (h.choices?.length ?? 0) === 0)
  );

  const handleSave = async () => {
    if (!original || !imageUrl || !title.trim() || hotspots.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateEscapeRoom(original.id, { title: title.trim(), visibility, imageUrl, storyText: storyText.trim() || undefined, theme: theme ?? undefined, hotspots });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save - please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  if (notAllowed) return <p className="p-8 text-center text-muted-foreground">You don't have permission to edit this escape room.</p>;
  if (!original || !imageUrl) return <p className="p-8 text-center text-muted-foreground">Escape room not found.</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Edit Escape Room</h1>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">AI Prompt Generator (optional)</p>
        <button onClick={() => setShowPromptGenerator((v) => !v)} className="text-xs font-semibold text-secondary">
          {showPromptGenerator ? 'Hide' : 'Show'}
        </button>
      </div>
      {showPromptGenerator && (
        <div className="mt-3">
          <PromptGeneratorPanel />
        </div>
      )}

      <div className="card-surface mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">Background image and clues</p>
          <label className="cursor-pointer text-xs font-semibold text-secondary">
            Replace image
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} className="hidden" />
          </label>
        </div>
        {uploading && <p className="mb-2 text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
        {uploadError && <p className="mb-2 text-sm text-destructive">{uploadError}</p>}

        <HotspotEditor imageUrl={imageUrl} hotspots={hotspots} onChange={setHotspots} />

        <label className="mt-6 block">
          <span className="mb-1 block text-sm font-semibold text-primary">Room title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
          />
        </label>

        <div className="mt-5">
          <p className="mb-1.5 text-sm font-semibold text-primary">
            Theme <span className="font-normal text-muted-foreground">(optional - matches the "escaped!" message to your setting)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTheme(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${theme === null ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'}`}
            >
              None
            </button>
            {ESCAPE_ROOM_THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${theme === t ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-primary">
            Story introduction <span className="font-normal text-muted-foreground">(optional - shown before the game begins)</span>
          </span>
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
          />
        </label>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setVisibility('public')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold ${visibility === 'public' ? 'border-secondary bg-secondary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            🌐 Public - anyone can use
          </button>
          <button
            onClick={() => setVisibility('private')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold ${visibility === 'private' ? 'border-secondary bg-secondary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            🔒 Private - only you
          </button>
        </div>

        {incompleteHotspot && hotspots.length > 0 && (
          <p className="mt-3 text-sm text-destructive">
            ⚠ Every clue needs a locate hint, a question, and a correct answer (and at least one wrong option, if multiple choice) before saving.
          </p>
        )}
        {saveError && <p className="mt-3 text-sm text-destructive">⚠ {saveError}</p>}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!title.trim() || hotspots.length === 0 || !!incompleteHotspot || saving}
            className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
          </button>
          <button onClick={() => navigate(-1)} className="rounded-lg border border-border px-5 py-3 font-semibold text-primary hover:border-secondary">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
