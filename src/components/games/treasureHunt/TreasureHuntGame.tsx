import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../GameShell';
import { addCoins } from '../../../features/avatar/avatarStore';
import { ChestModal } from './ChestModal';
import { EXPLORERS, huntImageUrl, loadHuntAssets, type HuntAssets, type WorldId } from './huntAssets';
import { LANDMARK_LABELS, directionWords } from './huntClues';
import { HuntEngine } from './huntEngine';
import { arbiterOf, newTeam, rankProgress, reduceTeam, resolveWorlds, type HuntNet, type PlayerInfo, type Progress, type RoomSettings, type TeamEvent, type TeamState } from './huntNet';
import { DIFFICULTY, TIER_COINS, TIER_LABEL, buildQuestions, chestTotal, splitChests, type Difficulty, type HuntQuestion } from './huntQuestions';
import { generateWorld, worldCapacity, type WorldMap } from './huntWorld';
import { WorldPicker, capacityOf, isWorldChoice, randomPair, type WorldChoice } from './WorldPicker';
import { getVolume, isMuted, playMusic, playSfx, preloadSounds, setMuted as setSfxMuted, setVolume as setSfxVolume, stopMusic, stopSfx } from './huntSound';
import './treasureHunt.css';

/**
 * Treasure Hunt: explore worlds, read the clues, find the chests and answer the question that
 * locks each one. Solo, or inside a live room (`multi`): race (everyone has their own run on the
 * same maps and questions) or co-op (one team, shared hearts, one chest at a time).
 */

export interface MultiSession {
  net: HuntNet;
  settings: RoomSettings;
  /** the players that were in the room when the hunt began */
  roster: PlayerInfo[];
}

const CHAR_KEY = 'lingobite:hunt:explorer';
const DIFF_KEY = 'lingobite:hunt:difficulty';
const WORLD_KEY = 'lingobite:hunt:world';

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

export function ExplorerFace({ id, size = 64 }: { id: string; size?: number }) {
  const k = size / 128;
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0"
      style={{ width: 128 * k, height: 160 * k, backgroundImage: `url(${huntImageUrl(`chars/${id}`)})`, backgroundSize: `${384 * k}px ${640 * k}px`, backgroundRepeat: 'no-repeat' }}
    />
  );
}

interface Row {
  id: string;
  name: string;
  explorer: string;
  chests: number;
  coins: number;
  state: 'playing' | 'done' | 'out' | 'left';
  you: boolean;
}

