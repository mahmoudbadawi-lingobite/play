import { assetUrl } from './ccAssets';

/**
 * A round game button that can be held for as long as you like. It is drawn with a background picture (not an <img>) and
 * all the browser's long-press behaviour (image menu, text selection, context menu) is switched off.
 */
export function PressButton({ file, label, disabled, onDown, onUp }: { file: string; label: string; disabled?: boolean; onDown: () => void; onUp?: () => void }) {
  return (
    <div
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      onPointerDown={(e) => { e.preventDefault(); if (disabled) return; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); onDown(); }}
      onPointerUp={() => onUp?.()}
      onPointerCancel={() => onUp?.()}
      onLostPointerCapture={() => onUp?.()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`pointer-events-auto h-16 w-16 shrink-0 select-none rounded-full bg-contain bg-center bg-no-repeat sm:h-[4.5rem] sm:w-[4.5rem] ${disabled ? 'opacity-40' : 'active:scale-95'}`}
      style={{ backgroundImage: `url(${assetUrl(`ui/${file}`)})`, touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
    />
  );
}

