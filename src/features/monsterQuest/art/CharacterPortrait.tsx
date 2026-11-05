import { useMq } from '../context';
import { DEFAULT_CHARACTER, SHEET, characterById, sheetUrl, useCharacters } from '../world/characters';

/** Head-and-shoulders crop of an explorer that fills its (square, usually round) container. */
export function CharacterPortrait({ id }: { id?: string }) {
  const mq = useMq(); useCharacters();
  const who = id ?? mq.character ?? DEFAULT_CHARACTER, head = characterById(who).head.down;
  const pct = (SHEET.w * 0.82 / head.w) * 100;                       // width of one frame, in % of the container
  const left = 50 - pct / 2, top = 50 - ((head.top + head.w * 0.5) / SHEET.h) * pct + 4;
  return (
    <span aria-hidden="true" style={{ display: 'block', position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${pct}%`, aspectRatio: '1', backgroundImage: `url(${sheetUrl(who)})`, backgroundRepeat: 'no-repeat', backgroundSize: `${SHEET.cols * 100}% ${SHEET.rows * 100}%`, backgroundPosition: '0% 0%' }} />
    </span>
  );
}
