import { useMemo, useState } from 'react';
import type { GameProps } from './GameShell';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PictureMatchGame({ items, onFinish }: GameProps) {
  const withImages = useMemo(() => items.filter((i) => !!i.imageUrl), [items]);
  const rounds = useMemo(() => shuffle(withImages).slice(0, Math.min(8, withImages.length)), [withImages]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const current = rounds[index];
  const options = useMemo(() => {
    if (!current) return [];
    const distractors = shuffle(items.filter((i) => i.id !== current.id)).slice(0, 3).map((i) => i.term);
    return shuffle([current.term, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (rounds.length === 0) {
    return <p className="p-6 text-muted-foreground">Not enough images in this set to play Picture Match.</p>;
  }

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === current.term;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      if (index + 1 >= rounds.length) {
        const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / rounds.length) * 100);
        onFinish(accuracy);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 700);
  };

  return (
    <div className="card-surface p-6">
      <p className="mb-3 text-sm text-muted-foreground">Picture {index + 1} / {rounds.length}</p>
      <img
        src={current.imageUrl}
        alt="What is this?"
        className="mx-auto h-56 w-auto max-w-full rounded-xl border border-border object-contain"
      />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectOpt = opt === current.term;
          const showState = selected && (isSelected || isCorrectOpt);
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={!!selected}
              className={`rounded-lg border p-3 font-medium ${
                showState
                  ? isCorrectOpt ? 'border-success bg-success/10 text-success' : 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-primary hover:border-secondary'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
