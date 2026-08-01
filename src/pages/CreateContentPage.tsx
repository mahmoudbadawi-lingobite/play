import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
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
  const [items, setItems] = useState<ContentItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [duplicate, setDuplicate] = useState<ContentSet | null>(null);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const result = await parseTemplateFile(file);
    setItems(result.items);
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
    const id = await createContentSet({
      title: title.trim(),
      skill,
      teacherId: profile.uid,
      teacherName: profile.displayName ?? 'Teacher',
      visibility,
      items,
    });
    setSaving(false);
    navigate(`/play/${id}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">{t('createGame')}</h1>

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

        <button
          onClick={() => generateTemplate(skill)}
          className="mt-4 w-full rounded-lg border border-secondary px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-secondary/10"
        >
          📥 {t('downloadTemplate')}
        </button>

        <label className="mt-4 block">
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

        {items.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-border p-2 text-sm">
            {items.map((it) => (
              <p key={it.id} className="border-b border-border/50 py-1 last:border-0">
                <b>{it.term}</b> — {it.clue}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted-foreground">{items.length} items loaded</p>
          </div>
        )}

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

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
          className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save game'}
        </button>
      </div>
    </div>
  );
}
