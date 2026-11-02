import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { RARITY_META, TYPE_META } from './config';
import type { ElementType, Rarity } from './types';
import { sfx } from './sound';

export function TypeBadge({ type, small }: { type: ElementType; small?: boolean }) {
  const m = TYPE_META[type];
  return <span className={`inline-flex items-center gap-1 rounded-full font-bold text-white ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`} style={{ background: m.color }}>{m.icon} {m.label}</span>;
}
export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const m = RARITY_META[rarity];
  return <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" style={{ background: m.color }}>{m.label}</span>;
}

export function Bar({ pct, color = '#22c55e', label, height = 10 }: { pct: number; color?: string; label?: string; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-black/25" style={{ height }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function GameButton({ tone = 'gold', className = '', onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'gold' | 'blue' | 'red' | 'green' | 'ghost' }) {
  return <button {...rest} onClick={(e) => { sfx.click(); onClick?.(e); }} className={`mq-btn mq-btn-${tone} ${className}`} />;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mq-panel ${className}`}>{children}</div>;
}

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="mq-modal-bg" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`mq-modal ${wide ? 'mq-modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function StatRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-white/90">
      <span className="w-8 shrink-0 uppercase opacity-80">{label}</span>
      <div className="flex-1"><Bar pct={(value / max) * 100} color={color} height={8} /></div>
      <span className="w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

export const fmt = (n: number) => n.toLocaleString();
