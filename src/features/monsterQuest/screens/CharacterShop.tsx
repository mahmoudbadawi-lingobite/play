import { useState } from 'react';
import * as api from '../api';
import { CharacterAvatar } from '../art/CharacterAvatar';
import { useMq } from '../context';
import { sfx } from '../sound';
import { CHARACTERS, characterKey } from '../world/characters';
import { GameButton, Panel } from '../ui';

/** Explorers: the one being played, the ones you own (tap to switch for free) and the ones you can buy with coins. */
export function CharacterShop() {
  const mq = useMq();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!mq.hasExplorers) {
    return <Panel><p className="text-sm font-bold text-white/85">Explorer shop is not installed yet. Run supabase/monster_quest_roster_patch.sql in the Supabase SQL editor.</p></Panel>;
  }
  const run = async (id: string, fn: () => Promise<void>) => { setBusy(id); setMsg(null); try { await fn(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(null); } };
  const play = (id: string) => run(id, async () => { mq.setState(await api.equip(characterKey(id))); sfx.click(); });
  const buy = (id: string, name: string) => run(id, async () => {
    mq.setState(await api.buyCosmetic(characterKey(id))); await mq.refresh();
    mq.setState(await api.equip(characterKey(id))); sfx.coin(); setMsg({ ok: true, text: `${name} is yours now, and you are playing as them! You keep all your other explorers.` });
  });
  return (
    <Panel>
      <p className="font-display text-sm font-extrabold uppercase tracking-wide text-white/80">My explorers</p>
      <p className="mt-1 text-xs font-semibold text-white/70">Your first explorer was free. Buy more with coins and keep every explorer you buy: switch between the ones you own any time for free. Props you buy work on every explorer.</p>
      {msg && <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-bold text-white ${msg.ok ? 'bg-green-600/90' : 'bg-red-500/90'}`} role="status">{msg.text}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CHARACTERS.map((c) => {
          const cos = mq.cosmetics.find((x) => x.key === characterKey(c.id));
          if (!cos) return null;
          const owned = mq.ownedCharacters.includes(c.id), on = mq.character === c.id, price = cos.price_coins ?? 0;
          return (
            <div key={c.id} className={`flex flex-col items-center rounded-2xl border-2 p-2 ${on ? 'border-yellow-300 bg-yellow-300/20' : 'border-white/20 bg-white/10'}`}>
              <div className="mq-avatar-stage !p-1"><CharacterAvatar id={c.id} width={92} props={on ? undefined : []} /></div>
              <p className="mt-1 text-sm font-extrabold text-white">{c.name}</p>
              <p className="text-[11px] font-semibold text-white/70">{c.blurb}</p>
              {on ? <span className="mt-1 text-xs font-extrabold text-yellow-300">✔ Playing</span>
                : owned ? <GameButton tone="green" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.id} onClick={() => play(c.id)}>Play as {c.name}</GameButton>
                : <GameButton tone="gold" className="mt-1 !px-3 !py-1 !text-xs" disabled={busy === c.id || mq.state.coins < price} onClick={() => buy(c.id, c.name)}>{price} 🪙</GameButton>}
            </div>);
        })}
      </div>
    </Panel>
  );
}
