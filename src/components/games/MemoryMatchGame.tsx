import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from './GameShell';

interface Card {
  cardId: string;
  itemId: string;
  label: string;
  kind: 'term' | 'clue';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MemoryMatchGame({ items, onFinish }: GameProps) {
  const pool = useMemo(() => shuffle(items).slice(0, Math.min(8, items.length)), [items]);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const built: Card[] = pool.flatMap((item) => [
      { cardId: `${item.id}-term`, itemId: item.id, label: item.term, kind: 'term' as const },
      { cardId: `${item.id}-clue`, itemId: item.id, label: item.clue, kind: 'clue' as const },
    ]);
    setCards(shuffle(built));
  }, [pool]);

  const handleFlip = (cardId: string) => {
    if (flipped.includes(cardId) || matched.includes(cardId) || flipped.length === 2) return;
    const next = [...flipped, cardId];
    setFlipped(next);

    if (next.length === 2) {
      setAttempts((a) => a + 1);
      const [a1, a2] = next.map((id) => cards.find((c) => c.cardId === id)!);
      if (a1.itemId === a2.itemId) {
        setTimeout(() => {
          setMatched((m) => [...m, a1.cardId, a2.cardId]);
          setFlipped([]);
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      const accuracy = Math.round((pool.length / Math.max(attempts, pool.length)) * 100);
      setTimeout(() => onFinish(Math.min(accuracy, 100)), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Match each term with its clue · {matched.length / 2}/{pool.length} pairs</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.cardId) || matched.includes(card.cardId);
          const isMatched = matched.includes(card.cardId);
          return (
            <button
              key={card.cardId}
              onClick={() => handleFlip(card.cardId)}
              disabled={isMatched}
              className={`flex h-24 items-center justify-center rounded-xl border p-2 text-center text-sm font-medium transition ${
                isMatched
                  ? 'border-success bg-success/10 text-success'
                  : isFlipped
                  ? 'border-secondary bg-secondary/10 text-primary animate-pop-in'
                  : 'border-border bg-primary text-primary-foreground'
              }`}
            >
              {isFlipped ? card.label : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
