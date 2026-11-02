import { useEffect, useState } from 'react';
import * as api from '../api';
import { useMq } from '../context';
import { GameButton, Panel, fmt } from '../ui';

type Kind = 'xp' | 'monsters' | 'weekly';
const TABS: { k: Kind; label: string; unit: string }[] = [
  { k: 'xp', label: 'Highest XP', unit: 'XP' }, { k: 'monsters', label: 'Most monsters', unit: 'monsters' }, { k: 'weekly', label: 'This week', unit: 'caught' },
];

export function Leaderboard() {
  const { userId } = useMq();
  const [kind, setKind] = useState<Kind>('xp');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.leaderboard>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setRows(null); setErr(null); api.leaderboard(kind).then(setRows).catch((e: Error) => setErr(e.message)); }, [kind]);
  const unit = TABS.find((t) => t.k === kind)!.unit;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">{TABS.map((t) => <GameButton key={t.k} tone={kind === t.k ? 'gold' : 'ghost'} onClick={() => setKind(t.k)}>{t.label}</GameButton>)}</div>
      <Panel>
        {err && <p className="font-bold text-red-300">{err}</p>}
        {!rows && !err && <p className="font-bold text-white/80">Loading…</p>}
        {rows && rows.length === 0 && <p className="font-bold text-white/80">No one is on this board yet. Be the first!</p>}
        <ol className="space-y-1.5">
          {rows?.map((r) => (
            <li key={r.user_id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${r.user_id === userId ? 'bg-yellow-300/25 ring-2 ring-yellow-300' : 'bg-white/10'}`}>
              <span className="w-8 text-center text-lg font-extrabold text-white">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
              <span className="min-w-0 flex-1 truncate font-bold text-white">{r.display_name ?? 'Trainer'}</span>
              <span className="text-xs font-bold text-white/70">Lv. {r.level}</span>
              <span className="w-24 text-right font-extrabold tabular-nums text-yellow-300">{fmt(Number(r.value))} <span className="text-[10px] opacity-70">{unit}</span></span>
            </li>))}
        </ol>
        <p className="mt-3 text-xs font-semibold text-white/60">Battle wins and ranked points will join the board when the Battle Arena opens.</p>
      </Panel>
    </div>
  );
}
