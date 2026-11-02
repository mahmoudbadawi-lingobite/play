import { useState } from 'react';
import * as api from '../api';
import { useMq } from '../context';
import { Orb } from '../art/Orb';
import { GameButton, Panel, fmt } from '../ui';
import { sfx } from '../sound';

export function Inventory() {
  const mq = useMq();
  const rows = mq.items.filter((i) => (mq.state.inventory[i.key] ?? 0) > 0);
  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap gap-6 text-white"><span className="font-extrabold">🪙 {fmt(mq.state.coins)} coins</span><span className="font-extrabold">💎 {fmt(mq.state.gems)} gems</span></Panel>
      <Panel>
        <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Capture orbs</p>
        {rows.length === 0 ? <p className="mt-2 text-sm font-bold text-white/85">Your bag is empty. Visit the Shop to buy orbs.</p> : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {rows.map((i) => (<div key={i.key} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><Orb size={48} color={i.color} />
              <div className="flex-1"><p className="font-extrabold text-white">{i.name}</p><p className="text-xs font-semibold text-white/75">{i.description}</p></div>
              <span className="rounded-full bg-black/30 px-3 py-1 text-lg font-extrabold text-white">x{mq.state.inventory[i.key]}</span></div>))}
          </div>)}
        <p className="mt-3 text-xs font-semibold text-white/65">Potions, XP boosters and evolution stones arrive with the battle and evolution update.</p>
      </Panel>
    </div>
  );
}

export function Shop() {
  const mq = useMq();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const buy = async (key: string, name: string) => {
    const n = qty[key] ?? 1; setBusy(key); setMsg(null);
    try { const s = await api.buy(key, n); mq.setState(s); sfx.coin(); setMsg({ ok: true, text: `Bought ${n} × ${name}!` }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  };
  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap gap-6 text-white"><span className="font-extrabold">🪙 {fmt(mq.state.coins)} coins</span><span className="font-extrabold">💎 {fmt(mq.state.gems)} gems</span><span className="text-xs font-semibold opacity-75">Earn coins by answering questions and capturing monsters.</span></Panel>
      {msg && <p className={`rounded-xl px-3 py-2 text-sm font-bold text-white ${msg.ok ? 'bg-green-600/90' : 'bg-red-500/90'}`} role="status">{msg.text}</p>}
      <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">Capture orbs</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {mq.items.map((i) => {
          const n = qty[i.key] ?? 1;
          const cost = i.price_coins != null ? `${fmt(i.price_coins * n)} 🪙` : `${fmt((i.price_gems ?? 0) * n)} 💎`;
          const afford = i.price_coins != null ? mq.state.coins >= i.price_coins * n : mq.state.gems >= (i.price_gems ?? 0) * n;
          return (
            <Panel key={i.key} className="flex items-center gap-3">
              <Orb size={56} color={i.color} />
              <div className="min-w-0 flex-1"><p className="font-display font-extrabold text-white">{i.name} <span className="text-xs font-bold text-yellow-300">x{i.catch_multiplier} catch</span></p><p className="text-xs font-semibold text-white/75">{i.description}</p><p className="text-xs font-bold text-white/60">You have {mq.state.inventory[i.key] ?? 0}</p></div>
              <div className="flex flex-col items-end gap-1.5">
                <select value={n} onChange={(e) => setQty({ ...qty, [i.key]: +e.target.value })} aria-label={`Quantity of ${i.name}`} className="rounded-lg border-2 border-[#1b4fb3] bg-white px-1.5 py-0.5 text-sm font-bold text-[#10285a]">{[1, 3, 5, 10].map((v) => <option key={v} value={v}>{v}</option>)}</select>
                <GameButton tone="gold" disabled={!afford || busy === i.key} onClick={() => buy(i.key, i.name)}>{cost}</GameButton>
              </div>
            </Panel>);
        })}
      </div>
    </div>
  );
}
