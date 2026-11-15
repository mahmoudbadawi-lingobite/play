import type { CSSProperties, ReactNode } from 'react';
import { ARENAS, ARENA_H, ARENA_W, BRAZIER_FRAME, BRAZIER_IMAGE, arenaFor, arenaImage } from './arenas';
import './arena.css';

/**
 * The painted battle arena. The picture always covers the whole box (like a background-size: cover) and everything that
 * belongs to the picture (the braziers, the monsters) is placed in % of the picture, so it stays put on every screen.
 * Children (the two fighters) are drawn on top of the braziers.
 */
export function ArenaStage({ zone, children }: { zone: string; children?: ReactNode }) {
  const id = arenaFor(zone);
  return (
    <div className="mq-stage" aria-hidden="true">
      <img className="mq-stage-bg" src={arenaImage(id)} alt="" draggable={false} />
      {ARENAS[id].braziers.map((b, i) => {
        const h = (b.w * BRAZIER_FRAME.h) / BRAZIER_FRAME.w;
        const style = {
          left: `${(b.x / ARENA_W) * 100}%`, top: `${((b.y - h) / ARENA_H) * 100}%`, width: `${(b.w / ARENA_W) * 100}%`,
          aspectRatio: `${BRAZIER_FRAME.w} / ${BRAZIER_FRAME.h}`, backgroundImage: `url(${BRAZIER_IMAGE})`,
          animationDuration: `${BRAZIER_FRAME.frames / BRAZIER_FRAME.fps}s`, animationDelay: `${-i * 0.37}s`,
        } as CSSProperties;
        return <div key={i} className="mq-brazier" style={style}><span className="mq-brazier-glow" /></div>;
      })}
      {children}
    </div>
  );
}
