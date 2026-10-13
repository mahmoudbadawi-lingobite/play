import { useState } from 'react';
import { AvatarPreview } from './Avatar';
import { buyItem, equipItem, SHOP_ITEMS, useAvatarStore, type ShopItem, type ShopSlot } from './avatarStore';

const TABS: { slot: ShopSlot; label: string }[] = [
  { slot: 'hat', label: 'Hats' },
  { slot: 'shirt', label: 'Shirts' },
  { slot: 'skin', label: 'Skin' },
];

export function AvatarShop({ onBack }: { onBack: () => void }) {
  const store = useAvatarStore();
  const [slot, setSlot] = useState<ShopSlot>('hat');
  const items = SHOP_ITEMS.filter((i) => i.slot === slot);

  const act = (item: ShopItem) => {
    if (store.owned.includes(item.id)) equipItem(item);
    else buyItem(item);
  };

  return (
    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-primary">Your look</h2>
        <span className="rounded-full border-2 border-border px-3 py-1 text-sm font-bold text-primary">🪙 {store.coins}</span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <AvatarPreview look={store} className="h-28 w-14 shrink-0" />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Shop sections">
          {TABS.map((t) => (
            <button
              key={t.slot}
              type="button"
              role="tab"
              aria-selected={slot === t.slot}
              onClick={() => setSlot(t.slot)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${slot === t.slot ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border text-primary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const owned = store.owned.includes(item.id);
          const worn = store[item.slot] === item.value;
          const poor = !owned && store.coins < item.price;
          return (
            <div key={item.id} className="flex flex-col items-center rounded-xl border-2 border-border p-2 text-center">
              <AvatarPreview look={{ ...store, [item.slot]: item.value }} className="h-20 w-10" />
              <p className="mt-1 text-sm font-bold text-primary">{item.name}</p>
              <button
                type="button"
                onClick={() => act(item)}
                disabled={worn || poor}
                className="mt-1 w-full rounded-lg bg-secondary px-2 py-1.5 text-sm font-bold text-secondary-foreground disabled:opacity-50"
              >
                {worn ? 'Wearing' : owned ? 'Wear' : poor ? `Need ${item.price - store.coins} more` : `Buy · ${item.price} 🪙`}
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onBack} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">
        Back to the start
      </button>
    </div>
  );
}
