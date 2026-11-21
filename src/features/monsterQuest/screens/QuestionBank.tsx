import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';
import { listMyClasses, listMyContentSets, listPublicContentSets } from '../../../lib/services';
import type { ContentSet, SchoolClass } from '../../../types';
import * as api from '../api';
import { QUESTION_TYPES } from '../config';
import { ConfirmDialog, GameButton, Modal, Panel } from '../ui';
import type { BankQuestion, QuestionType } from '../types';
import { useSubjects } from '../../subjects/useSubjects';
import { SubjectSkillPicker } from '../../subjects/SubjectSkillPicker';
import { COGNITIVE_LEVELS, picksToArrays, picksToTags, rowToPicks, type Picks } from '../../subjects/types';

const blank = (audience: string[] = []): Partial<BankQuestion> => ({ type: 'mcq', subject: 'English', difficulty: 1, xp_reward: 5, active: true, prompt: '', answer: '', ...(audience.length ? { class_ids: audience } : {}) });
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
const TEMPLATE_COLS = ['type', 'prompt', 'options', 'answer', 'explanation', 'topic', 'subject', 'grade', 'difficulty', 'xp_reward', 'time_limit_s', 'passage', 'tts_text', 'audio_url', 'image_url', 'skill_id'];

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

/** Choose who gets a question: everyone, or one or more of the teacher's classes. */
function AudiencePicker({ classes, value, onChange, light }: { classes: SchoolClass[]; value: string[]; onChange: (v: string[]) => void; light?: boolean }) {
  const on = light ? 'border-[#1b4fb3] bg-[#1b4fb3] text-white' : 'border-yellow-300 bg-yellow-300 text-[#10285a]';
  const off = light ? 'border-[#1b4fb3] bg-white text-[#10285a]' : 'border-white/40 bg-white/10 text-white';
  const chip = (active: boolean) => `rounded-full border-2 px-3 py-1 text-xs font-extrabold ${active ? on : off}`;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Who gets these questions">
      <button type="button" className={chip(value.length === 0)} aria-pressed={value.length === 0} onClick={() => onChange([])}>🌍 Everyone</button>
      {classes.map((c) => <button key={c.id} type="button" className={chip(value.includes(c.id))} aria-pressed={value.includes(c.id)} onClick={() => toggle(c.id)}>{c.name} · {c.studentIds.length}</button>)}
      {classes.length === 0 && <span className="text-xs font-semibold opacity-70">Create a class under My Classes to aim questions at it.</span>}
    </div>
  );
}

