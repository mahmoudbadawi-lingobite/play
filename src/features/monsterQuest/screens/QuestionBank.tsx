import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';
import { listMyContentSets, listPublicContentSets } from '../../../lib/services';
import type { ContentSet } from '../../../types';
import * as api from '../api';
import { QUESTION_TYPES } from '../config';
import { GameButton, Modal, Panel } from '../ui';
import type { BankQuestion, QuestionType } from '../types';

const blank = (): Partial<BankQuestion> => ({ type: 'mcq', subject: 'English', difficulty: 1, xp_reward: 5, active: true, prompt: '', answer: '' });
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const TEMPLATE_COLS = ['type', 'prompt', 'options', 'answer', 'explanation', 'topic', 'subject', 'grade', 'difficulty', 'xp_reward', 'time_limit_s', 'passage', 'tts_text', 'audio_url', 'image_url'];

/** Turn one spreadsheet/JSON row into a bank question, or return an error string. */
function rowToQuestion(r: Record<string, any>): Partial<BankQuestion> | string {
  const type = String(r.type ?? '').trim().toLowerCase() as QuestionType;
  if (!QUESTION_TYPES.some((t) => t.value === type)) return `unknown type "${r.type}"`;
  const prompt = String(r.prompt ?? '').trim();
  if (!prompt) return 'missing prompt';
  const split = (v: any) => String(v ?? '').split('|').map((x) => x.trim()).filter(Boolean);
  const ans = String(r.answer ?? '').trim();
  if (!ans) return 'missing answer';
  let options: any = null, answer: any;
  if (type === 'mcq' || type === 'listening' || type === 'reading') {
    options = split(r.options); if (options.length < 2) return 'needs at least 2 options separated by |';
    if (!options.some((o: string) => o.toLowerCase() === ans.toLowerCase())) return 'answer must match one of the options';
    answer = options.find((o: string) => o.toLowerCase() === ans.toLowerCase());
  } else if (type === 'true_false') {
    if (!/^(true|false)$/i.test(ans)) return 'answer must be True or False';
    answer = /^true$/i.test(ans) ? 'True' : 'False';
  } else if (type === 'sentence_order') {
    answer = ans.split(/\s+/); options = answer; if (answer.length < 2) return 'sentence needs 2+ words';
  } else if (type === 'word_match') {
    const pairs = split(ans).map((p) => p.split('=').map((x) => x.trim()));
    if (pairs.length < 2 || pairs.some((p) => p.length !== 2 || !p[0] || !p[1])) return 'answer must look like  a=b|c=d';
    answer = Object.fromEntries(pairs); options = { left: pairs.map((p) => p[0]) };
    if (new Set(pairs.map((p) => p[1])).size !== pairs.length) return 'each match must be unique';
  } else answer = split(ans);
  const num = (v: any) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const diff = Math.min(5, Math.max(1, num(r.difficulty) ?? 1));
  return {
    type, prompt, options, answer, explanation: String(r.explanation ?? '').trim() || null, topic: String(r.topic ?? '').trim() || null,
    subject: String(r.subject ?? '').trim() || 'English', grade: num(r.grade), difficulty: diff, xp_reward: Math.min(50, Math.max(0, num(r.xp_reward) ?? 5)),
    time_limit_s: num(r.time_limit_s), passage: String(r.passage ?? '').trim() || null, tts_text: String(r.tts_text ?? '').trim() || null,
    audio_url: String(r.audio_url ?? '').trim() || null, image_url: String(r.image_url ?? '').trim() || null, active: true,
  };
}

