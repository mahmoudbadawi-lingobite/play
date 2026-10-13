import { useEffect, useMemo, useRef, useState } from 'react';
import { buildContentPrompt, parseContentReply, SKILL_HELP } from '../../lib/contentPrompt';
import type { ContentItem, SkillTemplate } from '../../types';

const AI_SHORTCUTS = [
  { label: 'ChatGPT', url: 'https://chat.openai.com' },
  { label: 'Gemini', url: 'https://gemini.google.com/app' },
  { label: 'Claude', url: 'https://claude.ai/new' },
];

const COUNTS = [8, 10, 12, 16, 20];

const chip = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-xs font-medium ${active ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'}`;

/**
 * "Copy a prompt, paste the AI's reply" content builder.
 * Reports the parsed items through onItemsChange (empty array when there is
 * nothing valid yet), so the page decides what the final button does.
 */
export function AiContentPanel({
  skill,
  title,
  onItemsChange,
}: {
  skill: SkillTemplate;
  title: string;
  onItemsChange: (items: ContentItem[]) => void;
}) {
  const [grade, setGrade] = useState(5);
  const [count, setCount] = useState(12);
  const [subject, setSubject] = useState('English');
  const [topic, setTopic] = useState('');
  const [hasAttachment, setHasAttachment] = useState(true);
  const [rawText, setRawText] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildContentPrompt({ skill, title, grade, count, subject, topic, hasAttachment, rawText }),
    [skill, title, grade, count, subject, topic, hasAttachment, rawText],
  );
  const parsed = useMemo(() => (pasteText.trim() ? parseContentReply(pasteText, skill) : null), [pasteText, skill]);

  const cbRef = useRef(onItemsChange);
  useEffect(() => {
    cbRef.current = onItemsChange;
  });
  useEffect(() => {
    cbRef.current(parsed ? parsed.items : []);
  }, [parsed]);

  const copyPrompt = async (openUrl?: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
    if (openUrl) window.open(openUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="card-surface mt-6 p-4 sm:p-6">
      <p className="font-display text-lg font-semibold text-primary">Create the content with AI</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe your material, copy the prompt into any AI chat (attach your worksheet or word list there), then
        paste the AI's reply below. No template needed.
      </p>
      <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-primary">
        <b className="capitalize">{skill}</b>: {SKILL_HELP[skill]}
      </p>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Grade</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`h-8 w-8 rounded-lg text-sm font-semibold ${grade === g ? 'bg-primary text-primary-foreground' : 'border border-border text-primary/70'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-semibold text-primary">Number of items</p>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map((c) => (
            <button key={c} type="button" onClick={() => setCount(c)} className={chip(count === c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Subject / language</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="English"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-primary">Topic (optional)</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "Animals" or "Past simple"'
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3">
        <input type="checkbox" checked={hasAttachment} onChange={(e) => setHasAttachment(e.target.checked)} className="mt-0.5" />
        <span className="text-sm text-primary">
          <span className="font-semibold">I'll attach my material in the AI chat</span>
          <span className="block text-xs text-muted-foreground">
            A worksheet, textbook page, passage or word list (PDF, photo or document). The AI reads it and builds the items from it.
          </span>
        </span>
      </label>

      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-semibold text-primary">
          Or type / paste words or notes here (optional)
        </span>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={3}
          placeholder="One word or note per line"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
        />
      </label>

      <div className="mt-5">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-primary">Copy this prompt</p>
          <button
            type="button"
            onClick={() => copyPrompt()}
            className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90"
          >
            {copied ? '✓ Copied' : 'Copy prompt'}
          </button>
        </div>
        {!title.trim() && <p className="mb-1.5 text-xs text-destructive">Type the game title above first so it's included in the prompt.</p>}
        <textarea readOnly value={prompt} rows={8} className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-primary" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="self-center text-xs text-muted-foreground">Copy & open:</span>
          {AI_SHORTCUTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => copyPrompt(s.url)}
              title={`Copies the prompt and opens ${s.label} - paste it there, attach your material, and send`}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-primary hover:border-secondary"
            >
              {s.label} ↗
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-secondary bg-secondary/5 p-3">
        <p className="mb-1 text-sm font-semibold text-primary">Paste the AI's reply here</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Copy the code block the AI sends back (or its whole reply) and paste it. We'll check it instantly.
        </p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={6}
          placeholder={'{ "items": [ { "term": "...", "clue": "..." } ] }'}
          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-secondary"
        />

        {parsed && parsed.errors.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-xs text-destructive">
            {parsed.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {parsed && parsed.items.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold text-secondary">✓ {parsed.items.length} items ready</p>
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card p-2 text-sm">
              {parsed.items.map((it) => (
                <p key={it.id} className="border-b border-border/50 py-1 last:border-0">
                  <b>{it.term}</b> — {it.clue}
                </p>
              ))}
            </div>
          </div>
        )}
        {parsed && parsed.warnings.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-xs text-primary/80">
            {parsed.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
        {pasteText && (
          <button type="button" onClick={() => setPasteText('')} className="mt-2 text-xs font-medium text-muted-foreground underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