export function QuestionBank() {
  const { profile } = useAuth();
  const subj = useSubjects();
  const [rows, setRows] = useState<BankQuestion[]>([]);
  const [stats, setStats] = useState<Record<string, { asked: number; correct: number }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<BankQuestion> | null>(null);
  const [askBulkDel, setAskBulkDel] = useState(false);
  const [byClass, setByClass] = useState<{ all: boolean; picked: string[] } | null>(null);   // 'Delete by class' dialog
  const [askDel, setAskDel] = useState<BankQuestion | null>(null);
  const [q, setQ] = useState(''); const [ft, setFt] = useState<QuestionType | 'all'>('all'); const [fd, setFd] = useState(0);
  const [sets, setSets] = useState<ContentSet[] | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [newAudience, setNewAudience] = useState<string[]>([]);   // audience for new / imported / generated questions
  const [fs, setFs] = useState('all');                          // subject filter
  const [fa, setFa] = useState<string>('all');                    // audience filter: all | everyone | <class id>
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState(false);
  const [bulkAud, setBulkAud] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try { const [r, s] = await Promise.all([api.listBankQuestions(), api.questionStats().catch(() => ({}))]); setRows(r); setStats(s); setErr(null); }
    catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (profile?.uid) void listMyClasses(profile.uid).then(setClasses); }, [profile?.uid]);
  // false until monster_quest_teacher_stage1.sql has been run (the column does not exist yet)
  const targeting = rows.length === 0 || Array.isArray(rows[0].class_ids);
  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const audienceOf = (r: BankQuestion) => (r.class_ids?.length ? r.class_ids.map((id) => classById.get(id) ?? 'Another class').join(', ') : 'Everyone');

  const shown = useMemo(() => rows.filter((r) => (ft === 'all' || r.type === ft) && (!fd || r.difficulty === fd) && (fs === 'all' || r.subject_id === fs) && (fa === 'all' || (fa === 'everyone' ? !r.class_ids?.length : (r.class_ids ?? []).includes(fa))) && (!q || r.prompt.toLowerCase().includes(q.toLowerCase()) || (r.topic ?? '').toLowerCase().includes(q.toLowerCase()))), [rows, q, ft, fd, fa, fs]);
  if (!profile) return null;

  /** Adds the chosen audience (only when one is chosen, so everything keeps working before the SQL update is run). */
  const withAudience = (list: Partial<BankQuestion>[]) => (targeting && newAudience.length ? list.map((x) => ({ ...x, class_ids: newAudience })) : list);
  const isMine = (r: BankQuestion) => r.created_by === profile.uid || profile.role === 'admin';
  const mineShown = shown.filter(isMine);
  const allSelected = mineShown.length > 0 && mineShown.every((r) => sel.has(r.id));
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const applyBulk = async () => {
    setBulk(false); setErr(null);
    try { const n = await api.setQuestionAudience([...sel], bulkAud); setInfo(`Updated the audience of ${n} question${n === 1 ? '' : 's'}.`); setSel(new Set()); await load(); }
    catch (e) { setErr((e as Error).message); }
  };
  /** Subject tags for imported questions. Returns an error text when the subject is not one the user may use. Skipped (no tags) until the subjects SQL has been run. */
  const tagFor = (named: string | null | undefined, hint?: { subjectId?: string | null; skillIds?: string[]; domainIds?: string[] }): Partial<BankQuestion> | string => {
    if (!subj.ready) return {};
    const want = (named ?? '').trim().toLowerCase();
    const sub = (hint?.subjectId && subj.allowed.find((x) => x.id === hint.subjectId)) || subj.allowed.find((x) => x.id.toLowerCase() === want || x.name.toLowerCase() === want)
      || (!want && subj.allowed.length === 1 ? subj.allowed[0] : undefined);
    if (!sub) return want ? `you are not approved for the subject "${named}"` : 'choose a subject in the subject column';
    const sameSub = hint?.subjectId === sub.id;
    const p: Picks = { subjectId: sub.id, domainIds: sameSub ? hint?.domainIds ?? [] : [], skillIds: sameSub ? hint?.skillIds ?? [] : [] };
    const t = picksToTags(p, sub);
    return { subject: sub.name, subject_id: sub.id, domain_id: t.domainId, skill_id: t.skillId, ...(subj.multi ? { domain_ids: picksToArrays(p, sub).domainIds, skill_ids: p.skillIds } : {}) };
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return; setErr(null); setInfo(null);
    try {
      let data: Record<string, any>[];
      if (f.name.toLowerCase().endsWith('.json')) { const j = JSON.parse(await f.text()); data = Array.isArray(j) ? j : j.questions ?? []; }
      else { const wb = XLSX.read(await f.arrayBuffer()); data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }); }
      const ok: Partial<BankQuestion>[] = [], bad: string[] = [];
      data.forEach((r, i) => {
        const x = rowToQuestion(r); if (typeof x === 'string') return void bad.push(`Row ${i + 2}: ${x}`);
        const sks = String(r.skill_id ?? '').split(/[|,;]/).map((z) => z.trim()).filter(Boolean); const sd = sks.length ? subj.subjects.find((z) => z.domains.some((d) => d.skills.some((k) => k.id === sks[0]))) : undefined;
        const tg = tagFor(String(r.subject ?? '') || null, sd ? { subjectId: sd.id, skillIds: sks.filter((k) => sd.domains.some((d) => d.skills.some((z) => z.id === k))) } : undefined);
        if (typeof tg === 'string') bad.push(`Row ${i + 2}: ${tg}`); else ok.push({ ...x, ...tg });
      });
      if (ok.length) await api.insertBankQuestions(withAudience(ok), profile.uid);
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
      const tg = tagFor(null, { subjectId: s.subjectId, domainIds: s.domainIds?.length ? s.domainIds : s.domainId ? [s.domainId] : [], skillIds: s.skillIds?.length ? s.skillIds : s.skillId ? [s.skillId] : [] }); if (typeof tg === 'string') return setErr(tg.replace('choose a subject in the subject column', 'Choose a subject for this set first, or ask an admin to approve one for you.'));
      const out: Partial<BankQuestion>[] = items.map((it, idx) => {
        const wrong = terms.filter((t) => t.toLowerCase() !== it.term.trim().toLowerCase()).sort(() => Math.random() - 0.5).slice(0, 3);
        const useMcq = wrong.length === 3 && idx % 2 === 0;
        return useMcq
          ? { type: 'mcq' as const, prompt: it.clue, options: [it.term.trim(), ...wrong], answer: it.term.trim(), explanation: `${it.term}: ${it.clue}`, topic: s.title, subject: 'English', ...tg, difficulty: 2, xp_reward: 5, active: true }
          : { type: 'type_answer' as const, prompt: it.clue, answer: [it.term.trim()], topic: s.title, subject: 'English', ...tg, difficulty: 3, xp_reward: 6, time_limit_s: 40, active: true };
      });
      const n = await api.insertBankQuestions(withAudience(out), profile.uid);
      setInfo(`Created ${n} questions from "${s.title}".`); await load();
    } catch (e) { setErr((e as Error).message); }
  };
  /** What the 'Delete by class' dialog would do. Only the teacher's own questions. A question also aimed at a class that is NOT chosen is kept. */
  const byClassPlan = () => {
    const mine = rows.filter((x) => x.created_by === profile.uid);
    if (!byClass) return { del: [] as BankQuestion[], kept: [] as BankQuestion[] };
    if (byClass.all) return { del: mine, kept: [] as BankQuestion[] };
    const del: BankQuestion[] = [], kept: BankQuestion[] = [];
    for (const x of mine) {
      const aud = x.class_ids ?? [];
      if (!aud.length) { if (byClass.picked.includes('everyone')) del.push(x); continue; }
      if (aud.every((id) => byClass.picked.includes(id))) del.push(x); else if (aud.some((id) => byClass.picked.includes(id))) kept.push(x);
    }
    return { del, kept };
  };
  const deleteByClass = async () => {
    const { del } = byClassPlan(); setByClass(null); setErr(null); setInfo(null);
    let done = 0; const failed: string[] = [];
    for (const x of del) { try { await api.deleteBankQuestion(x.id); done++; } catch (e) { failed.push((e as Error).message); } }
    setSel(new Set());
    setInfo(`Deleted ${done} question${done === 1 ? '' : 's'}.${failed.length ? ` ${failed.length} could not be deleted: ${failed[0]}` : ''}`);
    await load();
  };
  const removeSelected = async () => {
    setAskBulkDel(false); setErr(null); setInfo(null);
    const ids = [...sel].filter((id) => { const r = rows.find((x) => x.id === id); return r && isMine(r); });
    let done = 0; const failed: string[] = [];
    for (const id of ids) { try { await api.deleteBankQuestion(id); done++; } catch (e) { failed.push((e as Error).message); } }
    setSel(new Set());
    setInfo(`Deleted ${done} question${done === 1 ? '' : 's'}.${failed.length ? ` ${failed.length} could not be deleted: ${failed[0]}` : ''}`);
    await load();
  };
  const remove = async (r: BankQuestion) => { setAskDel(null); try { await api.deleteBankQuestion(r.id); await load(); } catch (e) { setErr((e as Error).message); } };
  const toggle = async (r: BankQuestion) => { try { await api.saveBankQuestion({ id: r.id, active: !r.active }, profile.uid); await load(); } catch (e) { setErr((e as Error).message); } };
  const inp = 'rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#10285a]';

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <GameButton tone="green" onClick={() => setEdit(blank(targeting ? newAudience : []))}>＋ New question</GameButton>
          <label className="mq-btn mq-btn-blue cursor-pointer">⬆ Import (.xlsx / .csv / .json)<input type="file" accept=".xlsx,.xls,.csv,.json" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
          <GameButton tone="ghost" onClick={template}>⬇ Template</GameButton>
          <GameButton tone="red" onClick={() => setByClass({ all: false, picked: [] })}>🗑 Delete by class…</GameButton>
          <GameButton tone="ghost" onClick={openSets}>📚 From a Game Library set</GameButton>
        </div>
        {targeting && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-extrabold uppercase text-white/80">New, imported and generated questions go to</p>
            <AudiencePicker classes={classes} value={newAudience} onChange={setNewAudience} />
          </div>)}
        <p className="mt-2 text-xs font-semibold text-white/75">Students get questions in capture challenges, training and special attacks, matched to the monster and zone difficulty. A question aimed at classes is only asked to students in those classes; "Everyone" questions go to all students. You can edit or delete only your own; admins manage all.</p>
      </Panel>
      {!targeting && <p className="rounded-xl bg-yellow-500/90 px-3 py-2 text-sm font-bold text-[#10285a]" role="status">Class targeting is not switched on yet: run supabase/monster_quest_teacher_stage1.sql in the Supabase SQL editor, then reload.</p>}
      {info && <p className="rounded-xl bg-green-600/90 px-3 py-2 text-sm font-bold text-white" role="status">{info}</p>}
      {err && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prompt or topic…" aria-label="Search questions" className={`${inp} min-w-[160px] flex-1`} />
        <select value={ft} onChange={(e) => setFt(e.target.value as any)} className={inp} aria-label="Filter by type"><option value="all">All types</option>{QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <select value={fd} onChange={(e) => setFd(+e.target.value)} className={inp} aria-label="Filter by difficulty"><option value={0}>Any difficulty</option>{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Difficulty {d}</option>)}</select>
        {subj.ready && subj.allowed.length > 1 && <select value={fs} onChange={(e) => setFs(e.target.value)} className={inp} aria-label="Filter by subject"><option value="all">All subjects</option>{subj.allowed.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}
        {targeting && <select value={fa} onChange={(e) => setFa(e.target.value)} className={inp} aria-label="Filter by audience"><option value="all">Any audience</option><option value="everyone">Everyone</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      </div>
      {sel.size > 0 && (
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-white">{sel.size} selected</span>
            {targeting && <GameButton tone="blue" onClick={() => { setBulkAud([]); setBulk(true); }}>🎯 Set audience…</GameButton>}
            <GameButton tone="red" onClick={() => setAskBulkDel(true)}>🗑 Delete {sel.size}…</GameButton>
            <GameButton tone="ghost" onClick={() => setSel(new Set())}>Clear</GameButton>
          </div>
        </Panel>)}

      <Panel className="!p-0 overflow-x-auto">
        {loading ? <p className="p-4 font-bold text-white">Loading…</p> : (
          <table className="w-full min-w-[640px] text-left text-sm text-white">
            <thead className="bg-black/25 text-xs uppercase"><tr><th className="w-8 p-2"><input type="checkbox" aria-label="Select all my questions shown" checked={allSelected} onChange={() => setSel(allSelected ? new Set() : new Set(mineShown.map((r) => r.id)))} /></th><th className="p-2">Question</th><th className="p-2">Type</th><th className="p-2">Topic</th>{targeting && <th className="p-2">Audience</th>}<th className="p-2 text-center">Diff.</th><th className="p-2 text-center">Asked</th><th className="p-2 text-center">Correct</th><th className="p-2" /></tr></thead>
            <tbody>
              {shown.map((r) => { const s = stats[r.id]; const mine = isMine(r); return (
                <tr key={r.id} className={`border-t border-white/10 ${r.active ? '' : 'opacity-50'}`}>
                  <td className="p-2">{mine && <input type="checkbox" aria-label="Select question" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}</td>
                  <td className="max-w-[320px] p-2 font-semibold"><span className="line-clamp-2">{r.prompt}</span></td>
                  <td className="p-2 text-xs">{QUESTION_TYPES.find((t) => t.value === r.type)?.label}</td><td className="p-2 text-xs">{r.topic ?? '–'}{(r.skill_ids?.length || r.skill_id) && <span className="block text-[10px] opacity-70">{(r.skill_ids?.length ? r.skill_ids : [r.skill_id!]).map((id) => subj.subjects.flatMap((x) => x.domains.flatMap((d) => d.skills)).find((k) => k.id === id)?.name).filter(Boolean).join(' · ')}</span>}</td>
                  {targeting && <td className="max-w-[160px] p-2 text-xs"><span className={`line-clamp-2 ${r.class_ids?.length ? 'font-bold text-yellow-200' : 'text-white/70'}`}>{audienceOf(r)}</span></td>}
                  <td className="p-2 text-center">{r.difficulty}</td><td className="p-2 text-center">{s?.asked ?? 0}</td><td className="p-2 text-center">{s?.asked ? `${Math.round((s.correct / s.asked) * 100)}%` : '–'}</td>
                  <td className="whitespace-nowrap p-2 text-right">{mine && (<><button className="mr-2 font-bold text-yellow-300 hover:underline" onClick={() => setEdit(r)}>Edit</button><button className="mr-2 font-bold text-sky-300 hover:underline" onClick={() => toggle(r)}>{r.active ? 'Hide' : 'Show'}</button><button className="font-bold text-red-300 hover:underline" onClick={() => setAskDel(r)}>Delete</button></>)}</td>
                </tr>); })}
              {shown.length === 0 && <tr><td colSpan={9} className="p-4 text-center font-bold text-white/80">No questions found.</td></tr>}
            </tbody>
          </table>)}
      </Panel>
      <p className="text-xs font-semibold text-white/60">Showing {shown.length} of {rows.length}. Students never see answers in their browser; answers are checked on the server.</p>

      {askBulkDel && <ConfirmDialog title={`Delete ${sel.size} question${sel.size === 1 ? '' : 's'}?`} message="These questions and their statistics will be removed. Students' progress and rewards are not affected. This cannot be undone." confirmLabel="Delete all selected" tone="red" onConfirm={removeSelected} onCancel={() => setAskBulkDel(false)} />}
      {askDel && <ConfirmDialog title="Delete this question?" message="This cannot be undone." confirmLabel="Delete" tone="red" onConfirm={() => remove(askDel)} onCancel={() => setAskDel(null)} />}
      {edit && <QuestionForm initial={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} userId={profile.uid} classes={classes} targeting={targeting} />}
      {bulk && (
        <Modal onClose={() => setBulk(false)}>
          <p className="font-display text-lg font-extrabold text-[#10285a]">Who should get these {sel.size} question{sel.size === 1 ? '' : 's'}?</p>
          <p className="mt-1 text-xs text-[#3d5a94]">Pick one or more of your classes, or Everyone. This replaces their current audience.</p>
          <div className="mt-3"><AudiencePicker light classes={classes} value={bulkAud} onChange={setBulkAud} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={() => setBulk(false)}>Cancel</GameButton><GameButton tone="green" onClick={applyBulk}>Apply</GameButton></div>
        </Modal>)}
      {byClass && (() => { const plan = byClassPlan(); const chip = (on: boolean) => `rounded-full border-2 px-3 py-1 text-xs font-extrabold ${on ? 'border-[#c0392b] bg-[#c0392b] text-white' : 'border-[#1b4fb3] bg-white text-[#10285a]'}`;
        const toggleP = (id: string) => setByClass({ all: false, picked: byClass.picked.includes(id) ? byClass.picked.filter((z) => z !== id) : [...byClass.picked, id] });
        return (
        <Modal onClose={() => setByClass(null)}>
          <p className="font-display text-lg font-extrabold text-[#10285a]">Delete my questions by class</p>
          <p className="mt-1 text-xs text-[#3d5a94]">Only questions you created. Choose all of them, or pick the classes (and/or Everyone) whose questions should go.</p>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Which questions to delete">
            <button type="button" className={chip(byClass.all)} aria-pressed={byClass.all} onClick={() => setByClass({ all: !byClass.all, picked: [] })}>All my questions</button>
            {!byClass.all && <>
              <button type="button" className={chip(byClass.picked.includes('everyone'))} aria-pressed={byClass.picked.includes('everyone')} onClick={() => toggleP('everyone')}>🌍 Everyone</button>
              {classes.map((c) => <button key={c.id} type="button" className={chip(byClass.picked.includes(c.id))} aria-pressed={byClass.picked.includes(c.id)} onClick={() => toggleP(c.id)}>{c.name}</button>)}
            </>}
          </div>
          <p className="mt-3 rounded-xl bg-[#eaf2ff] p-2.5 text-sm font-bold text-[#10285a]">{plan.del.length} question{plan.del.length === 1 ? '' : 's'} will be deleted.{plan.kept.length > 0 && <span className="block text-xs font-semibold text-[#3d5a94]">{plan.kept.length} also aimed at other classes will be kept.</span>}</p>
          <p className="mt-1 text-xs text-[#3d5a94]">Statistics of deleted questions are removed. Students' progress and rewards are not affected. This cannot be undone.</p>
          <div className="mt-4 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={() => setByClass(null)}>Cancel</GameButton><GameButton tone="red" disabled={plan.del.length === 0} onClick={deleteByClass}>Delete {plan.del.length}</GameButton></div>
        </Modal>); })()}
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

function QuestionForm({ initial, onClose, onSaved, userId, classes, targeting }: { initial: Partial<BankQuestion>; onClose: () => void; onSaved: () => void; userId: string; classes: SchoolClass[]; targeting: boolean }) {
  const [f, setF] = useState<Partial<BankQuestion>>(initial);
  const subj = useSubjects();
  const tagged = subj.ready; // false until the subjects SQL has been run: the form then works as before
  const typeList = tagged ? QUESTION_TYPES.filter((x) => subj.typesFor(f.subject_id).some((d) => d.id === x.value) || x.value === f.type) : QUESTION_TYPES;
  // class ids this teacher can see are editable; ids of classes they do not own (an admin editing someone else's question) are kept as they are
  const known = new Set(classes.map((c) => c.id));
  const [aud, setAud] = useState<string[]>((initial.class_ids ?? []).filter((id) => known.has(id)));
  const kept = (initial.class_ids ?? []).filter((id) => !known.has(id));
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
    if (tagged && !f.subject_id) return setErr('Choose the subject first.');
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
      await api.saveBankQuestion({ ...f, options, answer, prompt: f.prompt!.trim(), difficulty: f.difficulty ?? 1, xp_reward: f.xp_reward ?? 5, subject: (tagged ? subj.subjectById(f.subject_id)?.name : null) || f.subject || 'English',
        ...(tagged ? { subject_id: f.subject_id ?? null, domain_id: f.domain_id ?? null, skill_id: f.skill_id ?? null, ...(subj.multi ? { domain_ids: f.domain_ids ?? [], skill_ids: f.skill_ids ?? [] } : {}), cognitive_level: f.cognitive_level ?? null } : {}),
        passage: f.passage || null, topic: f.topic || null, explanation: f.explanation || null, image_url: f.image_url || null, audio_url: f.audio_url || null, tts_text: f.tts_text || null,
        grade: f.grade ?? null, time_limit_s: f.time_limit_s ?? null, ...(targeting ? { class_ids: [...aud, ...kept] } : { class_ids: undefined }) }, userId);
      onSaved();
    } catch (e) { setErr((e as Error).message); setSaving(false); }
  };
  const optionList = lines(optText);

  return (
    <Modal onClose={onClose} wide>
      <p className="font-display text-lg font-extrabold text-[#10285a]">{f.id ? 'Edit question' : 'New question'}</p>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <label className={lab}>Type</label>
        <select value={t} onChange={(e) => { set({ type: e.target.value as QuestionType }); setAnsText(''); }} className={inp}>{typeList.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select>
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
        {tagged && (<div className="mt-2 rounded-xl bg-[#eaf2ff] p-2.5">
          <p className="mb-1 text-xs font-extrabold uppercase text-[#3d5a94]">Subject and skill</p>
          <SubjectSkillPicker subjects={subj.allowed} canRequest multi={subj.multi} savesAll value={rowToPicks({ subjectId: f.subject_id ?? null, domainId: f.domain_id, skillId: f.skill_id, domainIds: f.domain_ids, skillIds: f.skill_ids })}
            onChange={(p) => { const sb = subj.subjectById(p.subjectId); const v = picksToTags(p, sb); const arr = picksToArrays(p, sb); const ok = subj.typesFor(v.subjectId).some((d) => d.id === f.type); set({ subject_id: v.subjectId, domain_id: v.domainId, skill_id: v.skillId, domain_ids: arr.domainIds, skill_ids: arr.skillIds, ...(ok || !v.subjectId ? {} : { type: (subj.typesFor(v.subjectId)[0]?.id ?? 'mcq') as QuestionType }) }); }} />
          <label className={lab}>Thinking level (optional)</label>
          <select value={f.cognitive_level ?? ''} onChange={(e) => set({ cognitive_level: e.target.value || null })} className={inp}><option value="">Not set</option>{COGNITIVE_LEVELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </div>)}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {!tagged && <div><label className={lab}>Subject</label><input value={f.subject ?? ''} onChange={(e) => set({ subject: e.target.value })} className={inp} /></div>}
          <div><label className={lab}>Topic</label><input value={f.topic ?? ''} onChange={(e) => set({ topic: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Grade (optional)</label><input type="number" min={1} max={12} value={f.grade ?? ''} onChange={(e) => set({ grade: e.target.value ? +e.target.value : null })} className={inp} /></div>
          <div><label className={lab}>Difficulty (1–5)</label><select value={f.difficulty ?? 1} onChange={(e) => set({ difficulty: +e.target.value })} className={inp}>{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label className={lab}>XP reward</label><input type="number" min={0} max={50} value={f.xp_reward ?? 5} onChange={(e) => set({ xp_reward: +e.target.value })} className={inp} /></div>
          <div><label className={lab}>Timer (seconds)</label><input type="number" min={5} value={f.time_limit_s ?? ''} onChange={(e) => set({ time_limit_s: e.target.value ? +e.target.value : null })} placeholder="none" className={inp} /></div>
        </div>
        {targeting && (<><label className={lab}>Who gets this question?</label><AudiencePicker light classes={classes} value={aud} onChange={setAud} />{kept.length > 0 && <p className="mt-1 text-xs font-semibold text-[#3d5a94]">Also aimed at {kept.length} class{kept.length === 1 ? '' : 'es'} of another teacher (kept as is).</p>}</>)}
      </div>
      {err && <p className="mt-2 rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={onClose}>Cancel</GameButton><GameButton tone="green" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save question'}</GameButton></div>
    </Modal>
  );
}
