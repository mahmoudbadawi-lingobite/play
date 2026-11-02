import { useMemo, useState } from 'react';
import { levelInfo } from '../../avatar/level';
import * as api from '../api';
import { Trainer } from '../art/Trainer';
import { useMq } from '../context';
import { sfx } from '../sound';
import { GameButton, Panel } from '../ui';
import type { Cosmetic, CosmeticSlot } from '../types';

const SLOTS: { k: CosmeticSlot; label: string; icon: string }[] = [
  { k: 'body', label: 'Body', icon: '🧍' }, { k: 'skin', label: 'Skin', icon: '🖐️' }, { k: 'hairstyle', label: 'Hair style', icon: '💇' }, { k: 'haircolor', label: 'Hair color', icon: '🎨' },
  { k: 'hat', label: 'Hats', icon: '🧢' }, { k: 'top', label: 'Jackets', icon: '🧥' }, { k: 'pants', label: 'Pants', icon: '👖' }, { k: 'shoes', label: 'Shoes', icon: '👟' },
  { k: 'backpack', label: 'Backpacks', icon: '🎒' }, { k: 'accessory', label: 'Extras', icon: '🕶️' },
];

export function Wardrobe() {
  const mq = useMq();
  const [slot, setSlot] = useState<CosmeticSlot>('hat');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [facing, setFacing] = useState<'down' | 'side' | 'up'>('down');
  const level = levelInfo(mq.state.xp).level;
  const items = useMemo(() => mq.cosmetics.filter((c) => c.slot === slot), [mq.cosmetics, slot]);
  const free = (c: Cosmetic) => (c.price_coins ?? 1) === 0 && c.price_gems == null;
  const owned = (c: Cosmetic) => free(c) || mq.ownedCosmetics.has(c.key);

  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); setMsg(null); try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); } };
  const equip = (c: Cosmetic) => run(c.key, async () => { mq.setState(await api.equip(c.key)); sfx.click(); });
  const buy = (c: Cosmetic) => run(c.key, async () => { mq.setState(await api.buyCosmetic(c.key)); await mq.refresh(); sfx.coin(); setMsg({ ok: true, text: `You bought ${c.name}! Tap it to wear it.` }); });

  return (
    <div className="grid gap-3 md:grid-cols-[240px_1fr]">
      <Panel className="flex flex-col items-center">
        <div className="mq-avatar-stage"><Trainer facing={facing} size={210} look={mq.look} /></div>
        <div className="mt-2 flex gap-1.5">{(['down', 'side', 'up'] as const).map((f) => <button key={f} type="button" onClick={() => setFacing(f)} className={`rounded-full px-3 py-1 text-xs font-extrabold ${facing === f ? 'bg-yellow-300 text-[#10285a]' : 'bg-white/15 text-white'}`}>{f === 'down' ? 'Front' : f === 'side' ? 'Side' : 'Back'}</button>)}</div>
        <p className="mt-2 text-center text-xs font-semibold text-white/75">Your look is saved to your account and shows in the world and in battles.</p>
        <p className="mt-1 text-sm font-extrabold text-white">🪙 {mq.state.coins} · 💎 {mq.state.gems}</p>
      </Panel>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">{SLOTS.map((s) => <button key={s.k} type="button" onClick={() => setSlot(s.k)} className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${slot === s.k ? 'bg-yellow-300 text-[#10285a]' : 'bg-white/15 text-white'}`}>{s.icon} {s.label}</button>)}</div>
        {msg && <p className={`rounded-xl px-3 py-2 text-sm font-bold text-white ${msg.ok ? 'bg-green-600/90' : 'bg-red-500/90'}`} role="status">{msg.text}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((c) => {
            const on = mq.state.outfit?.[c.slot] === c.key;
            const lvlLocked = !owned(c) && level < c.unlock_level;
            const afford = (c.price_coins == null || mq.state.coins >= c.price_coins) && (c.price_gems == null || mq.state.gems >= c.price_gems);
            return (
              <div key={c.key} className={`flex flex-col items-center rounded-2xl border-2 p-2 ${on ? 'border-yellow-300 bg-yellow-300/20' : 'border-white/20 bg-white/10'}`}>
                <button type="button" className="rounded-xl bg-white/10" onClick={() => owned(c) && equip(c)} aria-label={`Preview ${c.name}`} disabled={!owned(c)}><Trainer size={84} look={{ ...mq.look, ...c.data }} /></button>
                <p className="mt-1 text-center text-xs font-extrabold text-white">{c.name}</p>
                {on ? <span className="mt-1 text-xs font-extrabold text-yellow-300">✔ Wearing</span>
                  : owned(c) ? <GameButton tone="green" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.key} onClick={() => equip(c)}>Wear</GameButton>
                  : lvlLocked ? <span className="mt-1 text-[11px] font-bold text-white/70">🔒 Level {c.unlock_level}</span>
                  : <GameButton tone="gold" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.key || !afford} onClick={() => buy(c)}>{c.price_coins != null ? `${c.price_coins} 🪙` : `${c.price_gems} 💎`}</GameButton>}
              </div>);
          })}
        </div>
      </div>
    </div>
  );
}
