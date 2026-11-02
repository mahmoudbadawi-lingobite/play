import { useState } from 'react';
import { Link } from 'react-router-dom';
import { levelInfo } from '../../avatar/level';
import { MonsterArt } from '../art/MonsterArt';
import { Trainer } from '../art/Trainer';
import { useMq } from '../context';
import { isMuted, setMuted, sfx } from '../sound';
import { GameButton, Panel, RarityBadge, fmt } from '../ui';
import { RARITY_META } from '../config';

export function Profile() {
  const mq = useMq();
  const [muted, setM] = useState(isMuted());
  const lv = levelInfo(mq.state.xp);
  const total = mq.state.correct_total + mq.state.wrong_total;
  const rarest = [...mq.monsters].sort((a, b) => RARITY_META[mq.speciesById.get(b.species_id)!.rarity].order - RARITY_META[mq.speciesById.get(a.species_id)!.rarity].order)[0];
  const rsp = rarest && mq.speciesById.get(rarest.species_id);
  const stat = (label: string, value: string) => <div className="rounded-xl bg-white/10 p-3 text-center"><p className="text-lg font-extrabold text-white">{value}</p><p className="text-[11px] font-bold uppercase text-white/70">{label}</p></div>;
  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap items-center gap-4">
        <div className="mq-avatar-ring"><Trainer size={92} /></div>
        <div className="flex-1"><p className="font-display text-2xl font-extrabold text-white">{mq.name}</p><p className="font-bold text-yellow-300">Trainer level {lv.level} · {fmt(mq.state.xp)} XP</p>
          {rsp && <p className="mt-1 flex items-center gap-2 text-xs font-bold text-white/80">Rarest catch: <MonsterArt spec={rsp.art} spriteUrl={rsp.sprite_url} size={28} anim="none" /> {rsp.name} <RarityBadge rarity={rsp.rarity} /></p>}</div>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stat('Monsters', String(mq.monsters.length))}{stat('Species', `${new Set(mq.monsters.map((m) => m.species_id)).size}/${mq.species.length}`)}
        {stat('Correct answers', fmt(mq.state.correct_total))}{stat('Accuracy', total ? `${Math.round((mq.state.correct_total / total) * 100)}%` : '–')}
      </div>
      <Panel>
        <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Settings</p>
        <label className="mt-2 flex cursor-pointer items-center gap-3 font-bold text-white"><input type="checkbox" className="h-5 w-5" checked={!muted} onChange={(e) => { setMuted(!e.target.checked); setM(!e.target.checked); if (e.target.checked) sfx.correct(); }} /> Sound effects</label>
        <p className="mt-2 text-xs font-semibold text-white/65">Your XP is shared with the rest of LingoBite Play. Trainer outfits and background music are planned for Phase 2.</p>
        <Link to="/avatar" className="mt-3 inline-block"><GameButton tone="blue" type="button">Open the Style Store</GameButton></Link>
      </Panel>
    </div>
  );
}
