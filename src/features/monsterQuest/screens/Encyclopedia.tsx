import { useEffect, useMemo, useState } from 'react';
import * as api from '../api';
import { RARITY_META, TYPE_CHART, TYPE_META, TYPE_ORDER } from '../config';
import { useMq } from '../context';
import { MonsterArt } from '../art/MonsterArt';
import { Modal, Panel, RarityBadge, TypeBadge, GameButton } from '../ui';
import type { Species } from '../types';

export function Encyclopedia() {
  const mq = useMq();
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Species | null>(null);
  const [tab, setTab] = useState<'species' | 'types'>('species');
  useEffect(() => { api.loadSeenSpecies(mq.userId).then((a) => setSeen(new Set(a))).catch(() => undefined); }, [mq.userId, mq.monsters.length]);
  const caught = useMemo(() => new Set(mq.monsters.map((m) => m.species_id)), [mq.monsters]);
  const sorted = useMemo(() => [...mq.species].sort((a, b) => RARITY_META[a.rarity].order - RARITY_META[b.rarity].order || a.name.localeCompare(b.name)), [mq.species]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <GameButton tone={tab === 'species' ? 'gold' : 'ghost'} onClick={() => setTab('species')}>Monsters ({caught.size}/{mq.species.length})</GameButton>
        <GameButton tone={tab === 'types' ? 'gold' : 'ghost'} onClick={() => setTab('types')}>Type chart</GameButton>
      </div>
      {tab === 'species' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((s) => { const c = caught.has(s.id), sn = seen.has(s.id) || c; return (
            <button key={s.id} type="button" disabled={!sn} onClick={() => setOpen(s)} className="mq-mon-card" style={{ ['--tc' as string]: sn ? TYPE_META[s.type].color : '#64748b' }}>
              <MonsterArt spec={s.art} spriteUrl={s.sprite_url} size={90} anim="none" silhouette={!c} />
              <span className="font-display text-sm font-extrabold text-white">{sn ? s.name : '???'}</span>
              {sn ? <span className="flex items-center gap-1"><TypeBadge type={s.type} small /><RarityBadge rarity={s.rarity} /></span> : <span className="text-[11px] font-bold text-white/60">Not discovered</span>}
              <span className="text-[11px] font-bold text-white/70">{c ? '✅ Captured' : sn ? '👀 Seen' : ''}</span>
            </button>); })}
        </div>
      ) : (
        <Panel>
          <p className="text-sm font-semibold text-white/85">Each row attacks the columns. <span className="text-green-300">2×</span> = super effective, <span className="text-red-300">½×</span> = not very effective. (Used by the Battle Arena later.)</p>
          <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[560px] border-separate border-spacing-1 text-center text-xs font-bold text-white">
            <thead><tr><th />{TYPE_ORDER.map((t) => <th key={t} title={TYPE_META[t].label}>{TYPE_META[t].icon}</th>)}</tr></thead>
            <tbody>{TYPE_ORDER.map((a) => (<tr key={a}><th className="text-left" title={TYPE_META[a].label}>{TYPE_META[a].icon} {TYPE_META[a].label}</th>
              {TYPE_ORDER.map((d) => { const m = TYPE_CHART[a][d] ?? 1; return <td key={d} className={`rounded ${m > 1 ? 'bg-green-600/70' : m < 1 ? 'bg-red-600/60' : 'bg-white/10'}`}>{m === 1 ? '·' : m > 1 ? '2×' : '½×'}</td>; })}</tr>))}</tbody></table></div>
        </Panel>
      )}
      {open && (
        <Modal onClose={() => setOpen(null)}>
          <div className="text-center">
            <MonsterArt spec={open.art} spriteUrl={open.sprite_url} size={150} silhouette={!caught.has(open.id)} />
            <p className="font-display text-2xl font-extrabold text-[#10285a]">{open.name}</p>
            <div className="mt-1 flex justify-center gap-2"><TypeBadge type={open.type} /><RarityBadge rarity={open.rarity} /></div>
            <p className="mt-2 text-sm text-[#3d5a94]">{open.description}</p>
            <p className="mt-2 text-xs font-bold text-[#3d5a94]">Found in: {open.zones.map((z) => mq.zones.find((x) => x.id === z)?.name ?? z).join(', ')}</p>
            <p className="text-xs font-bold text-[#3d5a94]">Needs {open.required_correct} correct answer{open.required_correct > 1 ? 's' : ''} to capture</p>
          </div>
          <GameButton tone="blue" className="mt-3 w-full" onClick={() => setOpen(null)}>Close</GameButton>
        </Modal>)}
    </div>
  );
}
