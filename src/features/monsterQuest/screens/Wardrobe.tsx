import { useMemo, useState } from 'react';
import { levelInfo } from '../../avatar/level';
import * as api from '../api';
import { CharacterAvatar } from '../art/CharacterAvatar';
import { useMq } from '../context';
import { sfx } from '../sound';
import { GameButton, Panel } from '../ui';
import { propUrl, usePropCatalog, type PropSlot } from '../world/props';
import type { Cosmetic } from '../types';

const SLOTS: { k: PropSlot; label: string; icon: string }[] = [
  { k: 'prop_head', label: 'Hats', icon: '🎩' }, { k: 'prop_face', label: 'Face', icon: '🕶️' }, { k: 'prop_neck', label: 'Neck', icon: '🧣' }, { k: 'prop_back', label: 'Back', icon: '🎒' },
];

/** Props for your explorer: try them on for free, buy with coins, wear or take off. They show in the world. */
export function Wardrobe() {
  const mq = useMq(), catalog = usePropCatalog();
  const [slot, setSlot] = useState<PropSlot>('prop_head');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [facing, setFacing] = useState<'down' | 'side' | 'up'>('down');
  const [tryOn, setTryOn] = useState<Record<string, string | null>>({}); // preview per slot: prop id, or null = bare
  const level = levelInfo(mq.state.xp).level;
  const items = useMemo(() => mq.cosmetics.filter((c) => c.slot === slot), [mq.cosmetics, slot]);
  const owned = (c: Cosmetic) => mq.ownedCosmetics.has(c.key);
  const wornBySlot = (s: string) => mq.cosmetics.find((c) => c.key === mq.state.outfit?.[s])?.data.prop ?? null;
  const shown = SLOTS.map((s) => (s.k in tryOn ? tryOn[s.k] : wornBySlot(s.k))).filter((x): x is string => !!x);

  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); setMsg(null); try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); } };
  const clearTry = (s: string) => setTryOn((t) => { const n = { ...t }; delete n[s]; return n; });
  const wear = (c: Cosmetic) => run(c.key, async () => { mq.setState(await api.equip(c.key)); clearTry(c.slot); sfx.click(); });
  const takeOff = (c: Cosmetic) => run(c.key, async () => { mq.setState(await api.unequip(c.slot)); clearTry(c.slot); sfx.click(); });
  const buy = (c: Cosmetic) => run(c.key, async () => { mq.setState(await api.buyCosmetic(c.key)); await mq.refresh(); mq.setState(await api.equip(c.key)); clearTry(c.slot); sfx.coin(); setMsg({ ok: true, text: `You bought ${c.name} and you are wearing it!` }); });

  if (!mq.hasExplorers) return <Panel><p className="text-sm font-bold text-white/85">The wardrobe is not installed yet. Run supabase/monster_quest_roster_patch.sql in the Supabase SQL editor.</p></Panel>;
  return (
    <div className="grid gap-3 md:grid-cols-[250px_1fr]">
      <Panel className="flex flex-col items-center">
        <div className="mq-avatar-stage"><CharacterAvatar width={170} facing={facing} props={shown} headroom /></div>
        <div className="mt-2 flex gap-1.5">{(['down', 'side', 'up'] as const).map((f) => <button key={f} type="button" onClick={() => setFacing(f)} className={`rounded-full px-3 py-1 text-xs font-extrabold ${facing === f ? 'bg-yellow-300 text-[#10285a]' : 'bg-white/15 text-white'}`}>{f === 'down' ? 'Front' : f === 'side' ? 'Side' : 'Back'}</button>)}</div>
        <p className="mt-2 text-center text-xs font-semibold text-white/75">Tap any prop to try it on. What you wear shows in the world. Change explorer in Profile.</p>
        <p className="mt-1 text-sm font-extrabold text-white">🪙 {mq.state.coins} · 💎 {mq.state.gems}</p>
      </Panel>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">{SLOTS.map((s) => <button key={s.k} type="button" onClick={() => setSlot(s.k)} className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${slot === s.k ? 'bg-yellow-300 text-[#10285a]' : 'bg-white/15 text-white'}`}>{s.icon} {s.label}</button>)}</div>
        {msg && <p className={`rounded-xl px-3 py-2 text-sm font-bold text-white ${msg.ok ? 'bg-green-600/90' : 'bg-red-500/90'}`} role="status">{msg.text}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 p-2">
            <button type="button" className="flex h-[84px] w-full items-center justify-center rounded-xl bg-white/10 text-3xl" onClick={() => setTryOn({ ...tryOn, [slot]: null })} aria-label="Try nothing">🚫</button>
            <p className="mt-1 text-xs font-extrabold text-white">Nothing</p>
            {wornBySlot(slot) && <GameButton tone="blue" className="mt-1 !px-3 !py-1 !text-xs" disabled={!!busy} onClick={() => run('off', async () => { mq.setState(await api.unequip(slot)); clearTry(slot); sfx.click(); })}>Take off</GameButton>}
          </div>
          {items.length === 0 && <p className="col-span-full self-center text-sm font-bold text-white/80">New props for this part are coming soon!</p>}
          {items.map((c) => {
            const p = catalog.find((x) => x.id === c.data.prop); if (!p) return null;
            const on = mq.state.outfit?.[c.slot] === c.key;
            const lvlLocked = !owned(c) && level < c.unlock_level;
            const afford = (c.price_coins == null || mq.state.coins >= c.price_coins) && (c.price_gems == null || mq.state.gems >= c.price_gems);
            return (
              <div key={c.key} className={`flex flex-col items-center rounded-2xl border-2 p-2 ${on ? 'border-yellow-300 bg-yellow-300/20' : 'border-white/20 bg-white/10'}`}>
                <button type="button" className="flex h-[84px] w-full items-center justify-center rounded-xl bg-white/10" onClick={() => setTryOn({ ...tryOn, [slot]: p.id })} aria-label={`Try ${c.name}`}>
                  <img src={propUrl(p)} alt="" style={{ maxWidth: 76, maxHeight: 76, objectFit: 'contain' }} draggable={false} />
                </button>
                <p className="mt-1 text-center text-xs font-extrabold text-white">{c.name}</p>
                {on ? <GameButton tone="blue" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.key} onClick={() => takeOff(c)}>✔ Wearing · take off</GameButton>
                  : owned(c) ? <GameButton tone="green" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.key} onClick={() => wear(c)}>Wear</GameButton>
                  : lvlLocked ? <span className="mt-1 text-[11px] font-bold text-white/70">🔒 Level {c.unlock_level}</span>
                  : <GameButton tone="gold" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.key || !afford} onClick={() => buy(c)}>{c.price_coins != null ? `${c.price_coins} 🪙` : `${c.price_gems} 💎`}</GameButton>}
              </div>);
          })}
        </div>
      </div>
    </div>
  );
}
