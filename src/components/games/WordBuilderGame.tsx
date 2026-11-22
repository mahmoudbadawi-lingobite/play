import { useMemo, useState } from 'react';
import type { GameProps } from './GameShell';
import { ListenButton } from '../common/ListenButton';

import { tr } from '../../i18n/tr';
import { isArabicText, stripMarks } from '../../lib/arabicText';

const clean = (t: string) => stripMarks(t).toUpperCase();
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
  const [available, setAvailable] = useState(() => scramble(clean(questions[0]?.term ?? '')));
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
    const isCorrect = guess === clean(current.term);
    if (isCorrect) setCorrectCount((c) => c + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        const accuracy = Math.round(((isCorrect ? correctCount + 1 : correctCount) / questions.length) * 100);
        onFinish(accuracy);
      } else {
        const next = questions[index + 1];
        setIndex((i) => i + 1);
        setAvailable(scramble(clean(next.term)));
        setBuilt([]);
        setFeedback(null);
      }
    }, 900);
  };

  return (
    <div className="card-surface p-6">
      <p className="mb-1 text-sm text-muted-foreground">{tr('Word {i} / {n}', { i: index + 1, n: questions.length })}</p>
      {current.imageUrl && (
        <img src={current.imageUrl} alt="" className="mx-auto mb-3 h-32 w-auto max-w-full rounded-lg object-contain" />
      )}
      {current.audio && <div className="mb-3"><ListenButton text={current.audio} /></div>}
      <p dir="auto" className="font-display text-xl text-primary">{current.clue}</p>

      <div dir={isArabicText(current.term) ? 'rtl' : 'ltr'} className="mt-5 flex min-h-[3.5rem] flex-wrap gap-2 rounded-lg border-2 border-dashed border-border p-3">
        {built.length === 0 && <span className="text-sm text-muted-foreground">{tr('Tap letters below to build the word')}</span>}
        {built.length > 0 && isArabicText(current.term) ? (
          // Arabic: show the built letters joined into one word so they connect
          <span dir="rtl" className="px-2 text-3xl font-bold text-primary">{built.map((l) => l.char).join('')}</span>
        ) : (
          built.map((l) => (
            <span key={l.id} className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
              {l.char}
            </span>
          ))
        )}
      </div>

      <div dir={isArabicText(current.term) ? 'rtl' : 'ltr'} className="mt-4 flex flex-wrap gap-2">
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

      {feedback === 'wrong' && <p className="mt-2 text-sm text-destructive">{tr('Correct')}: {clean(current.term)}</p>}

      <div className="mt-5 flex gap-2">
        <button onClick={removeLast} disabled={!!feedback} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">
          ⌫ {tr('Undo')}
        </button>
        <button
          onClick={submit}
          disabled={!!feedback || built.length !== clean(current.term).length}
          className="flex-1 rounded-lg bg-primary py-2 font-semibold text-primary-foreground disabled:opacity-40"
        >
          {tr('Check')}
        </button>
      </div>
    </div>
  );
}
