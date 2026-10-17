import { useEffect, useState } from 'react';
import { webglAvailable } from '../../../features/avatar/webgl';
import { WORLDS, type World } from './worlds';

function Card({ w, selected, onPick }: { w: World; selected: boolean; onPick: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!webglAvailable()) return;
    import('../../../features/world3d/previews')
      .then((m) => m.snapshotWorld(w.id, 360, 225))
      .then((url) => alive && setSrc(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [w.id]);

  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={`group relative aspect-[16/10] overflow-hidden rounded-2xl border-4 text-left shadow-md transition ${selected ? 'border-[#FF9A1F] ring-4 ring-[#FF9A1F]/40' : 'border-white hover:border-secondary'}`}
      style={{ background: `linear-gradient(${w.sky}, ${w.skyFar} 55%, ${w.ground})` }}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" draggable={false} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-80" aria-hidden="true">{w.emoji}</span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-xs font-extrabold leading-tight text-white drop-shadow sm:text-sm">
        {w.name}
      </span>
    </button>
  );
}

/** "Pick your world": each card is a picture of the real 3D world. */
export function WorldCards({ worldId, onWorld }: { worldId: string; onWorld: (id: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3" role="group" aria-label="Worlds">
      {WORLDS.map((w) => (
        <Card key={w.id} w={w} selected={w.id === worldId} onPick={() => onWorld(w.id)} />
      ))}
    </div>
  );
}
