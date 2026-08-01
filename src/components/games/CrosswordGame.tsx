import { useMemo, useRef, useState } from 'react';
import type { GameProps } from './GameShell';
import { generateCrossword } from '../../games/crosswordGenerator';

export function CrosswordGame({ items, onFinish }: GameProps) {
  const layout = useMemo(() => generateCrossword(items.slice(0, 12)), [items]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const handleChange = (r: number, c: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    setAnswers((a) => ({ ...a, [cellKey(r, c)]: char }));
  };

  const totalLetters = layout.cells.size;
  const correctLetters = [...layout.cells.entries()].filter(
    ([k, cell]) => (answers[k] || '') === cell.char
  ).length;

  const submit = () => {
    setChecked(true);
    const accuracy = Math.round((correctLetters / Math.max(totalLetters, 1)) * 100);
    setTimeout(() => onFinish(accuracy), 1200);
  };

  return (
    <div className="card-surface p-3 sm:p-6">
      <div className="overflow-x-auto pb-2">
        <div
          className="grid w-max gap-0.5"
          style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1.75rem))` }}
        >
          {Array.from({ length: layout.rows }).map((_, r) =>
            Array.from({ length: layout.cols }).map((_, c) => {
              const cell = layout.cells.get(cellKey(r, c));
              if (!cell) return <div key={cellKey(r, c)} className="h-7 w-7 sm:h-8 sm:w-8" />;
              const isCorrect = checked && (answers[cellKey(r, c)] || '') === cell.char;
              const isWrong = checked && (answers[cellKey(r, c)] || '') !== cell.char;
              return (
                <div key={cellKey(r, c)} className="relative h-7 w-7 sm:h-8 sm:w-8">
                  {cell.number && <span className="pointer-events-none absolute left-0.5 top-0 text-[8px] text-muted-foreground">{cell.number}</span>}
                  <input
                    ref={(el) => { inputRefs.current[cellKey(r, c)] = el; }}
                    maxLength={1}
                    value={answers[cellKey(r, c)] || ''}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    disabled={checked}
                    className={`h-7 w-7 border text-center text-sm font-bold uppercase outline-none sm:h-8 sm:w-8 ${
                      isCorrect ? 'border-success bg-success/10' : isWrong ? 'border-destructive bg-destructive/10' : 'border-border bg-card'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Across</p>
          {layout.words.filter((w) => w.direction === 'across').map((w) => (
            <div key={w.itemId} className="mb-1 flex items-center gap-2 text-sm text-primary">
              {w.imageUrl && <img src={w.imageUrl} alt="" className="h-8 w-8 rounded object-contain" />}
              <span><b>{w.number}.</b> {w.clue}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Down</p>
          {layout.words.filter((w) => w.direction === 'down').map((w) => (
            <div key={w.itemId} className="mb-1 flex items-center gap-2 text-sm text-primary">
              {w.imageUrl && <img src={w.imageUrl} alt="" className="h-8 w-8 rounded object-contain" />}
              <span><b>{w.number}.</b> {w.clue}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={submit}
        disabled={checked}
        className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Check answers
      </button>
    </div>
  );
}
