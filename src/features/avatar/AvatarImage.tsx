import { lazy, Suspense, useEffect, useState } from 'react';
import { STARTER, type Gender, type Look } from './catalog';
import { Avatar2D } from './Avatar2D';
import type { AvatarStageProps } from './AvatarStage';
import type { View } from './stage';
import { webglAvailable } from './webgl';

const AvatarStage = lazy(() => import('./AvatarStage'));

/** Live, draggable 3D character. Falls back to the flat 2D character when WebGL isn't available. */
export function AvatarStageView(props: AvatarStageProps) {
  const [failed, setFailed] = useState(false);
  const fallback = (
    <div className={`flex items-center justify-center ${props.className ?? ''}`}>
      <Avatar2D figure={{ gender: props.gender, look: props.look }} className="h-full max-h-80 w-auto" />
    </div>
  );
  if (!webglAvailable() || failed) return fallback;
  return (
    <Suspense fallback={<div className={`animate-pulse rounded-2xl bg-muted/40 ${props.className ?? ''}`} aria-hidden="true" />}>
      <AvatarStage {...props} onError={() => setFailed(true)} />
    </Suspense>
  );
}

/**
 * The character as a small picture (header chip, rewards, saved looks...).
 * Rendered once by the 3D engine and cached; the 2D figure shows meanwhile.
 */
export function AvatarImage({
  gender,
  look,
  view = 'bust',
  size = 48,
  className = '',
}: {
  gender: Gender | null;
  look: Look | null;
  view?: View;
  /** Display size in CSS pixels (square). */
  size?: number;
  className?: string;
}) {
  const g = gender ?? 'boy';
  const l = look ?? STARTER[g];
  const [src, setSrc] = useState<string | null>(null);
  const key = JSON.stringify([g, l, view]);

  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (!gender || !webglAvailable()) return;
    import('./snapshot')
      .then((m) => m.snapshotLook(g, l, view, Math.min(512, Math.round(size * 2.5)), () => !alive))
      .then((url) => alive && setSrc(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // `key` captures gender, look and view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size]);

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt="" width={size} height={size} className="h-full w-full object-contain" draggable={false} />
      ) : (
        <Avatar2D figure={{ gender: g, look: l }} className="h-full w-auto" />
      )}
    </span>
  );
}
