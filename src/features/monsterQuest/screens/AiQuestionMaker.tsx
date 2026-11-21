import { useMemo, useState } from 'react';
import { SubjectSkillPicker } from '../../subjects/SubjectSkillPicker';
import { NO_PICKS, type Picks } from '../../subjects/types';
import type { useSubjects } from '../../subjects/useSubjects';
import { QUESTION_TYPES } from '../config';
import { GameButton } from '../ui';
import { buildQuestionPrompt, defaultTypes, parseQuestionReply } from '../questionPrompt';

type Subjects = ReturnType<typeof useSubjects>;

/** Build an AI prompt for questions, then take the AI's reply and add the questions to the bank. */
export function AiQuestionMaker({ subj, onAdd }: { subj: Subjects; onAdd: (rows: Record<string, any>[], picks: Picks) => Promise<string> }) {
  const [picks, setPicks] = useState<Picks>(NO_PICKS);
  const [types, setTypes] = useState<string[] | null>(null);       // null = follow the chosen domain
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState(2);
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [attach, setAttach] = useState(false);
  const [reply, setReply] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const subject = subj.subjectById(picks.subjectId);
  const chosenTypes = types ?? defaultTypes(picks, subject);
  const allowed = picks.subjectId ? subj.typesFor(picks.subjectId).map((d) => d.id) : QUESTION_TYPES.map((t) => t.value as string);
  const usable = chosenTypes.filter((t) => allowed.includes(t));
  const prompt = useMemo(() => {
    if (!subject) return '';
    const skills = subject.domains.flatMap((x) => x.skills).filter((x) => picks.skillIds.includes(x.id)).map((x) => ({ name: x.name, hint: x.description }));
    return buildQuestionPrompt({ subject: subject.name, domains: subject.domains.filter((x) => picks.domainIds.includes(x.id)).map((x) => x.name), skills, types: usable, count, difficulty, grade: grade ? Number(grade) : null, topic, material, hasAttachment: attach });
  }, [subject, picks, usable.join(','), count, difficulty, grade, topic, material, attach]);

  const chip = (on: boolean) => `rounded-full border-2 px-3 py-1 text-xs font-extrabold ${on ? 'border-[#1b4fb3] bg-[#1b4fb3] text-white' : 'border-[#1b4fb3] bg-white text-[#10285a]'}`;
  const inp = 'w-full rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-semibold text-[#10285a]';
  const lab = 'mt-3 mb-1 block text-xs font-extrabold uppercase text-[#3d5a94]';
  const copy = async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setMsg('Copy failed: select the prompt text and copy it by hand.'); } };
  const add = async () => {
    setMsg(null);
    const r = parseQuestionReply(reply);
    if (r.error) return setMsg(r.error);
    if (!r.rows.length) return setMsg('Paste the AI reply first.');
    setMsg(await onAdd(r.rows, picks)); setReply('');
  };

  return (
    <div className="text-[#10285a]">
      <p className="font-display text-lg font-extrabold">Make questions with AI</p>
      <p className="text-xs text-[#3d5a94]">1 Choose subject and skills · 2 paste your text · 3 copy the prompt into any AI chat · 4 paste the reply here.</p>
      <div className="mt-3"><SubjectSkillPicker subjects={subj.allowed} canRequest multi value={picks} onChange={(p) => setPicks(p)} /></div>

      {subject && (<>
        <span className={lab}>Question types {types === null ? '(chosen from your domain, tap to change)' : ''}</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Question types">
          {QUESTION_TYPES.filter((t) => allowed.includes(t.value)).map((t) => (
            <button key={t.value} type="button" className={chip(usable.includes(t.value))} aria-pressed={usable.includes(t.value)}
              onClick={() => setTypes(usable.includes(t.value) ? usable.filter((x) => x !== t.value) : [...usable, t.value])}>{t.label}</button>))}
        </div>
        {usable.includes('listening') && <p className="mt-2 rounded-xl bg-[#eaf2ff] p-2 text-xs font-bold">Listening: the AI cuts your text into chunks of 2-3 sentences. Each chunk becomes one listening question that is read aloud.</p>}

        <span className={lab}>Your text (optional)</span>
        <textarea value={material} onChange={(e) => setMaterial(e.target.value)} rows={6} placeholder="Paste the story, passage, dialogue or word list here. You can also attach a photo or file in the AI chat and tick the box below." className={inp} />
        <label className="mt-1 flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} /> I will attach the text as a file or image in the AI chat</label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div><label className={lab}>How many</label><input type="number" min={1} max={40} value={count} onChange={(e) => setCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} className={inp} /></div>
          <div><label className={lab}>Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className={inp}>{[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className={lab}>Grade</label><input value={grade} onChange={(e) => setGrade(e.target.value.replace(/\D/g, ''))} className={inp} placeholder="optional" /></div>
          <div><label className={lab}>Topic</label><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inp} placeholder="optional" /></div>
        </div>

        <span className={lab}>Prompt to copy</span>
        <textarea readOnly value={prompt} rows={7} className={`${inp} font-mono text-xs`} onFocus={(e) => e.currentTarget.select()} />
        <div className="mt-2"><GameButton tone="blue" onClick={copy} disabled={!usable.length}>{copied ? '✓ Copied' : '📋 Copy prompt'}</GameButton></div>

        <span className={lab}>AI reply</span>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="Paste the AI's JSON reply here" className={`${inp} font-mono text-xs`} />
        <div className="mt-2"><GameButton tone="green" onClick={add} disabled={!reply.trim()}>➕ Add these questions</GameButton></div>
      </>)}
      {msg && <p role="status" className="mt-3 rounded-xl bg-[#eaf2ff] p-2.5 text-sm font-bold">{msg}</p>}
    </div>
  );
}
