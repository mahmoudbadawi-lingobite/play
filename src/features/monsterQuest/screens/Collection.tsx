import { useMemo, useState } from 'react';
import * as api from '../api';
import { MAX_TEAM, RARITY_META, STAT_MAX, TYPE_META, TYPE_ORDER } from '../config';
import { useMq } from '../context';
import { MonsterArt } from '../art/MonsterArt';
import { GameButton, Modal, Panel, RarityBadge, StatRow, TypeBadge } from '../ui';
import type { ElementType, OwnedMonster, Rarity } from '../types';

export function Collection() {
  const mq = useMq();
  const [q, setQ] = useState('');
  const [type, setType] = useState<ElementType | 'all'>('all');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [sort, setSort] = useState<'recent' | 'level' | 'name' | 'type' | 'rarity'>('recent');
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<OwnedMonster | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const team = useMemo(() => mq.monsters.filter((m) => m.team_slot).sort((a, b) => a.team_slot! - b.team_slot!), [mq.monsters]);
  const list = useMemo(() => {
    const out = mq.monsters.filter((m) => {
      const sp = mq.speciesById.get(m.species_id)!;
      return (type === 'all' || sp.type === type) && (rarity === 'all' || sp.rarity === rarity) && (!favOnly || m.favorite)
        && (!q || sp.name.toLowerCase().includes(q.toLowerCase()) || (m.nickname ?? '').toLowerCase().includes(q.toLowerCase()));
    });
    const sp = (m: OwnedMonster) => mq.speciesById.get(m.species_id)!;
    out.sort((a, b) => sort === 'level' ? b.level - a.level : sort === 'name' ? sp(a).name.localeCompare(sp(b).name)
      : sort === 'type' ? sp(a).type.localeCompare(sp(b).type) : sort === 'rarity' ? RARITY_META[sp(b).rarity].order - RARITY_META[sp(a).rarity].order
      : +new Date(b.captured_at) - +new Date(a.captured_at));
    return out;
  }, [mq.monsters, mq.speciesById, q, type, rarity, sort, favOnly]);

  const run = async (fn: () => Promise<void>) => { setErr(null); try { await fn(); await mq.refresh(); } catch (e) { setErr((e as Error).message); } };
  const toggleTeam = (m: OwnedMonster) => run(() => {
    const ids = team.map((t) => t.id);
    if (m.team_slot) return api.setTeam(ids.filter((i) => i !== m.id));
    if (ids.length >= MAX_TEAM) throw new Error(`Your team is full (${MAX_TEAM}). Remove a monster first.`);
    return api.setTeam([...ids, m.id]);
  });

  if (mq.monsters.length === 0) return <Panel><p className="text-center font-bold text-white">🐾 No monsters yet. Explore the world and answer questions to capture your first one!</p></Panel>;

  const sel = 'rounded-xl border-2 border-[#1b4fb3] bg-white px-2.5 py-1.5 text-sm font-bold text-[#10285a]';
  return (
    <div className="space-y-3">
      <Panel>
        <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Battle team ({team.length}/{MAX_TEAM})</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: MAX_TEAM }, (_, i) => { const m = team[i]; const sp = m && mq.speciesById.get(m.species_id); return (
            <button key={i} type="button" onClick={() => m && setOpen(m)} className="flex h-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/30 bg-white/10 text-white">
              {m && sp ? (<><MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={58} anim="none" /><span className="text-[11px] font-bold">{sp.name}</span></>) : <span className="text-xs font-bold opacity-60">Slot {i + 1}</span>}
            </button>); })}
        </div>
        <p className="mt-2 text-xs font-semibold text-white/70">Your team is saved to your account. It will be used in the Battle Arena when that opens.</p>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" aria-label="Search monsters" className={`${sel} min-w-[140px] flex-1`} />
        <select value={type} onChange={(e) => setType(e.target.value as ElementType | 'all')} aria-label="Filter by type" className={sel}><option value="all">All types</option>{TYPE_ORDER.map((t) => <option key={t} value={t}>{TYPE_META[t].icon} {TYPE_META[t].label}</option>)}</select>
        <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | 'all')} aria-label="Filter by rarity" className={sel}><option value="all">All rarities</option>{(Object.keys(RARITY_META) as Rarity[]).map((r) => <option key={r} value={r}>{RARITY_META[r].label}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort" className={sel}><option value="recent">Newest</option><option value="level">Level</option><option value="name">Name</option><option value="type">Type</option><option value="rarity">Rarity</option></select>
        <button type="button" onClick={() => setFavOnly(!favOnly)} className={`${sel} ${favOnly ? '!bg-yellow-300' : ''}`} aria-pressed={favOnly}>⭐ Favorites</button>
      </div>
      {err && <p className="rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((m) => { const sp = mq.speciesById.get(m.species_id)!; return (
          <button key={m.id} type="button" onClick={() => setOpen(m)} className="mq-mon-card" style={{ ['--tc' as string]: TYPE_META[sp.type].color }}>
            {m.favorite && <span className="absolute right-2 top-1.5 text-lg">⭐</span>}
            {m.team_slot && <span className="absolute left-2 top-2 rounded-full bg-green-500 px-1.5 text-[10px] font-extrabold text-white">TEAM</span>}
            <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={96} />
            <span className="font-display text-sm font-extrabold text-white">{m.nickname || sp.name}</span>
            <span className="text-[11px] font-bold text-white/80">Lv. {m.level}</span>
            <span className="flex items-center gap-1"><TypeBadge type={sp.type} small /><RarityBadge rarity={sp.rarity} /></span>
          </button>); })}
        {list.length === 0 && <p className="col-span-full py-6 text-center font-bold text-white/80">No monsters match those filters.</p>}
      </div>

      {open && (() => { const m = mq.monsters.find((x) => x.id === open.id) ?? open; const sp = mq.speciesById.get(m.species_id)!; return (
        <Modal onClose={() => setOpen(null)}>
          <div className="text-center">
            <MonsterArt spec={sp.art} spriteUrl={sp.sprite_url} size={150} />
            <p className="font-display text-2xl font-extrabold text-[#10285a]">{m.nickname || sp.name}</p>
            <div className="mt-1 flex items-center justify-center gap-2"><TypeBadge type={sp.type} /><RarityBadge rarity={sp.rarity} /><span className="text-sm font-bold text-[#3d5a94]">Level {m.level}</span></div>
            <p className="mt-2 text-sm text-[#3d5a94]">{sp.description}</p>
          </div>
          <div className="mt-3 space-y-1.5 rounded-2xl bg-[#10285a] p-3">
            <StatRow label="HP" value={m.hp} max={STAT_MAX.hp} color="#22c55e" /><StatRow label="ATK" value={m.attack} max={STAT_MAX.attack} color="#ef4444" />
            <StatRow label="DEF" value={m.defense} max={STAT_MAX.defense} color="#3b82f6" /><StatRow label="SPD" value={m.speed} max={STAT_MAX.speed} color="#facc15" />
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-[#3d5a94]">Stage 1 · Caught {new Date(m.captured_at).toLocaleDateString()}{m.zone_id ? ` in the ${mq.zones.find((z) => z.id === m.zone_id)?.name ?? m.zone_id}` : ''}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <GameButton tone={m.favorite ? 'gold' : 'ghost'} className="!text-[#10285a]" onClick={() => run(() => api.toggleFavorite(m.id))}>{m.favorite ? '⭐ Favorite' : '☆ Favorite'}</GameButton>
            <GameButton tone={m.team_slot ? 'red' : 'green'} onClick={() => toggleTeam(m)}>{m.team_slot ? 'Remove from team' : 'Add to team'}</GameButton>
          </div>
          <GameButton tone="blue" className="mt-2 w-full" onClick={() => setOpen(null)}>Close</GameButton>
        </Modal>); })()}
    </div>
  );
}
