import { SHEET, frameRect, sheetUrl, type Facing } from '../world/characters';

/** One frame of an explorer's sprite sheet (the same sheets Treasure Hunt uses), shown as a CSS sprite. `width` in px. */
export function CharacterSprite({ id, facing = 'down', step = 0, width = 80, className, style }: { id: string; facing?: Facing; step?: 0 | 1 | 2; width?: number; className?: string; style?: React.CSSProperties }) {
  const k = width / SHEET.w, r = frameRect(facing, step);
  return <span className={className} aria-hidden="true" style={{ display: 'block', width, height: SHEET.h * k, flex: 'none', backgroundImage: `url(${sheetUrl(id)})`, backgroundRepeat: 'no-repeat', backgroundSize: `${SHEET.w * SHEET.cols * k}px ${SHEET.h * SHEET.rows * k}px`, backgroundPosition: `${-r.sx * k}px ${-r.sy * k}px`, ...style }} />;
}