export function QuestionBank() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<BankQuestion[]>([]);
  const [stats, setStats] = useState<Record<string, { asked: number; correct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<BankQuestion> | null>(null);
  const [q, setQ] = useState(''); const [ft, setFt] = useState<QuestionType | 'all'>('all'); const [fd, setFd] = useState(0);
  const [sets, setSets] = useState<ContentSet[] | null>(null);

  const load = async () => {
    setLoading(true);
    try { const [r, s] = await Promise.all([api.listBankQuestions(), api.questionStats().catch(() => ({}))]); setRows(r); setStats(s); setErr(null); }
    catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const shown = useMemo(() => rows.filter((r) => (ft === 'all' || r.type === ft) && (!fd || r.difficulty === fd) && (!q || r.prompt.toLowerCase().includes(q.toLowerCase()) || (r.topic ?? '').toLowerCase().includes(q.toLowerCase()))), [rows, q, ft, fd]);
  if (!profile) return null;

  const onFile = async (f: File | undefined) => {
    if (!f) return; setErr(null); setInfo(null);
    try {
      let data: Record<string, any>[];
      if (f.name.toLowerCase().endsWith('.json')) { const j = JSON.parse(await f.text()); data = Array.isArray(j) ? j : j.questions ?? []; }
      else { const wb = XLSX.read(await f.arrayBuffer()); data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }
      const ok: Partial<BankQuestion>[] = [], bad: string[] = [];
      data.forEach((r, i) => { const x = rowToQuestion(r); if (typeof x === 'string') bad.push(`Row ${i + 2}: ${x}`); else ok.push(x); });
      if (ok.length) await api.insertBankQuestions(ok, profile.uid);
      setInfo(`Imported ${ok.length} question${ok.length === 1 ? '' : 's'}.${bad.length ? ` Skipped ${bad.length}: ${bad.slice(0, 5).join('; ')}${bad.length > 5 ? '…' : ''}` : ''}`);
      await load();
    } catch (e) { setErr(`Import failed: ${(e as Error).message}`); }
  };
  const template = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLS,
      ['mcq', 'What is the opposite of "hot"?', 'cold|warm|big|fast', 'cold', 'Cold is the opposite of hot.', 'Vocabulary', 'English', 7, 1, 5, '', '', '', '', ''],
      ['fill_blank', 'She ___ to school every day. (go)', '', 'goes', '', 'Grammar', 'English', 7, 2, 6, 20, '', '', '', ''],
      ['spelling', 'Listen and spell the word.', '', 'necessary', '', 'Spelling', 'English', 8, 3, 8, 40, '', 'necessary', '', ''],
      ['sentence_order', 'Put the words in order.', '', 'The dog runs fast', '', 'Grammar', 'English', 6, 1, 6, 40, '', '', '', ''],
      ['word_match', 'Match each word with its meaning.', '', 'tiny=very small|huge=very big', '', 'Vocabulary', 'English', 6, 2, 8, 60, '', '', '', ''],
      ['true_false', 'True or false: "Their" and "there" mean the same.', '', 'False', '', 'Grammar', 'English', 7, 1, 4, 15, '', '', '', '']]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Questions'); XLSX.writeFile(wb, 'monster-quest-questions-template.xlsx');
  };
  const openSets = async () => { setSets([]); setSets([...(await listMyContentSets(profile.uid)), ...(await listPublicContentSets())].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)); };
  const fromSet = async (s: ContentSet) => {
    setSets(null); setErr(null);
    try {
      const items = s.items.filter((i) => i.term && i.clue);
      const terms = Array.from(new Set(items.map((i) => i.term.trim())));
      const out: Partial<BankQuestion>[] = items.map((it, idx) => {
        const wrong = terms.filter((t) => t.toLowerCase() !== it.term.trim().toLowerCase()).sort(() => Math.random() - 0.5).slice(0, 3);
        const useMcq = wrong.length === 3 && idx % 2 === 0;
        return useMcq
          ? { type: 'mcq' as const, prompt: it.clue, options: [it.term.trim(), ...wrong], answer: it.term.trim(), explanation: `${it.term}: ${it.clue}`, topic: s.title, subject: 'English', difficulty: 2, xp_reward: 5, active: true }
          : { type: 'type_answer' as const, prompt: it.clue, answer: [it.term.trim()], topic: s.title, subject: 'English', difficulty: 3, xp_reward: 6, time_limit_s: 40, active: true };
      });
      const n = await api.insertBankQuestions(out, profile.uid);
      setInfo(`Created ${n} questions from "${s.title}".`); await load();
    } catch (e) { setErr((e as Error).message); }
  };
  const remove = async (r: BankQuestion) => { if (!confirm('Delete this question?')) return; try { await api.deleteBankQuestion(r.id); await load(); } catch (e) { setErr((e as Error).message); } };
  const toggle = async (r: BankQuestion) => { try { await api.saveBankQuestion({ id: r.id, active: !r.active }, profile.uid); await load(); } catch (e) { setErr((e as Error).message); } };
  const inp = 'rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#10285a]';

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <GameButton tone="green" onClick={() => setEdit(blank())}>＋ New question</GameButton>
          <label className="mq-btn mq-btn-blue cursor-pointer">⬆ Import (.xlsx / .csv / .json)<input type="file" accept=".xlsx,.xls,.csv,.json" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
          <GameButton tone="ghost" onClick={template}>⬇ Template</GameButton>
          <GameButton tone="ghost" onClick={openSets}>📚 From a Game Library set</GameButton>
        </div>
        <p className="mt-2 text-xs font-semibold text-white/75">Questions you add are used in every student's capture challenges, matched to the monster and zone difficulty. You can edit or delete only your own; admins manage all.</p>
      </Panel>
      {info && <p className="rounded-xl bg-green-600/90 px-3 py-2 text-sm font-bold text-white" role="status">{info}</p>}
      {err && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompt or topic…" aria-label="Search questions" className={`${inp} min-w-[160px] flex-1`} />
        <select value={ft} onChange={(e) => setFt(e.target.value as any)} className={inp} aria-label="Filter by type"><option value="all">All types</option>{QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <select value={fd} onChange={(e) => setFd(+e.target.value)} className={inp} aria-label="Filter by difficulty"><option value={0}>Any difficulty</option>{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Difficulty {d}</option>)}</select>
      </div>

      <Panel className="!p-0 overflow-x-auto">
        {loading ? <p className="p-4 font-bold text-white">Loading…</p> : (
          <table className="w-full min-w-[640px] text-left text-sm text-white">
            <thead className="bg-black/25 text-xs uppercase"><tr><th className="p-2">Question</th><th className="p-2">Type</th><th className="p-2">Topic</th><th className="p-2 text-center">Diff.</th><th className="p-2 text-center">Asked</th><th className="p-2 text-center">Correct</th><th className="p-2" /></tr></thead>
            <tbody>
              {shown.map((r) => { const s = stats[r.id]; const mine = r.created_by === profile.uid || profile.role === 'admin'; return (
                <tr key={r.id} className={`border-t border-white/10 ${r.active ? '' : 'opacity-50'}`}>
                  <td className="max-w-[320px] p-2 font-semibold"><span className="line-clamp-2">{r.prompt}</span></td>
                  <td className="p-2 text-xs">{QUESTION_TYPES.find((t) => t.value === r.type)?.label}</td><td className="p-2 text-xs">{r.topic ?? '–'}</td>
                  <td className="p-2 text-center">{r.difficulty}</td><td className="p-2 text-center">{s?.asked ?? 0}</td><td className="p-2 text-center">{s?.asked ? `${Math.round((s.correct / s.asked) * 100)}%` : '–'}</td>
                  <td className="whitespace-nowrap p-2 text-right">{mine && (<><button className="mr-2 font-bold text-yellow-300 hover:underline" onClick={() => setEdit(r)}>Edit</button><button className="mr-2 font-bold text-sky-300 hover:underline" onClick={() => toggle(r)}>{r.active ? 'Hide' : 'Show'}</button><button className="font-bold text-red-300 hover:underline" onClick={() => remove(r)}>Delete</button></>)}</td>
                </tr>); })}
              {shown.length === 0 && <tr><td colSpan={7} className="p-4 text-center font-bold text-white/80">No questions found.</td></tr>}
            </tbody>
          </table>)}
      </Panel>
      <p className="text-xs font-semibold text-white/60">Showing {shown.length} of {rows.length}. Students never see answers in their browser; answers are checked on the server.</p>

      {edit && <QuestionForm initial={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} userId={profile.uid} />}
      {sets && (
        <Modal onClose={() => setSets(null)}>
          <p className="font-display text-lg font-extrabold text-[#10285a]">Create questions from a Game Library set</p>
          <p className="mt-1 text-xs text-[#3d5a94]">Each term becomes a question: the clue is the prompt, the term is the answer (alternating multiple-choice and type-the-answer).</p>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {sets.length === 0 && <p className="text-sm font-bold text-[#3d5a94]">Loading…</p>}
            {sets.map((s) => <button key={s.id} type="button" onClick={() => fromSet(s)} className="flex w-full items-center justify-between rounded-xl bg-[#eaf2ff] px-3 py-2 text-left hover:bg-[#d6e6ff]"><span className="font-bold text-[#10285a]">{s.title}</span><span className="text-xs font-bold text-[#3d5a94]">{s.items.length} items</span></button>)}
          </div>
          <GameButton tone="blue" className="mt-3 w-full" onClick={() => setSets(null)}>Cancel</GameButton>
        </Modal>)}
    </div>
  );
}

