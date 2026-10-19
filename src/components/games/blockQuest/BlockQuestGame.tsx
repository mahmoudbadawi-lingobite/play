import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GameProps } from '../GameShell';
import { ConfettiBurst } from '../../escapeRoom/ConfettiBurst';
import { playEscapeRoomSfx, preloadEscapeRoomSfx, useEscapeRoomSfxEnabled } from '../../../lib/escapeRoomSfx';
import { addCoins, useAvatarState } from '../../../features/avatar/avatarStore';
import { buildGates, norm, speak, speechAvailable, stopSpeaking, type Phase } from './engine';
import { AnswerButtons, BossPanel, LetterTray } from './Panels';
import { S_FAR, S_NEAR } from './Scene';
import { SceneView, is3D } from './SceneView';
import { StartPanel } from './StartPanel';
import { getWorld, WORLDS } from './worlds';
import './blockQuest.css';

const APPROACH_SECS = 2.6;
const PASS_SECS = 1.15;
const SCROLL_SPEED = 1.1;
const GATE_SECONDS = 15;
const DONE_DELAY_MS = 3000;

const easeOutQuad = (p: number) => 1 - (1 - p) * (1 - p);

/** Calls `callback` every animation frame while `active` is true. */
function useFrame(callback: (dt: number, now: number) => void, active: boolean) {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  });
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      cbRef.current(dt, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

function Star({ filled, delay, size = 48 }: { filled: boolean; delay: number; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <polygon
        className={filled ? 'bq-star' : undefined}
        style={{ animationDelay: `${delay}s` }}
        points="12,2 15,9 22,9.5 16.5,14 18.5,21.5 12,17.5 5.5,21.5 7.5,14 2,9.5 9,9"
        fill={filled ? '#FFC83D' : '#D9D6E8'}
        stroke={filled ? '#8A5E00' : '#B9B5CF'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BlockQuestGame({ items, skill, onFinish }: GameProps) {
  const [searchParams] = useSearchParams();
  const raceLocked = searchParams.get('mode') === 'race';

  const gates = useMemo(() => buildGates(items, skill), [items, skill]);
  const av = useAvatarState();
  const figure = { gender: av.gender ?? ('boy' as const), look: av.looks[av.gender ?? 'boy'] };
  const [sfxEnabled, setSfxEnabled] = useEscapeRoomSfxEnabled();
  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const [worldId, setWorldId] = useState(WORLDS[0].id);
  const [raceChoice, setRaceChoice] = useState(false);
  const raceMode = raceLocked || raceChoice;

  const [phase, setPhase] = useState<Phase>('start');
  const [gateIndex, setGateIndex] = useState(0);
  const [lane, setLane] = useState(1);
  const [frame, setFrame] = useState({ s: S_FAR, scroll: 0, pass: 0 });
  const [misses, setMisses] = useState(0);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [usedTiles, setUsedTiles] = useState<string[]>([]);
  const [bonkKey, setBonkKey] = useState(0);
  const [flash, setFlash] = useState<{ key: number; text: string; tone: 'good' | 'bad' } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [gateTimeLeft, setGateTimeLeft] = useState(GATE_SECONDS);
  const [runCoins, setRunCoins] = useState(0);
  const [result, setResult] = useState<{ accuracy: number; stars: number; bonus: number; title: string } | null>(null);

  const phaseRef = useRef<Phase>('start');
  const phaseStartRef = useRef(0);
  const indexRef = useRef(0);
  const cleanRef = useRef(0);
  const finishedRef = useRef(false);
  const doneTimerRef = useRef<number | null>(null);
  const flashKeyRef = useRef(0);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const world = getWorld(worldId);
  const gate = gates[gateIndex];
  const laneGate = !!gate && (gate.kind === 'portal' || gate.kind === 'listen');
  const placed = usedTiles.length;
  const timedOut = raceMode && phase === 'ask' && gateTimeLeft <= 0;
  const hintOn = misses >= 2 || timedOut;

  const glowLane = laneGate && hintOn ? gate.options.findIndex((o) => o.correct) : null;
  let hintTileId: string | null = null;
  if (gate?.kind === 'bridge' && hintOn) {
    const expected = gate.item.term.trim()[placed];
    hintTileId = gate.letters.find((l) => !usedTiles.includes(l.id) && norm(l.char) === norm(expected ?? ''))?.id ?? null;
  }

  // ---------- helpers ----------
  const go = (next: Phase) => {
    phaseRef.current = next;
    phaseStartRef.current = performance.now();
    setPhase(next);
  };

  const showFlash = (text: string, tone: 'good' | 'bad') => {
    flashKeyRef.current += 1;
    setFlash({ key: flashKeyRef.current, text, tone });
  };

  const earn = (amount: number) => {
    addCoins(amount);
    setRunCoins((c) => c + amount);
  };

  const resetGate = () => {
    setMisses(0);
    setWrongIds([]);
    setUsedTiles([]);
    setLane(1);
    setGateTimeLeft(GATE_SECONDS);
  };

  const startRun = () => {
    indexRef.current = 0;
    cleanRef.current = 0;
    finishedRef.current = false;
    setGateIndex(0);
    resetGate();
    setElapsed(0);
    setRunCoins(0);
    setResult(null);
    setFrame({ s: S_FAR, scroll: 0, pass: 0 });
    preloadEscapeRoomSfx();
    go('approach');
  };

  const finishRun = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const accuracy = Math.round((cleanRef.current / gates.length) * 100);
    const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;
    const bonus = stars === 3 ? 20 : stars === 2 ? 10 : 5;
    earn(bonus);
    const titles = world.congrats;
    setResult({ accuracy, stars, bonus, title: titles[Math.floor(Math.random() * titles.length)] });
    playEscapeRoomSfx('detected');
    go('done');
    doneTimerRef.current = window.setTimeout(() => onFinish(accuracy), DONE_DELAY_MS);
  };

  const advance = () => {
    const next = indexRef.current + 1;
    if (next >= gates.length) {
      finishRun();
      return;
    }
    indexRef.current = next;
    setGateIndex(next);
    resetGate();
    setFrame((f) => ({ ...f, s: S_FAR, pass: 0 }));
    go('approach');
  };

  const succeed = () => {
    if (phaseRef.current !== 'ask' || !gate) return;
    const clean = misses === 0 && !timedOut;
    let coins = clean ? 5 : 2;
    if (gate.kind === 'boss') coins += 5;
    if (raceMode && clean && GATE_SECONDS - gateTimeLeft <= 6) coins += 3;
    if (clean) cleanRef.current += 1;
    earn(coins);
    playEscapeRoomSfx('correct');
    showFlash(`+${coins}`, 'good');
    go('passing');
  };

  const commitLane = (laneIdx: number) => {
    if (phaseRef.current !== 'ask' || !gate || !laneGate) return;
    const opt = gate.options[laneIdx];
    if (!opt || wrongIds.includes(opt.id)) return;
    setLane(laneIdx);
    if (opt.correct) {
      succeed();
    } else {
      playEscapeRoomSfx('mistake');
      setMisses((m) => m + 1);
      setWrongIds((w) => [...w, opt.id]);
      setBonkKey((k) => k + 1);
      showFlash('Not that one – try again', 'bad');
    }
  };

  const tapLetter = (tileId: string) => {
    if (phaseRef.current !== 'ask' || gate?.kind !== 'bridge' || usedTiles.includes(tileId)) return;
    const tile = gate.letters.find((l) => l.id === tileId);
    const expected = gate.item.term.trim()[placed];
    if (tile && expected && norm(tile.char) === norm(expected)) {
      playEscapeRoomSfx('detected');
      setUsedTiles((u) => [...u, tileId]);
      if (placed + 1 >= gate.letters.length) succeed();
    } else {
      playEscapeRoomSfx('mistake');
      setMisses((m) => m + 1);
      setBonkKey((k) => k + 1);
      showFlash('Wrong letter – try another', 'bad');
    }
  };

  const submitBoss = (text: string): boolean => {
    if (phaseRef.current !== 'ask' || !gate) return false;
    if (norm(text) === norm(gate.item.term)) {
      succeed();
      return true;
    }
    playEscapeRoomSfx('mistake');
    setMisses((m) => m + 1);
    setBonkKey((k) => k + 1);
    showFlash('Almost! Try again', 'bad');
    return false;
  };

  const moveLane = (delta: number) => {
    if ((phaseRef.current !== 'ask' && phaseRef.current !== 'approach') || !laneGate) return;
    setLane((l) => Math.min(2, Math.max(0, l + delta)));
  };

  // ---------- animation loop ----------
  useFrame((dt, now) => {
    const ph = phaseRef.current;
    const t = Math.max(0, now - phaseStartRef.current) / 1000;
    if (ph === 'approach') {
      const p = Math.min(1, t / (reduced ? 0.01 : APPROACH_SECS));
      setFrame((f) => ({
        s: S_FAR + (S_NEAR - S_FAR) * easeOutQuad(p),
        scroll: reduced ? f.scroll : f.scroll + dt * SCROLL_SPEED * (1 - p * 0.85),
        pass: 0,
      }));
      if (p >= 1) go('ask');
    } else if (ph === 'passing') {
      const p = Math.min(1, t / (reduced ? 0.01 : PASS_SECS));
      setFrame((f) => ({ ...f, scroll: reduced ? f.scroll : f.scroll + dt * SCROLL_SPEED * 1.4, pass: p }));
      if (p >= 1) advance();
    }
  }, phase === 'approach' || phase === 'passing');

  // ---------- keyboard ----------
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if ((phaseRef.current !== 'ask' && phaseRef.current !== 'approach') || !laneGate) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        commitLane(lane);
      }
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ---------- timers, speech, cleanup ----------
  const clockRunning = phase !== 'start' && phase !== 'done';
  useEffect(() => {
    if (!raceMode || !clockRunning) return;
    const id = window.setInterval(() => {
      setElapsed((e) => e + 1);
      if (phaseRef.current === 'ask') setGateTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [raceMode, clockRunning]);

  useEffect(() => {
    if (timedOut) {
      playEscapeRoomSfx('mistake');
      showFlash("Time's up – hint is on", 'bad');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  useEffect(() => {
    if (phase === 'ask' && gate?.kind === 'listen') speak(gate.item.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, gateIndex]);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 1200);
    return () => window.clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    preloadEscapeRoomSfx();
    return () => {
      stopSpeaking();
      if (doneTimerRef.current !== null) window.clearTimeout(doneTimerRef.current);
    };
  }, []);

  if (!gate) return <p className="p-6 text-center text-muted-foreground">This game needs a few more items.</p>;

  const playing = phase === 'approach' || phase === 'ask' || phase === 'passing';
  const asking = phase === 'ask';
  const bannerLabel = gate.kind === 'listen' ? 'Listen' : gate.kind === 'bridge' ? 'Build the bridge' : gate.kind === 'boss' ? 'Final gate' : 'Clue';
  const bannerHelp =
    gate.kind === 'listen'
      ? 'Tap the speaker, then pick the word you hear.'
      : gate.kind === 'bridge'
        ? 'Tap the letters in order to build the bridge.'
        : gate.kind === 'boss'
          ? 'Type the answer to open the gate.'
          : null;
  const sceneLabel = `Block Quest, ${world.name}. Gate ${gateIndex + 1} of ${gates.length}.`;
  const use3d = is3D();
  const onCoin = () => earn(1);

  return (
    <div className="relative">
      {phase === 'done' && <ConfettiBurst />}

      {/* Play area: the world with the HUD and the question laid over it */}
      <div
        className={`relative overflow-hidden rounded-3xl border-4 border-primary bg-sky-200 ${use3d ? 'aspect-[3/4] max-h-[80vh] w-full sm:aspect-[16/10]' : ''}`}
        onPointerDown={(e) => {
          swipeRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) moveLane(dx < 0 ? -1 : 1);
        }}
      >
        <SceneView
          worldId={worldId}
          figure={figure}
          phase={phase}
          gate={playing || phase === 'done' ? gate : null}
          gateKey={playing || phase === 'done' ? gate.id : ''}
          s={frame.s}
          scroll={frame.scroll}
          pass={frame.pass}
          lane={lane}
          wrongIds={wrongIds}
          glowLane={glowLane}
          placed={placed}
          bonkKey={bonkKey}
          label={sceneLabel}
          onCoin={onCoin}
          onPickLane={asking && laneGate ? commitLane : undefined}
        />

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 sm:p-3">
          <div className="flex w-28 min-w-0 flex-col gap-1 sm:w-32">
            <span className="w-fit rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-3 py-1 text-xs font-extrabold text-white shadow sm:text-sm">
              {phase === 'start' ? `${gates.length} gates` : `Gate ${Math.min(gateIndex + 1, gates.length)} / ${gates.length}`}
            </span>
            <div
              className="h-2 w-full overflow-hidden rounded-full border border-white/70 bg-[#2B2B6B]/60"
              role="progressbar"
              aria-label="Gates cleared"
              aria-valuemin={0}
              aria-valuemax={gates.length}
              aria-valuenow={phase === 'start' ? 0 : phase === 'done' ? gates.length : gateIndex}
            >
              <div
                className="h-full rounded-full bg-[#2DB36B] transition-all duration-500"
                style={{ width: `${phase === 'start' ? 0 : phase === 'done' ? 100 : (gateIndex / gates.length) * 100 + (playing ? 100 / gates.length / 2 : 0)}%` }}
              />
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5">
            {raceMode && playing && (
              <span className={`rounded-full border-2 bg-[#2B2B6B]/90 px-3 py-1 text-xs font-extrabold shadow sm:text-sm ${asking && gateTimeLeft <= 5 ? 'border-red-400 text-red-200' : 'border-white/70 text-white'}`}>
                ⏱ {asking ? `${gateTimeLeft}s` : '—'} · {elapsed}s
              </span>
            )}
            <span className="rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-3 py-1 text-xs font-extrabold text-white shadow sm:text-sm" aria-label={`${av.coins} coins`}>
              🪙 {av.coins}
            </span>
            <button
              type="button"
              onClick={() => setSfxEnabled(!sfxEnabled)}
              aria-pressed={sfxEnabled}
              aria-label={sfxEnabled ? 'Mute sounds' : 'Unmute sounds'}
              className="rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm"
            >
              {sfxEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>

        {/* Question - a small card tucked at the top so the action stays visible */}
        {playing && (
          <div className="pointer-events-none absolute inset-x-0 top-[3.1rem] flex justify-center px-2 sm:top-2">
            <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:min-w-[13rem] sm:max-w-[min(26rem,calc(100%-19rem))]">
              {gate.item.imageUrl && gate.kind !== 'listen' && (
                <img src={gate.item.imageUrl} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover sm:h-12 sm:w-16" />
              )}
              <div className="min-w-0 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="rounded-full bg-secondary px-2 py-px text-[10px] font-extrabold text-secondary-foreground">{bannerLabel}</span>
                  {gate.kind === 'listen' && speechAvailable() && (
                    <button type="button" onClick={() => speak(gate.item.term)} aria-label="Hear the word again" className="bq-btn rounded-full bg-primary px-2 py-px text-[11px] font-bold text-primary-foreground">
                      🔊 Hear it
                    </button>
                  )}
                </div>
                {gate.kind !== 'listen' && <p className="font-display text-[13px] font-bold leading-snug text-primary sm:text-[15px]">{gate.item.clue}</p>}
                {bannerHelp && <p className="text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{bannerHelp}</p>}
              </div>
            </div>
          </div>
        )}

        {flash && (
          <div
            key={flash.key}
            className="bq-pop pointer-events-none absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border-2 px-4 py-2 text-xl font-extrabold"
            style={
              flash.tone === 'good'
                ? { background: '#FFC83D', color: '#2B2B5E', borderColor: '#8A5E00' }
                : { background: '#FFE5E0', color: '#8F2A12', borderColor: '#C8421F' }
            }
          >
            {flash.tone === 'good' ? `🪙 ${flash.text}` : flash.text}
          </div>
        )}
        {phase === 'done' && result && (
          <div className="pointer-events-none absolute inset-x-2 top-12 flex justify-center sm:inset-x-auto sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
            <div className="pointer-events-auto w-full max-w-xs rounded-2xl border-2 border-primary bg-card/90 p-3 text-center shadow-xl backdrop-blur-sm sm:w-56">
              <p className="font-display text-lg font-bold leading-tight text-primary sm:text-xl">{result.title}</p>
              <div className="mt-1 flex justify-center gap-0.5" aria-label={`${result.stars} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} filled={n <= result.stars} delay={n * 0.25} size={34} />
                ))}
              </div>
              <p className="mt-1 text-sm font-bold text-primary">
                {result.accuracy}% first-try · 🪙 +{runCoins}
              </p>
              <p className="text-xs text-muted-foreground">Saving your score…</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {phase === 'start' && (
        <StartPanel worldId={worldId} onWorld={setWorldId} raceMode={raceMode} raceLocked={raceLocked} onRace={setRaceChoice} onStart={startRun} />
      )}
      {playing && laneGate && (
        <>
          <AnswerButtons options={gate.options} lane={lane} wrongIds={wrongIds} glowLane={glowLane} disabled={!asking} onPick={commitLane} />
          <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">Tip: use ← → to move and Space to jump in, or just tap an answer.</p>
        </>
      )}
      {playing && gate.kind === 'bridge' && (
        <LetterTray term={gate.item.term} letters={gate.letters} usedIds={usedTiles} placed={placed} hintId={hintTileId} disabled={!asking} onTap={tapLetter} />
      )}
      {playing && gate.kind === 'boss' && <BossPanel key={gate.id} term={gate.item.term} misses={misses} disabled={!asking} onSubmit={submitBoss} />}

      <p className="sr-only" aria-live="polite">
        {flash?.text ?? ''}
      </p>
    </div>
  );
}
