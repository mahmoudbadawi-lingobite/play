import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuestProgress } from '../contexts/GuestProgressContext';
import { getContentSet, listPublicContentSets, recordGameResult } from '../lib/services';
import { CC_MAX_PLAYERS, CC_MIN_PLAYERS, CcNet, arbiter, cleanRoomCode, makeRoomCode, makeRoster, type CcMode, type CcMulti, type CcPlayer, type CcRoomSettings, type ResultRow, type RosterEntry } from '../components/games/critterClash/ccNet';
import { CritterController } from '../components/games/critterClash/CritterController';
import { ResultsTable } from '../components/games/critterClash/ResultsTable';
import { ANIMALS, limbUrl } from '../components/games/critterClash/ccAssets';
import { CritterClashGame } from '../components/games/critterClash/CritterClashGame';
import { tr } from '../i18n/tr';
import type { ContentSet } from '../types';

/**
 * Critter Clash rooms.
 *   /critter          host a room (pick a game) or join with a code
 *   /critter/:code    the room: lobby, countdown, the match, back to the lobby
 */

const NAME_KEY = 'lingobite:critter:guestname';
const ID_KEY = 'lingobite:critter:guestid';
const ssGet = (k: string) => { try { return window.sessionStorage.getItem(k); } catch { return null; } };
const ssSet = (k: string, v: string) => { try { window.sessionStorage.setItem(k, v); } catch { /* storage blocked */ } };

function useIdentity() {
  const { profile, loading } = useAuth();
  return useMemo(() => {
    if (loading) return null;
    let id = profile?.uid ?? ssGet(ID_KEY);
    if (!id) { id = `g-${Math.random().toString(36).slice(2, 10)}`; ssSet(ID_KEY, id); }
    let name = profile?.displayName?.trim().split(/\s+/)[0] ?? ssGet(NAME_KEY);
    if (!name) { name = `Guest${Math.floor(10 + Math.random() * 90)}`; ssSet(NAME_KEY, name); }
    return { id, name: name.slice(0, 14) };
  }, [profile, loading]);
}

const roomLink = (code: string) => `${window.location.origin}${window.location.pathname.replace(/critter(\/.*)?$/, '')}critter/${code}`;

// ================================================================= /critter
export function CritterEntryPage() {
  const navigate = useNavigate();
  const { profile: me } = useAuth();
  const isTeacher = me?.role === 'teacher' || me?.role === 'admin';
  const [params] = useSearchParams();
  const presetSet = params.get('set');
  const [code, setCode] = useState('');
  const [sets, setSets] = useState<ContentSet[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => { void listPublicContentSets().then((list) => setSets(list.filter((s) => s.items.length >= 4))); }, []);

  const host = (setId: string) => navigate(`/critter/${makeRoomCode()}?host=1&set=${encodeURIComponent(setId)}`);
  const shown = (sets ?? []).filter((s) => !query.trim() || s.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm uppercase tracking-wide text-secondary">{tr('Critter Clash')}</p>
      <h1 className="font-display text-3xl font-bold text-primary">{tr('Play with friends')}</h1>
      <p className="mt-1 text-muted-foreground">{tr('Two teams. Answer questions to earn your shot and knock the other team into the water.')}</p>

      <div className="card-surface mt-6 p-5">
        <h2 className="font-display text-lg font-bold text-primary">{tr('Join a room')}</h2>
        <p className="text-sm text-muted-foreground">{tr('Type the 5-letter code your host shows you.')}</p>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.length === 5) navigate(`/critter/${code}`); }}>
          <input value={code} onChange={(e) => setCode(cleanRoomCode(e.target.value))} placeholder={tr('ABCDE')} aria-label={tr('Room code')} className="w-40 rounded-lg border-2 border-border bg-background px-3 py-2 text-center font-display text-2xl font-bold uppercase tracking-widest" />
          <button type="submit" disabled={code.length !== 5} className="rounded-lg bg-secondary px-5 py-2 text-lg font-extrabold text-secondary-foreground disabled:opacity-50">{tr('Join')}</button>
        </form>
      </div>

      <div className="card-surface mt-5 p-5">
        <h2 className="font-display text-lg font-bold text-primary">{isTeacher ? tr('Host a class match') : tr('Host a room')}</h2>
        <p className="text-sm text-muted-foreground">{tr('Pick the game whose questions the match will use.')}</p>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr('Search games…')} className="mt-3 w-full rounded-lg border-2 border-border bg-background px-3 py-2 text-sm" />
        {sets === null ? (
          <p className="mt-3 text-sm text-muted-foreground">{tr('Loading games…')}</p>
        ) : shown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{tr('No games found (a game needs at least 4 items).')}</p>
        ) : (
          <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
            {shown.map((s) => (
              <li key={s.id} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${presetSet === s.id ? 'border-secondary bg-secondary/10' : 'border-border'}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-primary">{s.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{s.skill} · {s.items.length} {tr('items')}</p>
                </div>
                <button type="button" onClick={() => host(s.id)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">{tr('Host')}</button>
              </li>
            ))}
          </ul>
        )}
        {presetSet && <button type="button" onClick={() => host(presetSet)} className="mt-3 w-full rounded-xl bg-secondary px-5 py-3 text-lg font-extrabold text-secondary-foreground">{tr('Host a room with the game you picked')}</button>}
      </div>
    </div>
  );
}

