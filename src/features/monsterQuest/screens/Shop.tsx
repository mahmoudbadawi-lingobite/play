import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { useMq } from '../context';
import { Orb } from '../art/Orb';
import { GameButton, Panel, fmt } from '../ui';
import { sfx } from '../sound';
import type { Item, ItemKind } from '../types';

const KIND_LABEL: Record<ItemKind, string> = { ball: 'Capture orbs', potion: 'Potions', booster: 'XP boosters', stone: 'Evolution' };
const KIND_ICON: Record<ItemKind, string> = { ball: '', potion: '🧪', booster: '🍬', stone: '💠' };
const KIND_HELP: Record<ItemKind, string> = { ball: 'Used when capturing wild monsters.', potion: 'Use in the Battle Arena to heal.', booster: 'Use from My Monsters to give XP.', stone: 'Used when a monster evolves.' };

export function ItemIcon({ item, size = 48 }: { item: Item; size?: number }) {
  return item.kind === 'ball' ? <Orb size={size} color={item.color} /> : <span className="flex items-center justify-center rounded-full" style={{ width: size, height: size, background: item.color, fontSize: size * 0.55 }}>{KIND_ICON[item.kind]}</span>;
}

export function Inventory() {
  const mq = useMq();
  const rows = mq.items.filter((i) => (mq.state.inventory[i.key] ?? 0) > 0);
  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap gap-6 text-white"><span className="font-extrabold">🪙 {fmt(mq.state.coins)} coins</span><span className="font-extrabold">💎 {fmt(mq.state.gems)} gems</span></Panel>
      {(Object.keys(KIND_LABEL) as ItemKind[]).map((kind) => {
        const list = rows.filter((i) => i.kind === kind);
        if (list.length === 0) return null;
        return (
          <Panel key={kind}>
            <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">{KIND_LABEL[kind]} <span className="ml-1 text-[11px] normal-case opacity-70">{KIND_HELP[kind]}</span></p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {list.map((i) => (<div key={i.key} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><ItemIcon item={i} />
                <div className="flex-1"><p className="font-extrabold text-white">{i.name}</p><p className="text-xs font-semibold text-white/75">{i.description}</p></div>
                <span className="rounded-full bg-black/30 px-3 py-1 text-lg font-extrabold text-white">x{mq.state.inventory[i.key]}</span></div>))}
            </div>
          </Panel>);
      })}
      {rows.length === 0 && <Panel><p className="text-sm font-bold text-white/85">Your bag is empty. Visit the Shop!</p></Panel>}
    </div>
  );
}

export function Shop({ onStyle }: { onStyle?: () => void } = {}) {
  const mq = useMq();
  const [tab, setTab] = useState<ItemKind>('ball');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const buy = async (key: string, name: string) => {
    const n = qty[key] ?? 1; setBusy(key); setMsg(null);
    try { const s = await api.buy(key, n); mq.setState(s); sfx.coin(); setMsg({ ok: true, text: `Bought ${n} × ${name}!` }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  };
  const list = mq.items.filter((i) => i.kind === tab);
  return (
    <div className="space-y-3">
      <Panel className="flex flex-wrap items-center gap-6 text-white"><span className="font-extrabold">🪙 {fmt(mq.state.coins)} coins</span><span className="font-extrabold">💎 {fmt(mq.state.gems)} gems</span>
        {onStyle
          ? <span className="ml-auto"><GameButton tone="blue" type="button" onClick={onStyle}>👕 Explorer style shop</GameButton></span>
          : <Link to="/monster-quest/style" className="ml-auto"><GameButton tone="blue" type="button">👕 Explorer style shop</GameButton></Link>}</Panel>
      <div className="flex flex-wrap gap-2">{(Object.keys(KIND_LABEL) as ItemKind[]).map((k) => <GameButton key={k} tone={tab === k ? 'gold' : 'ghost'} onClick={() => { setTab(k); setMsg(null); }}>{KIND_LABEL[k]}</GameButton>)}</div>
      {msg && <p className={`rounded-xl px-3 py-2 text-sm font-bold text-white ${msg.ok ? 'bg-green-600/90' : 'bg-red-500/90'}`} role="status">{msg.text}</p>}
      <p className="text-xs font-semibold text-white/70">{KIND_HELP[tab]} Earn coins from answers, captures, battles and missions; gems come from weekly missions.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((i) => {
          const n = qty[i.key] ?? 1;
          const cost = i.price_coins != null ? `${fmt(i.price_coins * n)} 🪙` : `${fmt((i.price_gems ?? 0) * n)} 💎`;
          const afford = i.price_coins != null ? mq.state.coins >= i.price_coins * n : mq.state.gems >= (i.price_gems ?? 0) * n;
          return (
            <Panel key={i.key} className="flex items-center gap-3">
              <ItemIcon item={i} size={56} />
              <div className="min-w-0 flex-1"><p className="font-display font-extrabold text-white">{i.name}{i.kind === 'ball' && <span className="ml-1 text-xs font-bold text-yellow-300">x{i.catch_multiplier} catch</span>}</p><p className="text-xs font-semibold text-white/75">{i.description}</p><p className="text-xs font-bold text-white/60">You have {mq.state.inventory[i.key] ?? 0}</p></div>
              <div className="flex flex-col items-end gap-1.5">
                <select value={n} onChange={(e) => setQty({ ...qty, [i.key]: +e.target.value })} aria-label={`Quantity of ${i.name}`} className="rounded-lg border-2 border-[#1b4fb3] bg-white px-1.5 py-0.5 text-sm font-bold text-[#10285a]">{[1, 3, 5, 10].map((v) => <option key={v} value={v}>{v}</option>)}</select>
                <GameButton tone="gold" disabled={!afford || busy === i.key} onClick={() => buy(i.key, i.name)}>{cost}</GameButton>
              </div>
            </Panel>);
        })}
        {list.length === 0 && <p className="text-sm font-bold text-white/80">Nothing here yet.</p>}
      </div>
    </div>
  );
}
