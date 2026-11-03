import { useRef, useState } from 'react';

/** Analog virtual joystick (bottom-left). Reports a vector with length 0..1; the engine applies the dead zone. */
export function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const id = useRef<number | null>(null);
  const R = 46;
  const set = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / R);
    setKnob([(dx / d) * k * R, (dy / d) * k * R]); onMove((dx / d) * k, (dy / d) * k);
  };
  const end = () => { id.current = null; setKnob([0, 0]); onMove(0, 0); };
  return (
    <div ref={base} className="mq-joy" role="group" aria-label="Movement joystick"
      onPointerDown={(e) => { e.preventDefault(); id.current = e.pointerId; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(e); }}
      onPointerMove={(e) => { if (id.current === e.pointerId) set(e); }} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <div className="mq-joy-ring" />
      <div className="mq-joy-knob" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
    </div>
  );
}
