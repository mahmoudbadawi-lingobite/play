import { useEffect, useRef, useState } from 'react';
import * as api from '../api';
import { useMq } from '../context';
import { MonsterArt } from '../art/MonsterArt';
import { QuestionView, formatCorrectAnswer } from '../QuestionView';
import { sfx } from '../sound';
import { Bar, GameButton, Modal } from '../ui';
import type { AnswerResult, OwnedMonster, Question } from '../types';

/** Training Dojo: a short quiz session whose correct answers give the monster XP (server-validated). */
export function TrainModal({ monster, onClose }: { monster: OwnedMonster; onClose: () => void }) {
  const mq = useMq();
  const sp = mq.speciesById.get(monster.species_id)!;
  const [encId, setEncId] = useState<string | null>(null);
  const [total, setTotal] = useState(5);
  const [phase, setPhase] = useState<'intro' | 'loading' | 'question' | 'feedback' | 'done'>('intro');
  const [q, setQ] = useState<Question | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gainedXp, setGainedXp] = useState(0);
  const [levels, setLevels] = useState(0);
  const [lv, setLv] = useState({ level: monster.level, xp: monster.xp, next: 20 + monster.level * 10 });
  const done = useRef(false);
  const alive = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; window.setTimeout(() => { if (!alive.current && encId && !done.current) void api.flee(encId).catch(() => undefined); }, 50); };
  }, [encId]);

  const guard = async <T,>(fn: () => Promise<T>): Promise<T | null> => { setBusy(true); setErr(null); try { return await fn(); } catch (e) { setErr((e as Error).message); return null; } finally { setBusy(false); } };

  const next = async (id: string) => {
    setPhase('loading');
    const nq = await guard(() => api.nextQuestion(id));
    if (nq) { setQ(nq); setPhase('question'); } else setPhase('intro');
  };
  const start = async () => {
    const s = await guard(() => api.trainStart(monster.id));
    if (!s) return;
    setEncId(s.id); setTotal(s.total_questions); await next(s.id);
  };
  const submit = async (answer: unknown) => {
    if (!encId) return;
    const r = await guard(() => api.answerQuestion(encId, answer));
    if (!r) { setPhase('intro'); return; }
    setRes(r);
    if (r.correct) sfx.correct(); else sfx.wrong();
    if (r.monster) { setLv(r.monster); setGainedXp((g) => g + r.monster_xp); setLevels((l) => l + r.monster!.levels_gained); if (r.monster.levels_gained) sfx.levelUp(); }
    const xp = mq.state.xp + r.xp;
    mq.setState({ ...mq.state, xp, coins: mq.state.coins + r.coins });
    if (r.finished) done.current = true;
    setPhase('feedback');
  };
  const close = async () => { done.current = true; await mq.refresh().catch(() => undefined); onClose(); };

  return (
    <Modal wide>
      <div className="flex items-center gap-3">
        <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={84} />
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold text-[#10285a]">Training Dojo: {monster.nickname || sp.name}</p>
          <p className="text-xs font-bold text-[#3d5a94]">Level {lv.level}</p>
          <Bar pct={(lv.xp / lv.next) * 100} color="linear-gradient(90deg,#38bdf8,#818cf8)" label="Monster XP" />
          <p className="text-[11px] font-bold text-[#3d5a94]">{lv.xp} / {lv.next} XP{gainedXp > 0 && <span className="text-green-600"> · +{gainedXp} this session</span>}</p>
        </div>
      </div>
      {err && <p className="mt-2 rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}

      {phase === 'intro' && (<div className="mt-3 text-center"><p className="text-sm font-semibold text-[#3d5a94]">Answer {total} questions. Every correct answer gives your monster XP (and you earn some too). Higher-level monsters get harder questions.</p>
        <div className="mt-3 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={close}>Not now</GameButton><GameButton tone="green" disabled={busy} onClick={start}>Start training</GameButton></div></div>)}
      {phase === 'loading' && <p className="py-6 text-center font-bold text-[#3d5a94]">Getting a question…</p>}
      {phase === 'question' && q && <div className="mt-3 rounded-2xl bg-[#123a8f] p-3"><QuestionView key={q.id} q={q} busy={busy} onSubmit={submit} /></div>}
      {phase === 'feedback' && res && q && (
        <div className={`mq-card mt-3 ${res.correct ? 'mq-card-good' : 'mq-card-bad'}`} aria-live="polite">
          <p className="text-lg font-extrabold">{res.correct ? `Correct! +${res.monster_xp} monster XP` : res.late ? 'Too slow!' : 'Not quite'}</p>
          {!res.correct && <p className="mt-1 text-sm font-semibold">Answer: <span className="font-extrabold">{formatCorrectAnswer(q.type, res.correct_answer)}</span></p>}
          {res.explanation && <p className="mt-1 text-sm">{res.explanation}</p>}
          {res.monster && res.monster.levels_gained > 0 && <p className="mt-1 font-extrabold text-amber-600">⭐ Level up! Now level {res.monster.level}</p>}
          <p className="mt-1 text-xs font-bold opacity-70">Question {Math.min(total, res.correct_count + res.wrong_count)} of {total}</p>
          <GameButton className="mt-2 w-full" tone={res.finished ? 'gold' : 'green'} onClick={() => (res.finished ? setPhase('done') : next(encId!))}>{res.finished ? 'Finish' : 'Next question'}</GameButton>
        </div>)}
      {phase === 'done' && (
        <div className="mt-3 text-center">
          <p className="font-display text-2xl font-extrabold text-[#10285a]">Training complete! 🎉</p>
          <p className="mt-1 text-sm font-bold text-[#3d5a94]">+{gainedXp} monster XP{levels > 0 ? ` · ${levels} level${levels > 1 ? 's' : ''} gained` : ''}</p>
          <GameButton className="mt-3 w-full" tone="blue" onClick={close}>Done</GameButton>
        </div>)}
    </Modal>
  );
}
