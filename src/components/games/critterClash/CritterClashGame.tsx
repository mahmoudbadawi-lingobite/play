import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GameProps } from '../GameShell';
import { tr } from '../../../i18n/tr';
import { speakNatural } from '../../../lib/speech';
import { makeQuestionSource } from './ccQuestions';
import { COVER_FILES, PROP_FILES, UI_FILES, WORLD_FILES, ANIMALS, limbUrl, loadImages, probeBackgrounds, speciesFiles, type ImageStore, type Species } from './ccAssets';
import { CritterGame, type GameStatus } from './ccGame';
import { scoreRow, type CcMulti } from './ccNet';
import { PressButton } from './PressButton';
import { ResultsTable } from './ResultsTable';
import { ExitButton } from './ExitButton';
import { Terrain } from './ccTerrain';
import { setSfxMuted, sfxMuted, startAmbient, stopAmbient, unlockSfx } from './ccSfx';

const SPECIES: Species[] = [...ANIMALS];

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
  const [mute, setMute] = useState(sfxMuted());
  useEffect(() => { startAmbient(); return () => stopAmbient(); }, []);
  useEffect(() => { const un = () => unlockSfx(); window.addEventListener('pointerdown', un, { once: true, capture: true }); return () => window.removeEventListener('pointerdown', un, true); }, []);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [st, setSt] = useState<GameStatus | null>(null);
  const [myPick, setMyPick] = useState(-1);
  const stats = useRef({ right: 0, answered: 0, assists: 0 });
  const readyIds = useRef(new Set<string>());
  const lastDir = useRef(0);
  const reported = useRef(false);
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
  useEffect(() => {
    if (!multi || st?.phase !== 'over' || reported.current || multi.spectator) return;
    reported.current = true;
    const me = multi.roster.find((r) => r.id === multi.meId);
    if (me) multi.onReport?.(scoreRow(me, stats.current, st.winner));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st?.phase]);

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
      else if (m.t === 'forfeit' && g && g.isHost) { const t = multi.roster.find((r) => r.id === m.id)?.team; if (t === 0 || t === 1) g.forfeit(t); }
      else if (m.t === 'cmd' && g && g.isHost && g.arena && m.id === g.shooterId && m.turn === g.turns) {
        // a phone controller: the button presses of the shooter move this device's animal
        if (m.c === 'dir') { g.moveDir = m.v === 1 ? 1 : m.v === -1 ? -1 : 0; lastDir.current = Date.now(); }
        else if (m.c === 'hop') g.hop();
        else if (m.c === 'adj') g.adjust(m.a ?? 0, m.p ?? 0);
        else if (m.c === 'fire') g.fire();
      }
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
        const prefs: Species[][] = [[], []];
        for (const r of mu?.roster ?? []) if (r.sp) prefs[r.team].push(r.sp as Species);
        const g = new CritterGame(terrain, store.current, makeQuestionSource(itemsRef.current), !mu, bgs, prefs);
        g.onStatus = setSt;
        if (mu) {
          const { net, roster, meId } = mu;
          g.net = true; g.isHost = mu.isHost; g.meId = meId; g.controlled = !!mu.arena; g.arena = !!mu.arena;
          g.onOver = (w) => multiRef.current?.onOver?.(w);
          g.animalOf = (id) => roster.find((r) => r.id === id)?.sp as Species | undefined;
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
            // in a big-screen match only this device builds the map; the phones need a moment to show their question screen
            const everyone = m.arena ? readyIds.current.has(m.meId) && Date.now() - t0 > 2500 : here.every((id) => readyIds.current.has(id));
            if (everyone || Date.now() - t0 > 12000) { window.clearInterval(timer); game.current.hostBegin(); }
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
    const spectating = !!multiRef.current?.spectator;
    const watchdog = window.setInterval(() => { if (g.arena && g.moveDir !== 0 && Date.now() - lastDir.current > 500) g.moveDir = 0; }, 200);
    const down = (e: PointerEvent) => { if (spectating || !g.canAct) return; drag = { x: e.offsetX, y: e.offsetY }; cv.setPointerCapture(e.pointerId); g.aimScreen(e.offsetX * dpr, e.offsetY * dpr); };
    const move = (e: PointerEvent) => { if (drag) g.aimScreen(e.offsetX * dpr, e.offsetY * dpr); };
    const up = () => { drag = null; };
    if (!spectating) { cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); }

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
    if (!spectating) { window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); }
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); window.clearInterval(watchdog);
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    };
  }, [ready]);

  if (error) return <div className="card-surface p-6 text-center">{tr('Could not load the game.')} <div className="text-xs opacity-60">{error}</div></div>;
  if (!ready) {
    return (
      <div className="card-surface mx-auto max-w-md p-8 text-center">
        <img src={limbUrl('bunny')} alt="" className="mx-auto h-20 w-20 animate-bounce object-contain" draggable={false} />
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
  const spectator = !!multi?.spectator;
  const big = spectator; // the teacher's big-screen view: larger text

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
      const me = multi.roster.find((r) => r.id === multi.meId);
      const row = scoreRow(me ?? { id: multi.meId, name: '', team: 0 }, stats.current, st?.winner ?? null);
      onFinish(row.answered ? Math.round((100 * row.right) / row.answered) : 0, row.xp);
    } else {
      const c = (st?.correct[0] ?? 0) + (st?.correct[1] ?? 0);
      onFinish(st?.asked ? Math.round((100 * c) / st.asked) : 0, Math.min(150, 10 * c + (st?.winner == null ? 0 : 20)));
    }
  };

  return (
    <div ref={root} className={full ? 'fixed inset-0 z-[100] flex flex-col bg-slate-900 p-2' : 'relative mx-auto w-full max-w-5xl'}>
      <div className={`mb-2 text-center text-sm ${full ? 'hidden' : ''}`}>
        {multi ? (
          spectator ? <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800">{tr('Class match: you are watching')}</span>
          : <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">{tr('You are on the {team}', { team: teamLabel(myTeam ?? 0) })}</span>
        ) : (
          <>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{tr('Two teams share one device')}</span>
            {setId && <Link to={`/critter?set=${encodeURIComponent(setId)}`} className="ms-2 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{tr('Play online with friends')} →</Link>}
          </>
        )}
      </div>
      {spectator && multi && st && (
        <div className={`mb-2 grid grid-cols-2 gap-2 ${full ? 'hidden' : ''}`}>
          {[0, 1].map((t) => (
            <div key={t} className={`rounded-xl px-3 py-2 ${t === 0 ? 'bg-sky-100 text-sky-900' : 'bg-rose-100 text-rose-900'} ${st.team === t && st.phase !== 'over' ? 'ring-2 ring-slate-800' : ''}`}>
              <div className="flex items-center justify-between font-display text-lg font-bold"><span>{teamLabel(t)}</span><span>✔ {st.correct[t]}</span></div>
              <div className="flex flex-wrap gap-x-2 text-sm">{multi.roster.filter((r) => r.team === t).map((r) => <span key={r.id} className={st.shooter === r.id && st.phase !== 'over' ? 'font-bold underline' : ''}>{r.name}</span>)}</div>
            </div>
          ))}
        </div>
      )}
      <div ref={wrap} className={`relative w-full overflow-hidden rounded-2xl bg-sky-200 ${full ? 'min-h-0 flex-1' : ''}`} style={full ? undefined : { height: 'clamp(300px, 62vh, 620px)' }}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full touch-none" />
        {st?.phase === 'wait' && <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">{tr('Waiting for the other players…')}</div>}
        {st && (st.phase === 'move' || st.phase === 'flight' || st.phase === 'settle') && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {multi && (!st.controlled || spectator || multi.arena)
              ? tr('{name} is aiming…', { name: nameOf(st.shooter) || teamName })
              : <>{tr("{team}'s turn", { team: teamName })} · {st.fizzle ? tr('Weak shot: drag to aim, then press Fire') : tr('Drag to aim, then press Fire')}</>}
          </div>
        )}
        {q && (
          <div className={`absolute inset-x-2 bottom-2 mx-auto rounded-2xl bg-white/95 p-3 shadow-lg ${big ? 'max-w-4xl p-5' : 'max-w-xl'}`}>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{tr("{team}'s turn", { team: teamName })} · {multi && st?.shooter ? nameOf(st.shooter) : st?.animal}</span><span>⏱ {st?.timeLeft}</span>
            </div>
            {q.passage && <p dir="auto" className="mb-1 text-sm text-slate-600">{q.passage}</p>}
            <div className="mb-2 flex items-start gap-2">
              <p dir="auto" className={`flex-1 font-semibold text-slate-900 ${big ? 'text-2xl' : 'text-base'}`}>{q.prompt}</p>
              {q.audio && <button type="button" className="rounded-full bg-sky-100 px-2 py-1" aria-label={tr('Listen')} onClick={() => speakNatural(q.audio!)}>🔊</button>}
            </div>
            {iAnswer || spectator ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {q.options.map((o, i) => {
                  const done = st?.phase === 'feedback';
                  const cls = done ? (i === q.correct ? 'bg-emerald-500 text-white' : i === st?.picked ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400') : 'bg-sky-100 text-slate-900 hover:bg-sky-200';
                  return <button key={i} type="button" dir="auto" disabled={done || myPick >= 0 || spectator} onClick={() => pickAnswer(i)} className={`rounded-xl px-3 py-2 font-medium ${big ? 'py-4 text-xl' : 'text-sm'} ${cls} ${myPick === i ? 'ring-2 ring-slate-800' : ''}`}>{o}</button>;
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
            <div className={`absolute bottom-3 left-3 flex gap-3 ${spectator ? 'hidden' : ''}`}>
              <PressButton file="ui_btn_left.webp" label={tr('Left')} disabled={!myTurn} onDown={() => { g.moveDir = -1; }} onUp={() => { g.moveDir = 0; }} />
              <PressButton file="ui_btn_right.webp" label={tr('Right')} disabled={!myTurn} onDown={() => { g.moveDir = 1; }} onUp={() => { g.moveDir = 0; }} />
            </div>
            {/* jump and shoot: right side */}
            <div className={`absolute bottom-3 right-3 flex flex-col items-end gap-2 ${spectator ? 'hidden' : ''}`}>
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
            {!spectator && (
              <div className="pointer-events-auto absolute left-3 top-10">
                <ExitButton pickTeam={!multi} onExit={(t) => {
                  if (!multi) { if (t === 0 || t === 1) g.forfeit(t); }
                  else if (multi.isHost && myTeam !== null) g.forfeit(myTeam);
                  else multi.net.send({ t: 'forfeit', id: multi.meId });
                }} />
              </div>
            )}
            {/* view and full screen: top right, under the red team's bar */}
            <div className="pointer-events-auto absolute right-3 top-10 flex gap-2">
              <button type="button" className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow" onClick={() => { g.mapView = !g.mapView; }}>{st.map ? `🔍 ${tr('Close-up')}` : `🗺️ ${tr('Map')}`}</button>
              <button type="button" className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow" aria-label={mute ? tr('Sound on') : tr('Sound off')} onClick={() => { const m = !mute; setSfxMuted(m); setMute(m); if (!m) unlockSfx(); }}>{mute ? '🔇' : '🔊'}</button>
              <button type="button" className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow" aria-label={full ? tr('Exit full screen') : tr('Full screen')} onClick={() => (full ? exitFull() : void enterFull())}>{full ? '🗗' : '⛶'}</button>
            </div>
          </div>
        )}
        {st?.phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-auto bg-black/50 p-3 text-white">
            <div className="text-3xl font-bold">{st.winner === null ? tr('Draw!') : tr('{team} wins!', { team: teamLabel(st.winner) })}</div>
            <div className="text-sm">{tr('Correct answers')}: {tr('Blue team')} {st.correct[0]} · {tr('Red team')} {st.correct[1]}</div>
            {spectator && multi?.results && <ResultsTable rows={multi.results.rows} dark />}
            {spectator && !multi?.results && <div className="text-sm opacity-80">{tr('Collecting the results…')}</div>}
            <div className="flex gap-2">
              {spectator
                ? <button type="button" className="rounded-xl bg-white px-5 py-2 font-bold text-slate-900" onClick={() => multi?.onClose?.()}>{tr('Back to the room')}</button>
                : <button type="button" className="btn-primary" onClick={finish}>{tr('Finish')}</button>}
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
