import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../GameShell';
import { addCoins } from '../../../features/avatar/avatarStore';
import { ChestModal } from './ChestModal';
import { EXPLORERS, huntImageUrl, loadHuntAssets, type HuntAssets } from './huntAssets';
import { directionWords } from './huntClues';
import { HuntEngine } from './huntEngine';
import { DIFFICULTY, TIER_COINS, TIER_LABEL, buildQuestions, splitChests, type Difficulty, type HuntQuestion } from './huntQuestions';
import { generateWorld, type WorldMap } from './huntWorld';
import type { WorldId } from './huntAssets';
import { getVolume, isMuted, playMusic, playSfx, preloadSounds, setMuted as setSfxMuted, setVolume as setSfxVolume, stopMusic, stopSfx } from './huntSound';
import './treasureHunt.css';

/**
 * Treasure Hunt (solo): explore two worlds, read the clues, find the chests and
 * answer the question that locks each one.
 */

const WORLD_ORDER: WorldId[] = ['jungle', 'desert'];
const CHAR_KEY = 'lingobite:hunt:explorer';
const DIFF_KEY = 'lingobite:hunt:difficulty';

type Phase = 'loading' | 'start' | 'intro' | 'play' | 'end';

const readLS = (k: string, d: string) => {
  try {
    return window.localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const writeLS = (k: string, v: string) => {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    // storage blocked
  }
};

function ExplorerFace({ id, size = 64 }: { id: string; size?: number }) {
  const k = size / 128;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{ width: 128 * k, height: 160 * k, backgroundImage: `url(${huntImageUrl(`chars/${id}`)})`, backgroundSize: `${384 * k}px ${640 * k}px`, backgroundRepeat: 'no-repeat' }}
    />
  );
}

