import { useMemo, useState } from 'react';
import type { GameProps } from './GameShell';

const MAX_MISSES = 6;
const KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function HangmanGame({ items, onFinish }: GameProps) {
  const rounds = useMemo(() => [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(5, items.length)), [items]);
  const [index, setIndex] = useState(0);
  const [wonCount, setWonCount] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);

  const current = rounds[index];
  const term = current.term.toUpperCase();
  const displayLetters = term.split('').map((ch) => (/[A-Z]/.test(ch) ? ch : ch));
  const solved = displayLetters.every((ch) => !/[A-Z]/.test(ch) || guessed.includes(ch));
  const lost = misses >= MAX_MISSES;
  const roundOver = solved || lost;

  const guess = (letter: string) => {
    if (guessed.includes(letter) || roundOver) return;
    const next = [...guessed, letter];
    setGuessed(next);
    if (!term.includes(letter)) setMisses((m) => m + 1);
  };

  const nextRound = () => {
    const won = solved;
    if (won) setWonCount((w) => w + 1);
    if (index + 1 >= rounds.length) {
      const accuracy = Math.round(((won ? wonCount + 1 : wonCount) / rounds.length) * 100);
      onFinish(accuracy);
    } else {
      setIndex((i) => i + 1);
      setGuessed([]);
      setMisses(0);
    }
  };

  return (
    <div className="card-surface p-6 text-center">
      <p className="mb-1 text-sm text-muted-foreground">Word {index + 1} / {rounds.length} · Misses: {misses}/{MAX_MISSES}</p>
      <p className="mb-4 font-display text-lg text-primary">{current.clue}</p>

      <div className="mb-6 flex justify-center gap-2 text-2xl font-bold tracking-widest text-primary">
        {displayLetters.map((ch, i) =>
          /[A-Z]/.test(ch) ? (
            <span key={i} className="w-6 border-b-2 border-primary">
              {guessed.includes(ch) || lost ? ch : '\u00A0'}
            </span>
          ) : (
            <span key={i} className="w-3">{ch}</span>
          )
        )}
      </div>

      {roundOver ? (
        <div className="mb-4">
          {lost && <p className="mb-2 text-destructive">The word was: {term}</p>}
          {solved && <p className="mb-2 text-success">Nice! ✅</p>}
          <button onClick={nextRound} className="rounded-lg bg-secondary px-5 py-2 font-semibold text-secondary-foreground">
            {index + 1 >= rounds.length ? 'Finish' : 'Next word'}
          </button>
        </div>
      ) : (
        <div className="mx-auto grid max-w-lg grid-cols-7 gap-1.5 sm:grid-cols-9">
          {KEYBOARD.map((letter) => {
            const used = guessed.includes(letter);
            const wrong = used && !term.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => guess(letter)}
                disabled={used}
                className={`rounded-md border py-1.5 text-sm font-semibold ${
                  wrong ? 'border-destructive bg-destructive/10 text-destructive' :
                  used ? 'border-success bg-success/10 text-success' :
                  'border-border bg-card text-primary hover:border-secondary'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
