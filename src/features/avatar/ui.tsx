import { useEffect, useState } from 'react';
import { getItem, STARTER, type Gender, type Item, type Rarity } from './catalog';
import { levelInfo, useXp } from './level';
import { useAvatarState } from './avatarStore';
import { AvatarImage } from './AvatarImage';
import { webglAvailable } from './webgl';

export const RARITY: Record<Rarity, { label: string; cls: string }> = {
  common: { label: 'Common', cls: 'bg-slate-200 text-slate-700' },
  rare: { label: 'Rare', cls: 'bg-sky-200 text-sky-900' },
  epic: { label: 'Epic', cls: 'bg-violet-600 text-white' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  outfits: '👕',
  hats: '🎩',
  hair: '💇',
  accessories: '🕶️',
  shoes: '👟',
  backpacks: '🎒',
  pets: '🐾',
  sets: '⭐',
};

export function CoinPill({ coins, className = '' }: { coins: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-white/70 bg-[#2B2B6B] px-3 py-1 text-sm font-extrabold text-white shadow ${className}`}
      aria-label={`${coins} coins`}
    >
      <span className="inline-block h-5 w-5 rounded-full border-2 border-[#B8860B] bg-[#FFC83D]" aria-hidden="true" />
      {coins.toLocaleString()}
    </span>
  );
}

/** Level badge with the student's hero and an XP progress bar. */
export function LevelBadge({ className = '' }: { className?: string }) {
  const { gender, looks } = useAvatarState();
  const xp = useXp();
  const info = levelInfo(xp);
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="rounded-2xl border-2 border-white/80 bg-white/90 p-0.5 shadow">
        <AvatarImage gender={gender} look={gender ? looks[gender] : null} size={52} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-white drop-shadow">Level {info.level}</p>
        <div className="mt-1 h-3 w-36 overflow-hidden rounded-full border border-white/70 bg-[#3B3B8F]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={info.pct} aria-label="Progress to the next level">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FFB020] to-[#FF7A1F]" style={{ width: `${Math.max(6, info.pct)}%` }} />
        </div>
      </div>
    </div>
  );
}

/** One item shown on a character (rendered once by the 3D engine, then cached). */
export function ItemThumb({ gender, item, size = 88 }: { gender: Gender; item: Item | null; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const id = item?.id;
  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (!id || !webglAvailable()) return;
    import('./snapshot')
      .then((m) => m.snapshotItem(gender, id, Math.min(256, Math.round(size * 2)), () => !alive))
      .then((url) => alive && setSrc(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id, gender, size]);

  return (
    <span className="flex items-center justify-center" style={{ width: size, height: size }}>
      {!item ? (
        <span className="text-3xl opacity-40" aria-hidden="true">⛔</span>
      ) : src ? (
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-contain" draggable={false} />
      ) : (
        <span className="text-4xl opacity-70" aria-hidden="true">{CATEGORY_EMOJI[item.category]}</span>
      )}
    </span>
  );
}

export const itemById = getItem;
export const starterFor = (g: Gender) => STARTER[g];
