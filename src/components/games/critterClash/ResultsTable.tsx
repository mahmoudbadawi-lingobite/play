import { tr } from '../../../i18n/tr';
import type { ResultRow } from './ccNet';

/** Who earned what in a match: one row per player, best first. */
export function ResultsTable({ rows, dark }: { rows: ResultRow[]; dark?: boolean }) {
  const sorted = [...rows].sort((a, b) => b.xp - a.xp || b.right - a.right);
  const th = dark ? 'text-white/70' : 'text-muted-foreground';
  return (
    <div className={`w-full max-w-2xl overflow-auto rounded-2xl ${dark ? 'bg-white/10 text-white' : 'bg-white text-slate-900'} p-3`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`text-start text-xs ${th}`}>
            <th className="px-2 py-1 text-start">{tr('Player')}</th><th className="px-2 py-1">{tr('Team')}</th><th className="px-2 py-1">{tr('Right')}</th>
            <th className="px-2 py-1">{tr('Assists')}</th><th className="px-2 py-1">{tr('Accuracy')}</th><th className="px-2 py-1">XP</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-t border-black/10 text-center">
              <td className="px-2 py-1 text-start font-semibold">{r.name}</td>
              <td className="px-2 py-1"><span className={`inline-block h-3 w-3 rounded-full ${r.team === 0 ? 'bg-sky-500' : 'bg-rose-500'}`} /></td>
              <td className="px-2 py-1">{r.right}</td>
              <td className="px-2 py-1">{r.assists}</td>
              <td className="px-2 py-1">{r.answered ? Math.round((100 * r.right) / r.answered) : 0}%</td>
              <td className="px-2 py-1 font-bold">+{r.xp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
