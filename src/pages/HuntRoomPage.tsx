import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuestProgress } from '../contexts/GuestProgressContext';
import { getContentSet, listPublicContentSets, recordGameResult } from '../lib/services';
import { EXPLORERS } from '../components/games/treasureHunt/huntAssets';
import { HuntNet, MAX_PLAYERS, MIN_PLAYERS, arbiterOf, cleanRoomCode, makeRoomCode, resolveWorlds, type HuntMode, type PlayerInfo, type RoomSettings } from '../components/games/treasureHunt/huntNet';
import { DIFFICULTY, chestTotal, type Difficulty } from '../components/games/treasureHunt/huntQuestions';
import { WorldPicker, capacityOf } from '../components/games/treasureHunt/WorldPicker';
import { ExplorerFace, TreasureHuntGame, type MultiSession } from '../components/games/treasureHunt/TreasureHuntGame';
import { stopMusic } from '../components/games/treasureHunt/huntSound';
import type { ContentSet } from '../types';

/**
 * Treasure Hunt rooms.
 *   /hunt            host a room (pick a game) or join with a code
 *   /hunt/:code      the room: lobby, countdown, the hunt, back to the lobby
 */

const NAME_KEY = 'lingobite:hunt:guestname';
const ID_KEY = 'lingobite:hunt:guestid';
const CHAR_KEY = 'lingobite:hunt:explorer';

const ssGet = (k: string) => {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
};
const ssSet = (k: string, v: string) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    // storage blocked
  }
};
const lsGet = (k: string) => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
};

/** Who I am in the room: my account, or a throw-away guest identity for this tab. */
function useIdentity() {
  const { profile, loading } = useAuth();
  return useMemo(() => {
    if (loading) return null;
    let id = profile?.uid ?? ssGet(ID_KEY);
    if (!id) {
      id = `g-${Math.random().toString(36).slice(2, 10)}`;
      ssSet(ID_KEY, id);
    }
    let name = profile?.displayName?.trim().split(/\s+/)[0] ?? ssGet(NAME_KEY);
    if (!name) {
      name = `Guest${Math.floor(10 + Math.random() * 90)}`;
      ssSet(NAME_KEY, name);
    }
    const saved = lsGet(CHAR_KEY);
    const explorer = EXPLORERS.some((e) => e.id === saved) ? (saved as string) : EXPLORERS[Math.floor(Math.random() * EXPLORERS.length)].id;
    return { id, name: name.slice(0, 14), explorer };
  }, [profile, loading]);
}

const roomLink = (code: string) => `${window.location.origin}${window.location.pathname.replace(/hunt(\/.*)?$/, '')}hunt/${code}`;

