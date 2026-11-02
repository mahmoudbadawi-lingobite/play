import { useEffect, useState } from 'react';
import * as api from '../api';
import { useMq } from '../context';
import { sfx } from '../sound';
import { Bar, GameButton, Panel } from '../ui';
import type { Mission } from '../types';

export function Quests() {
  const mq = useMq();
  const [rows, setRows] = useState<Mission[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = () => api.missionsList().then(setRows).catch((e: Error) => setErr(e.message));
  useEffect(() => { void load(); }, []);

  const claim = async (m: Mission) => {
    setBusy(m.key); setErr(null);
    try { mq.setState(await api.claimMission(m.key)); sfx.coin(); await load(); } catch (e) { setErr((e as Error).message); } finally { setBusy(null); }
  };
  const group = (period: 'daily' | 'weekly') => (
    <Panel>
      <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">{period === 'daily' ? 'Daily missions' : 'Weekly missions'} <span className="ml-1 text-[11px] normal-case opacity-70">{period === 'daily' ? 'reset every day' : 'reset every Monday'} (UTC)</span></p>
      <div className="mt-2 space-y-2">
        {rows?.filter((m) => m.period === period).map((m) => {
          const done = m.progress >= m.target;
          return (
            <div key={m.key} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/10 p-3">
              <div className="min-w-[180px] flex-1">
                <p className="font-bold text-white">{m.title}</p>
                <div className="mt-1 flex items-center gap-2"><Bar pct={(m.progress / m.target) * 100} color={done ? '#22c55e' : '#facc15'} label={m.title} /><span className="text-xs font-extrabold tabular-nums text-white">{m.progress}/{m.target}</span></div>
              </div>
              <span className="text-sm font-extrabold text-yellow-300">{m.reward_coins > 0 && `${m.reward_coins} 🪙`} {m.reward_gems > 0 && `${m.reward_gems} 💎`}</span>
              {m.claimed ? <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white">✔ Claimed</span>
                : <GameButton tone={done ? 'gold' : 'ghost'} disabled={!done || busy === m.key} onClick={() => claim(m)}>Claim</GameButton>}
            </div>);
        })}
      </div>
    </Panel>
  );
  return (
    <div className="space-y-3">
      {err && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}
      {!rows && !err && <p className="font-bold text-white">Loading…</p>}
      {rows && (<>{group('daily')}{group('weekly')}<p className="text-xs font-semibold text-white/60">Achievements and special events are planned for a later update.</p></>)}
    </div>
  );
}