export function TreasureHuntGame({ items, skill, onFinish }: GameProps) {
  const [assets, setAssets] = useState<HuntAssets | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [explorer, setExplorer] = useState(() => (EXPLORERS.some((e) => e.id === readLS(CHAR_KEY, '')) ? readLS(CHAR_KEY, '') : EXPLORERS[0].id));
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (['easy', 'medium', 'hard'].includes(readLS(DIFF_KEY, '')) ? (readLS(DIFF_KEY, '') as Difficulty) : 'easy'));

  // the run
  const [worlds, setWorlds] = useState<WorldMap[]>([]);
  const [questions, setQuestions] = useState<HuntQuestion[]>([]);
  const [stage, setStage] = useState(0);
  const [chestIdx, setChestIdx] = useState(0); // inside the stage
  const [lives, setLives] = useState(3);
  const [hints, setHints] = useState(0);
  const [coins, setCoins] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [wrongHere, setWrongHere] = useState(0);
  const [won, setWon] = useState(false);
  const [modal, setModal] = useState<{ q: HuntQuestion; result: { coins: number; firstTry: boolean } | null } | null>(null);
  const [near, setNear] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [volume, setVolumeState] = useState(() => getVolume());

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<HuntEngine | null>(null);
  const finishedRef = useRef(false);
  const timers = useRef<number[]>([]);
  const stickRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let alive = true;
    void loadHuntAssets().then((a) => {
      if (!alive) return;
      setAssets(a);
      setPhase('start');
    });
    setTouch(typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window));
    return () => {
      alive = false;
      timers.current.forEach((t) => window.clearTimeout(t));
      stopMusic();
      stopSfx();
    };
  }, []);

  // ---------------------------------------------------------------- derived
  const world = worlds[stage];
  const stageChests = world?.chests.length ?? 0;
  const globalIndex = useMemo(() => {
    let n = 0;
    for (let i = 0; i < stage; i++) n += worlds[i]?.chests.length ?? 0;
    return n + chestIdx;
  }, [worlds, stage, chestIdx]);
  const totalChests = questions.length;
  const currentQ = questions[globalIndex];
  const stageStart = globalIndex - chestIdx;

  // ---------------------------------------------------------------- run control
  const startRun = () => {
    const def = DIFFICULTY[difficulty];
    const qs = buildQuestions(items, skill, difficulty);
    const [a, b] = splitChests(qs.length);
    const seed = Math.floor(Math.random() * 1e9);
    setQuestions(qs);
    setWorlds([generateWorld(WORLD_ORDER[0], seed, a), generateWorld(WORLD_ORDER[1], seed + 101, b)]);
    setStage(0);
    setChestIdx(0);
    setLives(def.lives);
    setHints(def.hints);
    setCoins(0);
    setRight(0);
    setWrong(0);
    setWrongHere(0);
    setWon(false);
    setModal(null);
    setHintText(null);
    finishedRef.current = false;
    writeLS(CHAR_KEY, explorer);
    writeLS(DIFF_KEY, difficulty);
    preloadSounds();
    setPhase('intro');
  };

  const finish = (didWin: boolean) => {
    setWon(didWin);
    setModal(null);
    engineRef.current?.setPaused(true);
    stopMusic();
    if (didWin) playSfx('victory');
    setPhase('end');
  };

  const accuracy = right + wrong === 0 ? 0 : Math.round((right / (right + wrong)) * 100);

  // ---------------------------------------------------------------- the canvas / engine
  useEffect(() => {
    if (phase !== 'play' && phase !== 'intro') return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !assets) return;
    const engine = new HuntEngine(canvas, assets);
    engineRef.current = engine;
    engine.character = explorer;
    const size = () => engine.resize(wrap.clientWidth, wrap.clientHeight);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap);
    engine.start();
    return () => {
      ro.disconnect();
      engine.stop();
      engineRef.current = null;
    };
    // the engine lives as long as the play screen; its world is set by the effect below
  }, [phase === 'play' || phase === 'intro', assets, explorer]); // eslint-disable-line react-hooks/exhaustive-deps

  // load the world of the current stage
  useEffect(() => {
    const e = engineRef.current;
    if (!e || !world) return;
    e.loadWorld(world);
    e.setTiers(questions.slice(stageStart, stageStart + stageChests).map((q) => q.tier));
    e.setActiveChest(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, phase === 'play' || phase === 'intro']);

  // which chest is active, and whether the explorer may walk
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.setActiveChest(chestIdx);
    setHintText(null);
  }, [chestIdx, world]);

  useEffect(() => {
    engineRef.current?.setPaused(phase !== 'play' || !!modal);
  }, [phase, modal]);

  // ambient music: jungle music on the jungle map, desert music on the desert map
  useEffect(() => {
    if ((phase === 'intro' || phase === 'play') && world) playMusic(world.id);
    else if (phase === 'start' || phase === 'loading') stopMusic();
  }, [phase, world?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openChest = useCallback(() => {
    if (!currentQ) return;
    setWrongHere(0);
    setModal((m) => m ?? { q: currentQ, result: null });
  }, [currentQ]);

  // engine events (kept current through a ref so the engine never holds a stale closure)
  const openRef = useRef(openChest);
  openRef.current = openChest;
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.events = {
      onBump: () => openRef.current(),
      onNear: (n) => {
        setNear(n);
        if (n) playSfx('ding'); // the explorer found the chest
      },
    };
  }, [phase === 'play' || phase === 'intro']); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- answering
  const handleAnswer = (correct: boolean) => {
    if (!modal || modal.result) return;
    const q = modal.q;
    if (!correct) {
      setWrong((n) => n + 1);
      setWrongHere((n) => n + 1);
      const left = lives - 1;
      setLives(left);
      if (left <= 0) timers.current.push(window.setTimeout(() => finish(false), 600));
      return;
    }
    const firstTry = wrongHere === 0;
    const earned = TIER_COINS[q.tier] + (firstTry ? 2 : 0);
    setRight((n) => n + 1);
    setCoins((c) => c + earned);
    addCoins(earned);
    engineRef.current?.markOpened(chestIdx);
    playSfx('open');
    setModal({ q, result: { coins: earned, firstTry } });
    timers.current.push(
      window.setTimeout(() => {
        setModal(null);
        if (chestIdx + 1 < stageChests) setChestIdx(chestIdx + 1);
        else if (stage + 1 < worlds.length) {
          setStage(stage + 1);
          setChestIdx(0);
          setPhase('intro');
        } else finish(true);
      }, 1500),
    );
  };

  // ---------------------------------------------------------------- hint
  const useHint = () => {
    const e = engineRef.current;
    if (!e || hints <= 0 || phase !== 'play') return;
    const off = e.activeOffset();
    if (!off) return;
    setHints((h) => h - 1);
    e.showHint(6);
    setHintText(`The chest is ${directionWords(off.dx, off.dy)} of you.`);
    timers.current.push(window.setTimeout(() => setHintText(null), 6000));
  };

  // ---------------------------------------------------------------- touch joystick
  const moveStick = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (clientX - (r.left + R)) / R;
    let dy = (clientY - (r.top + R)) / R;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    setKnob({ x: dx, y: dy });
    engineRef.current?.setStick(len < 0.12 ? 0 : dx, len < 0.12 ? 0 : dy);
  };
  const releaseStick = () => {
    setKnob({ x: 0, y: 0 });
    engineRef.current?.setStick(0, 0);
  };

  // ================================================================= screens
  if (phase === 'loading') return <p className="p-8 text-center text-muted-foreground">Packing the map and the explorers…</p>;

  if (phase === 'start') {
    const def = DIFFICULTY[difficulty];
    const total = Math.max(2, Math.min(def.chests, items.length));
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="font-display text-xl font-bold text-primary">🗺️ Treasure Hunt</p>
        <p className="mt-1 text-sm text-muted-foreground">Explore two worlds. Read the clues, find the hidden chests, and answer the question that locks each one.</p>

        <p className="mt-4 text-sm font-extrabold text-primary">Choose your explorer</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {EXPLORERS.map((e) => (
            <button key={e.id} type="button" onClick={() => setExplorer(e.id)} aria-pressed={explorer === e.id} className={`flex flex-col items-center rounded-2xl border-2 px-1 py-2 ${explorer === e.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'}`}>
              <ExplorerFace id={e.id} size={56} />
              <span className="mt-1 text-xs font-extrabold text-primary">{e.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-extrabold text-primary">Difficulty</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} className={`rounded-2xl border-2 px-3 py-2 text-left ${difficulty === d ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'}`}>
              <span className="block font-display font-bold text-primary">{DIFFICULTY[d].label}</span>
              <span className="block text-xs text-muted-foreground">{DIFFICULTY[d].blurb}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{total} chests in this hunt{items.length < def.chests ? ' (that is all this set has)' : ''}.</p>

        <button type="button" onClick={startRun} className="mt-4 w-full rounded-xl bg-secondary px-6 py-4 text-xl font-extrabold text-secondary-foreground shadow">
          Start the hunt
        </button>
      </div>
    );
  }

  if (phase === 'end') {
    const opened = right;
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
        <div className="mx-auto flex justify-center"><ExplorerFace id={explorer} size={96} /></div>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">{won ? 'You found all the treasure!' : 'Out of hearts!'}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{won ? 'Every chest is open. Great explorer!' : 'The hunt is over, but you opened some chests.'}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div><p className="text-xs text-muted-foreground">Chests</p><p className="font-display text-2xl font-bold text-primary">{opened}/{totalChests}</p></div>
          <div><p className="text-xs text-muted-foreground">Coins</p><p className="font-display text-2xl font-bold text-primary">🪙 {coins}</p></div>
          <div><p className="text-xs text-muted-foreground">Accuracy</p><p className="font-display text-2xl font-bold text-secondary">{accuracy}%</p></div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (finishedRef.current) return;
            finishedRef.current = true;
            onFinish(accuracy);
          }}
          className="mt-5 w-full rounded-xl bg-secondary px-6 py-3 text-lg font-extrabold text-secondary-foreground shadow"
        >
          Collect my reward
        </button>
      </div>
    );
  }

  // intro + play share the same stage (the intro card sits on top of the map)
  const def = DIFFICULTY[difficulty];
  return (
    <div>
      <div ref={wrapRef} className="hunt-stage relative w-full overflow-hidden rounded-2xl border-4 border-[#2B2B6B] bg-sky-200" style={{ height: 'min(72vh, 560px)' }}>
        <canvas ref={canvasRef} className="block h-full w-full" aria-label="Treasure map" />

        {/* sound controls: mute + volume for the ambient music */}
        <div className="absolute left-2 top-12 z-40 flex items-center gap-1.5 rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2 py-1 shadow">
          <button
            type="button"
            onClick={() => {
              const m = !muted;
              setSfxMuted(m);
              setMutedState(m);
              if (!m) setVolumeState(getVolume());
            }}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={muted}
            className="text-base leading-none"
          >
            {muted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setSfxVolume(v);
              setVolumeState(v);
              setMutedState(isMuted());
            }}
            aria-label="Music volume"
            className="h-1.5 w-16 cursor-pointer accent-[#FF9A1F] sm:w-24"
          />
        </div>

        {/* top bar */}
        <div className="pointer-events-none absolute left-2 right-2 top-2 flex items-start justify-between gap-2">
          <div className="flex gap-1.5">
            <span className="rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm" aria-label={`${lives} hearts`}>
              {Array.from({ length: def.lives }, (_, i) => (i < lives ? '❤️' : '🖤')).join('')}
            </span>
            <span className="rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm">🪙 {coins}</span>
          </div>
          <span className="rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm">
            {world?.name} · 🧰 {Math.min(globalIndex + 1, totalChests)}/{totalChests}
          </span>
        </div>

        {/* clue */}
        {phase === 'play' && world?.chests[chestIdx] && (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 mx-auto max-w-xl rounded-2xl border-2 border-[#2B2B6B] bg-[#FFF8E6]/95 p-2.5 text-center shadow-lg sm:bottom-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#7a5b00]">🧭 Clue {Math.min(globalIndex + 1, totalChests)} · {currentQ ? TIER_LABEL[currentQ.tier] : ''}</p>
            <p className="text-sm font-bold text-[#2B2B6B] sm:text-base">{world.chests[chestIdx].clue}</p>
            {hintText && <p className="mt-1 text-xs font-extrabold text-[#c2410c]">{hintText}</p>}
          </div>
        )}

        {/* controls */}
        {phase === 'play' && !modal && (
          <>
            <button
              type="button"
              onClick={useHint}
              disabled={hints <= 0}
              className="absolute right-2 top-12 rounded-full border-2 border-white/70 bg-[#FF9A1F] px-3 py-1.5 text-xs font-extrabold text-white shadow disabled:opacity-50 sm:text-sm"
            >
              🧭 Hint ({hints})
            </button>
            {near && (
              <button type="button" onClick={openChest} className="hunt-pop absolute left-1/2 top-[58%] -translate-x-1/2 rounded-2xl border-4 border-white bg-[#FF9A1F] px-6 py-3 text-lg font-extrabold text-white shadow-xl">
                🔓 Open the chest
              </button>
            )}
            {touch ? (
              <div
                ref={stickRef}
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  moveStick(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => e.buttons && moveStick(e.clientX, e.clientY)}
                onPointerUp={releaseStick}
                onPointerCancel={releaseStick}
                className="absolute bottom-24 left-3 h-28 w-28 rounded-full border-4 border-white/70 bg-black/25"
                aria-label="Move"
              >
                <span className="pointer-events-none absolute h-12 w-12 rounded-full border-4 border-white bg-[#FF9A1F] shadow" style={{ left: `calc(50% - 1.5rem + ${knob.x * 2.2}rem)`, top: `calc(50% - 1.5rem + ${knob.y * 2.2}rem)` }} />
              </div>
            ) : (
              <p className="pointer-events-none absolute bottom-24 left-3 rounded-lg bg-black/35 px-2 py-1 text-[11px] font-bold text-white">Arrow keys / WASD to walk</p>
            )}
          </>
        )}

        {/* stage intro */}
        {phase === 'intro' && world && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4">
            <div className="hunt-pop w-full max-w-sm rounded-3xl border-4 border-[#2B2B6B] bg-[#FFF8E6] p-5 text-center shadow-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#7a5b00]">World {stage + 1} of {worlds.length}</p>
              <p className="font-display text-2xl font-extrabold text-[#2B2B6B]">{world.name}</p>
              <div className="my-2 flex justify-center"><ExplorerFace id={explorer} size={72} /></div>
              <p className="text-sm text-[#2B2B6B]">{world.tagline}</p>
              <p className="mt-1 text-sm font-bold text-[#2B2B6B]">{stageChests} chest{stageChests === 1 ? '' : 's'} to find.</p>
              <button type="button" onClick={() => setPhase('play')} className="mt-3 w-full rounded-xl bg-[#FF9A1F] px-5 py-3 text-lg font-extrabold text-white shadow">Let's go!</button>
            </div>
          </div>
        )}

        {modal && <ChestModal key={modal.q.id} q={modal.q} result={modal.result} onAnswer={handleAnswer} onClose={() => setModal(null)} />}
      </div>
    </div>
  );
}
