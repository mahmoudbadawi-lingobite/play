import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgress } from '../../contexts/GuestProgressContext';
import { getContentSet, incrementPlayCount, recordGameResult } from '../../lib/services';
import { getGameDefinition } from '../../games/registry';
import type { ContentSet, GameKey } from '../../types';
import { MemoryMatchGame } from './MemoryMatchGame';
import { TypingRaceGame } from './TypingRaceGame';
import { WordBuilderGame } from './WordBuilderGame';
import { CrosswordGame } from './CrosswordGame';
import { PictureMatchGame } from './PictureMatchGame';
import { HangmanGame } from './HangmanGame';

export interface GameProps {
  items: ContentSet['items'];
  onFinish: (accuracyPercent: number) => void;
}

const GAME_COMPONENTS: Record<GameKey, React.ComponentType<GameProps>> = {
  'memory-match': MemoryMatchGame,
  'typing-race': TypingRaceGame,
  'word-builder': WordBuilderGame,
  'crossword': CrosswordGame,
  'picture-match': PictureMatchGame,
  'hangman': HangmanGame,
};

export function GameShell() {
  const { setId, gameKey } = useParams<{ setId: string; gameKey: GameKey }>();
  const { t } = useTranslation();
  const { profile, isGuest } = useAuth();
  const { addXP, xp: guestXP } = useGuestProgress();

  const [set, setSet] = useState<ContentSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const startRef = useRef<number>(Date.now());
  const countedRef = useRef(false);

  useEffect(() => {
    if (!setId) return;
    getContentSet(setId).then((s) => {
      setSet(s);
      setLoading(false);
      if (s && !countedRef.current) {
        countedRef.current = true;
        incrementPlayCount(s.id);
      }
      startRef.current = Date.now();
    });
  }, [setId]);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading game...</p>;
  if (!set || !gameKey || !GAME_COMPONENTS[gameKey]) {
    return <p className="p-8 text-center text-muted-foreground">This game isn't available.</p>;
  }

  const GameComponent = GAME_COMPONENTS[gameKey];
  const gameDef = getGameDefinition(gameKey);

  const handleFinish = async (accuracyPercent: number) => {
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const earned = Math.round((accuracyPercent / 100) * 50 + 10);
    setAccuracy(accuracyPercent);
    setXpEarned(earned);
    setFinished(true);

    if (profile) {
      await recordGameResult({
        contentSetId: set.id,
        contentSetTitle: set.title,
        gameKey,
        studentId: profile.uid,
        studentName: profile.displayName ?? 'Player',
        xpEarned: earned,
        accuracy: accuracyPercent,
        durationSeconds,
      });
    } else if (isGuest) {
      addXP(earned);
    }
  };

  if (finished) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card-surface p-8">
          <span className="text-4xl">🎉</span>
          <h2 className="mt-3 font-display text-2xl font-bold text-primary">Nice work!</h2>
          <p className="mt-1 text-muted-foreground">{set.title} · {gameDef.name}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="font-display text-2xl font-bold text-secondary">{accuracy}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP earned</p>
              <p className="font-display text-2xl font-bold text-primary">+{xpEarned}</p>
            </div>
          </div>
          {isGuest && <p className="mt-4 text-xs text-muted-foreground">{t('guestNoticeSave')} (session XP: {guestXP})</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setFinished(false); startRef.current = Date.now(); }} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              Play again
            </button>
            <Link to="/library" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">
              Back to library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-background mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm uppercase tracking-wide text-secondary">{gameDef.name}</p>
      <h1 className="font-display text-2xl font-bold text-primary">{set.title}</h1>
      <div className="mt-6 ltr-always">
        <GameComponent items={set.items} onFinish={handleFinish} />
      </div>
    </div>
  );
}
