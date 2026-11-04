import { useEffect, useRef, useState } from 'react';
import { useMq } from '../context';
import { DEFAULT_CHARACTER, PLAYER_BASE, frameUrl } from '../world/characters';
import { PROP_BY_ID, measureFrame, placeProp, propUrl, type Facing, type HeadBox, type PropDef } from '../world/props';

/** An explorer with the wardrobe props they are wearing. Props are fitted to the measured head of the frame. */
export function CharacterAvatar({ id, facing = 'down', size = 120, props, className }: { id?: string; facing?: Facing; size?: number; props?: string[]; className?: string }) {
  const mq = useMq();
  const who = id ?? mq.character ?? DEFAULT_CHARACTER;
  const worn = (props ?? mq.props).map((p) => PROP_BY_ID.get(p)).filter((p): p is PropDef => !!p);
  const img = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<HeadBox | null>(null);
  const src = frameUrl(PLAYER_BASE, who, facing, 0);
  useEffect(() => { setBox(null); const el = img.current; if (el && el.complete) setBox(measureFrame(el)); }, [src]);
  const k = size / 260;
  const layer = (behind: boolean) => !box ? null : worn.map((p) => {
    const pl = placeProp(p, box, facing);
    if (!pl || pl.behind !== behind) return null;
    return <img key={p.id} src={propUrl(p)} alt="" draggable={false} style={{ position: 'absolute', left: pl.x * k, top: pl.y * k, width: pl.w * k, height: pl.h * k, pointerEvents: 'none' }} />;
  });
  return (
    <div className={className} style={{ position: 'relative', width: size, height: (size * 232) / 260, flex: 'none' }} aria-hidden="true">
      {layer(true)}
      <img ref={img} src={src} alt="" draggable={false} onLoad={(e) => setBox(measureFrame(e.currentTarget))} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {layer(false)}
    </div>
  );
}
