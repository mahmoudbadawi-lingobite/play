import { supabase } from '../../../lib/supabase';
import type { GameEvent } from './ccGame';

/**
 * Live rooms for Critter Clash. Same idea as Treasure Hunt: nothing is stored, players meet on a Supabase Realtime
 * channel named after the room code (Presence = who is here, Broadcast = messages). Only turn events travel, never physics.
 */
export { cleanRoomCode, makeRoomCode } from '../treasureHunt/huntNet';

export const CC_MAX_PLAYERS = 10;
export const CC_MIN_PLAYERS = 2;

export interface CcPlayer {
  id: string;
  name: string;
  joinedAt: number;
  host: boolean;
  /** true while a match is running: nobody new can join */
  locked: boolean;
}
/**
 * 'map'   every device shows the map (the teacher may only watch)
 * 'arena' big-screen match: the host's screen shows the map, the others use their phones as controllers
 */
export type CcMode = 'map' | 'arena';
export interface CcRoomSettings { setId: string; setTitle: string; mode: CcMode; hostPlays: boolean }
export interface ResultRow { id: string; name: string; team: 0 | 1; right: number; answered: number; assists: number; xp: number }

/** What one player earned: 10 per right answer, 5 per right answer as a teammate (assist), 20 if the team won. */
export function scoreRow(p: { id: string; name: string; team: 0 | 1 }, s: { right: number; answered: number; assists: number }, winner: 0 | 1 | null): ResultRow {
  return { ...p, ...s, xp: Math.min(200, 10 * s.right + 5 * s.assists + (winner !== null && winner === p.team ? 20 : 0)) };
}
/** sp = the animal that belongs to this player (the picture shown next to their name in the room) */
export interface RosterEntry { id: string; name: string; team: 0 | 1; sp?: string }

export type CcMsg =
  | { t: 'settings'; s: CcRoomSettings }
  | { t: 'start'; roster: RosterEntry[]; mode: CcMode }
  | { t: 'ready'; id: string }
  | { t: 'ev'; e: GameEvent }
  | { t: 'ans'; id: string; pick: number; turn: number }
  | { t: 'forfeit'; id: string }
  | { t: 'cmd'; id: string; turn: number; c: 'dir' | 'hop' | 'adj' | 'fire'; v?: number; a?: number; p?: number }
  | { t: 'stats'; row: ResultRow }
  | { t: 'results'; rows: ResultRow[]; winner: 0 | 1 | null };

/** What the room page hands to a match screen. */
export interface CcMulti {
  net: CcNet; roster: RosterEntry[]; meId: string; isHost: boolean;
  /** watching only (the teacher): no controls, answers shown */
  spectator?: boolean;
  /** big-screen match: this device runs the animals, the players' phones are controllers */
  arena?: boolean;
  onReport?: (row: ResultRow) => void;
  onOver?: (winner: 0 | 1 | null) => void;
  onClose?: () => void;
  results?: { rows: ResultRow[]; winner: 0 | 1 | null } | null;
}

export const arbiter = (players: CcPlayer[]) => [...players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0] ?? null;

/** Split the players over two teams, alternating after a shuffle so the teams are as even as possible. */
export function makeRoster(players: CcPlayer[]): RosterEntry[] {
  const a = [...players];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.map((p, i) => ({ id: p.id, name: p.name, team: (i % 2) as 0 | 1 }));
}

export class CcNet {
  me: CcPlayer;
  players: CcPlayer[] = [];
  code: string;
  private send_: ((m: CcMsg) => void) | null = null;
  private track_: ((p: CcPlayer) => void) | null = null;
  private leave_: (() => void) | null = null;
  private msgCbs = new Set<(m: CcMsg) => void>();
  private playerCbs = new Set<(p: CcPlayer[]) => void>();

  constructor(code: string, me: CcPlayer) { this.code = code; this.me = me; }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const channel = supabase.channel(`critter:${this.code}`, { config: { broadcast: { self: false, ack: false }, presence: { key: this.me.id } } });
      channel.on('broadcast', { event: 'm' }, ({ payload }) => this.msgCbs.forEach((cb) => cb(payload as CcMsg)));
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, unknown[]>;
        const list: CcPlayer[] = [];
        for (const metas of Object.values(state)) {
          const last = metas[metas.length - 1] as Partial<CcPlayer> | undefined;
          if (last?.id) list.push(last as CcPlayer);
        }
        this.players = list;
        this.playerCbs.forEach((cb) => cb(list));
      });
      let settled = false;
      const fail = () => { if (!settled) { settled = true; reject(new Error('Could not reach the room. Check your connection and try again.')); } };
      const timer = window.setTimeout(fail, 12000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track(this.me).then(() => {
            if (settled) return;
            settled = true; window.clearTimeout(timer);
            this.send_ = (m) => void channel.send({ type: 'broadcast', event: 'm', payload: m });
            this.track_ = (p) => void channel.track(p);
            this.leave_ = () => void supabase.removeChannel(channel);
            resolve();
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { window.clearTimeout(timer); fail(); }
      });
    });
  }
  send(m: CcMsg) { this.send_?.(m); }
  onMessage(cb: (m: CcMsg) => void) { this.msgCbs.add(cb); return () => void this.msgCbs.delete(cb); }
  onPlayers(cb: (p: CcPlayer[]) => void) { this.playerCbs.add(cb); return () => void this.playerCbs.delete(cb); }
  update(patch: Partial<CcPlayer>) { this.me = { ...this.me, ...patch }; this.track_?.(this.me); }
  leave() { this.leave_?.(); this.leave_ = null; this.send_ = null; this.msgCbs.clear(); this.playerCbs.clear(); }
}
