import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from './GameShell';

const TIME_PER_QUESTION = 12;

export function TypingRaceGame({ items, onFinish }: GameProps) {
  const questions = useMemo(() => [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(10, items.length)), [items]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const current = questions[index];

  useEffect(() => {
    if (feedback) return;
    if (timeLeft <= 0) {
      advance(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, feedback]);

  function advance(wasCorrect: boolean) {
    if (wasCorrect) setCorrectCount((c) => c + 1);
    setFeedback(wasCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        const accuracy = Math.round(((wasCorrect ? correctCount + 1 : correctCount) / questions.length) * 100);
        onFinish(accuracy);
      } else {
        setIndex((i) => i + 1);
        setInput('');
        setTimeLeft(TIME_PER_QUESTION);
        setFeedback(null);
      }
    }, 600);
  }

  const submit = () => {
    if (feedback) return;
    const isCorrect = input.trim().toLowerCase() === current.term.trim().toLowerCase();
    advance(isCorrect);
  };

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {index + 1} / {questions.length}</span>
        <span className={timeLeft <= 4 ? 'font-bold text-destructive' : ''}>⏱ {timeLeft}s</span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-secondary transition-all" style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }} />
      </div>

      {current.imageUrl && (
        <img src={current.imageUrl} alt="" className="mx-auto mb-3 h-32 w-auto max-w-full rounded-lg object-contain" />
      )}
      <p className="font-display text-xl text-primary">{current.clue}</p>

      <input
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Type the answer..."
        className={`mt-4 w-full rounded-lg border px-4 py-3 text-lg outline-none ${
          feedback === 'correct' ? 'border-success bg-success/10' : feedback === 'wrong' ? 'border-destructive bg-destructive/10 animate-shake' : 'border-border'
        }`}
        disabled={!!feedback}
      />
      {feedback === 'wrong' && (
        <p className="mt-2 text-sm text-destructive">Correct answer: {current.term}</p>
      )}

      <button
        onClick={submit}
        disabled={!!feedback || !input}
        className="mt-4 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-40"
      >
        Submit
      </button>
    </div>
  );
}
