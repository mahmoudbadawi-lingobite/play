import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GameProps } from '../GameShell';
import { tr } from '../../../i18n/tr';
import { speakNatural } from '../../../lib/speech';
import { makeQuestionSource } from './ccQuestions';
import { COVER_FILES, PROP_FILES, UI_FILES, WORLD_FILES, assetUrl, loadImages, probeBackgrounds, speciesFiles, type ImageStore, type Species } from './ccAssets';
import { CritterGame, type GameStatus } from './ccGame';
import type { CcNet, RosterEntry } from './ccNet';
import { Terrain } from './ccTerrain';

const SPECIES: Species[] = ['hippo', 'llama', 'chicken', 'penguin', 'goat', 'bunny'];

/**
 * A round game button that can be held for as long as you like. It is drawn with a background picture (not an <img>) and
 * all the browser's long-press behaviour (image menu, text selection, context menu) is switched off.
 */
function PressButton({ file, label, disabled, onDown, onUp }: { file: string; label: string; disabled?: boolean; onDown: () => void; onUp?: () => void }) {
  return (
    <div
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPointerDown={(e) => { e.preventDefault(); if (disabled) return; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); onDown(); }}
      onPointerUp={() => onUp?.()}
      onPointerCancel={() => onUp?.()}
      onLostPointerCapture={() => onUp?.()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`pointer-events-auto h-16 w-16 shrink-0 select-none rounded-full bg-contain bg-center bg-no-repeat sm:h-[4.5rem] sm:w-[4.5rem] ${disabled ? 'opacity-40' : 'active:scale-95'}`}
      style={{ backgroundImage: `url(${assetUrl(`ui/${file}`)})`, touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
    />
  );
}

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
  const root = useRef<HTMLDivElement>(null);
  const [fsReal, setFsReal] = useState(false); // the browser's full screen
  const [fsFake, setFsFake] = useState(false); // fallback for browsers (iPhone) that cannot full-screen a page element
  const [offer, setOffer] = useState(false);
  const full = fsReal || fsFake;

  const enterFull = async () => {
    setOffer(false);
    const el = root.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    try {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else setFsFake(true);
    } catch { setFsFake(true); }
  };
  const exitFull = useCallback(() => {
    setFsFake(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);
  useEffect(() => {
    const on = () => setFsReal(!!document.fullscreenElement && document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', on);
    return () => { document.removeEventListener('fullscreenchange', on); if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined); };
  }, []);
  // a new match: suggest full screen once; when the match ends, leave full screen by itself
  useEffect(() => { if (ready) setOffer(true); }, [ready, round]);
  useEffect(() => { if (st?.phase === 'over') exitFull(); }, [st?.phase, exitFull]);

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
        const bgs = await probeBackgrounds(store.current);
        const terrain = await Terrain.build(store.current, (p) => !dead && setProgress(0.5 + p * 0.5));
        if (dead) return;
        const mu = multiRef.current;
        const g = new CritterGame(terrain, store.current, makeQuestionSource(itemsRef.current), !mu, bgs);
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
    // touch or drag anywhere: the animal aims toward your finger, the farther away the stronger the throw
    const down = (e: PointerEvent) => { if (!g.canAct) return; drag = { x: e.offsetX, y: e.offsetY }; cv.setPointerCapture(e.pointerId); g.aimScreen(e.offsetX * dpr, e.offsetY * dpr); };
    const move = (e: PointerEvent) => { if (drag) g.aimScreen(e.offsetX * dpr, e.offsetY * dpr); };
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
    <div ref={root} className={full ? 'fixed inset-0 z-[100] flex flex-col bg-slate-900 p-2' : 'mx-auto w-full max-w-5xl'}>
      <div className={`mb-2 text-center text-sm ${full ? 'hidden' : ''}`}>
        {multi ? (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">{tr('You are on the {team}', { team: teamLabel(myTeam ?? 0) })}</span>
        ) : (
          <>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{tr('Two teams share one device')}</span>
            {setId && <Link to={`/critter?set=${encodeURIComponent(setId)}`} className="ms-2 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{tr('Play online with friends')} →</Link>}
          </>
        )}
      </div>
      <div ref={wrap} className={`relative w-full overflow-hidden rounded-2xl bg-sky-200 ${full ? 'min-h-0 flex-1' : ''}`} style={full ? undefined : { height: 'clamp(300px, 62vh, 620px)' }}>
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
        {st && st.phase !== 'over' && st.phase !== 'wait' && (
          <div className={`pointer-events-none absolute inset-0 transition-opacity ${q ? 'opacity-0' : 'opacity-100'}`} aria-hidden={!!q}>
            {/* walking: left side of the screen, can be held */}
            <div className="absolute bottom-3 left-3 flex gap-3">
              <PressButton file="ui_btn_left.webp" label={tr('Left')} disabled={!myTurn} onDown={() => { g.moveDir = -1; }} onUp={() => { g.moveDir = 0; }} />
              <PressButton file="ui_btn_right.webp" label={tr('Right')} disabled={!myTurn} onDown={() => { g.moveDir = 1; }} onUp={() => { g.moveDir = 0; }} />
            </div>
            {/* jump and shoot: right side */}
            <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
              <div className="pointer-events-auto flex gap-1.5">
                {([['▲', tr('Aim up'), () => g.adjust(0.06, 0)], ['▼', tr('Aim down'), () => g.adjust(-0.06, 0)], ['−', tr('Less power'), () => g.adjust(0, -0.06)], ['+', tr('More power'), () => g.adjust(0, 0.06)]] as [string, string, () => void][]).map(([sym, label, fn]) => (
                  <button key={label} type="button" aria-label={label} title={label} disabled={!myTurn} onClick={fn} className="h-9 w-9 rounded-full bg-white/90 text-lg font-bold text-slate-800 shadow disabled:opacity-40">{sym}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <PressButton file="ui_btn_hop.webp" label={tr('Hop')} disabled={!myTurn} onDown={() => g.hop()} />
                <PressButton file="ui_btn_fire.webp" label={tr('Fire')} disabled={!myTurn} onDown={() => g.fire()} />
              </div>
            </div>
            {/* view and full screen: top right, under the red team's bar */}
            <div className="pointer-events-auto absolute right-3 top-10 flex gap-2">
              <button type="button" className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow" onClick={() => { g.mapView = !g.mapView; }}>{st.map ? `🔍 ${tr('Close-up')}` : `🗺️ ${tr('Map')}`}</button>
              <button type="button" className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow" aria-label={full ? tr('Exit full screen') : tr('Full screen')} onClick={() => (full ? exitFull() : void enterFull())}>{full ? '🗗' : '⛶'}</button>
            </div>
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
      {offer && !full && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl">
            <div className="text-4xl">🖥️</div>
            <h3 className="mt-2 font-display text-xl font-bold text-slate-900">{tr('Play full screen?')}</h3>
            <p className="mt-1 text-sm text-slate-600">{tr('Full screen gives you the whole map and bigger buttons.')}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-base font-bold text-white" onClick={() => void enterFull()}>{tr('Full screen')}</button>
              <button type="button" className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-base font-semibold text-slate-700" onClick={() => setOffer(false)}>{tr('Not now')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
