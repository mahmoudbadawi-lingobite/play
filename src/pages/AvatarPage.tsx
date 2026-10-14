import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CATEGORIES,
  HAIR_COLORS,
  ITEMS,
  OPTIONAL_SLOTS,
  REQUIRED_SLOTS,
  SKINS,
  SLOT_LABEL,
  getItem,
  suitsGender,
  type Slot,
} from '../features/avatar/catalog';
import {
  MAX_SAVED_LOOKS,
  chooseGender,
  deleteSavedLook,
  equipItem,
  saveLook,
  setHairColor,
  setSkin,
  unequipSlot,
  useAvatarState,
  wearSavedLook,
} from '../features/avatar/avatarStore';
import { AvatarImage, AvatarStageView } from '../features/avatar/AvatarImage';
import type { StageApi } from '../features/avatar/stage';
import { ChooseHero } from '../features/avatar/ChooseHero';
import { CoinPill, ItemThumb, LevelBadge } from '../features/avatar/ui';

const SLOTS: Slot[] = [...REQUIRED_SLOTS, ...OPTIONAL_SLOTS];

export function AvatarPage() {
  const state = useAvatarState();
  const { gender } = state;
  const [api, setApi] = useState<StageApi | null>(null);
  const [openSlot, setOpenSlot] = useState<Slot | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  if (!gender) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <ChooseHero />
      </div>
    );
  }

  const look = state.looks[gender];
  const saved = state.saved[gender];
  const other = gender === 'boy' ? 'girl' : 'boy';
  const ownedFor = (slot: Slot) => ITEMS.filter((i) => i.slot === slot && suitsGender(i, gender) && state.owned.includes(i.id));

  const doSave = () => {
    const ok = saveLook(name);
    setMsg(ok ? 'Look saved!' : `You can save up to ${MAX_SAVED_LOOKS} looks. Delete one first.`);
    if (ok) setName('');
    window.setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-primary">My Avatar</h1>
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#6C4DFF] to-[#3FA9FF] px-3 py-2">
          <LevelBadge />
          <CoinPill coins={state.coins} />
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        {/* Preview */}
        <div className="relative self-start overflow-hidden rounded-3xl border-4 border-primary bg-gradient-to-b from-sky-300 via-sky-200 to-violet-200 lg:sticky lg:top-20">
          <AvatarStageView gender={gender} look={look} className="h-[420px] w-full sm:h-[520px]" onApi={setApi} />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            <button type="button" onClick={() => api?.rotateBy(-0.6)} aria-label="Turn left" className="rounded-full bg-white/90 px-4 py-2 text-lg font-bold text-primary shadow">◀</button>
            <button type="button" onClick={() => api?.zoomBy(0.85)} aria-label="Zoom in" className="rounded-full bg-white/90 px-4 py-2 text-lg font-bold text-primary shadow">＋</button>
            <button type="button" onClick={() => api?.zoomBy(1.18)} aria-label="Zoom out" className="rounded-full bg-white/90 px-4 py-2 text-lg font-bold text-primary shadow">－</button>
            <button type="button" onClick={() => api?.rotateBy(0.6)} aria-label="Turn right" className="rounded-full bg-white/90 px-4 py-2 text-lg font-bold text-primary shadow">▶</button>
          </div>
          <p className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary">Drag to spin · scroll to zoom</p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <section className="card-surface p-4">
            <h2 className="font-display text-lg font-semibold text-primary">What I'm wearing</h2>
            <ul className="mt-2 divide-y divide-border/60">
              {SLOTS.map((slot) => {
                const current = getItem(look[slot]);
                const required = REQUIRED_SLOTS.includes(slot);
                const options = ownedFor(slot);
                return (
                  <li key={slot} className="py-2">
                    <div className="flex items-center gap-3">
                      <ItemThumb gender={gender} item={current ?? null} size={52} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SLOT_LABEL[slot]}</p>
                        <p className="truncate font-semibold text-primary">{current?.name ?? 'None'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenSlot(openSlot === slot ? null : slot)}
                        aria-expanded={openSlot === slot}
                        className="rounded-lg border-2 border-border px-3 py-1.5 text-sm font-bold text-primary hover:border-secondary"
                      >
                        {openSlot === slot ? 'Close' : 'Change'}
                      </button>
                    </div>
                    {openSlot === slot && (
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {!required && (
                          <button type="button" onClick={() => unequipSlot(slot)} className={`rounded-xl border-2 p-1 text-center text-xs font-bold ${!look[slot] ? 'border-secondary bg-secondary/15' : 'border-border'}`}>
                            <ItemThumb gender={gender} item={null} size={56} />
                            None
                          </button>
                        )}
                        {options.map((it) => (
                          <button key={it.id} type="button" onClick={() => equipItem(it.id)} className={`rounded-xl border-2 p-1 text-center text-xs font-bold ${look[slot] === it.id ? 'border-secondary bg-secondary/15' : 'border-border'}`}>
                            <ItemThumb gender={gender} item={it} size={56} />
                            <span className="block truncate">{it.name}</span>
                          </button>
                        ))}
                        {options.length === 0 && (
                          <p className="col-span-full text-xs text-muted-foreground">
                            Nothing here yet. Visit the <Link to="/store" className="font-bold text-secondary underline">Style Store</Link>!
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card-surface p-4">
            <h2 className="font-display text-lg font-semibold text-primary">Skin and hair color</h2>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">Skin</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {SKINS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSkin(s.id)} aria-label={s.name} aria-pressed={look.skin === s.id} className={`h-9 w-9 rounded-full border-4 ${look.skin === s.id ? 'border-secondary' : 'border-white'} shadow`} style={{ background: s.color }} />
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-muted-foreground">Hair</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {HAIR_COLORS.map((h) => (
                <button key={h.id} type="button" onClick={() => setHairColor(h.id)} aria-label={h.name} aria-pressed={look.hairColor === h.id} className={`h-9 w-9 rounded-full border-4 ${look.hairColor === h.id ? 'border-secondary' : 'border-white'} shadow`} style={{ background: h.color }} />
              ))}
            </div>
          </section>

          <section className="card-surface p-4">
            <h2 className="font-display text-lg font-semibold text-primary">My favorite looks <span className="text-sm font-normal text-muted-foreground">({saved.length}/{MAX_SAVED_LOOKS})</span></h2>
            <div className="mt-2 flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Name this look" aria-label="Name this look" className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary" />
              <button type="button" onClick={doSave} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">Save look</button>
            </div>
            {msg && <p className="mt-1 text-xs font-semibold text-secondary" aria-live="polite">{msg}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {saved.map((s) => (
                <div key={s.id} className="rounded-xl border-2 border-border p-2 text-center">
                  <AvatarImage gender={gender} look={s.look} view="body" size={84} className="mx-auto" />
                  <p className="truncate text-sm font-bold text-primary">{s.name}</p>
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => wearSavedLook(s.id)} className="flex-1 rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">Wear</button>
                    <button type="button" onClick={() => deleteSavedLook(s.id)} aria-label={`Delete ${s.name}`} className="rounded-lg border border-border px-2 py-1 text-xs font-bold text-primary">✕</button>
                  </div>
                </div>
              ))}
              {saved.length === 0 && <p className="col-span-full text-xs text-muted-foreground">Save your best outfits here and wear them again with one tap.</p>}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <Link to="/store" className="rounded-xl bg-secondary px-5 py-3 font-extrabold text-secondary-foreground">🛍️ Open the Style Store</Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Switch to the ${other} character? Your ${gender} look is saved and everything you own stays yours.`)) chooseGender(other);
              }}
              className="rounded-xl border-2 border-border px-4 py-3 text-sm font-bold text-primary hover:border-secondary"
            >
              Switch to {other} character
            </button>
          </section>
        </div>
      </div>
      <p className="sr-only">{CATEGORIES.length} categories in the store</p>
    </div>
  );
}