// ================================================================= /hunt
export function HuntEntryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetSet = params.get('set');
  const [code, setCode] = useState('');
  const [sets, setSets] = useState<ContentSet[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void listPublicContentSets().then((list) => setSets(list.filter((s) => s.items.length >= 4)));
  }, []);

  const host = (setId: string) => navigate(`/hunt/${makeRoomCode()}?host=1&set=${encodeURIComponent(setId)}`);
  const shown = (sets ?? []).filter((s) => !query.trim() || s.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm uppercase tracking-wide text-secondary">Treasure Hunt</p>
      <h1 className="font-display text-3xl font-bold text-primary">Play with friends</h1>
      <p className="mt-1 text-muted-foreground">Up to {MAX_PLAYERS} explorers in one live room. Race each other or work together as a team.</p>

      <div className="card-surface mt-6 p-5">
        <h2 className="font-display text-lg font-bold text-primary">Join a room</h2>
        <p className="text-sm text-muted-foreground">Type the 5-letter code your host shows you.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 5) navigate(`/hunt/${code}`);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(cleanRoomCode(e.target.value))}
            placeholder="ABCDE"
            aria-label="Room code"
            className="w-40 rounded-lg border-2 border-border bg-background px-3 py-2 text-center font-display text-2xl font-bold uppercase tracking-widest"
          />
          <button type="submit" disabled={code.length !== 5} className="rounded-lg bg-secondary px-5 py-2 text-lg font-extrabold text-secondary-foreground disabled:opacity-50">
            Join
          </button>
        </form>
      </div>

      <div className="card-surface mt-5 p-5">
        <h2 className="font-display text-lg font-bold text-primary">Host a room</h2>
        <p className="text-sm text-muted-foreground">Pick the game whose questions fill the chests.</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search games…" className="mt-3 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
        {sets === null ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading games…</p>
        ) : shown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No games found (a game needs at least 4 items).</p>
        ) : (
          <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
            {shown.map((s) => (
              <li key={s.id} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${presetSet === s.id ? 'border-secondary bg-secondary/10' : 'border-border'}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-primary">{s.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{s.skill} · {s.items.length} items · by {s.teacherName}</p>
                </div>
                <button type="button" onClick={() => host(s.id)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">
                  Host
                </button>
              </li>
            ))}
          </ul>
        )}
        {presetSet && (
          <button type="button" onClick={() => host(presetSet)} className="mt-3 w-full rounded-xl bg-secondary px-5 py-3 text-lg font-extrabold text-secondary-foreground">
            Host a room with the game you picked
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================= /hunt/:code
interface Run {
  settings: RoomSettings;
  roster: PlayerInfo[];
  id: number;
}

export function HuntRoomPage() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = cleanRoomCode(rawCode ?? '');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const wantHost = params.get('host') === '1';
  const hostSetId = params.get('set');
  const identity = useIdentity();
  const { profile, isGuest } = useAuth();
  const { addXP } = useGuestProgress();

  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [error, setError] = useState('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [settings, setSettings] = useState<RoomSettings | null>(null);
  const [set, setSet] = useState<ContentSet | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastResult, setLastResult] = useState<{ xp: number; accuracy: number } | null>(null);
  const netRef = useRef<HuntNet | null>(null);
  const [net, setNet] = useState<HuntNet | null>(null);
  const settingsRef = useRef<RoomSettings | null>(null);
  const startedAt = useRef(0);
  const runCounter = useRef(0);

  const isHost = !!players.find((p) => p.id === identity?.id)?.host;
  const meInfo = players.find((p) => p.id === identity?.id);

  // ---------------------------------------------------------------- connect
  useEffect(() => {
    if (!identity || code.length !== 5) return;
    let dead = false;
    const me: PlayerInfo = { id: identity.id, name: identity.name, explorer: identity.explorer, joinedAt: Date.now(), host: wantHost, locked: false };
    const room = new HuntNet(code, me);
    netRef.current = room;

    const off = room.onMessage((m) => {
      if (m.t === 'settings') {
        settingsRef.current = m.s;
        setSettings(m.s);
      } else if (m.t === 'start') {
        settingsRef.current = m.s;
        setSettings(m.s);
        runCounter.current += 1;
        setRun(null);
        setLastResult(null);
        startedAt.current = Date.now();
        setCountdown(3);
        room.update({ locked: true });
        // the roster is whatever the host saw when starting
        pendingRun.current = { settings: m.s, roster: m.roster, id: runCounter.current };
      }
    });
    const offPlayers = room.onPlayers((list) => {
      if (dead) return;
      setPlayers(list);
    });

    void (async () => {
      try {
        await room.connect();
        // give the presence list a moment to arrive
        await new Promise((r) => window.setTimeout(r, 1100));
        if (dead) return;
        const others = room.players.filter((p) => p.id !== me.id);
        if (wantHost) {
          if (others.some((p) => p.host)) throw new Error('CLASH');
        } else {
          if (!others.some((p) => p.host)) throw new Error('This room does not exist (or the host has left). Check the code and try again.');
          if (others.length >= MAX_PLAYERS) throw new Error(`This room is full (${MAX_PLAYERS} players).`);
          if (others.some((p) => p.locked)) throw new Error('This hunt has already started. Ask the host to open the room again.');
        }
        setStatus('ready');
      } catch (e) {
        if (dead) return;
        if (e instanceof Error && e.message === 'CLASH') {
          room.leave();
          navigate(`/hunt/${makeRoomCode()}?host=1${hostSetId ? `&set=${encodeURIComponent(hostSetId)}` : ''}`, { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Could not join the room.');
        setStatus('error');
      }
    })();

    setNet(room);
    return () => {
      dead = true;
      off();
      offPlayers();
      room.leave();
      stopMusic();
      netRef.current = null;
      setNet(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.id, code]);

  const pendingRun = useRef<Run | null>(null);

  // 3, 2, 1 ... then the hunt
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      if (pendingRun.current) setRun(pendingRun.current);
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? c : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  // ---------------------------------------------------------------- host: the room's settings
  useEffect(() => {
    if (status !== 'ready' || !wantHost || settingsRef.current || !hostSetId) return;
    let alive = true;
    void getContentSet(hostSetId).then((s) => {
      if (!alive || !s) return;
      const first: RoomSettings = { setId: s.id, setTitle: s.title, mode: 'race', difficulty: 'easy', world: 'mix', worlds: [], seed: 0, n: 0 };
      settingsRef.current = first;
      setSettings(first);
      setSet(s);
    });
    return () => {
      alive = false;
    };
  }, [status, wantHost, hostSetId]);

  const changeSettings = (patch: Partial<RoomSettings>) => {
    const cur = settingsRef.current;
    if (!cur || !netRef.current) return;
    const next = { ...cur, ...patch };
    settingsRef.current = next;
    setSettings(next);
    netRef.current.send({ t: 'settings', s: next });
  };

  // the host tells newcomers what the room is set to
  useEffect(() => {
    if (status === 'ready' && isHost && settingsRef.current) netRef.current?.send({ t: 'settings', s: settingsRef.current });
  }, [players.length, status, isHost]);

  // if the host left, the longest-standing player takes over
  useEffect(() => {
    if (status !== 'ready' || !identity || !net || players.length === 0) return;
    if (players.some((p) => p.host)) return;
    if (arbiterOf(players)?.id === identity.id) net.update({ host: true });
  }, [players, status, identity, net]);

  // everybody loads the questions the host picked
  useEffect(() => {
    if (!settings?.setId || set?.id === settings.setId) return;
    let alive = true;
    void getContentSet(settings.setId).then((s) => {
      if (alive && s) setSet(s);
    });
    return () => {
      alive = false;
    };
  }, [settings?.setId, set?.id]);

  // ---------------------------------------------------------------- starting
  const everyoneHere = players.length >= MIN_PLAYERS && players.every((p) => !p.locked);
  const canStart = isHost && !!settings && !!set && everyoneHere && players.length <= MAX_PLAYERS;
  const start = () => {
    if (!canStart || !netRef.current || !settingsRef.current) return;
    const roster = [...players].sort((a, b) => a.joinedAt - b.joinedAt);
    const seed = Math.floor(Math.random() * 1e9);
    const s: RoomSettings = { ...settingsRef.current, seed, worlds: resolveWorlds(settingsRef.current.world, seed), n: roster.length };
    settingsRef.current = s;
    setSettings(s);
    netRef.current.send({ t: 'start', s, roster });
    runCounter.current += 1;
    pendingRun.current = { settings: s, roster, id: runCounter.current };
    startedAt.current = Date.now();
    setRun(null);
    setLastResult(null);
    setCountdown(3);
    netRef.current.update({ locked: true });
  };

  const handleFinish = useCallback(
    async (accuracyPercent: number) => {
      const s = settingsRef.current;
      const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const earned = Math.round((accuracyPercent / 100) * 50 + 10);
      setLastResult({ xp: earned, accuracy: accuracyPercent });
      if (profile && s) {
        await recordGameResult({
          contentSetId: s.setId,
          contentSetTitle: s.setTitle,
          gameKey: 'treasure-hunt',
          studentId: profile.uid,
          studentName: profile.displayName ?? 'Player',
          xpEarned: earned,
          accuracy: accuracyPercent,
          durationSeconds,
        }).catch(() => undefined);
      } else if (isGuest) addXP(earned);
      stopMusic();
      netRef.current?.update({ locked: false });
      setRun(null);
    },
    [profile, isGuest, addXP],
  );

  const pickExplorer = (id: string) => {
    try {
      window.localStorage.setItem(CHAR_KEY, id);
    } catch {
      // storage blocked
    }
    netRef.current?.update({ explorer: id });
  };

  // ================================================================= screens
  if (code.length !== 5) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">That room code does not look right.</p>
        <Link to="/hunt" className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground">Back</Link>
      </div>
    );
  }
  if (!identity || status === 'connecting') return <p className="p-10 text-center text-muted-foreground">Opening the room…</p>;
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-4xl">🚪</p>
        <p className="mt-2 text-primary">{error}</p>
        <Link to="/hunt" className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground">Back</Link>
      </div>
    );
  }

  if (countdown !== null) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-lg font-bold text-primary">{settings?.mode === 'coop' ? 'Team hunt' : 'Race'} starts in</p>
        <p className="hunt-pop font-display text-8xl font-extrabold text-secondary" key={countdown}>{countdown > 0 ? countdown : 'Go!'}</p>
      </div>
    );
  }

  if (run && set && net) {
    const multi: MultiSession = { net, settings: run.settings, roster: run.roster };
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <p className="text-sm uppercase tracking-wide text-secondary">Treasure Hunt · {run.settings.mode === 'coop' ? 'Co-op team' : 'Race'} · Room {code}</p>
        <h1 className="font-display text-xl font-bold text-primary">{set.title}</h1>
        <div className="mt-4 ltr-always">
          <TreasureHuntGame key={run.id} items={set.items} skill={set.skill} onFinish={handleFinish} multi={multi} />
        </div>
      </div>
    );
  }

  // ---- the lobby
  const s = settings;
  const sorted = [...players].sort((a, b) => a.joinedAt - b.joinedAt);
  const total = s && set ? chestTotal(s.difficulty, set.items.length, capacityOf(s.world)) : 0;
  const waitingOn = players.filter((p) => p.locked).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-sm uppercase tracking-wide text-secondary">Treasure Hunt room</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold tracking-widest text-primary">{code}</h1>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(roomLink(code));
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          }}
          className="rounded-lg border-2 border-border px-3 py-1.5 text-sm font-bold text-primary hover:border-secondary"
        >
          {copied ? 'Link copied!' : '🔗 Copy invite link'}
        </button>
        <Link to="/hunt" className="ml-auto text-sm font-semibold text-muted-foreground hover:text-primary">Leave room</Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Share the code or the link. {MIN_PLAYERS}–{MAX_PLAYERS} players.</p>

      {lastResult && (
        <p className="mt-3 rounded-xl bg-success/15 px-3 py-2 text-sm font-bold text-primary">
          Last hunt: {lastResult.accuracy}% accuracy · +{lastResult.xp} XP saved. Play again?
        </p>
      )}

      <div className="card-surface mt-4 p-4">
        <p className="font-display font-bold text-primary">Explorers in the room ({players.length}/{MAX_PLAYERS})</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {sorted.map((p) => (
            <li key={p.id} className={`flex flex-col items-center rounded-2xl border-2 px-1 py-2 ${p.id === identity.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/10' : 'border-border'}`}>
              <ExplorerFace id={p.explorer} size={56} />
              <span className="mt-1 max-w-full truncate text-xs font-extrabold text-primary">{p.host ? '👑 ' : ''}{p.name}{p.id === identity.id ? ' (you)' : ''}</span>
              {p.locked && <span className="text-[10px] text-muted-foreground">still playing</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm font-extrabold text-primary">Your explorer</p>
        <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {EXPLORERS.map((e) => (
            <button key={e.id} type="button" onClick={() => pickExplorer(e.id)} aria-pressed={meInfo?.explorer === e.id} className={`flex flex-col items-center rounded-2xl border-2 px-1 py-1.5 ${meInfo?.explorer === e.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'}`}>
              <ExplorerFace id={e.id} size={44} />
              <span className="text-[11px] font-extrabold text-primary">{e.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card-surface mt-4 p-4">
        <p className="font-display font-bold text-primary">The hunt</p>
        {!s ? (
          <p className="mt-2 text-sm text-muted-foreground">Waiting for the host's settings…</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Game: <b className="text-primary">{s.setTitle}</b></p>

            <p className="mt-3 text-sm font-extrabold text-primary">Mode</p>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {([['race', '🏁 Race', 'Everybody hunts the same maps and questions. First to open the most chests wins.'], ['coop', '🤝 Co-op', 'One team shares the hearts. Find each chest together, one answer at a time.']] as [HuntMode, string, string][]).map(([m, label, blurb]) => (
                <button key={m} type="button" disabled={!isHost} onClick={() => changeSettings({ mode: m })} aria-pressed={s.mode === m} className={`rounded-2xl border-2 px-3 py-2 text-left ${s.mode === m ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'} disabled:cursor-default`}>
                  <span className="block font-display font-bold text-primary">{label}</span>
                  <span className="block text-xs text-muted-foreground">{blurb}</span>
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm font-extrabold text-primary">World</p>
            <WorldPicker value={s.world} disabled={!isHost} onChange={(w) => changeSettings({ world: w })} />

            <p className="mt-3 text-sm font-extrabold text-primary">Difficulty</p>
            <div className="mt-1 grid gap-2 sm:grid-cols-3">
              {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
                <button key={d} type="button" disabled={!isHost} onClick={() => changeSettings({ difficulty: d })} aria-pressed={s.difficulty === d} className={`rounded-2xl border-2 px-3 py-2 text-left ${s.difficulty === d ? 'border-[#FF9A1F] bg-[#FF9A1F]/15' : 'border-border'} disabled:cursor-default`}>
                  <span className="block font-display font-bold text-primary">{DIFFICULTY[d].label}</span>
                  <span className="block text-xs text-muted-foreground">{DIFFICULTY[d].blurb}</span>
                </button>
              ))}
            </div>
            {set && <p className="mt-2 text-xs text-muted-foreground">{total} chests in this hunt{s.mode === 'coop' ? '. The team gets one extra heart for every friend.' : '.'}</p>}
          </>
        )}

        {isHost ? (
          <>
            <button type="button" onClick={start} disabled={!canStart} className="mt-4 w-full rounded-xl bg-secondary px-6 py-4 text-xl font-extrabold text-secondary-foreground shadow disabled:opacity-50">
              Start the hunt
            </button>
            {!canStart && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {players.length < MIN_PLAYERS ? `Waiting for at least ${MIN_PLAYERS} players…` : waitingOn > 0 ? 'Some explorers are still finishing the last hunt…' : !set ? 'Loading the game…' : ''}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-muted px-3 py-3 text-center text-sm font-bold text-primary">Waiting for the host to start the hunt…</p>
        )}
      </div>
    </div>
  );
}
