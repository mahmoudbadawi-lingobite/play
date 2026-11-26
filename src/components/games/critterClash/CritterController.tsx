import { useEffect, useRef, useState } from 'react';
import { tr } from '../../../i18n/tr';
import { speakNatural } from '../../../lib/speech';
import { PressButton } from './PressButton';
import type { Question } from './ccGame';
import { scoreRow, type CcMulti } from './ccNet';

type CPhase = 'wait' | 'question' | 'feedback' | 'move' | 'flight' | 'settle' | 'over';

/**
 * A phone used as a controller in a big-screen match: it shows the question, and when this player is the shooter,
 * the buttons that walk, jump, aim and fire the animal on the big screen.
 */
export function CritterController({ multi, onFinish }: { multi: CcMulti; onFinish: (accuracy: number, xp: number) => void }) {
  const { net, roster, meId } = multi;
  const me = roster.find((r) => r.id === meId);
  const myTeam = me?.team ?? 0;
  const nameOf = (id: string) => roster.find((r) => r.id === id)?.name ?? '';
  const [phase, setPhase] = useState<CPhase>('wait');
  const [team, setTeam] = useState<0 | 1>(0);
  const [shooter, setShooter] = useState('');
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState(-1);
  const [myPick, setMyPick] = useState(-1);
  const [fizzle, setFizzle] = useState(false);
  const [aim, setAim] = useState({ ang: 0.8, pw: 0.6, ml: 0 });
  const [winner, setWinner] = useState<0 | 1 | null>(null);
  const [now, setNow] = useState(Date.now());
  const [deadline, setDeadline] = useState(0);
  const turn = useRef(0);
  const stats = useRef({ right: 0, answered: 0, assists: 0 });
  const fbUntil = useRef(0);
  const qRef = useRef<Question | null>(null);
  const reported = useRef(false);
  const holdTimer = useRef(0);

  useEffect(() => {
    const off = net.onMessage((m) => {
      if (m.t !== 'ev') return;
      const e = m.e;
      if (e.k === 'turn') {
        turn.current = e.snap.turns + 1;
        qRef.current = e.q; setQ(e.q); setTeam(e.team); setShooter(e.shooter); setPicked(-1); setMyPick(-1); setFizzle(false);
        setPhase('question'); setDeadline(Date.now() + 15000);
      } else if (e.k === 'res') {
        setPicked(e.pick); setFizzle(e.pick !== qRef.current?.correct); setPhase('feedback'); fbUntil.current = Date.now() + 1600;
      } else if (e.k === 'pos') setAim({ ang: e.ang, pw: e.pw, ml: e.ml });
      else if (e.k === 'fire') setPhase('flight');
      else if (e.k === 'skip') setPhase('settle');
      else if (e.k === 'over') { setWinner(e.winner); setPhase('over'); }
    });
    const tick = window.setInterval(() => {
      setNow(Date.now());
      if (fbUntil.current && Date.now() >= fbUntil.current) { fbUntil.current = 0; setPhase((p) => (p === 'feedback' ? 'move' : p)); setDeadline(Date.now() + 30000); }
    }, 250);
    return () => { off(); window.clearInterval(tick); window.clearInterval(holdTimer.current); };
  }, [net]);

  const iShoot = shooter === meId;
  const iAnswer = team === myTeam;
  const canPlay = phase === 'move' && iShoot;
  const secs = Math.max(0, Math.ceil((deadline - now) / 1000));
  const teamName = (t: number) => (t === 0 ? tr('Blue team') : tr('Red team'));

  const cmd = (c: 'dir' | 'hop' | 'adj' | 'fire', extra: { v?: number; a?: number; p?: number } = {}) => net.send({ t: 'cmd', id: meId, turn: turn.current, c, ...extra });
  const hold = (v: number) => {
    window.clearInterval(holdTimer.current);
    if (v === 0) { cmd('dir', { v: 0 }); window.setTimeout(() => cmd('dir', { v: 0 }), 120); return; }
    cmd('dir', { v });
    holdTimer.current = window.setInterval(() => cmd('dir', { v }), 150);
  };

  const pick = (i: number) => {
    if (!q || phase !== 'question' || myPick >= 0 || !iAnswer) return;
    setMyPick(i);
    stats.current.answered++;
    if (i === q.correct) { stats.current.right++; if (!iShoot) stats.current.assists++; }
    if (iShoot) net.send({ t: 'ans', id: meId, pick: i, turn: turn.current });
  };

  useEffect(() => {
    if (phase !== 'over' || reported.current) return;
    reported.current = true;
    multi.onReport?.(scoreRow({ id: meId, name: me?.name ?? '', team: myTeam }, stats.current, winner));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finish = () => {
    const row = scoreRow({ id: meId, name: me?.name ?? '', team: myTeam }, stats.current, winner);
    onFinish(row.answered ? Math.round((100 * row.right) / row.answered) : 0, row.xp);
  };

  const bg = myTeam === 0 ? 'from-sky-600 to-sky-800' : 'from-rose-600 to-rose-800';
  return (
    <div className={`mx-auto flex min-h-[70vh] w-full max-w-md flex-col gap-3 rounded-3xl bg-gradient-to-b ${bg} p-4 text-white`}>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{teamName(myTeam)} · {me?.name}</span>
        {(phase === 'question' || phase === 'move') && <span className="rounded-full bg-black/30 px-3 py-1">⏱ {secs}</span>}
      </div>

      {phase === 'wait' && <p className="my-auto text-center text-lg">{tr('Look at the big screen. The match is about to start…')}</p>}

      {(phase === 'question' || phase === 'feedback') && q && (
        <div className="rounded-2xl bg-white p-3 text-slate-900">
          <p className="mb-1 text-xs font-semibold text-slate-500">{tr("{team}'s turn", { team: teamName(team) })} · {nameOf(shooter) || '…'}</p>
          {q.passage && <p dir="auto" className="mb-1 text-sm text-slate-600">{q.passage}</p>}
          <div className="mb-2 flex items-start gap-2">
            <p dir="auto" className="flex-1 text-base font-semibold">{q.prompt}</p>
            {q.audio && <button type="button" className="rounded-full bg-sky-100 px-2 py-1" aria-label={tr('Listen')} onClick={() => speakNatural(q.audio!)}>🔊</button>}
          </div>
          {iAnswer ? (
            <div className="grid gap-2">
              {q.options.map((o, i) => {
                const done = phase === 'feedback';
                const cls = done ? (i === q.correct ? 'bg-emerald-500 text-white' : i === picked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400') : 'bg-sky-100 hover:bg-sky-200';
                return <button key={i} type="button" dir="auto" disabled={done || myPick >= 0} onClick={() => pick(i)} className={`rounded-xl px-3 py-3 text-base font-medium ${cls} ${myPick === i ? 'ring-2 ring-slate-800' : ''}`}>{o}</button>;
              })}
            </div>
          ) : <p className="text-center text-sm text-slate-600">{tr('The other team is answering…')}</p>}
          {iAnswer && !iShoot && phase === 'question' && <p className="mt-2 text-center text-xs text-slate-600">{tr('{name} takes the shot. Answer too: +5 XP for a right answer.', { name: nameOf(shooter) })}</p>}
          {phase === 'feedback' && <p className="mt-2 text-center text-sm font-semibold">{fizzle ? tr('Not quite: weak shot and a short walk') : tr('Correct! Full-power shot')}</p>}
        </div>
      )}

      {(phase === 'move' || phase === 'flight' || phase === 'settle') && (
        iShoot ? (
          <div className="flex flex-1 flex-col justify-between gap-3">
            <div className="rounded-2xl bg-black/25 p-3 text-center text-sm">
              {phase === 'move' ? tr('Your turn! Watch the big screen.') : tr('Watch the big screen…')}
              <div className="mt-1 text-xs opacity-80">{tr('Angle')} {Math.round((aim.ang * 180) / Math.PI)}° · {tr('Power')} {Math.round(aim.pw * 100)}% · {tr('Walk left')} {aim.ml}</div>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex gap-3">
                <PressButton file="ui_btn_left.webp" label={tr('Left')} disabled={!canPlay} onDown={() => hold(-1)} onUp={() => hold(0)} />
                <PressButton file="ui_btn_right.webp" label={tr('Right')} disabled={!canPlay} onDown={() => hold(1)} onUp={() => hold(0)} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-1.5">
                  {([['▲', tr('Aim up'), () => cmd('adj', { a: 0.06, p: 0 })], ['▼', tr('Aim down'), () => cmd('adj', { a: -0.06, p: 0 })], ['−', tr('Less power'), () => cmd('adj', { a: 0, p: -0.06 })], ['+', tr('More power'), () => cmd('adj', { a: 0, p: 0.06 })]] as [string, string, () => void][]).map(([sym, label, fn]) => (
                    <button key={label} type="button" aria-label={label} disabled={!canPlay} onClick={fn} className="h-11 w-11 rounded-full bg-white/90 text-xl font-bold text-slate-800 shadow disabled:opacity-40">{sym}</button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <PressButton file="ui_btn_hop.webp" label={tr('Hop')} disabled={!canPlay} onDown={() => cmd('hop')} />
                  <PressButton file="ui_btn_fire.webp" label={tr('Fire')} disabled={!canPlay} onDown={() => cmd('fire')} />
                </div>
              </div>
            </div>
          </div>
        ) : <p className="my-auto text-center text-lg">{team === myTeam ? tr('Your teammate is shooting. Watch the big screen!') : tr('The other team is shooting. Watch the big screen!')}</p>
      )}

      {phase === 'over' && (
        <div className="my-auto text-center">
          <p className="text-3xl font-bold">{winner === null ? tr('Draw!') : tr('{team} wins!', { team: teamName(winner) })}</p>
          <p className="mt-2 text-sm">{tr('Your right answers')}: {stats.current.right}/{stats.current.answered}</p>
          <button type="button" className="mt-4 rounded-xl bg-white px-6 py-3 text-lg font-bold text-slate-900" onClick={finish}>{tr('Finish')}</button>
        </div>
      )}
    </div>
  );
}