// ================================================================= /critter/:code
interface Run { roster: RosterEntry[]; id: number; mode: CcMode }

export function CritterRoomPage() {
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
  const [players, setPlayers] = useState<CcPlayer[]>([]);
  const [settings, setSettings] = useState<CcRoomSettings | null>(null);
  const [set, setSet] = useState<ContentSet | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastResult, setLastResult] = useState<{ xp: number; accuracy: number } | null>(null);
  const [net, setNet] = useState<CcNet | null>(null);
  const [results, setResults] = useState<{ rows: ResultRow[]; winner: 0 | 1 | null } | null>(null);
  const rowsRef = useRef(new Map<string, ResultRow>());
  const winnerRef = useRef<0 | 1 | null>(null);
  const publishTimer = useRef(0);
  const runRef = useRef<Run | null>(null);
  const isHostRef = useRef(false);
  const netRef = useRef<CcNet | null>(null);
  const settingsRef = useRef<CcRoomSettings | null>(null);
  const pendingRun = useRef<Run | null>(null);
  const startedAt = useRef(0);
  const runCounter = useRef(0);

  const isHost = !!players.find((p) => p.id === identity?.id)?.host;
  isHostRef.current = isHost;
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';

  /** Host: gather what every player earned, then tell everybody (and show it). */
  function publish() {
    window.clearTimeout(publishTimer.current);
    const rows = [...rowsRef.current.values()];
    if (!rows.length && !runRef.current) return;
    const payload = { rows, winner: winnerRef.current };
    netRef.current?.send({ t: 'results', ...payload });
    setResults(payload);
  }
  function addRow(row: ResultRow) {
    rowsRef.current.set(row.id, row);
    const need = runRef.current?.roster.length ?? 0;
    if (need && rowsRef.current.size >= need) publish();
    else { window.clearTimeout(publishTimer.current); publishTimer.current = window.setTimeout(publish, 6000); }
  }
  const onReport = (row: ResultRow) => { if (isHostRef.current) addRow(row); else netRef.current?.send({ t: 'stats', row }); };
  const onOver = (winner: 0 | 1 | null) => { winnerRef.current = winner; if (isHostRef.current) { window.clearTimeout(publishTimer.current); publishTimer.current = window.setTimeout(publish, 8000); } };

  const updateSettings = (patch: Partial<CcRoomSettings>) => {
    const cur = settingsRef.current; if (!cur) return;
    const next = { ...cur, ...patch };
    settingsRef.current = next; setSettings(next); netRef.current?.send({ t: 'settings', s: next });
  };

  useEffect(() => {
    if (!identity || code.length !== 5) return;
    let dead = false;
    const me: CcPlayer = { id: identity.id, name: identity.name, joinedAt: Date.now(), host: wantHost, locked: false };
    const room = new CcNet(code, me);
    netRef.current = room;
    const off = room.onMessage((m) => {
      if (m.t === 'settings') { settingsRef.current = m.s; setSettings(m.s); }
      else if (m.t === 'start') {
        runCounter.current += 1;
        pendingRun.current = { roster: m.roster, id: runCounter.current, mode: m.mode };
        startedAt.current = Date.now();
        setRun(null); setLastResult(null); setResults(null); rowsRef.current.clear(); setCountdown(3);
        room.update({ locked: true });
      } else if (m.t === 'stats') {
        if (isHostRef.current) addRow(m.row);
      } else if (m.t === 'results') setResults({ rows: m.rows, winner: m.winner });
    });
    const offPlayers = room.onPlayers((list) => { if (!dead) setPlayers(list); });
    void (async () => {
      try {
        await room.connect();
        await new Promise((r) => window.setTimeout(r, 1100));
        if (dead) return;
        const others = room.players.filter((p) => p.id !== me.id);
        if (wantHost) {
          if (others.some((p) => p.host)) throw new Error('CLASH');
        } else {
          if (!others.some((p) => p.host)) throw new Error('This room does not exist (or the host has left). Check the code and try again.');
          if (others.length >= CC_MAX_PLAYERS) throw new Error(`This room is full (${CC_MAX_PLAYERS} players).`);
          if (others.some((p) => p.locked)) throw new Error('This match has already started. Ask the host to open the room again.');
        }
        setStatus('ready');
      } catch (e) {
        if (dead) return;
        if (e instanceof Error && e.message === 'CLASH') {
          room.leave();
          navigate(`/critter/${makeRoomCode()}?host=1${hostSetId ? `&set=${encodeURIComponent(hostSetId)}` : ''}`, { replace: true });
          return;
        }
        setError(e instanceof Error ? e.message : 'Could not join the room.');
        setStatus('error');
      }
    })();
    setNet(room);
    return () => { dead = true; off(); offPlayers(); room.leave(); netRef.current = null; setNet(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity?.id, code]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { setCountdown(null); if (pendingRun.current) { runRef.current = pendingRun.current; setRun(pendingRun.current); } return; }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? c : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  // host: what the room plays
  useEffect(() => {
    if (status !== 'ready' || !wantHost || settingsRef.current || !hostSetId) return;
    let alive = true;
    void getContentSet(hostSetId).then((s) => {
      if (!alive || !s) return;
      const first: CcRoomSettings = { setId: s.id, setTitle: s.title, mode: 'map', hostPlays: !isTeacher };
      settingsRef.current = first; setSettings(first); setSet(s);
    });
    return () => { alive = false; };
  }, [status, wantHost, hostSetId]);

  // the host tells newcomers what the room is set to
  useEffect(() => {
    if (status === 'ready' && isHost && settingsRef.current) netRef.current?.send({ t: 'settings', s: settingsRef.current });
  }, [players.length, status, isHost]);

  // if the host left, the longest-standing player takes over
  useEffect(() => {
    if (status !== 'ready' || !identity || !net || players.length === 0) return;
    if (players.some((p) => p.host)) return;
    if (arbiter(players)?.id === identity.id) net.update({ host: true });
  }, [players, status, identity, net]);

  // everybody loads the questions the host picked
  useEffect(() => {
    if (!settings?.setId || set?.id === settings.setId) return;
    let alive = true;
    void getContentSet(settings.setId).then((s) => { if (alive && s) setSet(s); });
    return () => { alive = false; };
  }, [settings?.setId, set?.id]);

  const hostPlays = settings ? settings.mode === 'map' && settings.hostPlays : true;
  const participants = players.filter((p) => hostPlays || !p.host);
  const everyoneHere = participants.length >= CC_MIN_PLAYERS && players.every((p) => !p.locked);
  const canStart = isHost && !!settings && !!set && everyoneHere && players.length <= CC_MAX_PLAYERS;
  const start = () => {
    if (!canStart || !netRef.current || !settings) return;
    const order = [...players].sort((a, b) => a.joinedAt - b.joinedAt).map((p) => p.id); // same order as the pictures in the room
    const roster = makeRoster(participants).map((r) => ({ ...r, sp: ANIMALS[order.indexOf(r.id) % ANIMALS.length] as string }));
    netRef.current.send({ t: 'start', roster, mode: settings.mode });
    runCounter.current += 1;
    pendingRun.current = { roster, id: runCounter.current, mode: settings.mode };
    startedAt.current = Date.now();
    setRun(null); setLastResult(null); setResults(null); rowsRef.current.clear(); setCountdown(3);
    netRef.current.update({ locked: true });
  };

  const handleFinish = useCallback(async (accuracyPercent: number, xpOverride?: number) => {
    const s = settingsRef.current;
    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    const earned = xpOverride ?? Math.round((accuracyPercent / 100) * 50 + 10);
    setLastResult({ xp: earned, accuracy: accuracyPercent });
    if (profile && s) {
      await recordGameResult({ contentSetId: s.setId, contentSetTitle: s.setTitle, gameKey: 'critter-clash', studentId: profile.uid, studentName: profile.displayName ?? 'Player', xpEarned: earned, accuracy: accuracyPercent, durationSeconds }).catch(() => undefined);
    } else if (isGuest) addXP(earned);
    netRef.current?.update({ locked: false });
    setRun(null);
  }, [profile, isGuest, addXP]);

  // ================================================================= screens
  if (code.length !== 5) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">{tr('That room code does not look right.')}</p>
        <Link to="/critter" className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground">{tr('Back')}</Link>
      </div>
    );
  }
  if (!identity || status === 'connecting') return <p className="p-10 text-center text-muted-foreground">{tr('Opening the room…')}</p>;
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-4xl">🚪</p>
        <p className="mt-2 text-primary">{error}</p>
        <Link to="/critter" className="mt-4 inline-block rounded-lg bg-secondary px-4 py-2 font-semibold text-secondary-foreground">{tr('Back')}</Link>
      </div>
    );
  }
  if (countdown !== null) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-lg font-bold text-primary">{tr('The match starts in')}</p>
        <p className="font-display text-8xl font-extrabold text-secondary" key={countdown}>{countdown > 0 ? countdown : tr('Go!')}</p>
      </div>
    );
  }
  if (run && set && net) {
    const inRoster = run.roster.some((r) => r.id === identity.id);
    const arena = run.mode === 'arena';
    const multi: CcMulti = {
      net, roster: run.roster, meId: identity.id, isHost, spectator: !inRoster, arena, onReport, onOver, results,
      onClose: () => { netRef.current?.update({ locked: false }); setRun(null); },
    };
    return (
      <div className="mx-auto max-w-5xl px-4 py-4">
        <p className="text-sm uppercase tracking-wide text-secondary">{tr('Critter Clash')} · {tr('Room')} {code}</p>
        <div className="mt-2 ltr-always">
          {arena && inRoster
            ? <CritterController key={run.id} multi={multi} onFinish={handleFinish} />
            : <CritterClashGame key={run.id} items={set.items} skill={set.skill} onFinish={handleFinish} multi={multi} />}
        </div>
      </div>
    );
  }

  const sorted = [...players].sort((a, b) => a.joinedAt - b.joinedAt);
  const waitingOn = players.filter((p) => p.locked).length;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <p className="text-sm uppercase tracking-wide text-secondary">{tr('Critter Clash room')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-extrabold tracking-widest text-primary">{code}</h1>
        <button type="button" onClick={() => { void navigator.clipboard?.writeText(roomLink(code)); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }} className="rounded-lg border-2 border-border px-3 py-1.5 text-sm font-bold text-primary hover:border-secondary">
          {copied ? tr('Link copied!') : `🔗 ${tr('Copy invite link')}`}
        </button>
        <Link to="/critter" className="ms-auto text-sm font-semibold text-muted-foreground hover:text-primary">{tr('Leave room')}</Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{tr('Share the code or the link. {a}–{b} players.', { a: CC_MIN_PLAYERS, b: CC_MAX_PLAYERS })}</p>

      {lastResult && <p className="mt-3 rounded-xl bg-success/15 px-3 py-2 text-sm font-bold text-primary">{tr('Last match: {acc}% accuracy · +{xp} XP saved. Play again?', { acc: lastResult.accuracy, xp: lastResult.xp })}</p>}

      {results && (
        <div className="card-surface mt-4 p-4">
          <p className="font-display font-bold text-primary">{tr('Results of the last match')}{results.winner !== null ? ` · ${results.winner === 0 ? tr('Blue team') : tr('Red team')} ${tr('won')}` : ''}</p>
          <div className="mt-2"><ResultsTable rows={results.rows} /></div>
        </div>
      )}

      <div className="card-surface mt-4 p-4">
        <p className="font-display font-bold text-primary">{tr('Players in the room')} ({players.length}/{CC_MAX_PLAYERS})</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {sorted.map((p, i) => (
            <li key={p.id} className={`flex flex-col items-center rounded-2xl border-2 px-1 py-3 ${p.id === identity.id ? 'border-[#FF9A1F] bg-[#FF9A1F]/10' : 'border-border'}`}>
              <img src={limbUrl(ANIMALS[i % ANIMALS.length])} alt="" className="h-14 w-14 object-contain" draggable={false} />
              <span className="mt-1 max-w-full truncate text-xs font-extrabold text-primary">{p.host ? '👑 ' : ''}{p.name}{p.id === identity.id ? ` (${tr('you')})` : ''}</span>
              {p.locked && <span className="text-[10px] text-muted-foreground">{tr('still playing')}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card-surface mt-4 p-4">
        <p className="font-display font-bold text-primary">{tr('The match')}</p>
        {!settings ? <p className="mt-2 text-sm text-muted-foreground">{tr("Waiting for the host's settings…")}</p> : (
          <p className="mt-1 text-sm text-muted-foreground">{tr('Game')}: <b className="text-primary">{settings.setTitle}</b></p>
        )}
        {isHost && isTeacher && settings && (
          <div className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3 text-sm">
            <p className="font-semibold text-primary">{tr('Class match settings')}</p>
            <label className="flex items-start gap-2"><input type="radio" name="ccmode" checked={settings.mode === 'map'} onChange={() => updateSettings({ mode: 'map' })} />
              <span><b>{tr('Everyone sees the map')}</b><br /><span className="text-xs text-muted-foreground">{tr("Each student's device shows the match.")}</span></span></label>
            <label className="flex items-start gap-2"><input type="radio" name="ccmode" checked={settings.mode === 'arena'} onChange={() => updateSettings({ mode: 'arena', hostPlays: false })} />
              <span><b>{tr('Big screen')}</b><br /><span className="text-xs text-muted-foreground">{tr("Show this screen to the class. Students use their phones as controllers.")}</span></span></label>
            {settings.mode === 'map' && <label className="flex items-center gap-2"><input type="checkbox" checked={!settings.hostPlays} onChange={(e) => updateSettings({ hostPlays: !e.target.checked })} /> {tr("I only watch (I don't play)")}</label>}
          </div>
        )}
        {!isHost && settings && <p className="mt-2 text-xs text-muted-foreground">{settings.mode === 'arena' ? tr('Big-screen match: your phone will be the controller.') : tr('Everyone sees the map on their own device.')}</p>}
        <p className="mt-2 text-xs text-muted-foreground">{tr('Players are split into a blue and a red team when the match starts. Each turn one player answers to earn the shot, and teammates can answer too for a bonus.')}</p>
        {isHost ? (
          <>
            <button type="button" onClick={start} disabled={!canStart} className="mt-4 w-full rounded-xl bg-secondary px-6 py-4 text-xl font-extrabold text-secondary-foreground shadow disabled:opacity-50">{tr('Start the match')}</button>
            {!canStart && <p className="mt-2 text-center text-xs text-muted-foreground">{participants.length < CC_MIN_PLAYERS ? tr('Waiting for at least {n} players…', { n: CC_MIN_PLAYERS }) : waitingOn > 0 ? tr('Some players are still finishing the last match…') : !set ? tr('Loading the game…') : ''}</p>}
          </>
        ) : <p className="mt-4 rounded-xl bg-muted px-3 py-3 text-center text-sm font-bold text-primary">{tr('Waiting for the host to start the match…')}</p>}
      </div>
    </div>
  );
}
