import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateTemplate, parseTemplateFile } from '../lib/contentTemplates';
import { getContentSet, updateContentSet } from '../lib/services';
import type { ContentItem, ContentSet, SkillTemplate, Visibility } from '../types';

const SKILLS: SkillTemplate[] = ['vocabulary', 'grammar', 'reading', 'spelling'];

export function EditContentPage() {
  const { setId } = useParams<{ setId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [original, setOriginal] = useState<ContentSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  const [skill, setSkill] = useState<SkillTemplate>('vocabulary');
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [replacementItems, setReplacementItems] = useState<ContentItem[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!setId || !profile) return;
    getContentSet(setId).then((set) => {
      if (!set) { setLoading(false); return; }
      if (set.teacherId !== profile.uid && profile.role !== 'admin') {
        setNotAllowed(true);
        setLoading(false);
        return;
      }
      setOriginal(set);
      setSkill(set.skill);
      setTitle(set.title);
      setVisibility(set.visibility);
      setLoading(false);
    });
  }, [setId, profile]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const result = await parseTemplateFile(file);
    setReplacementItems(result.items);
    setParseErrors(result.errors);
  };

  const handleSave = async () => {
    if (!original || !title.trim()) return;
    setSaving(true);
    await updateContentSet(original.id, {
      title: title.trim(),
      skill,
      visibility,
      ...(replacementItems ? { items: replacementItems } : {}),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  if (notAllowed) return <p className="p-8 text-center text-muted-foreground">You don't have permission to edit this game.</p>;
  if (!original) return <p className="p-8 text-center text-muted-foreground">Game not found.</p>;

  const activeItems = replacementItems ?? original.items;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Edit game</h1>

      <div className="card-surface mt-6 p-6">
        <label className="mb-1 block text-sm font-semibold text-primary">Skill</label>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                skill === s ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-primary/70'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-semibold text-primary">Game title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
          />
        </label>

        <div className="mt-5 rounded-lg border border-border p-3">
          <p className="mb-2 text-sm font-semibold text-primary">Content ({activeItems.length} items)</p>
          <div className="max-h-32 overflow-y-auto text-sm">
            {activeItems.map((it) => (
              <p key={it.id} className="border-b border-border/50 py-1 text-muted-foreground last:border-0">
                <b className="text-primary">{it.term}</b> — {it.clue}
              </p>
            ))}
          </div>

          <button
            onClick={() => generateTemplate(skill)}
            className="mt-3 w-full rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary/10"
          >
            📥 Download template to edit content offline
          </button>
          <label className="mt-2 block">
            <span className="mb-1 block text-xs text-muted-foreground">Upload to replace all content above:</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground"
            />
          </label>
          {parseErrors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-xs text-destructive">
              {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>

        <div className="mt-5 flex gap-3">
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

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-border px-5 py-3 font-semibold text-primary hover:border-secondary"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
