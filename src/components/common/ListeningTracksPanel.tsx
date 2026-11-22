import { useMemo, useState } from 'react';
import type { ContentItem } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { isArabicText } from '../../lib/arabicText';
import { tr } from '../../i18n/tr';

const MAX_MB = 8;

function buildScript(items: ContentItem[], arabic: boolean): string {
  const list = items.map((it, i) => `${i + 1}. ${it.audio}`).join('\n');
  return arabic
    ? [
        'حوّل كل نص مرقّم أدناه إلى ملف صوتي منفصل بصوت بشري طبيعي وواضح.',
        '• اللغة: العربية الفصحى، بنطق سليم ومخارج واضحة، وبسرعة هادئة مناسبة للأطفال (أبطأ قليلاً من الكلام العادي).',
        '• الصوت: معلّم/معلّمة ودود، بنبرة دافئة ومن غير مبالغة في التمثيل.',
        '• لا تقرأ الأرقام ولا أي مقدمة أو تعليق: اقرأ نص كل مقطع فقط.',
        '• أنشئ ملفاً واحداً لكل رقم (MP3 أو WAV) وسمِّه بالرقم: 01 و02 و03 …',
        '• اترك صمتاً قصيراً (نحو نصف ثانية) في بداية كل ملف ونهايته.',
        '',
        'النصوص:',
        list,
      ].join('\n')
    : [
        'Turn each numbered text below into its own separate audio file, spoken by a natural, clear human-sounding voice.',
        '• Language: English, standard accent, calm school-friendly pace (slightly slower than normal speech).',
        '• Voice: a friendly teacher, warm tone, no over-acting.',
        '• Do NOT read the numbers or add any intro or comment: read only the text of each chunk.',
        '• Create ONE file per number (MP3 or WAV) and name it with that number: 01, 02, 03 …',
        '• Leave about half a second of silence at the start and end of each file.',
        '',
        'Texts:',
        list,
      ].join('\n');
}

/** Lets a teacher attach recorded voice tracks to listening items (instead of the device's robotic voice). */
export function ListeningTracksPanel({ items, onChange }: { items: ContentItem[]; onChange: (items: ContentItem[]) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const listening = useMemo(() => items.filter((i) => i.audio), [items]);
  if (listening.length === 0) return null;
  const arabic = listening.some((i) => isArabicText(i.audio ?? ''));
  const done = listening.filter((i) => i.audioUrl).length;

  const setUrl = (id: string, url: string | undefined) =>
    onChange(items.map((it) => (it.id === id ? { ...it, audioUrl: url } : it)));

  const uploadOne = async (id: string, file: File) => {
    setMsg('');
    if (file.size > MAX_MB * 1024 * 1024) return setMsg(tr('That file is larger than {n} MB.', { n: MAX_MB }));
    setBusy(id);
    try { setUrl(id, await uploadToCloudinary(file, 'video')); }
    catch (e) { setMsg(e instanceof Error ? e.message : tr('Upload failed')); }
    setBusy(null);
  };

  const uploadMany = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMsg('');
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (sorted.length !== listening.length) setMsg(tr('You chose {f} files for {n} items. They are matched in file-name order.', { f: sorted.length, n: listening.length }));
    setBusy('all');
    const next = [...items];
    try {
      for (let k = 0; k < Math.min(sorted.length, listening.length); k++) {
        if (sorted[k].size > MAX_MB * 1024 * 1024) { setMsg(tr('That file is larger than {n} MB.', { n: MAX_MB })); continue; }
        const url = await uploadToCloudinary(sorted[k], 'video');
        const idx = next.findIndex((it) => it.id === listening[k].id);
        if (idx >= 0) next[idx] = { ...next[idx], audioUrl: url };
        onChange([...next]);
      }
    } catch (e) { setMsg(e instanceof Error ? e.message : tr('Upload failed')); }
    setBusy(null);
  };

  const script = buildScript(listening, arabic);
  const copy = async () => { try { await navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };

  return (
    <div className="card-surface mt-4 p-4">
      <h3 className="font-display text-lg font-semibold text-primary">🎙 {tr('Listening voice tracks (optional)')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {tr('Without a track, the device reads the text aloud with its own voice, which can sound robotic. For a natural voice, make one audio file per chunk with an AI voice tool and upload them here.')}
      </p>

      <details className="mt-3 rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">{tr('Step 1 · Copy this prompt into your AI voice tool')}</summary>
        <p className="mt-2 text-xs text-muted-foreground">
          {tr('Use a tool that can download audio files, for example Google AI Studio (Generate speech with Gemini), ElevenLabs, or TTSMaker. A normal chat reply cannot be saved as an audio file.')}
        </p>
        <textarea readOnly value={script} dir="auto" rows={8} className="mt-2 w-full rounded-lg border border-border bg-muted/40 p-2 text-xs" />
        <button type="button" onClick={copy} className="mt-2 rounded-lg bg-secondary px-3 py-1.5 text-sm font-semibold text-secondary-foreground">
          {copied ? tr('Copied') : tr('Copy this prompt')}
        </button>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          {busy === 'all' ? tr('Uploading...') : tr('Step 2 · Upload all files at once')}
          <input type="file" accept="audio/*" multiple hidden disabled={!!busy} onChange={(e) => { void uploadMany(e.target.files); e.target.value = ''; }} />
        </label>
        <span className="text-xs text-muted-foreground">{tr('Name the files 01, 02, 03… so they match the numbers. {d} of {n} items have a track.', { d: done, n: listening.length })}</span>
      </div>
      {msg && <p className="mt-2 text-sm text-destructive">{msg}</p>}

      <ol className="mt-3 space-y-2">
        {listening.map((it, i) => (
          <li key={it.id} className="rounded-lg border border-border p-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-bold text-secondary">{i + 1}.</span>
              <p dir="auto" className="flex-1 text-primary">{it.audio}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {it.audioUrl && <audio controls src={it.audioUrl} className="h-8" />}
              <label className="cursor-pointer rounded-md border border-border px-2 py-1 text-xs font-semibold text-primary hover:border-secondary">
                {busy === it.id ? tr('Uploading...') : it.audioUrl ? tr('Replace') : tr('Upload')}
                <input type="file" accept="audio/*" hidden disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadOne(it.id, f); e.target.value = ''; }} />
              </label>
              {it.audioUrl && <button type="button" onClick={() => setUrl(it.id, undefined)} className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">{tr('Remove')}</button>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