export function TreasureHuntGame({ items, skill, onFinish, multi }: GameProps & { multi?: MultiSession }) {
  const mode = multi?.settings.mode ?? null;
  const isCoop = mode === 'coop';
  const isRace = mode === 'race';
  const me = multi?.net.me;

  const [assets, setAssets] = useState<HuntAssets | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [explorer, setExplorer] = useState(() => {
    if (me) return me.explorer;
    return EXPLORERS.some((e) => e.id === readLS(CHAR_KEY, '')) ? readLS(CHAR_KEY, '') : EXPLORERS[0].id;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (['easy', 'medium', 'hard'].includes(readLS(DIFF_KEY, '')) ? (readLS(DIFF_KEY, '') as Difficulty) : 'easy'));
  const [worldChoice, setWorldChoice] = useState<WorldChoice>(() => {
    const v = readLS(WORLD_KEY, '');
    return isWorldChoice(v) ? v : 'mix';
  });
  const runDifficulty: Difficulty = multi ? multi.settings.difficulty : difficulty;

  // the run
  const [worlds, setWorlds] = useState<WorldMap[]>([]);
  const [questions, setQuestions] = useState<HuntQuestion[]>([]);
  const [stageS, setStageS] = useState(0);
  const [chestS, setChestS] = useState(0); // inside the stage
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

  // multiplayer
  const [team, setTeam] = useState<TeamState | null>(null);
  const teamRef = useRef<TeamState | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [live, setLive] = useState<string[]>(() => multi?.net.players.map((p) => p.id) ?? []);
  const [boardOpen, setBoardOpen] = useState(true);
  const [placeBonus, setPlaceBonus] = useState(0);
  const t0 = useRef(0);
  const prevChest = useRef(0);
  const lastStage = useRef(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<HuntEngine | null>(null);
  const finishedRef = useRef(false);
  const endedRef = useRef(false);
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
  const locate = useCallback(
    (g: number) => {
      let rest = g;
      for (let i = 0; i < worlds.length; i++) {
        const n = worlds[i].chests.length;
        if (rest < n) return { stage: i, idx: rest };
        rest -= n;
      }
      return { stage: Math.max(0, worlds.length - 1), idx: Math.max(0, (worlds[worlds.length - 1]?.chests.length ?? 1) - 1) };
    },
    [worlds],
  );
  const loc = isCoop && team ? locate(team.chest) : null;
  const stage = loc ? loc.stage : stageS;
  const chestIdx = loc ? loc.idx : chestS;
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
  const claimBy = isCoop ? team?.claim?.by ?? null : null;
  const claimer = claimBy && claimBy !== me?.id ? multi?.roster.find((p) => p.id === claimBy)?.name ?? 'A teammate' : null;
  const livesShown = isCoop && team ? team.lives : lives;
  const hintsShown = isCoop && team ? team.hints : hints;
  const coinsShown = isCoop && team ? team.coins : coins;

  const stageRef = useRef(stage);
  stageRef.current = stage;

  // ---------------------------------------------------------------- sending to the room
  const sendProgress = useCallback(
    (patch: Partial<Progress> = {}) => {
      if (!multi || !me || !isRace) return;
      const prev = progressRef.current[me.id];
      const base: Progress = { id: me.id, chests: 0, coins: 0, right: 0, wrong: 0, lastT: 0, done: false, out: false };
      const p: Progress = { ...base, ...prev, ...patch };
      progressRef.current = { ...progressRef.current, [me.id]: p };
      setProgress(progressRef.current);
      multi.net.send({ t: 'prog', p });
    },
    [multi, me, isRace],
  );
  const progressRef = useRef<Record<string, Progress>>({});

  /** Co-op: every change goes through the arbiter, which rules on it and tells everybody. */
  const teamEvent = useCallback(
    (e: TeamEvent) => {
      if (!multi || !me) return;
      const arbiter = arbiterOf(multi.net.players);
      if (arbiter && arbiter.id !== me.id) {
        multi.net.send({ t: 'ev', e });
        return;
      }
      const cur = teamRef.current;
      if (!cur) return;
      const next = reduceTeam(cur, e, questions.length, Date.now());
      if (next !== cur) {
        teamRef.current = next;
        setTeam(next);
        multi.net.send({ t: 'team', s: next });
      }
    },
    [multi, me, questions.length],
  );
  const teamEventRef = useRef(teamEvent);
  teamEventRef.current = teamEvent;

  // ---------------------------------------------------------------- run control
  const startRun = () => {
    const seed = multi ? multi.settings.seed : Math.floor(Math.random() * 1e9);
    // which worlds this hunt visits (in a room everybody gets the same ones)
    const ids: WorldId[] = multi ? (multi.settings.worlds.length ? multi.settings.worlds : resolveWorlds(multi.settings.world, seed)) : worldChoice === 'mix' ? randomPair() : [worldChoice];
    const diff = runDifficulty;
    const def = DIFFICULTY[diff];
    const room = ids.reduce((n, id) => n + worldCapacity(id), 0);
    const total = chestTotal(diff, items.length, room);
    const qs = buildQuestions(items, skill, diff, total, multi ? seed : undefined);
    const split = ids.length === 1 ? [qs.length] : splitChests(qs.length, ids.length);
    setQuestions(qs);
    setWorlds(ids.map((id, i) => generateWorld(id, seed + 101 * i, split[i])));
    setStageS(0);
    setChestS(0);
    const startLives = isCoop && multi ? def.lives + Math.max(0, multi.settings.n - 1) : def.lives;
    setLives(startLives);
    setHints(def.hints);
    setCoins(0);
    setRight(0);
    setWrong(0);
    setWrongHere(0);
    setWon(false);
    setModal(null);
    setHintText(null);
    setPlaceBonus(0);
    finishedRef.current = false;
    endedRef.current = false;
    lastStage.current = 0;
    prevChest.current = 0;
    t0.current = Date.now();
    if (isCoop) {
      const t = newTeam(startLives, def.hints);
      teamRef.current = t;
      setTeam(t);
    } else {
      setTeam(null);
      teamRef.current = null;
    }
    progressRef.current = {};
    setProgress({});
    if (!multi) {
      writeLS(CHAR_KEY, explorer);
      writeLS(DIFF_KEY, difficulty);
      writeLS(WORLD_KEY, worldChoice);
    }
    preloadSounds(ids);
    // the pictures of the chosen world(s) are only fetched now (the first time they are needed)
    setPhase('loading');
    void loadHuntAssets(ids).then((a) => {
      setAssets(a);
      setPhase('intro');
    });
  };

  // inside a room the hunt starts by itself as soon as the pictures are ready
  const autoStarted = useRef(false);
  useEffect(() => {
    if (multi && phase === 'start' && !autoStarted.current) {
      autoStarted.current = true;
      startRun();
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (didWin: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setWon(didWin);
    setModal(null);
    engineRef.current?.setPaused(true);
    stopMusic();
    if (didWin) playSfx('victory');
    if (isRace) sendProgress({ done: true, out: !didWin });
    setPhase('end');
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const accuracy = isCoop && team ? (team.right + team.wrong === 0 ? 0 : Math.round((team.right / (team.right + team.wrong)) * 100)) : right + wrong === 0 ? 0 : Math.round((right / (right + wrong)) * 100);

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
    // co-op: chests that are already open stay open
    if (isCoop && team) for (let i = 0; i < chestIdx; i++) e.markOpened(i, true);
    e.setActiveChest(chestIdx);
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

  // ambient music: each world has its own loop
  useEffect(() => {
    if ((phase === 'intro' || phase === 'play') && world) playMusic(world.id);
    else if (phase === 'start' || phase === 'loading') stopMusic();
  }, [phase, world?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // in a room the world card closes by itself so nobody holds the others back
  useEffect(() => {
    if (!multi || phase !== 'intro') return;
    const t = window.setTimeout(() => setPhase('play'), 2600);
    return () => window.clearTimeout(t);
  }, [multi, phase, stage]);

  // co-op: a new world starts for everybody together
  useEffect(() => {
    if (!isCoop || !team) return;
    if (stage !== lastStage.current) {
      lastStage.current = stage;
      setPhase((p) => (p === 'play' ? 'intro' : p));
    }
  }, [isCoop, team, stage]);

  const openChest = useCallback(() => {
    if (!currentQ) return;
    if (isCoop && me) {
      const t = teamRef.current;
      if (t?.claim && t.claim.by !== me.id && Date.now() - t.claim.at < 70000) return;
      teamEventRef.current({ k: 'claim', by: me.id, chest: t?.chest ?? 0 });
      return;
    }
    setWrongHere(0);
    setModal((m) => m ?? { q: currentQ, result: null });
  }, [currentQ, isCoop, me]);

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

  // ---------------------------------------------------------------- the room: listening
  const ghostInfo = useRef(new Map<string, { stage: number; done: boolean }>());
  useEffect(() => {
    if (!multi || !me) return;
    const net = multi.net;
    const offMsg = net.onMessage((m) => {
      if (m.t === 'pos') {
        if (m.id === me.id) return;
        const e = engineRef.current;
        const info = multi.roster.find((p) => p.id === m.id);
        const meta = ghostInfo.current.get(m.id);
        ghostInfo.current.set(m.id, { stage: m.stage, done: meta?.done ?? false });
        if (!e || !info) return;
        if (m.stage !== stageRef.current || meta?.done) e.removeGhost(m.id);
        else e.setGhost({ id: m.id, name: info.name, character: info.explorer, x: m.x, y: m.y, dir: m.dir, moving: m.moving });
      } else if (m.t === 'prog') {
        if (m.p.id === me.id) return;
        progressRef.current = { ...progressRef.current, [m.p.id]: m.p };
        setProgress(progressRef.current);
        if (m.p.done) {
          ghostInfo.current.set(m.p.id, { stage: 0, done: true });
          engineRef.current?.removeGhost(m.p.id);
        }
      } else if (m.t === 'ev') {
        // only the arbiter rules on events
        const arbiter = arbiterOf(net.players);
        if (arbiter?.id !== me.id) return;
        const cur = teamRef.current;
        if (!cur) return;
        const next = reduceTeam(cur, m.e, questionsRef.current.length, Date.now());
        if (next !== cur) {
          teamRef.current = next;
          setTeam(next);
          net.send({ t: 'team', s: next });
        }
      } else if (m.t === 'team') {
        const cur = teamRef.current;
        if (!cur || m.s.v >= cur.v) {
          teamRef.current = m.s;
          setTeam(m.s);
        }
      }
    });
    const offPlayers = net.onPlayers((list) => {
      const ids = list.map((p) => p.id);
      setLive(ids);
      for (const id of [...ghostInfo.current.keys()]) if (!ids.includes(id)) engineRef.current?.removeGhost(id);
      // co-op: if the player who holds a chest has left, it is free again
      const t = teamRef.current;
      const arbiter = arbiterOf(list);
      if (isCoop && t?.claim && !ids.includes(t.claim.by) && arbiter?.id === me.id) {
        const next = { ...t, claim: null, v: t.v + 1 };
        teamRef.current = next;
        setTeam(next);
        net.send({ t: 'team', s: next });
      }
    });
    return () => {
      offMsg();
      offPlayers();
    };
  }, [multi, me, isCoop]);
  const questionsRef = useRef<HuntQuestion[]>([]);
  questionsRef.current = questions;

  // sending my position (a few times a second) and a heartbeat of my progress
  useEffect(() => {
    if (!multi || !me || phase === 'end' || phase === 'loading' || phase === 'start') return;
    let last = '';
    const pos = window.setInterval(() => {
      const e = engineRef.current;
      if (!e) return;
      const s = e.getState();
      const key = `${s.x.toFixed(2)},${s.y.toFixed(2)},${s.dir},${s.moving},${stageRef.current}`;
      if (key === last) return;
      last = key;
      multi.net.send({ t: 'pos', id: me.id, x: s.x, y: s.y, dir: s.dir, moving: s.moving, stage: stageRef.current });
    }, 250);
    const beat = window.setInterval(() => {
      if (isRace) sendProgress({});
      else if (isCoop && teamRef.current && arbiterOf(multi.net.players)?.id === me.id) multi.net.send({ t: 'team', s: teamRef.current });
    }, 4000);
    return () => {
      window.clearInterval(pos);
      window.clearInterval(beat);
    };
  }, [multi, me, phase, isRace, isCoop, sendProgress]);

  // co-op: reacting to what the team state says
  useEffect(() => {
    if (!isCoop || !team || !me) return;
    // a chest was opened (by anyone)
    if (team.chest > prevChest.current) {
      for (let g = prevChest.current; g < team.chest; g++) {
        const l = locate(g);
        if (l.stage === stageRef.current) engineRef.current?.markOpened(l.idx);
      }
      playSfx('open');
      prevChest.current = team.chest;
    }
    if (team.over) {
      finishRef.current(team.over === 'won');
      return;
    }
    // I hold the chest: show its question
    const mine = team.claim?.by === me.id;
    if (mine && !modal && currentQ && phase === 'play') {
      setWrongHere(0);
      setModal({ q: currentQ, result: null });
    } else if (!mine && modal && !modal.result) {
      setModal(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  // ---------------------------------------------------------------- answering
  const handleAnswer = (correct: boolean) => {
    if (!modal || modal.result) return;
    const q = modal.q;
    if (!correct) {
      setWrongHere((n) => n + 1);
      if (isCoop && me) {
        teamEvent({ k: 'wrong', by: me.id, chest: team?.chest ?? 0 });
        return;
      }
      setWrong((n) => n + 1);
      const left = lives - 1;
      setLives(left);
      if (isRace) sendProgress({ wrong: wrong + 1 });
      if (left <= 0) timers.current.push(window.setTimeout(() => finish(false), 600));
      return;
    }
    const found = world ? LANDMARK_LABELS[world.id]?.[world.chests[chestIdx]?.landmark ?? ''] : undefined;
    const firstTry = wrongHere === 0;
    const earned = TIER_COINS[q.tier] + (firstTry ? 2 : 0);
    addCoins(earned);
    if (isCoop && me) {
      setModal({ q, result: { coins: earned, firstTry } });
      teamEvent({ k: 'correct', by: me.id, chest: team?.chest ?? 0, earned, t: Date.now() - t0.current });
      timers.current.push(window.setTimeout(() => setModal(null), found ? 2600 : 1500));
      return;
    }
    setRight((n) => n + 1);
    setCoins((c) => c + earned);
    engineRef.current?.markOpened(chestIdx);
    playSfx('open');
    setModal({ q, result: { coins: earned, firstTry } });
    const nextChests = right + 1;
    if (isRace) sendProgress({ chests: nextChests, right: nextChests, coins: coins + earned, lastT: Date.now() - t0.current });
    timers.current.push(
      window.setTimeout(() => {
        setModal(null);
        if (chestIdx + 1 < stageChests) setChestS(chestIdx + 1);
        else if (stage + 1 < worlds.length) {
          setStageS(stage + 1);
          setChestS(0);
          setPhase('intro');
        } else finish(true);
      }, found ? 2600 : 1500),
    );
  };

  const closeModal = () => {
    if (isCoop && me && modal && !modal.result) teamEvent({ k: 'release', by: me.id });
    setModal(null);
  };

  // ---------------------------------------------------------------- hint
  const useHint = () => {
    const e = engineRef.current;
    if (!e || hintsShown <= 0 || phase !== 'play') return;
    const off = e.activeOffset();
    if (!off) return;
    if (isCoop && me) teamEvent({ k: 'hint', by: me.id });
    else setHints((h) => h - 1);
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

  // ---------------------------------------------------------------- the leaderboard
  const rows: Row[] = useMemo(() => {
    if (!multi || !me) return [];
    const roster = multi.roster;
    if (isCoop) {
      const list: Row[] = roster.map((p) => ({
        id: p.id,
        name: p.name,
        explorer: p.explorer,
        chests: team?.scores[p.id]?.right ?? 0,
        coins: team?.scores[p.id]?.coins ?? 0,
        state: live.includes(p.id) ? 'playing' : 'left',
        you: p.id === me.id,
      }));
      return list.sort((a, b) => b.coins - a.coins || b.chests - a.chests);
    }
    const prog: Progress[] = roster.map((p) => progress[p.id] ?? { id: p.id, chests: 0, coins: 0, right: 0, wrong: 0, lastT: 0, done: false, out: false });
    return rankProgress(prog).map((p) => {
      const info = roster.find((r) => r.id === p.id) as PlayerInfo;
      return {
        id: p.id,
        name: info.name,
        explorer: info.explorer,
        chests: p.chests,
        coins: p.coins,
        state: p.out ? 'out' : p.done ? 'done' : live.includes(p.id) ? 'playing' : 'left',
        you: p.id === me.id,
      } as Row;
    });
  }, [multi, me, isCoop, team, progress, live]);
  const everyoneDone = isCoop || rows.every((r) => r.state !== 'playing');
  const myPlace = rows.findIndex((r) => r.you) + 1;

  // ================================================================= screens
  if (phase === 'loading') return <p className="p-8 text-center text-muted-foreground">Packing the map and the explorers…</p>;

  if (phase === 'start' && multi) return <p className="p-8 text-center text-muted-foreground">Getting the worlds ready…</p>;

  if (phase === 'start') {
    const def = DIFFICULTY[difficulty];
    const room = capacityOf(worldChoice);
    const total = chestTotal(difficulty, items.length, room);
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="font-display text-xl font-bold text-primary">🗺️ Treasure Hunt</p>
        <p className="mt-1 text-sm text-muted-foreground">Pick a world. Read the clues, find the hidden chests, and answer the question that locks each one.</p>

        <p className="mt-4 text-sm font-extrabold text-primary">Choose your explorer</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {EXPLORERS.map((e) => (
            <button key={e.id} type="button" onClick={() => setExplorer(e.id)} aria-pressed={explorer === e.id} className={`flex flex-col items-center rounded-2xl border-2 px-1 py-2 ${explorer === e.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'}`}>
              <ExplorerFace id={e.id} size={56} />
              <span className="mt-1 text-xs font-extrabold text-primary">{e.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-extrabold text-primary">Choose your world</p>
        <WorldPicker value={worldChoice} onChange={setWorldChoice} />

        <p className="mt-4 text-sm font-extrabold text-primary">Difficulty</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} className={`rounded-2xl border-2 px-3 py-2 text-left ${difficulty === d ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'}`}>
              <span className="block font-display font-bold text-primary">{DIFFICULTY[d].label}</span>
              <span className="block text-xs text-muted-foreground">{DIFFICULTY[d].blurb}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {total} chests in this hunt
          {items.length < def.chests ? ' (that is all this set has)' : room < def.chests ? ` (this world has ${room} landmarks)` : ''}.
        </p>

        <button type="button" onClick={startRun} className="mt-4 w-full rounded-xl bg-secondary px-6 py-4 text-xl font-extrabold text-secondary-foreground shadow">
          Start the hunt
        </button>
      </div>
    );
  }

  if (phase === 'end') {
    const opened = isCoop && team ? team.right : right;
    const medal = (n: number) => (n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : `${n}.`);
    return (
      <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
        <div className="mx-auto flex justify-center"><ExplorerFace id={explorer} size={96} /></div>
        <h2 className="mt-2 font-display text-2xl font-bold text-primary">
          {isCoop ? (won ? 'Your team found all the treasure!' : 'The team is out of hearts!') : won ? 'You found all the treasure!' : 'Out of hearts!'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRace
            ? everyoneDone
              ? myPlace === 1 && opened > 0
                ? 'You won the race!'
                : `You finished number ${myPlace}.`
              : 'Waiting for the other explorers to finish…'
            : won
              ? isCoop
                ? 'Every chest is open. Great teamwork!'
                : 'Every chest is open. Great explorer!'
              : 'The hunt is over, but some chests were opened.'}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div><p className="text-xs text-muted-foreground">Chests</p><p className="font-display text-2xl font-bold text-primary">{opened}/{totalChests}</p></div>
          <div><p className="text-xs text-muted-foreground">Coins</p><p className="font-display text-2xl font-bold text-primary">🪙 {isCoop ? team?.coins ?? 0 : coins}</p></div>
          <div><p className="text-xs text-muted-foreground">Accuracy</p><p className="font-display text-2xl font-bold text-secondary">{accuracy}%</p></div>
        </div>

        {multi && (
          <div className="mt-4 rounded-2xl border-2 border-border p-2 text-left">
            <p className="px-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{isCoop ? 'Who helped the team' : 'Race results'}</p>
            {rows.map((r, i) => (
              <div key={r.id} className={`mt-1 flex items-center gap-2 rounded-xl px-2 py-1 ${r.you ? 'bg-[#FF9A1F]/15' : ''}`}>
                <span className="w-7 text-center text-lg">{medal(i + 1)}</span>
                <ExplorerFace id={r.explorer} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-primary">{r.name}{r.you ? ' (you)' : ''}</span>
                <span className="text-xs text-muted-foreground">{isCoop ? '' : r.state === 'playing' ? 'still playing…' : r.state === 'left' ? 'left' : r.state === 'out' ? 'out of hearts' : ''}</span>
                <span className="text-sm font-extrabold text-primary">🧰 {r.chests} · 🪙 {r.coins}</span>
              </div>
            ))}
          </div>
        )}
        {placeBonus > 0 && <p className="mt-2 text-sm font-extrabold text-[#c2410c]">+{placeBonus} bonus coins for your place!</p>}

        <button
          type="button"
          onClick={() => {
            if (finishedRef.current && !multi) return;
            if (multi && isRace && everyoneDone && opened > 0 && placeBonus === 0 && myPlace <= 3) {
              const bonus = myPlace === 1 ? 10 : myPlace === 2 ? 6 : 3;
              addCoins(bonus);
              setPlaceBonus(bonus);
            }
            finishedRef.current = true;
            onFinish(accuracy);
          }}
          className="mt-5 w-full rounded-xl bg-secondary px-6 py-3 text-lg font-extrabold text-secondary-foreground shadow"
        >
          {multi ? 'Collect my reward and go back to the room' : 'Collect my reward'}
        </button>
      </div>
    );
  }

  // intro + play share the same stage (the intro card sits on top of the map)
  const def = DIFFICULTY[runDifficulty];
  const pill = 'rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-1 text-xs font-extrabold text-white shadow sm:text-sm';
  const lifeSlots = isCoop && multi ? def.lives + Math.max(0, multi.settings.n - 1) : def.lives;
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
            <span className={pill} aria-label={`${livesShown} hearts`}>
              {Array.from({ length: lifeSlots }, (_, i) => (i < livesShown ? '❤️' : '🖤')).join('')}
            </span>
            <span className={pill}>🪙 {coinsShown}</span>
          </div>
          <span className={pill}>
            {world?.name} · 🧰 {Math.min(globalIndex + 1, totalChests)}/{totalChests}
          </span>
        </div>

        {/* live leaderboard (rooms only) */}
        {multi && phase === 'play' && (
          <div className="absolute right-2 top-[5.5rem] z-30 w-44 max-w-[46%] text-white sm:top-24">
            <button type="button" onClick={() => setBoardOpen((o) => !o)} className="ml-auto flex items-center gap-1 rounded-full border-2 border-white/70 bg-[#2B2B6B]/90 px-2.5 py-0.5 text-xs font-extrabold shadow" aria-expanded={boardOpen}>
              🏆 {isCoop ? 'Team' : 'Race'} {boardOpen ? '▾' : '▸'}
            </button>
            {boardOpen && (
              <ol className="mt-1 space-y-0.5 rounded-xl border-2 border-white/60 bg-[#2B2B6B]/85 p-1.5 shadow">
                {rows.map((r, i) => (
                  <li key={r.id} className={`flex items-center gap-1 rounded-lg px-1 py-0.5 text-[11px] font-bold ${r.you ? 'bg-[#FF9A1F]/70' : ''} ${r.state === 'left' ? 'opacity-50' : ''}`}>
                    <span className="w-4 text-center">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span>{r.state === 'done' ? '🏁' : r.state === 'out' ? '💔' : r.state === 'left' ? '🚪' : ''}🧰{r.chests}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* clue */}
        {phase === 'play' && world?.chests[chestIdx] && (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 mx-auto max-w-xl rounded-2xl border-2 border-[#2B2B6B] bg-[#FFF8E6]/95 p-2.5 text-center shadow-lg sm:bottom-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#7a5b00]">🧭 Clue {Math.min(globalIndex + 1, totalChests)} · {currentQ ? TIER_LABEL[currentQ.tier] : ''}</p>
            <p className="text-sm font-bold text-[#2B2B6B] sm:text-base">{world.chests[chestIdx].clue}</p>
            {claimer && <p className="mt-1 text-xs font-extrabold text-[#2563eb]">🔒 {claimer} is answering this chest…</p>}
            {hintText && <p className="mt-1 text-xs font-extrabold text-[#c2410c]">{hintText}</p>}
          </div>
        )}

        {/* controls */}
        {phase === 'play' && !modal && (
          <>
            <button
              type="button"
              onClick={useHint}
              disabled={hintsShown <= 0}
              className="absolute right-2 top-12 rounded-full border-2 border-white/70 bg-[#FF9A1F] px-3 py-1.5 text-xs font-extrabold text-white shadow disabled:opacity-50 sm:text-sm"
            >
              🧭 Hint ({hintsShown})
            </button>
            {near && !claimer && (
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
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#7a5b00]">{worlds.length === 1 ? 'Your world' : `World ${stage + 1} of ${worlds.length}`}</p>
              <p className="font-display text-2xl font-extrabold text-[#2B2B6B]">{world.name}</p>
              <div className="my-2 flex justify-center"><ExplorerFace id={explorer} size={72} /></div>
              <p className="text-sm text-[#2B2B6B]">{world.tagline}</p>
              <p className="mt-1 text-sm font-bold text-[#2B2B6B]">{stageChests} chest{stageChests === 1 ? '' : 's'} to find.</p>
              {multi ? (
                <p className="mt-3 text-sm font-extrabold text-[#c2410c]">Get ready…</p>
              ) : (
                <button type="button" onClick={() => setPhase('play')} className="mt-3 w-full rounded-xl bg-[#FF9A1F] px-5 py-3 text-lg font-extrabold text-white shadow">Let's go!</button>
              )}
            </div>
          </div>
        )}

        {modal && <ChestModal key={modal.q.id} q={modal.q} result={modal.result} place={modal.result && world ? LANDMARK_LABELS[world.id]?.[world.chests[chestIdx]?.landmark ?? ''] : null} onAnswer={handleAnswer} onClose={closeModal} />}
      </div>
    </div>
  );
}
