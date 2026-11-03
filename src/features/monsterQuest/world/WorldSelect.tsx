import { levelInfo } from '../../avatar/level';
import { useMq } from '../context';
import { GameButton } from '../ui';
import { WORLDS } from './worlds';

export function WorldSelect({ onEnter }: { onEnter: (id: number) => void }) {
  const mq = useMq(), level = levelInfo(mq.state.xp).level;
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-white/85">Choose a world to explore. Each one is bigger and tougher than the last.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WORLDS.map((w) => {
          const locked = level < w.unlockLevel, soon = !w.built, off = locked || soon;
          return (
            <div key={w.id} className={`mq-worldcard ${off ? 'is-off' : ''}`}>
              <div className="mq-worldcard-art" style={{ background: `linear-gradient(135deg, ${w.colors[0]}, ${w.colors[1]} 60%, ${w.colors[2]})` }}><span>{w.id}</span></div>
              <div className="p-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-white/70">Tier {w.tier} · {w.tierName}</p>
                <p className="font-display text-lg font-extrabold text-white">{w.name}</p>
                <p className="text-xs font-semibold text-white/75">{w.blurb}</p>
                <GameButton className="mt-3 w-full" tone={off ? 'ghost' : 'green'} disabled={off} onClick={() => onEnter(w.id)}>
                  {soon ? 'Coming next' : locked ? `🔒 Trainer level ${w.unlockLevel}` : 'Enter'}
                </GameButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
