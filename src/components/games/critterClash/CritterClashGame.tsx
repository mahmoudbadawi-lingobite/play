import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GameProps } from '../GameShell';
import { tr } from '../../../i18n/tr';
import { speakNatural } from '../../../lib/speech';
import { makeQuestionSource } from './ccQuestions';
import { COVER_FILES, PROP_FILES, UI_FILES, WORLD_FILES, assetUrl, loadImages, speciesFiles, type ImageStore, type Species } from './ccAssets';
import { CritterGame, type GameStatus } from './ccGame';
import type { CcNet, RosterEntry } from './ccNet';
import { Terrain } from './ccTerrain';

const SPECIES: Species[] = ['hippo', 'llama', 'chicken', 'penguin', 'goat', 'bunny'];

/** An online match: the room page passes the connection and who is on which team. */
export interface CcMulti { net: CcNet; roster: RosterEntry[]; meId: string; isHost: boolean }

/**
 * Critter Clash. On its own it is a one-device match (two teams share the screen). Inside a room (`multi`) every
 * device shows the map; the host's device decides each turn and everybody replays the same shots.
 */
export function CritterClashGame({ items, onFinish, multi }: GameProps & { multi?: CcMulti }) {
  const { setId } = useParams<{ setId: string }>();
  const itemsRef = useRef(items);
  const multiRef = useRef(multi);
  multiRef.current = multi;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<CritterGame | null>(null);
  const store = useRef<ImageStore>(new Map());
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [st, setSt] = useState<GameStatus | null>(null);
  const [myPick, setMyPick] = useState(-1);
  const stats = useRef({ right: 0, answered: 0, assists: 0 });
  const readyIds = useRef(new Set<string>());

  const myTeam = multi?.roster.find((r) => r.id === multi.meId)?.team ?? null;
  const nameOf = (id: string) => multi?.roster.find((r) => r.id === id)?.name ?? '';

  // messages from the room: they are listened to from the start so none is missed while the map is being built
  useEffect(() => {
    if (!multi) return;
    const { net } = multi;
    const off = net.onMessage((m) => {
      const g = game.current;
      if (m.t === 'ready') readyIds.current.add(m.id);
      else if (m.t === 'ev' && g) {
        g.apply(m.e);
      } else if (m.t === 'ans' && g && g.isHost && m.id === g.shooterId && m.turn === g.turns) g.hostResolve(m.pick);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi?.net]);

  useEffect(() => { setMyPick(-1); }, [st?.turn]);

  // load assets and build the map
  useEffect(() => {
    let dead = false;
    let timer = 0;
    setReady(false); setProgress(0); setError('');
    (async () => {
      try {
        const files = [...WORLD_FILES, ...PROP_FILES, ...UI_FILES, ...COVER_FILES, ...speciesFiles(SPECIES)];
        await loadImages(files, store.current, (p) => !dead && setProgress(p * 0.5));
        const terrain = await Terrain.build(store.current, (p) => !dead && setProgress(0.5 + p * 0.5));
        if (dead) return;
        const mu = multiRef.current;
        const g = new CritterGame(terrain, store.current, makeQuestionSource(itemsRef.current), !mu);
        g.onStatus = setSt;
        if (mu) {
          const { net, roster, meId } = mu;
          g.net = true; g.isHost = mu.isHost; g.meId = meId; g.controlled = false;
          g.out = (e) => net.send({ t: 'ev', e });
          g.onShooterAnswer = (pick) => net.send({ t: 'ans', id: meId, pick, turn: g.turns });
          g.shooterFor = (team, n) => {
            const here = new Set(net.players.map((p) => p.id));
            const members = roster.filter((r) => r.team === team && here.has(r.id));
            return (members.length ? members[n % members.length] : net.players.find((p) => p.host) ?? net.players[0])?.id ?? meId;
          };
        }
        game.current = g;
        setReady(true);
        if (mu) {
          // tell the host this device is ready; the host starts once everybody is (or after a few seconds)
          readyIds.current.add(mu.meId);
          const t0 = Date.now();
          timer = window.setInterval(() => {
            const m = multiRef.current; if (!m || !game.current) return;
            if (game.current.phase !== 'wait') { window.clearInterval(timer); return; }
            if (!m.isHost) { m.net.send({ t: 'ready', id: m.meId }); return; }
            const here = m.net.players.map((p) => p.id);
            if (here.every((id) => readyIds.current.has(id)) || Date.now() - t0 > 12000) { window.clearInterval(timer); game.current.hostBegin(); }
          }, 700);
        }
      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { dead = true; window.clearInterval(timer); game.current = null; };
  }, [round]);

  // if the host left and this device took over
  useEffect(() => {
    const g = game.current;
    if (g && multi) g.isHost = multi.isHost;
  }, [multi?.isHost, ready, multi]);

  // canvas size, loop and input
  useEffect(() => {
    if (!ready) return;
    const g = game.current!; const cv = canvas.current!; const box = wrap.current!;
    const ctx = cv.getContext('2d')!;
    let dpr = 1;
    const fit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(box.clientWidth * dpr); cv.height = Math.round(box.clientHeight * dpr);
      g.resize(cv.width, cv.height);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(box);
    let raf = 0; let last = performance.now();
    const loop = (now: number) => { g.update((now - last) / 1000); last = now; g.draw(ctx); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    let drag: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => { if (!g.canAct) return; drag = { x: e.offsetX, y: e.offsetY }; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (drag) g.setAim((drag.x - e.offsetX) * dpr, (drag.y - e.offsetY) * dpr); };
    const up = () => { drag = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    const keys = new Set<string>();
    const sync = () => { g.moveDir = keys.has('ArrowRight') || keys.has('d') ? 1 : keys.has('ArrowLeft') || keys.has('a') ? -1 : 0; };
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { g.fire(); e.preventDefault(); return; }
      if (e.key === 'z' || e.key === ' ') { g.hop(); e.preventDefault(); return; }
      if (e.key === 'w' || e.key === 'ArrowUp') { g.adjust(0.05, 0); e.preventDefault(); return; }
      if (e.key === 's' || e.key === 'ArrowDown') { g.adjust(-0.05, 0); e.preventDefault(); return; }
      if (e.key === 'e') { g.adjust(0, 0.04); return; }
      if (e.key === 'q') { g.adjust(0, -0.04); return; }
      keys.add(e.key); sync();
    };
    const ku = (e: KeyboardEvent) => { keys.delete(e.key); sync(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    };
  }, [ready]);

  const hold = useCallback((dir: number) => ({
    onPointerDown: (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); if (game.current) game.current.moveDir = dir; },
    onPointerUp: () => { if (game.current) game.current.moveDir = 0; },
    onPointerCancel: () => { if (game.current) game.current.moveDir = 0; },
  }), []);

  if (error) return <div className="card-surface p-6 text-center">{tr('Could not load the game.')} <div className="text-xs opacity-60">{error}</div></div>;
  if (!ready) {
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <div className="text-4xl">🦛</div>
        <div className="mt-2 font-semibold">{tr('Building the meadow…')}</div>
        <div className="mx-auto mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      </div>
    );
  }

  const g = game.current!;
  const myTurn = st?.canAct ?? false;
  const teamLabel = (t: number | undefined) => (t === 0 ? tr('Blue team') : tr('Red team'));
  const teamName = teamLabel(st?.team);
  const q = st?.question ?? null;
  const iAnswer = !multi || myTeam === st?.team; // my team is the one answering
  const iShoot = !multi || st?.shooter === multi.meId;

  const pickAnswer = (i: number) => {
    if (!q || st?.phase !== 'question' || myPick >= 0 || !iAnswer) return;
    setMyPick(i);
    const ok = i === q.correct;
    stats.current.answered++;
    if (ok) { stats.current.right++; if (!iShoot) stats.current.assists++; }
    if (iShoot) g.submitAnswer(i);
  };

  const btn = (file: string, label: string, props: Record<string, unknown>) => (
    <button type="button" aria-label={label} disabled={!myTurn} {...props} className="select-none touch-none disabled:opacity-40">
      <img src={assetUrl(`ui/${file}`)} alt="" draggable={false} className="h-14 w-14 sm:h-16 sm:w-16" />
    </button>
  );

  const finish = () => {
    if (multi) {
      const { right, answered, assists } = stats.current;
      const win = st?.winner !== null && st?.winner === myTeam;
      onFinish(answered ? Math.round((100 * right) / answered) : 0, Math.min(200, 10 * right + 5 * assists + (win ? 20 : 0)));
    } else {
      const c = (st?.correct[0] ?? 0) + (st?.correct[1] ?? 0);
      onFinish(st?.asked ? Math.round((100 * c) / st.asked) : 0, Math.min(150, 10 * c + (st?.winner == null ? 0 : 20)));
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-2 text-center text-sm">
        {multi ? (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">{tr('You are on the {team}', { team: teamLabel(myTeam ?? 0) })}</span>
        ) : (
          <>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{tr('Two teams share one device')}</span>
            {setId && <Link to={`/critter?set=${encodeURIComponent(setId)}`} className="ms-2 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{tr('Play online with friends')} →</Link>}
          </>
        )}
      </div>
      <div ref={wrap} className="relative w-full overflow-hidden rounded-2xl bg-sky-200" style={{ height: 'clamp(300px, 62vh, 620px)' }}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" />
        {st?.phase === 'wait' && <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">{tr('Waiting for the other players…')}</div>}
        {st && (st.phase === 'move' || st.phase === 'flight' || st.phase === 'settle') && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {multi && !st.controlled
              ? tr('{name} is aiming…', { name: nameOf(st.shooter) || teamName })
              : <>{tr("{team}'s turn", { team: teamName })} · {st.fizzle ? tr('Weak shot: drag to aim, then press Fire') : tr('Drag to aim, then press Fire')}</>}
          </div>
        )}
        {q && (
          <div className="absolute inset-x-2 bottom-2 mx-auto max-w-xl rounded-2xl bg-white/95 p-3 shadow-lg">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{tr("{team}'s turn", { team: teamName })} · {multi && st?.shooter ? nameOf(st.shooter) : st?.animal}</span><span>⏱ {st?.timeLeft}</span>
            </div>
            {q.passage && <p dir="auto" className="mb-1 text-sm text-slate-600">{q.passage}</p>}
            <div className="mb-2 flex items-start gap-2">
              <p dir="auto" className="flex-1 text-base font-semibold text-slate-900">{q.prompt}</p>
              {q.audio && <button type="button" className="rounded-full bg-sky-100 px-2 py-1" aria-label={tr('Listen')} onClick={() => speakNatural(q.audio!)}>🔊</button>}
            </div>
            {iAnswer ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {q.options.map((o, i) => {
                  const done = st?.phase === 'feedback';
                  const cls = done ? (i === q.correct ? 'bg-emerald-500 text-white' : i === st?.picked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400') : 'bg-sky-100 text-slate-900 hover:bg-sky-200';
                  return <button key={i} type="button" dir="auto" disabled={done || myPick >= 0} onClick={() => pickAnswer(i)} className={`rounded-xl px-3 py-2 text-sm font-medium ${cls} ${myPick === i ? 'ring-2 ring-slate-800' : ''}`}>{o}</button>;
                })}
              </div>
            ) : <p className="text-center text-sm text-slate-600">{tr('The other team is answering…')}</p>}
            {multi && iAnswer && !iShoot && st?.phase === 'question' && <p className="mt-2 text-center text-xs text-slate-600">{tr('{name} takes the shot. Answer too: +5 XP for a right answer.', { name: nameOf(st.shooter) })}</p>}
            {st?.phase === 'feedback' && <p className="mt-2 text-center text-sm font-semibold">{st.fizzle ? tr('Not quite: weak shot and a short walk') : tr('Correct! Full-power shot')}</p>}
          </div>
        )}
        {st?.phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
            <div className="text-3xl font-bold">{st.winner === null ? tr('Draw!') : tr('{team} wins!', { team: teamLabel(st.winner) })}</div>
            <div className="text-sm">{tr('Correct answers')}: {tr('Blue team')} {st.correct[0]} · {tr('Red team')} {st.correct[1]}</div>
            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={finish}>{tr('Finish')}</button>
              {!multi && <button type="button" className="btn-secondary" onClick={() => setRound((r) => r + 1)}>{tr('Play again')}</button>}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        {btn('ui_btn_left.webp', tr('Left'), hold(-1))}
        {btn('ui_btn_right.webp', tr('Right'), hold(1))}
        {btn('ui_btn_hop.webp', tr('Hop'), { onClick: () => g.hop() })}
        {btn('ui_btn_fire.webp', tr('Fire'), { onClick: () => g.fire() })}
        <button type="button" className="btn-secondary" onClick={() => { g.mapView = !g.mapView; }}>🗺️ {tr('Map')}</button>
      </div>
    </div>
  );
}
