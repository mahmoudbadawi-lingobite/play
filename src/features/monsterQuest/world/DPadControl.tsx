import { type MutableRefObject } from 'react';
import type { DPad } from './ExploreCanvas';

const ARROWS: Record<DPad, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };

/**
 * On-screen controller. Each button is an independent pointer target, so on a phone/iPad two fingers
 * (e.g. up + right) walk diagonally. Pointer capture keeps a button held even if the finger slides off it.
 * Shown on touch devices at any width (see .mq-dpad in monsterQuest.css); desktop players can toggle it.
 */
export function DPadControl({ pad, forceShow }: { pad: MutableRefObject<Set<DPad>>; forceShow?: boolean }) {
  const press = (d: DPad, on: boolean) => { if (on) pad.current.add(d); else pad.current.delete(d); };
  const btn = (d: DPad, area: string) => (
    <button key={d} type="button" aria-label={`Move ${d}`} style={{ gridArea: area }}
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); press(d, true); }}
      onPointerUp={() => press(d, false)} onPointerCancel={() => press(d, false)} onLostPointerCapture={() => press(d, false)}
      onContextMenu={(e) => e.preventDefault()}
      className="mq-dpad-btn">{ARROWS[d]}</button>
  );
  return (
    <div className={`mq-dpad ${forceShow ? 'mq-dpad-on' : ''}`} role="group" aria-label="Movement controller">
      {btn('up', 'u')}{btn('left', 'l')}{btn('right', 'r')}{btn('down', 'd')}
    </div>
  );
}
