import { useMemo, useState } from 'react';
import type { GameProps } from './GameShell';

function scramble(word: string): { char: string; id: string }[] {
  const letters = word.split('').map((char, i) => ({ char, id: `${i}-${char}-${Math.random()}` }));
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // guard against an accidental already-solved scramble on short words
  if (letters.map((l) => l.char).join('') === word && word.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  return letters;
}

export function WordBuilderGame({ items, onFinish }: GameProps) {
  const questions = useMemo(() => [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(8, items.length)), [items]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [available, setAvailable] = useState(() => scramble(questions[0]?.term.toUpperCase() ?? ''));
  const [built, setBuilt] = useState<{ char: string; id: string }[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const current = questions[index];

  const pick = (letter: { char: string; id: string }) => {
    if (feedback) return;
    setAvailable((a) => a.filter((l) => l.id !== letter.id));
    setBuilt((b) => [...b, letter]);
  };

  const removeLast = () => {
    if (feedback || built.length === 0) return;
    const last = built[built.length - 1];
    setBuilt((b) => b.slice(0, -1));
    setAvailable((a) => [...a, last]);
  };

  const submit = () => {
    const guess = built.map((l) => l.char).join('');
    const isCorrect = guess === current.term.toUpperCase();
    if (isCorrect) setCorrectCount((c) => c + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / questions.length) * 100);
        onFinish(accuracy);
      } else {
        const next = questions[index + 1];
        setIndex((i) => i + 1);
        setAvailable(scramble(next.term.toUpperCase()));
        setBuilt([]);
        setFeedback(null);
      }
    }, 900);
  };

  return (
    <div className="card-surface p-6">
      <p className="mb-1 text-sm text-muted-foreground">Word {index + 1} / {questions.length}</p>
      {current.imageUrl && (
        <img src={current.imageUrl} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />
      )}
      <p className="font-display text-xl text-primary">{current.clue}</p>

      <div className="mt-5 flex min-h-[3.5rem] flex-wrap gap-2 rounded-lg border-2 border-dashed border-border p-3">
        {built.length === 0 && <span className="text-sm text-muted-foreground">Tap letters below to build the word</span>}
        {built.map((l) => (
          <span key={l.id} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            {l.char}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {available.map((l) => (
          <button
            key={l.id}
            onClick={() => pick(l)}
            disabled={!!feedback}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-lg font-bold text-primary hover:border-secondary"
          >
            {l.char}
          </button>
        ))}
      </div>

      {feedback === 'wrong' && <p className="mt-2 text-sm text-destructive">Correct: {current.term.toUpperCase()}</p>}

      <div className="mt-5 flex gap-2">
        <button onClick={removeLast} disabled={!!feedback} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">
          ⌫ Undo
        </button>
        <button
          onClick={submit}
          disabled={!!feedback || built.length !== current.term.length}
          className="flex-1 rounded-lg bg-primary py-2 font-semibold text-primary-foreground disabled:opacity-40"
        >
          Check
        </button>
      </div>
    </div>
  );
}
