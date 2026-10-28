import { WORLD_IDS, worldPreviewUrl, type WorldId } from './huntAssets';
import { MAX_CHESTS, WORLD_DEFS, worldBlurb, worldCapacity, worldName } from './huntWorld';

/** 'mix' = two different worlds picked at random, one after the other */
export type WorldChoice = WorldId | 'mix';

export { MAX_CHESTS };

export const isWorldChoice = (v: string): v is WorldChoice => v === 'mix' || (WORLD_IDS as string[]).includes(v);

/** the most chests a hunt in this choice can hold */
export const capacityOf = (c: WorldChoice) => (c === 'mix' ? MAX_CHESTS : Math.min(MAX_CHESTS, worldCapacity(c)));

/** two different worlds, in random order */
export function randomPair(): WorldId[] {
  const a = [...WORLD_IDS].sort(() => Math.random() - 0.5);
  return a.slice(0, 2);
}

/** The world cards (a picture, a name and a line about each world, plus "Surprise me"). */
export function WorldPicker({ value, onChange, disabled = false }: { value: WorldChoice; onChange: (c: WorldChoice) => void; disabled?: boolean }) {
  const cards: { id: WorldChoice; name: string; blurb: string; max: string }[] = [
    ...WORLD_IDS.map((id) => ({ id: id as WorldChoice, name: worldName(id), blurb: worldBlurb(id), max: `Up to ${Math.min(MAX_CHESTS, worldCapacity(id))} chests` })),
    { id: 'mix', name: 'Surprise me', blurb: 'Two different worlds picked for you, one after the other', max: `Up to ${MAX_CHESTS} chests` },
  ];
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" role="radiogroup" aria-label="World">
      {cards.map((c) => {
        const on = value === c.id;
        const sky = c.id === 'mix' ? (['#c9b6ff', '#ffd9a0'] as const) : WORLD_DEFS[c.id].sky;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(c.id)}
            className={`flex flex-col overflow-hidden rounded-2xl border-2 text-left transition disabled:cursor-default ${on ? 'border-[#FF9A1F] bg-[#FF9A1F]/15 ring-2 ring-[#FF9A1F]/40' : 'border-border hover:border-[#FF9A1F]/60'}`}
          >
            <span className="flex h-24 w-full items-center justify-center sm:h-28" style={{ background: `linear-gradient(180deg, ${sky[0]}, ${sky[1]})` }}>
              {c.id === 'mix' ? (
                <span className="text-5xl" aria-hidden="true">🎲</span>
              ) : (
                <img src={worldPreviewUrl(c.id)} alt="" loading="lazy" draggable={false} className="h-full w-full object-contain p-1" />
              )}
            </span>
            <span className="px-2 pb-2 pt-1.5">
              <span className="block font-display text-sm font-bold leading-tight text-primary">{c.name}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{c.blurb}</span>
              <span className="mt-1 inline-block rounded-full bg-[#2B2B6B]/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">{c.max}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
