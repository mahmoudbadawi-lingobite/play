import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';
import { HotspotEditor } from '../components/escapeRoom/HotspotEditor';
import { PromptGeneratorPanel } from '../components/escapeRoom/PromptGeneratorPanel';
import { ESCAPE_ROOM_THEMES } from '../games/escapeRoomThemes';
import {
  checkDuplicateEscapeRoomTitle, createEscapeRoom, type HotspotInput,
} from '../lib/escapeRoomService';
import type { EscapeRoom, Visibility } from '../types';

export function CreateEscapeRoomPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [showPromptGenerator, setShowPromptGenerator] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<HotspotInput[]>([]);
  const [title, setTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [theme, setTheme] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [duplicate, setDuplicate] = useState<EscapeRoom | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const handleTitleBlur = async () => {
    if (!title.trim()) return;
    const existing = await checkDuplicateEscapeRoomTitle(title);
    setDuplicate(existing);
  };

  const incompleteHotspot = hotspots.find(
    (h) => !h.clueText.trim() || !h.correctAnswer.trim() || (h.answerMode === 'choice' && (h.choices?.length ?? 0) === 0)
  );

  const handleSave = async () => {
    if (!profile || !imageUrl || !title.trim() || hotspots.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const id = await createEscapeRoom({
        title: title.trim(),
        teacherId: profile.uid,
        teacherName: profile.displayName ?? 'Teacher',
        imageUrl,
        storyText: storyText.trim() || undefined,
        theme: theme ?? undefined,
        visibility,
        hotspots,
      });
      navigate(`/escape-room/${id}`);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save - please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Create an Escape Room</h1>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Step 1 · AI Prompt Generator (optional)</p>
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
        {!imageUrl ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Step 2 · Upload the room's background image</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
            />
            {uploading && <p className="mt-2 text-sm text-muted-foreground">Uploading to Cloudinary...</p>}
            {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Step 3 · Place your clues</p>
              <button onClick={() => { setImageUrl(null); setHotspots([]); }} className="text-xs font-semibold text-destructive">
                Change image
              </button>
            </div>
            <HotspotEditor imageUrl={imageUrl} hotspots={hotspots} onChange={setHotspots} />
          </div>
        )}

        {imageUrl && (
          <>
            <label className="mt-6 block">
              <span className="mb-1 block text-sm font-semibold text-primary">Room title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g. The Vocabulary Vault"
                className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
              />
            </label>

            {duplicate && (
              <div className="mt-2 rounded-lg border border-secondary bg-secondary/10 p-3 text-sm">
                <p className="font-semibold text-primary">A public escape room with this title already exists</p>
                <p className="text-muted-foreground">"{duplicate.title}" by {duplicate.teacherName}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => navigate(`/escape-room/${duplicate.id}`)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    Use existing instead
                  </button>
                  <button onClick={() => setDuplicate(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary">
                    Create mine anyway
                  </button>
                </div>
              </div>
            )}

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
                placeholder="Paste the story you generated with the AI prompt above, or write your own..."
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
                ⚠ Every clue needs text and a correct answer (and at least one wrong option, if multiple choice) before saving.
              </p>
            )}
            {saveError && <p className="mt-3 text-sm text-destructive">⚠ {saveError}</p>}

            <button
              onClick={handleSave}
              disabled={!title.trim() || hotspots.length === 0 || !!incompleteHotspot || saving}
              className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save escape room'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
