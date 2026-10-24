import { supabase } from '../../../lib/supabase';
import { WORLD_IDS, type WorldId } from './huntAssets';
import type { Difficulty } from './huntQuestions';
import { rngFrom } from './huntWorld';

/**
 * Live rooms for Treasure Hunt multiplayer.
 *
 * Nothing is stored in the database: players meet on a Supabase Realtime channel named after the
 * room code (Presence = who is in the room, Broadcast = the game messages). Every player builds the
 * same worlds and questions from the shared seed, so only positions and results travel.
 */

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const makeRoomCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const cleanRoomCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

export type HuntMode = 'race' | 'coop';

export interface PlayerInfo {
  id: string;
  name: string;
  explorer: string;
  joinedAt: number;
  host: boolean;
  /** true while a game is running: nobody new can join */
  locked: boolean;
}

export interface RoomSettings {
  setId: string;
  setTitle: string;
  mode: HuntMode;
  difficulty: Difficulty;
  /** what the host picked: one world, or 'mix' for two different worlds picked at random */
  world: WorldId | 'mix';
  /** the worlds this hunt really visits (filled in when it starts) */
  worlds: WorldId[];
  seed: number;
  /** how many players were in the room when the hunt started (co-op hearts depend on it) */
  n: number;
}

/** What each player has done so far (race mode: shown in the live leaderboard). */
export interface Progress {
  id: string;
  chests: number;
  coins: number;
  right: number;
  wrong: number;
  /** ms from the start of the hunt when the last chest was opened */
  lastT: number;
  done: boolean;
  /** true when the player ran out of hearts */
  out: boolean;
}

/** The shared state of a co-op team. Only the arbiter (oldest player in the room) changes it. */
export interface TeamState {
  v: number;
  chest: number;
  lives: number;
  hints: number;
  coins: number;
  right: number;
  wrong: number;
  claim: { by: string; at: number } | null;
  scores: Record<string, { coins: number; right: number; wrong: number }>;
  over: null | 'won' | 'lost';
  lastT: number;
}

export type TeamEvent =
  | { k: 'claim'; by: string; chest: number }
  | { k: 'release'; by: string }
  | { k: 'wrong'; by: string; chest: number }
  | { k: 'correct'; by: string; chest: number; earned: number; t: number }
  | { k: 'hint'; by: string };

export type NetMsg =
  | { t: 'settings'; s: RoomSettings }
  | { t: 'start'; s: RoomSettings; roster: PlayerInfo[] }
  | { t: 'pos'; id: string; x: number; y: number; dir: number; moving: boolean; stage: number }
  | { t: 'prog'; p: Progress }
  | { t: 'ev'; e: TeamEvent }
  | { t: 'team'; s: TeamState };

