import { Link } from 'react-router-dom';
import { levelInfo } from '../../avatar/level';
import { CharacterAvatar } from '../art/CharacterAvatar';
import { MonsterArt } from '../art/MonsterArt';
import { useMq } from '../context';
import { Bar, Panel, RarityBadge, fmt } from '../ui';

export function Dashboard() {
  const { state, monsters, speciesById, name, isStaff, species } = useMq();
  const lv = levelInfo(state.xp);
  const answered = state.correct_total + state.wrong_total;
  const acc = answered ? Math.round((state.correct_total / answered) * 100) : null;
  const caughtSpecies = new Set(monsters.map((m) => m.species_id)).size;
  const recent = monsters.slice(0, 6);
  const tiles: { to: string; icon: string; label: string; sub: string }[] = [
    { to: '/monster-quest/explore', icon: '🗺️', label: 'Explore World', sub: 'Find & capture monsters' },
    { to: '/monster-quest/monsters', icon: '🐾', label: 'My Monsters', sub: `${monsters.length} captured` },
    { to: '/monster-quest/arena', icon: '⚔️', label: 'Battle Arena', sub: `${state.battles_won} wins` },
    { to: '/monster-quest/quests', icon: '📜', label: 'Quests', sub: 'Daily & weekly missions' },
    { to: '/monster-quest/style', icon: '👕', label: 'Style', sub: 'Props for your explorer' },
    { to: '/monster-quest/dex', icon: '📖', label: 'Encyclopedia', sub: `${caughtSpecies}/${species.length} species` },
    { to: '/monster-quest/inventory', icon: '🎒', label: 'Inventory', sub: 'Your orbs' },
    { to: '/monster-quest/shop', icon: '🛍️', label: 'Shop', sub: 'Spend coins & gems' },
    { to: '/monster-quest/leaderboard', icon: '🏆', label: 'Leaderboard', sub: 'Top trainers' },
    ...(isStaff ? [{ to: '/monster-quest/questions', icon: '📝', label: 'Question Bank', sub: 'Manage questions' }] : []),
  ];

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-4">
        <div className="mq-avatar-ring">
          <CharacterAvatar size={84} />
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="font-display text-xl font-extrabold text-white">{name}</p>
          <p className="text-sm font-bold text-yellow-300">Trainer level {lv.level}</p>
          <div className="mt-1.5"><Bar pct={lv.pct} color="linear-gradient(90deg,#38bdf8,#818cf8)" label="XP to next level" /></div>
          <p className="mt-1 text-xs font-semibold text-white/70">{fmt(lv.into)} / {fmt(lv.need)} XP to level {lv.level + 1} · shared with all LingoBite Play games</p>
        </div>
        <div className="flex gap-3 text-center text-white">
          <div className="mq-stat"><p className="text-xl">🪙</p><p className="font-extrabold tabular-nums">{fmt(state.coins)}</p><p className="text-[10px] font-bold uppercase opacity-70">Coins</p></div>
          <div className="mq-stat"><p className="text-xl">💎</p><p className="font-extrabold tabular-nums">{fmt(state.gems)}</p><p className="text-[10px] font-bold uppercase opacity-70">Gems</p></div>
          <div className="mq-stat"><p className="text-xl">🐾</p><p className="font-extrabold tabular-nums">{monsters.length}</p><p className="text-[10px] font-bold uppercase opacity-70">Monsters</p></div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((t, i) => (
            <Link key={t.to} to={t.to} className={`mq-tile ${i === 0 ? 'mq-tile-hero col-span-2 sm:col-span-3' : ''}`}>
              <span className="text-3xl">{t.icon}</span><span className="font-display text-base font-extrabold">{t.label}</span><span className="text-xs font-semibold opacity-80">{t.sub}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          <Panel>
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Today</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-white"><span className="w-16">Daily XP</span><Bar pct={(state.xp_today / state.xp_daily_cap) * 100} color="#facc15" label="Daily XP" /><span className="tabular-nums">{state.xp_today}/{state.xp_daily_cap}</span></div>
            <p className="mt-3 text-xs font-semibold text-white/80">Answers: <span className="font-extrabold text-white">{state.correct_total}</span> correct · <span className="font-extrabold text-white">{state.wrong_total}</span> wrong{acc != null && <> · <span className="font-extrabold text-yellow-300">{acc}%</span> accuracy</>}</p>
          </Panel>
          <Panel>
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Latest captures</p>
            {recent.length === 0 ? <p className="mt-2 text-sm font-semibold text-white/80">Nothing yet. Head into the Green Forest and walk through the tall grass!</p> : (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {recent.map((m) => { const sp = speciesById.get(m.species_id)!; return (
                  <Link key={m.id} to="/monster-quest/monsters" className="flex flex-col items-center rounded-xl bg-white/10 p-1.5 hover:bg-white/20" title={sp.name}>
                    <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={56} anim="none" /><span className="w-full truncate text-center text-[11px] font-bold text-white">{sp.name}</span><RarityBadge rarity={sp.rarity} />
                  </Link>); })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
