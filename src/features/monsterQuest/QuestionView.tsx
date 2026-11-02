import { useEffect, useRef, useState } from 'react';
import type { Question } from './types';
import { sfx, speak } from './sound';
import { GameButton } from './ui';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const PAIR_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444'];

export function playQuestionAudio(q: Question) {
  if (q.audio_url) { void new Audio(q.audio_url).play().catch(() => undefined); return true; }
  if (q.tts_text) return speak(q.tts_text);
  return false;
}

/** Renders any question type. Calls onSubmit once with the player's answer (never knows the right answer). */
export function QuestionView({ q, onSubmit, busy }: { q: Question; onSubmit: (answer: unknown) => void; busy: boolean }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [chosen, setChosen] = useState<number[]>([]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(q.time_limit_s);
  const sent = useRef(false);
  const latest = useRef<unknown>(null);

  const isChoice = q.type === 'mcq' || q.type === 'true_false' || q.type === 'listening' || q.type === 'reading';
  const isTyped = q.type === 'fill_blank' || q.type === 'spelling' || q.type === 'type_answer';
  const words: string[] = q.type === 'sentence_order' ? (q.options ?? []) : [];
  const left: string[] = q.type === 'word_match' ? (q.options?.left ?? []) : [];
  const right: string[] = q.type === 'word_match' ? (q.options?.right ?? []) : [];

  const send = (answer: unknown) => { if (sent.current) return; sent.current = true; onSubmit(answer); };

  latest.current = isTyped ? text : q.type === 'sentence_order' ? chosen.map((i) => words[i]) : q.type === 'word_match' ? pairs : picked;

  // countdown (the server also enforces the limit with some grace)
  useEffect(() => {
    if (q.time_limit_s == null) return;
    const end = Date.now() + q.time_limit_s * 1000;
    const id = window.setInterval(() => {
      const r = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) { window.clearInterval(id); send(latest.current ?? null); }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  useEffect(() => {
    if (q.type === 'listening' || q.type === 'spelling') { const t = window.setTimeout(() => playQuestionAudio(q), 350); return () => window.clearTimeout(t); }
  }, [q]);

  const disabled = busy || sent.current;
  const canListen = (q.type === 'listening' || q.type === 'spelling') && (q.audio_url || q.tts_text);

  return (
    <div className="mx-auto w-full max-w-xl">
      {remaining != null && (
        <div className="mb-2 flex items-center gap-2" aria-live="off">
          <span className="text-xs font-extrabold text-white/80">⏱ {remaining}s</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(remaining / (q.time_limit_s || 1)) * 100}%`, background: remaining <= 5 ? '#ef4444' : '#facc15' }} /></div>
        </div>
      )}
      <div className="mq-bubble">
        <p className="text-base font-bold leading-snug text-[#10285a] sm:text-lg">{q.prompt}</p>
        {q.image_url && <img src={q.image_url} alt="" className="mx-auto mt-3 max-h-40 rounded-xl object-contain" />}
        {q.passage && <p className="mt-3 rounded-xl bg-[#eaf2ff] p-3 text-sm leading-relaxed text-[#1d3b6e]">{q.passage}</p>}
        {canListen && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => playQuestionAudio(q)} className="rounded-full bg-[#1c7ed6] px-4 py-1.5 text-sm font-bold text-white shadow">🔊 Play</button>
            {!q.audio_url && q.tts_text && <button type="button" onClick={() => speak(q.tts_text!, 0.55)} className="rounded-full bg-[#74a7e8] px-4 py-1.5 text-sm font-bold text-white shadow">🐢 Slow</button>}
          </div>
        )}
      </div>

      {isChoice && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {(q.options as string[]).map((o, i) => (
            <button key={o + i} type="button" disabled={disabled} onClick={() => { sfx.click(); setPicked(o); send(o); }}
              className={`mq-choice ${picked === o ? 'is-picked' : ''}`}>
              <span className="mq-choice-key">{LETTERS[i]}</span><span className="text-left">{o}</span>
            </button>
          ))}
        </div>
      )}

      {isTyped && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim() && !disabled) send(text.trim()); }}>
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} autoComplete="off" autoCapitalize="off" spellCheck={false}
            placeholder="Type your answer…" aria-label="Your answer" className="min-w-0 flex-1 rounded-2xl border-4 border-[#1b4fb3] bg-white px-4 py-3 text-lg font-bold text-[#10285a] outline-none focus:border-[#facc15]" />
          <GameButton type="submit" tone="green" disabled={disabled || !text.trim()}>Go</GameButton>
        </form>
      )}

      {q.type === 'sentence_order' && (
        <div className="mt-3">
          <div className="min-h-[56px] rounded-2xl border-4 border-dashed border-[#1b4fb3] bg-white/90 p-2" aria-label="Your sentence">
            <div className="flex flex-wrap gap-2">
              {chosen.map((wi, pos) => (
                <button key={pos} type="button" disabled={disabled} onClick={() => { sfx.click(); setChosen(chosen.filter((_, p) => p !== pos)); }} className="mq-chip bg-[#facc15] text-[#10285a]">{words[wi]}</button>
              ))}
              {chosen.length === 0 && <span className="px-2 py-1 text-sm font-semibold text-[#6b83b3]">Tap the words in order…</span>}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {words.map((w, i) => !chosen.includes(i) && (
              <button key={i} type="button" disabled={disabled} onClick={() => { sfx.click(); setChosen([...chosen, i]); }} className="mq-chip bg-white text-[#10285a]">{w}</button>
            ))}
          </div>
          <GameButton className="mt-3 w-full" tone="green" disabled={disabled || chosen.length !== words.length} onClick={() => send(chosen.map((i) => words[i]))}>Check sentence</GameButton>
        </div>
      )}

      {q.type === 'word_match' && (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              {left.map((l) => {
                const pairIdx = pairs[l] != null ? left.indexOf(l) : -1;
                return (
                  <button key={l} type="button" disabled={disabled} onClick={() => { sfx.click(); setSelLeft(l === selLeft ? null : l); }}
                    className="mq-chip w-full justify-center" style={{ background: pairIdx >= 0 ? PAIR_COLORS[pairIdx % 6] : selLeft === l ? '#facc15' : '#fff', color: pairIdx >= 0 ? '#fff' : '#10285a' }}>{l}</button>
                );
              })}
            </div>
            <div className="space-y-2">
              {right.map((r) => {
                const owner = Object.keys(pairs).find((k) => pairs[k] === r);
                return (
                  <button key={r} type="button" disabled={disabled || (!selLeft && !owner)} onClick={() => {
                    sfx.click();
                    if (selLeft) { const next = { ...pairs }; for (const k of Object.keys(next)) if (next[k] === r) delete next[k]; next[selLeft] = r; setPairs(next); setSelLeft(null); }
                    else if (owner) { const next = { ...pairs }; delete next[owner]; setPairs(next); }
                  }} className="mq-chip w-full justify-center text-center" style={{ background: owner ? PAIR_COLORS[left.indexOf(owner) % 6] : '#fff', color: owner ? '#fff' : '#10285a' }}>{r}</button>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-white/80">Tap a word on the left, then its match on the right. Tap a matched card to undo.</p>
          <GameButton className="mt-2 w-full" tone="green" disabled={disabled || Object.keys(pairs).length !== left.length} onClick={() => send(pairs)}>Check matches</GameButton>
        </div>
      )}
    </div>
  );
}

export function formatCorrectAnswer(type: string, a: any): string {
  if (a == null) return '';
  if (Array.isArray(a)) return type === 'sentence_order' ? a.join(' ') : a[0];
  if (typeof a === 'object') return Object.entries(a).map(([k, v]) => `${k} → ${v}`).join('  •  ');
  return String(a);
}
