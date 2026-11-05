import { SHEET, frameRect, sheetUrl, type Facing } from '../world/characters';

/** One frame of an explorer sheet as a CSS sprite. `width` in px (frames are square). step 0 = standing, 1-6 = walk. */
export function CharacterSprite({ id, facing = 'down', step = 0, width = 80, className, style }: { id: string; facing?: Facing; step?: number; width?: number; className?: string; style?: React.CSSProperties }) {
  const k = width / SHEET.w, r = frameRect(facing, step);
  return <span className={className} aria-hidden="true" style={{ display: 'block', width, height: SHEET.h * k, flex: 'none', backgroundImage: `url(${sheetUrl(id)})`, backgroundRepeat: 'no-repeat', backgroundSize: `${SHEET.w * SHEET.cols * k}px ${SHEET.h * SHEET.rows * k}px`, backgroundPosition: `${-r.sx * k}px ${-r.sy * k}px`, ...style }} />;
}
