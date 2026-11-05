import { useMemo } from 'react';
import { useMq } from '../context';
import { CharacterSprite } from './CharacterSprite';
import { DEFAULT_CHARACTER, SHEET, characterById, headBox, useCharacters, type Facing } from '../world/characters';
import { placeProp, propUrl, usePropCatalog, type PropDef } from '../world/props';

/** An explorer with the wardrobe props they are wearing. `props` = prop ids to show instead of the worn ones. `width` in px. */
export function CharacterAvatar({ id, facing = 'down', width = 100, props, className }: { id?: string; facing?: Facing; width?: number; props?: string[]; className?: string }) {
  const mq = useMq(), catalog = usePropCatalog(); useCharacters();
  const who = id ?? mq.character ?? DEFAULT_CHARACTER;
  const worn = useMemo(() => (props ?? mq.props).map((p) => catalog.find((c) => c.id === p)).filter((p): p is PropDef => !!p), [props, mq.props, catalog]);
  const box = headBox(characterById(who), facing), k = width / SHEET.w;
  const layer = (behind: boolean) => worn.map((p) => {
    const pl = placeProp(p, box, facing);
    if (!pl || pl.behind !== behind) return null;
    return <img key={p.id} src={propUrl(p)} alt="" draggable={false} style={{ position: 'absolute', left: pl.x * k, top: pl.y * k, width: pl.w * k, height: pl.h * k, pointerEvents: 'none' }} />;
  });
  return (
    <div className={className} style={{ position: 'relative', width, height: SHEET.h * k, flex: 'none' }} aria-hidden="true">
      {layer(true)}
      <CharacterSprite id={who} facing={facing} width={width} style={{ position: 'absolute', inset: 0 }} />
      {layer(false)}
    </div>
  );
}