function QuestionForm({ initial, onClose, onSaved, userId }: { initial: Partial<BankQuestion>; onClose: () => void; onSaved: () => void; userId: string }) {
  const [f, setF] = useState<Partial<BankQuestion>>(initial);
  const [optText, setOptText] = useState(Array.isArray(initial.options) ? initial.options.join('\n') : initial.options?.left && initial.answer ? '' : '');
  const [ansText, setAnsText] = useState(() => {
    const a: any = initial.answer;
    if (initial.type === 'word_match' && a && typeof a === 'object') return Object.entries(a).map(([k, v]) => `${k} = ${v}`).join('\n');
    if (Array.isArray(a)) return initial.type === 'sentence_order' ? a.join(' ') : a.join('\n');
    return typeof a === 'string' ? a : '';
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const t = f.type as QuestionType;
  const set = (p: Partial<BankQuestion>) => setF({ ...f, ...p });
  const inp = 'w-full rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#10285a]';
  const lab = 'mt-2 block text-xs font-extrabold uppercase text-[#3d5a94]';

  const save = async () => {
    setErr(null);
    if (!f.prompt?.trim()) return setErr('Write the question first.');
    let options: any = null, answer: any;
    if (t === 'mcq' || t === 'listening' || t === 'reading') {
      options = lines(optText); if (options.length < 2) return setErr('Add at least 2 options (one per line).');
      const a = options.find((o: string) => o.toLowerCase() === ansText.trim().toLowerCase()); if (!a) return setErr('Pick the correct option.'); answer = a;
    } else if (t === 'true_false') { if (!/^(true|false)$/i.test(ansText.trim())) return setErr('Choose True or False.'); answer = /^true$/i.test(ansText.trim()) ? 'True' : 'False'; }
    else if (t === 'sentence_order') { answer = ansText.trim().split(/\s+/).filter(Boolean); if (answer.length < 2) return setErr('Type the correct sentence (2+ words).'); options = answer; }
    else if (t === 'word_match') {
      const pairs = lines(ansText).map((l) => l.split('=').map((x) => x.trim()));
      if (pairs.length < 2 || pairs.some((p) => p.length !== 2 || !p[0] || !p[1])) return setErr('Write pairs like  tiny = very small  (one per line, at least 2).');
      answer = Object.fromEntries(pairs); options = { left: pairs.map((p) => p[0]) };
    } else { answer = lines(ansText); if (!answer.length) return setErr('Add at least one accepted answer.'); }
    setSaving(true);
    try {
      await api.saveBankQuestion({ ...f, options, answer, prompt: f.prompt!.trim(), difficulty: f.difficulty ?? 1, xp_reward: f.xp_reward ?? 5, subject: f.subject || 'English',
        passage: f.passage || null, topic: f.topic || null, explanation: f.explanation || null, image_url: f.image_url || null, audio_url: f.audio_url || null, tts_text: f.tts_text || null,
        grade: f.grade ?? null, time_limit_s: f.time_limit_s ?? null }, userId);
      onSaved();
    } catch (e) { setErr((e as Error).message); setSaving(false); }
  };
  const optionList = lines(optText);

  return (
    <Modal onClose={onClose} wide>
      <p className="font-display text-lg font-extrabold text-[#10285a]">{f.id ? 'Edit question' : 'New question'}</p>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <label className={lab}>Type</label>
        <select value={t} onChange={(e) => { set({ type: e.target.value as QuestionType }); setAnsText(''); }} className={inp}>{QUESTION_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
        <label className={lab}>Question / instruction</label><textarea value={f.prompt ?? ''} onChange={(e) => set({ prompt: e.target.value })} rows={2} className={inp} />
        {t === 'reading' && (<><label className={lab}>Reading passage</label><textarea value={f.passage ?? ''} onChange={(e) => set({ passage: e.target.value })} rows={4} className={inp} /></>)}
        {(t === 'listening' || t === 'spelling') && (<>
          <label className={lab}>Text to speak (browser voice){t === 'spelling' ? ' — this is the word to spell' : ''}</label><input value={f.tts_text ?? ''} onChange={(e) => set({ tts_text: e.target.value })} className={inp} />
          <label className={lab}>…or audio file URL (optional)</label><input value={f.audio_url ?? ''} onChange={(e) => set({ audio_url: e.target.value })} placeholder="https://…" className={inp} /></>)}
        {(t === 'mcq' || t === 'listening' || t === 'reading') && (<>
          <label className={lab}>Options (one per line)</label><textarea value={optText} onChange={(e) => setOptText(e.target.value)} rows={4} className={inp} />
          <label className={lab}>Correct option</label><select value={ansText} onChange={(e) => setAnsText(e.target.value)} className={inp}><option value="">Choose…</option>{optionList.map((o) => <option key={o} value={o}>{o}</option>)}</select></>)}
        {t === 'true_false' && (<><label className={lab}>Correct answer</label><select value={ansText} onChange={(e) => setAnsText(e.target.value)} className={inp}><option value="">Choose…</option><option>True</option><option>False</option></select></>)}
        {(t === 'fill_blank' || t === 'spelling' || t === 'type_answer') && (<><label className={lab}>Accepted answers (one per line)</label><textarea value={ansText} onChange={(e) => setAnsText(e.target.value)} rows={2} className={inp} /></>)}
        {t === 'sentence_order' && (<><label className={lab}>Correct sentence (students get the words shuffled)</label><input value={ansText} onChange={(e) => setAnsText(e.target.value)} className={inp} /></>)}
        {t === 'word_match' && (<><label className={lab}>Pairs (one per line:  word = match)</label><textarea value={ansText} onChange={(e) => setAnsText(e.target.value)} rows={4} className={inp} /></>)}
        <label className={lab}>Explanation shown after answering</label><input value={f.explanation ?? ''} onChange={(e) => set({ explanation: e.target.value })} className={inp} />
        <label className={lab}>Image URL (optional)</label><input value={f.image_url ?? ''} onChange={(e) => set({ image_url: e.target.value })} className={inp} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div><label className={lab}>Subject</label><input value={f.subject ?? ''} onChange={(e) => set({ subject: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Topic</label><input value={f.topic ?? ''} onChange={(e) => set({ topic: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Grade (optional)</label><input type="number" min={1} max={12} value={f.grade ?? ''} onChange={(e) => set({ grade: e.target.value ? +e.target.value : null })} className={inp} /></div>
          <div><label className={lab}>Difficulty (1–5)</label><select value={f.difficulty ?? 1} onChange={(e) => set({ difficulty: +e.target.value })} className={inp}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label className={lab}>XP reward</label><input type="number" min={0} max={50} value={f.xp_reward ?? 5} onChange={(e) => set({ xp_reward: +e.target.value })} className={inp} /></div>
          <div><label className={lab}>Timer (seconds)</label><input type="number" min={5} value={f.time_limit_s ?? ''} onChange={(e) => set({ time_limit_s: e.target.value ? +e.target.value : null })} placeholder="none" className={inp} /></div>
        </div>
      </div>
      {err && <p className="mt-2 rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={onClose}>Cancel</GameButton><GameButton tone="green" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save question'}</GameButton></div>
    </Modal>
  );
}
