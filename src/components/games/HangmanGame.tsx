import { useMemo, useState } from 'react';
import type { GameProps } from './GameShell';
import { ListenButton } from '../common/ListenButton';

import { tr } from '../../i18n/tr';
import { ARABIC_KEYBOARD, LATIN_KEYBOARD, isArabicText, letterKey, stripMarks } from '../../lib/arabicText';
const MAX_MISSES = 6;

export function HangmanGame({ items, onFinish }: GameProps) {
  const rounds = useMemo(() => [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(5, items.length)), [items]);
  const [index, setIndex] = useState(0);
  const [wonCount, setWonCount] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);

  const current = rounds[index];
  const arabic = isArabicText(current.term);
  const KEYBOARD = arabic ? ARABIC_KEYBOARD : LATIN_KEYBOARD;
  const term = stripMarks(current.term).toUpperCase();
  // one slot per character; `key` is what the player must guess (null for spaces and punctuation)
  const slots = term.split('').map((ch) => ({ ch, key: letterKey(ch) }));
  const keys = slots.map((x) => x.key).filter((k): k is string => k !== null);
  const solved = keys.every((k) => guessed.includes(k));
  const lost = misses >= MAX_MISSES;
  const roundOver = solved || lost;

  const guess = (letter: string) => {
    if (guessed.includes(letter) || roundOver) return;
    const next = [...guessed, letter];
    setGuessed(next);
    if (!keys.includes(letter)) setMisses((m) => m + 1);
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
      <p className="mb-1 text-sm text-muted-foreground">{tr('Word {i} / {n} · Misses: {m}/{max}', { i: index + 1, n: rounds.length, m: misses, max: MAX_MISSES })}</p>
      {current.imageUrl && (
        <img src={current.imageUrl} alt="" className="mx-auto mb-3 h-32 w-auto max-w-full rounded-lg object-contain" />
      )}
      {current.audio && <div className="mb-3"><ListenButton text={current.audio} /></div>}
      <p dir="auto" className="mb-4 font-display text-lg text-primary">{current.clue}</p>

      <div dir={arabic ? 'rtl' : 'ltr'} className="mb-6 flex flex-wrap justify-center gap-2 text-2xl font-bold text-primary">
        {roundOver ? (
          // finished: show the whole word joined up, the way it is written
          <span className="px-2 text-3xl" style={arabic ? undefined : { letterSpacing: '0.15em' }}>{term}</span>
        ) : (
          slots.map((x, i) =>
            x.key ? (
              <span key={i} className="w-7 border-b-2 border-primary">
                {guessed.includes(x.key) ? x.ch : '\u00A0'}
              </span>
            ) : (
              <span key={i} className="w-3">{x.ch}</span>
            )
          )
        )}
      </div>

      {roundOver ? (
        <div className="mb-4">
          {lost && <p className="mb-2 text-destructive">{tr('The word was:')} {term}</p>}
          {solved && <p className="mb-2 text-success">{tr('Nice! ✅')}</p>}
          <button onClick={nextRound} className="rounded-lg bg-secondary px-5 py-2 font-semibold text-secondary-foreground">
            {index + 1 >= rounds.length ? tr('Finish') : tr('Next word')}
          </button>
        </div>
      ) : (
        <div dir={arabic ? 'rtl' : 'ltr'} className="mx-auto grid max-w-lg grid-cols-7 gap-1.5 sm:grid-cols-9">
          {KEYBOARD.map((letter) => {
            const used = guessed.includes(letter);
            const wrong = used && !keys.includes(letter);
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
