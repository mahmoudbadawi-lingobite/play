import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { AiContentPanel } from '../components/common/AiContentPanel';
import { generateTemplate, parseTemplateFile } from '../lib/contentTemplates';
import { checkDuplicateTitle, createContentSet } from '../lib/services';
import type { ContentItem, ContentSet, SkillTemplate, Visibility } from '../types';

const SKILLS: SkillTemplate[] = ['vocabulary', 'grammar', 'reading', 'spelling'];

export function CreateContentPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [skill, setSkill] = useState<SkillTemplate>('vocabulary');
  const [title, setTitle] = useState('');
  const [aiItems, setAiItems] = useState<ContentItem[]>([]);
  const [fileItems, setFileItems] = useState<ContentItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [duplicate, setDuplicate] = useState<ContentSet | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Pasted AI content wins; the spreadsheet path is the fallback.
  const items = aiItems.length > 0 ? aiItems : fileItems;

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const result = await parseTemplateFile(file);
    setFileItems(result.items);
    setParseErrors(result.errors);
  };

  const handleTitleBlur = async () => {
    if (!title.trim()) return;
    const existing = await checkDuplicateTitle(title);
    setDuplicate(existing);
  };

  const handleSave = async () => {
    if (!profile || !title.trim() || items.length === 0) return;
    setSaving(true);
    setSaveError('');
    try {
      const id = await createContentSet({
        title: title.trim(),
        skill,
        teacherId: profile.uid,
        teacherName: profile.displayName ?? 'Teacher',
        visibility,
        items,
      });
      navigate(`/play/${id}`);
    } catch {
      setSaveError("Couldn't save the game. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">{t('createGame')}</h1>

      <div className="card-surface mt-6 p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 · Skill and title</p>
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
            onBlur={handleTitleBlur}
            placeholder="e.g. Animals - Beginner Vocabulary"
            className="w-full rounded-lg border border-border px-4 py-2.5 outline-none focus:border-secondary"
          />
        </label>

        {duplicate && (
          <div className="mt-2 rounded-lg border border-secondary bg-secondary/10 p-3 text-sm">
            <p className="font-semibold text-primary">{t('similarTitleFound')}</p>
            <p className="text-muted-foreground">"{duplicate.title}" by {duplicate.teacherName} · {duplicate.items.length} items</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => navigate(`/play/${duplicate.id}`)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                {t('useExisting')}
              </button>
              <button onClick={() => setDuplicate(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary">
                {t('createAnyway')}
              </button>
            </div>
          </div>
        )}
      </div>

      <AiContentPanel skill={skill} title={title} onItemsChange={setAiItems} />

      <details className="card-surface mt-4 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Prefer a spreadsheet? Use the template instead{fileItems.length > 0 && aiItems.length === 0 ? ` (${fileItems.length} items loaded)` : ''}
        </summary>
        <button
          onClick={() => generateTemplate(skill)}
          className="mt-3 w-full rounded-lg border border-secondary px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/10"
        >
          📥 {t('downloadTemplate')}
        </button>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-semibold text-primary">{t('uploadFilled')}</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
          />
        </label>
        {parseErrors.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-sm text-destructive">
            {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        {aiItems.length > 0 && fileItems.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">The pasted AI content above is used. Clear it to use the spreadsheet instead.</p>
        )}
      </details>

      <div className="card-surface mt-4 p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final step · Share and create</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setVisibility('public')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold ${visibility === 'public' ? 'border-secondary bg-secondary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            🌐 {t('visibilityPublic')}
          </button>
          <button
            onClick={() => setVisibility('private')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold ${visibility === 'private' ? 'border-secondary bg-secondary/10 text-primary' : 'border-border text-muted-foreground'}`}
          >
            🔒 {t('visibilityPrivate')}
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={!title.trim() || items.length === 0 || saving}
          className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {saving ? 'Creating...' : items.length > 0 ? `Create game (${items.length} items)` : 'Create game'}
        </button>
        {!saving && (!title.trim() || items.length === 0) && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {!title.trim() ? 'Type a game title in Step 1. ' : ''}
            {items.length === 0 ? "Paste the AI's reply above to enable this button." : ''}
          </p>
        )}
        {saveError && <p className="mt-2 text-center text-sm text-destructive">{saveError}</p>}
      </div>
    </div>
  );
}
