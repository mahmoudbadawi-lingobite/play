import { useState } from 'react';
import * as api from '../api';
import { useMq } from '../context';
import { MonsterArt } from '../art/MonsterArt';
import { sfx } from '../sound';
import { GameButton, Modal, RarityBadge, TypeBadge } from '../ui';
import type { OwnedMonster } from '../types';

/** Confirms, calls the server, then plays the evolution animation. The server decides whether evolution is allowed. */
export function EvolveModal({ monster, onClose }: { monster: OwnedMonster; onClose: () => void }) {
  const mq = useMq();
  const from = mq.speciesById.get(monster.species_id)!;
  const to = from.evolves_to ? mq.speciesById.get(from.evolves_to) : undefined;
  const item = from.evolve_item ? mq.itemsByKey.get(from.evolve_item) : undefined;
  const [phase, setPhase] = useState<'confirm' | 'anim' | 'done'>('confirm');
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  if (!to) return null;

  const go = async () => {
    setErr(null);
    try {
      await api.evolve(monster.id);
      setPhase('anim'); sfx.encounter();
      await new Promise((r) => setTimeout(r, 2200));
      setFlash(true); sfx.levelUp();
      await new Promise((r) => setTimeout(r, 500));
      await mq.refresh().catch(() => undefined);
      setFlash(false); setPhase('done');
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <Modal>
      {phase === 'confirm' && (<div className="text-center">
        <p className="font-display text-xl font-extrabold text-[#10285a]">{from.name} is ready to evolve?</p>
        <div className="my-2 flex items-center justify-center gap-2"><MonsterArt spec={from.art} spriteUrl={from.sprite_url} size={100} /><span className="text-3xl">➜</span><MonsterArt spec={to.art} spriteUrl={to.sprite_url} size={110} silhouette /></div>
        <p className="text-sm font-bold text-[#3d5a94]">Becomes {to.name}: stronger stats and a new look.</p>
        <p className="mt-2 rounded-xl bg-[#eaf2ff] p-2 text-sm font-bold text-[#10285a]">
          {from.evolve_level != null && <>Needs level {from.evolve_level} (yours: {monster.level}) </>}
          {item && <>Needs 1 {item.name} (you have {mq.state.inventory[item.key] ?? 0})</>}
        </p>
        {err && <p className="mt-2 rounded-xl bg-red-500/90 px-3 py-2 text-sm font-bold text-white" role="alert">{err}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2"><GameButton tone="ghost" className="!text-[#10285a]" onClick={onClose}>Cancel</GameButton><GameButton tone="gold" onClick={go}>Evolve!</GameButton></div>
      </div>)}
      {phase === 'anim' && (<div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-[#0b1b4d]">
        <div className="mq-evolve-aura" />
        <div className="mq-evolve-mon"><MonsterArt spec={from.art} spriteUrl={from.sprite_url} size={170} anim="none" /></div>
        <div className={`mq-evolve-flash ${flash ? 'is-on' : ''}`} />
        <p className="absolute bottom-3 text-lg font-extrabold text-white">{from.name} is evolving…</p>
      </div>)}
      {phase === 'done' && (<div className="text-center">
        <p className="font-display text-2xl font-extrabold text-amber-500">Evolution complete!</p>
        <div className="my-2 flex justify-center"><MonsterArt spec={to.art} spriteUrl={to.sprite_url} size={170} /></div>
        <p className="text-lg font-extrabold text-[#10285a]">{from.name} evolved into {to.name}!</p>
        <div className="mt-1 flex justify-center gap-2"><TypeBadge type={to.type} /><RarityBadge rarity={to.rarity} /></div>
        <GameButton tone="blue" className="mt-3 w-full" onClick={onClose}>Awesome</GameButton>
      </div>)}
    </Modal>
  );
}
