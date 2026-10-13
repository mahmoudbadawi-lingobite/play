import { useEffect, useRef, useState } from 'react';
import { LaneGlyph } from './Scene';
import { maskHint, norm, type BridgeLetter, type PortalOption } from './engine';

/** Darker than the portal colours so white text stays readable. */
const BUTTON_COLORS = ['#5B43D6', '#0B7A6B', '#C8421F'] as const;
const RING_COLOR = '#FFC83D';

export function AnswerButtons({
  options,
  lane,
  wrongIds,
  glowLane,
  disabled,
  onPick,
}: {
  options: PortalOption[];
  lane: number;
  wrongIds: string[];
  glowLane: number | null;
  disabled: boolean;
  onPick: (lane: number) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group" aria-label="Answers">
      {options.map((opt, i) => {
        const wrong = wrongIds.includes(opt.id);
        const selected = lane === i && !disabled && !wrong;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || wrong}
            onClick={() => onPick(i)}
            aria-label={wrong ? `${opt.label} (not this one)` : opt.label}
            className="bq-btn flex min-h-[60px] items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg font-extrabold"
            style={{
              background: wrong ? '#E5E3EE' : BUTTON_COLORS[i],
              color: wrong ? '#7A7690' : '#fff',
              outline: selected || glowLane === i ? `4px solid ${RING_COLOR}` : 'none',
              outlineOffset: 2,
            }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/90" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <LaneGlyph lane={i} cx={12} cy={12} r={8} fill={wrong ? '#9A98A8' : BUTTON_COLORS[i]} />
              </svg>
            </span>
            <span className={wrong ? 'line-through' : ''}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function LetterTray({
  term,
  letters,
  usedIds,
  placed,
  hintId,
  disabled,
  onTap,
}: {
  term: string;
  letters: BridgeLetter[];
  usedIds: string[];
  placed: number;
  hintId: string | null;
  disabled: boolean;
  onTap: (id: string) => void;
}) {
  const chars = term.trim().split('');
  return (
    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-3 text-center">
      <div className="flex flex-wrap justify-center gap-1.5" aria-label={`Spelling so far: ${chars.slice(0, placed).join('')}`}>
        {chars.map((c, i) => (
          <span
            key={i}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-border text-xl font-extrabold uppercase text-primary"
          >
            {i < placed ? c : ''}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Letter blocks">
        {letters.map((l) => {
          const used = usedIds.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              disabled={disabled || used}
              onClick={() => onTap(l.id)}
              aria-label={`Letter ${l.char}`}
              className="bq-btn h-12 w-12 rounded-xl text-xl font-extrabold uppercase"
              style={{
                background: used ? 'transparent' : '#FFC83D',
                color: '#2B2B5E',
                visibility: used ? 'hidden' : 'visible',
                outline: hintId === l.id ? '4px solid #7B61FF' : 'none',
                outlineOffset: 2,
              }}
            >
              {l.char}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BossPanel({
  term,
  misses,
  disabled,
  onSubmit,
}: {
  term: string;
  misses: number;
  disabled: boolean;
  /** Returns true when the answer was right. */
  onSubmit: (text: string) => boolean;
}) {
  const [text, setText] = useState('');
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const submit = () => {
    if (disabled || !text.trim()) return;
    if (!onSubmit(text)) {
      setShake((n) => n + 1);
      setText('');
    }
  };

  return (
    <div className="mt-3 rounded-2xl border-2 border-border bg-card p-4">
      <input
        key={shake}
        ref={inputRef}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Type the answer..."
        aria-label="Type the answer"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`w-full rounded-xl border-2 px-4 py-3 text-lg outline-none ${shake > 0 ? 'animate-shake border-destructive' : 'border-border'}`}
      />
      {misses >= 2 && (
        <p className="mt-2 text-center font-mono text-lg tracking-widest text-primary" aria-live="polite">
          {misses >= 3 ? term.trim() : maskHint(term, 1)}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !norm(text)}
        className="bq-btn mt-3 w-full rounded-xl bg-secondary px-4 py-3 text-lg font-extrabold text-secondary-foreground disabled:opacity-50"
      >
        Open the gate
      </button>
    </div>
  );
}