/** The worlds of a hunt: the chosen one, or two different ones picked from the shared seed. */
export function resolveWorlds(world: WorldId | 'mix', seed: number): WorldId[] {
  if (world !== 'mix') return [world];
  const rng = rngFrom(seed + 7);
  const pool = [...WORLD_IDS];
  const out: WorldId[] = [];
  for (let i = 0; i < 2; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

export const CLAIM_SECONDS = 70;

export function newTeam(lives: number, hints: number): TeamState {
  return { v: 0, chest: 0, lives, hints, coins: 0, right: 0, wrong: 0, claim: null, scores: {}, over: null, lastT: 0 };
}

/** The co-op rules, applied in order by the arbiter. Returns the same object when the event changes nothing. */
export function reduceTeam(s: TeamState, e: TeamEvent, total: number, now: number): TeamState {
  if (s.over) return s;
  const expired = s.claim && now - s.claim.at > CLAIM_SECONDS * 1000;
  const claim = expired ? null : s.claim;
  const bump = (patch: Partial<TeamState>): TeamState => ({ ...s, claim, ...patch, v: s.v + 1 });
  const score = (id: string) => s.scores[id] ?? { coins: 0, right: 0, wrong: 0 };
  switch (e.k) {
    case 'claim':
      if (e.chest !== s.chest || (claim && claim.by !== e.by)) return expired ? bump({}) : s;
      return bump({ claim: { by: e.by, at: now } });
    case 'release':
      return claim && claim.by === e.by ? bump({ claim: null }) : s;
    case 'wrong': {
      if (!claim || claim.by !== e.by || e.chest !== s.chest) return s;
      const lives = s.lives - 1;
      return bump({ lives, wrong: s.wrong + 1, scores: { ...s.scores, [e.by]: { ...score(e.by), wrong: score(e.by).wrong + 1 } }, over: lives <= 0 ? 'lost' : null, claim: lives <= 0 ? null : claim });
    }
    case 'correct': {
      if (!claim || claim.by !== e.by || e.chest !== s.chest) return s;
      const chest = s.chest + 1;
      const sc = score(e.by);
      return bump({
        chest,
        coins: s.coins + e.earned,
        right: s.right + 1,
        claim: null,
        lastT: e.t,
        scores: { ...s.scores, [e.by]: { ...sc, coins: sc.coins + e.earned, right: sc.right + 1 } },
        over: chest >= total ? 'won' : null,
      });
    }
    case 'hint':
      return s.hints > 0 ? bump({ hints: s.hints - 1 }) : s;
  }
}

/** Who is in charge of the shared co-op state: the player who has been in the room the longest. */
export function arbiterOf(players: PlayerInfo[]): PlayerInfo | null {
  return [...players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0] ?? null;
}

// ------------------------------------------------------------------ transport

export interface TransportLink {
  send: (m: NetMsg) => void;
  track: (me: PlayerInfo) => void;
  leave: () => void;
}
export interface TransportHandlers {
  onMessage: (m: NetMsg) => void;
  onPlayers: (p: PlayerInfo[]) => void;
}
export type TransportFactory = (code: string, me: PlayerInfo, h: TransportHandlers) => Promise<TransportLink>;

/** Supabase Realtime: Presence for who is here, Broadcast for the messages. */
export const supabaseTransport: TransportFactory = (code, me, h) =>
  new Promise((resolve, reject) => {
    const channel = supabase.channel(`hunt:${code}`, { config: { broadcast: { self: false, ack: false }, presence: { key: me.id } } });
    channel.on('broadcast', { event: 'm' }, ({ payload }) => h.onMessage(payload as NetMsg));
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      const list: PlayerInfo[] = [];
      for (const metas of Object.values(state)) {
        const last = metas[metas.length - 1] as Partial<PlayerInfo> | undefined;
        if (last?.id) list.push(last as PlayerInfo);
      }
      h.onPlayers(list);
    });
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Could not reach the room. Check your connection and try again.'));
      }
    }, 12000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track(me).then(() => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          resolve({
            send: (m) => void channel.send({ type: 'broadcast', event: 'm', payload: m }),
            track: (info) => void channel.track(info),
            leave: () => void supabase.removeChannel(channel),
          });
        });
      } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !settled) {
        settled = true;
        window.clearTimeout(timer);
        reject(new Error('Could not reach the room. Check your connection and try again.'));
      }
    });
  });

/** One player's connection to a room. */
export class HuntNet {
  me: PlayerInfo;
  players: PlayerInfo[] = [];
  private link: TransportLink | null = null;
  private msgCbs = new Set<(m: NetMsg) => void>();
  private playerCbs = new Set<(p: PlayerInfo[]) => void>();

  code: string;
  private factory: TransportFactory;

  constructor(code: string, me: PlayerInfo, factory: TransportFactory = supabaseTransport) {
    this.code = code;
    this.me = me;
    this.factory = factory;
  }

  async connect() {
    this.link = await this.factory(this.code, this.me, {
      onMessage: (m) => this.msgCbs.forEach((cb) => cb(m)),
      onPlayers: (p) => {
        this.players = p;
        this.playerCbs.forEach((cb) => cb(p));
      },
    });
  }

  send(m: NetMsg) {
    this.link?.send(m);
  }
  onMessage(cb: (m: NetMsg) => void) {
    this.msgCbs.add(cb);
    return () => void this.msgCbs.delete(cb);
  }
  onPlayers(cb: (p: PlayerInfo[]) => void) {
    this.playerCbs.add(cb);
    return () => void this.playerCbs.delete(cb);
  }
  /** change what the others see about me (explorer, locked ...) */
  update(patch: Partial<PlayerInfo>) {
    this.me = { ...this.me, ...patch };
    this.link?.track(this.me);
  }
  leave() {
    this.link?.leave();
    this.link = null;
    this.msgCbs.clear();
    this.playerCbs.clear();
  }
}

/** Race ranking: more chests first, then who got there sooner, then more coins. */
export function rankProgress(list: Progress[]): Progress[] {
  return [...list].sort((a, b) => b.chests - a.chests || (a.lastT || 1e12) - (b.lastT || 1e12) || b.coins - a.coins);
}
