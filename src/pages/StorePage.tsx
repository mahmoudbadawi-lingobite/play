import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CATEGORIES,
  getItem,
  itemsFor,
  priceOf,
  type Category,
  type Item,
  type Look,
  type Rarity,
} from '../features/avatar/catalog';
import { buyItem, equipItem, useAvatarState } from '../features/avatar/avatarStore';
import { AvatarStageView } from '../features/avatar/AvatarImage';
import { ChooseHero } from '../features/avatar/ChooseHero';
import { CoinPill, ItemThumb, LevelBadge, RARITY } from '../features/avatar/ui';

/** The look with `item` (or every piece of a set) put on, without saving anything. */
function tryOn(look: Look, item: Item | null): Look {
  if (!item) return look;
  const next = { ...look } as unknown as Record<string, string | null>;
  if (item.slot === 'set') {
    for (const pid of item.pieces ?? []) {
      const piece = getItem(pid);
      if (piece && piece.slot !== 'set') next[piece.slot] = pid;
    }
  } else {
    next[item.slot] = item.id;
  }
  return next as unknown as Look;
}

export function StorePage() {
  const state = useAvatarState();
  const { gender } = state;
  const [category, setCategory] = useState<Category>('outfits');
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const items = useMemo(() => {
    if (!gender) return [];
    const q = query.trim().toLowerCase();
    return itemsFor(gender)
      .filter((i) => i.category === category)
      .filter((i) => rarity === 'all' || i.rarity === rarity)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => priceOf(a, state.owned) - priceOf(b, state.owned) || a.name.localeCompare(b.name));
  }, [gender, category, query, rarity, state.owned]);

  if (!gender) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ChooseHero title="Choose your hero to start shopping" />
      </div>
    );
  }

  const look = state.looks[gender];
  const selected = getItem(selectedId);
  const preview = tryOn(look, selected ?? null);

  const status = (item: Item) => {
    const pieces = item.slot === 'set' ? (item.pieces ?? []) : [item.id];
    const owned = pieces.every((p) => state.owned.includes(p));
    const equipped = item.slot === 'set' ? pieces.every((p) => Object.values(look).includes(p)) : look[item.slot] === item.id;
    return { owned, equipped, price: priceOf(item, state.owned) };
  };

  const say = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2600);
  };

  const act = (item: Item) => {
    const st = status(item);
    if (st.owned) {
      equipItem(item.id);
      say(`${item.name} is on!`);
      return;
    }
    const res = buyItem(item.id);
    if (res === 'ok') say(`You got ${item.name}! 🎉`);
    else if (res === 'poor') say(`You need ${st.price - state.coins} more coins. Play a run to earn them!`);
  };

  const selSt = selected ? status(selected) : null;

  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#6C4DFF] via-[#5B7CFF] to-[#3FA9FF] p-4 shadow-lg">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
          <div className="absolute -left-6 top-6 h-16 w-28 rounded-2xl bg-white/40" />
          <div className="absolute right-24 top-2 h-12 w-20 rounded-2xl bg-white/30" />
          <div className="absolute bottom-0 left-1/3 h-10 w-32 rounded-t-2xl bg-[#6BCB5B]/60" />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <LevelBadge />
          <div className="text-center">
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow sm:text-4xl">🛍️ The Style Store</h1>
            <p className="text-sm font-semibold text-white/90">Collect, customize and make your hero unique!</p>
          </div>
          <div className="flex items-center gap-2">
            <CoinPill coins={state.coins} />
            <Link to="/avatar" className="rounded-full border-2 border-white/70 bg-white/90 px-3 py-1.5 text-sm font-extrabold text-primary shadow">My Avatar</Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr_340px]">
        {/* Categories */}
        <nav aria-label="Store categories" className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-extrabold shadow-sm lg:w-full ${
                category === c.id ? 'border-[#FF9A1F] bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] text-white' : 'border-border bg-card text-primary hover:border-secondary'
              }`}
            >
              <span className="text-xl" aria-hidden="true">{c.icon}</span>
              <span className="whitespace-nowrap lg:whitespace-normal">{c.label}</span>
            </button>
          ))}
        </nav>

        {/* Catalog */}
        <section className="order-3 min-w-0 lg:order-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items..."
              aria-label="Search items"
              className="min-w-0 flex-1 rounded-xl border-2 border-border bg-card px-4 py-2.5 outline-none focus:border-secondary"
            />
            <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | 'all')} aria-label="Rarity" className="rounded-xl border-2 border-border bg-card px-3 py-2.5 font-semibold text-primary">
              <option value="all">All rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
            </select>
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const st = status(item);
              const isSel = selectedId === item.id;
              return (
                <li key={item.id}>
                  <div
                    className={`flex h-full flex-col rounded-2xl border-2 bg-card p-2 text-center shadow-sm ${isSel ? 'border-[#FF9A1F] ring-2 ring-[#FF9A1F]/40' : 'border-border'}`}
                  >
                    <button type="button" onClick={() => setSelectedId(item.id)} className="rounded-xl bg-gradient-to-b from-sky-50 to-violet-50" aria-label={`Preview ${item.name}`}>
                      <ItemThumb gender={gender} item={item} size={120} />
                    </button>
                    <p className="mt-1 truncate text-sm font-extrabold text-primary">{item.name}</p>
                    <span className={`mx-auto mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY[item.rarity].cls}`}>{RARITY[item.rarity].label}</span>
                    <p className="mt-1 text-sm font-bold text-primary">{st.owned ? 'Owned' : `🪙 ${st.price}`}</p>
                    <button
                      type="button"
                      onClick={() => (st.equipped ? undefined : act(item))}
                      disabled={st.equipped}
                      className={`mt-auto rounded-lg px-2 py-1.5 text-sm font-extrabold ${st.equipped ? 'bg-[#FF9A1F] text-white' : st.owned ? 'bg-secondary text-secondary-foreground' : 'border-2 border-border text-primary hover:border-secondary'}`}
                    >
                      {st.equipped ? 'Equipped' : st.owned ? 'Wear' : 'Buy'}
                    </button>
                  </div>
                </li>
              );
            })}
            {items.length === 0 && <li className="col-span-full py-10 text-center text-muted-foreground">No items match your search.</li>}
          </ul>
          <p className="mt-4 rounded-2xl bg-gradient-to-r from-[#4B3FD6] to-[#6C4DFF] px-4 py-3 text-sm font-bold text-white">
            ✨ Earn coins by completing runs and answering questions! <Link to="/library" className="underline">Find a game</Link>
          </p>
        </section>

        {/* Preview */}
        <aside className="order-1 lg:sticky lg:top-20 lg:order-3 lg:self-start">
          <div className="overflow-hidden rounded-3xl border-4 border-primary bg-card shadow-lg">
            <div className="bg-gradient-to-b from-sky-300 via-sky-200 to-violet-200">
              <AvatarStageView gender={gender} look={preview} className="h-[320px] w-full sm:h-[400px]" />
            </div>
            <div className="p-4">
              {selected ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-xl font-extrabold text-primary">{selected.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${RARITY[selected.rarity].cls}`}>{RARITY[selected.rarity].label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.blurb}</p>
                  {selected.slot === 'set' && (
                    <p className="mt-1 text-xs text-primary/80">Includes: {(selected.pieces ?? []).map((p) => getItem(p)?.name).filter(Boolean).join(', ')}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => act(selected)}
                    disabled={selSt?.equipped}
                    className="mt-3 w-full rounded-xl bg-gradient-to-b from-[#FFB020] to-[#FF8A1F] px-4 py-3 text-lg font-extrabold text-white shadow disabled:opacity-60"
                  >
                    {selSt?.equipped ? 'Equipped ✓' : selSt?.owned ? 'Wear it' : `Buy · 🪙 ${selSt?.price}`}
                  </button>
                  <button type="button" onClick={() => setSelectedId(null)} className="mt-2 w-full text-xs font-bold text-muted-foreground underline">
                    Back to my current look
                  </button>
                </>
              ) : (
                <p className="text-center text-sm font-semibold text-muted-foreground">Tap an item to try it on your hero.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg transition-opacity" style={{ opacity: toast ? 1 : 0, pointerEvents: 'none' }} aria-live="polite">
        {toast}
      </p>
    </div>
  );
}
