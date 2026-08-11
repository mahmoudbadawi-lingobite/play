import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGuestProgress } from '../contexts/GuestProgressContext';
import { ConfettiBurst } from '../components/escapeRoom/ConfettiBurst';
import { shareLink } from '../lib/share';
import { pickCongratsMessage, GENERIC_CONGRATS, type CongratsMessage } from '../games/escapeRoomThemes';
import {
  getEscapeRoom, getEscapeRoomHotspots, incrementEscapeRoomPlayCount, recordEscapeRoomResult,
} from '../lib/escapeRoomService';
import type { EscapeRoom, EscapeRoomHotspot } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// After this many missed clicks on the current object, show its extra
// locate hint (if the teacher provided one). Same idea for wrong answers.
const LOCATE_HINT_THRESHOLD = 3;
const ANSWER_HINT_THRESHOLD = 2;

export function EscapeRoomPlayPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile, isGuest } = useAuth();
  const { addXP, xp: guestXP } = useGuestProgress();

  const [room, setRoom] = useState<EscapeRoom | null>(null);
  const [hotspots, setHotspots] = useState<EscapeRoomHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const countedRef = useRef(false);
  const startRef = useRef(Date.now());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [missesOnCurrent, setMissesOnCurrent] = useState(0);
  const [wrongAnswersOnCurrent, setWrongAnswersOnCurrent] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<'wrong' | null>(null);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [begun, setBegun] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [congrats, setCongrats] = useState<CongratsMessage>(GENERIC_CONGRATS[0]);
  const [shareStatus, setShareStatus] = useState<'shared' | 'copied' | null>(null);

  const handleShare = async () => {
    if (!room) return;
    const url = `${window.location.origin}${import.meta.env.BASE_URL}escape-room/${room.id}`;
    const result = await shareLink(url, room.title);
    if (result === 'shared' || result === 'copied') {
      setShareStatus(result);
      setTimeout(() => setShareStatus(null), 2000);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    Promise.all([getEscapeRoom(roomId), getEscapeRoomHotspots(roomId)]).then(([r, spots]) => {
      setRoom(r);
      setHotspots(spots);
      setLoading(false);
      if (r && !countedRef.current) {
        countedRef.current = true;
        incrementEscapeRoomPlayCount(r.id);
      }
      if (!r?.storyText) {
        setBegun(true);
        startRef.current = Date.now();
      }
    });
  }, [roomId]);

  const handleBegin = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    startRef.current = Date.now();
    setBegun(true);
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window) || !room?.storyText) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(room.storyText);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const current = hotspots[currentIndex];

  useEffect(() => {
    setMissesOnCurrent(0);
    setWrongAnswersOnCurrent(0);
  }, [currentIndex]);

  const choiceOptions = useMemo(() => {
    if (!current || current.answerMode !== 'choice') return [];
    return shuffle([current.correctAnswer, ...(current.choices ?? [])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, hotspots.length]);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading room...</p>;
  if (!room || hotspots.length === 0) return <p className="p-8 text-center text-muted-foreground">This escape room isn't available.</p>;

  if (!begun && room.storyText) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="card-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-wide text-secondary">Escape Room</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">{room.title}</h1>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-primary">{room.storyText}</p>
          {'speechSynthesis' in window && (
            <button
              onClick={handleToggleSpeak}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary hover:border-secondary"
            >
              {speaking ? '⏸ Stop reading' : '🔊 Read story aloud'}
            </button>
          )}
          <button
            onClick={handleBegin}
            className="mt-6 w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90"
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (unlocked || finished || !current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const distance = Math.hypot(xPercent - current.xPercent, yPercent - current.yPercent);

    if (distance <= current.radiusPercent) {
      setUnlocked(true);
      setHint(null);
      return;
    }

    const nextMisses = missesOnCurrent + 1;
    setMissesOnCurrent(nextMisses);
    setWrongClicks((w) => w + 1);

    if (distance <= current.radiusPercent * 2.5) setHint('🔥 Hot! You\'re very close.');
    else if (distance <= current.radiusPercent * 5) setHint('🌡️ Warm - getting closer.');
    else setHint('❄️ Cold - try another spot.');
  };

  const finishRoom = async (finalWrongClicks: number) => {
    const durationSeconds = Math.round((Date.now() - startRef.current) / 1000);
    const accuracy = Math.max(0, 100 - finalWrongClicks * 5);
    const earned = Math.round((accuracy / 100) * 50 + 10);
    setXpEarned(earned);
    setCongrats(pickCongratsMessage(room?.theme));
    setFinished(true);

    if (profile) {
      await recordEscapeRoomResult({
        roomId: room.id,
        roomTitle: room.title,
        wrongClicks: finalWrongClicks,
        durationSeconds,
        xpEarned: earned,
      });
    } else if (isGuest) {
      addXP(earned);
    }
  };

  const handleSubmitAnswer = (answer: string) => {
    if (!current) return;
    const isCorrect = answer.trim().toLowerCase() === current.correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      setAnswerFeedback(null);
      setUnlocked(false);
      setTypedAnswer('');
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
      if (currentIndex + 1 >= hotspots.length) {
        finishRoom(wrongClicks);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } else {
      setAnswerFeedback('wrong');
      setWrongClicks((w) => w + 1);
      setWrongAnswersOnCurrent((w) => w + 1);
    }
  };

  if (finished) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ConfettiBurst />
        <div className="card-surface p-8">
          <span className="text-4xl">{congrats.emoji}</span>
          <h2 className="mt-3 font-display text-2xl font-bold text-primary">{congrats.title}</h2>
          <p className="mt-1 text-muted-foreground">{room.title}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Wrong clicks/answers</p>
              <p className="font-display text-2xl font-bold text-primary">{wrongClicks}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">XP earned</p>
              <p className="font-display text-2xl font-bold text-secondary">+{xpEarned}</p>
            </div>
          </div>
          {isGuest && <p className="mt-4 text-xs text-muted-foreground">Guest progress isn't saved. Sign in to keep your XP. (session XP: {guestXP})</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={handleShare} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:opacity-90">
              {shareStatus === 'shared' ? '✓ Shared' : shareStatus === 'copied' ? '✓ Link copied' : '🔗 Share this room'}
            </button>
            <Link to="/escape-rooms" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary">
              Back to Escape Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-secondary">Escape Room</p>
          <h1 className="font-display text-2xl font-bold text-primary">{room.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Clue {currentIndex + 1} of {hotspots.length} · {solvedCount} solved</p>
        </div>
        <button onClick={handleShare} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:border-secondary">
          {shareStatus === 'shared' ? '✓ Shared' : shareStatus === 'copied' ? '✓ Copied' : '🔗 Share'}
        </button>
      </div>

      <div className="card-surface mt-4 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary">🔍 Find this</p>
        <p className="mb-3 font-display text-lg text-primary">{current?.locateHint || current?.clueText}</p>

        <div onClick={handleImageClick} className="relative w-full cursor-crosshair overflow-hidden rounded-xl border border-border">
          <img src={room.imageUrl} alt="" className="block w-full select-none" draggable={false} />
          {hotspots.slice(0, currentIndex).map((h) => (
            <span
              key={h.id}
              style={{ left: `${h.xPercent}%`, top: `${h.yPercent}%` }}
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-success text-sm text-white shadow"
            >
              ✓
            </span>
          ))}
        </div>

        {hint && !unlocked && <p className="mt-2 text-sm text-primary">{hint}</p>}
        {!unlocked && missesOnCurrent >= LOCATE_HINT_THRESHOLD && current?.locateHintExtra && (
          <p className="mt-2 rounded-lg border border-secondary bg-secondary/10 px-3 py-2 text-sm text-primary">
            💡 <span className="font-semibold">Extra hint:</span> {current.locateHintExtra}
          </p>
        )}

        {unlocked && current && (
          <div className="mt-4 rounded-lg border border-secondary bg-secondary/10 p-4">
            <p className="mb-2 text-sm font-semibold text-primary">Found it! ❓ Answer to unlock it:</p>
            <p className="mb-3 text-primary">{current.clueText}</p>

            {current.answerMode === 'type' ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer(typedAnswer)}
                  placeholder="Type your answer..."
                  className={`flex-1 rounded-lg border px-3 py-2 outline-none ${answerFeedback === 'wrong' ? 'border-destructive bg-destructive/10 animate-shake' : 'border-border'}`}
                />
                <button onClick={() => handleSubmitAnswer(typedAnswer)} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">
                  Submit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {choiceOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSubmitAnswer(opt)}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary hover:border-secondary"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {answerFeedback === 'wrong' && <p className="mt-2 text-sm text-destructive">Not quite - try again.</p>}
            {wrongAnswersOnCurrent >= ANSWER_HINT_THRESHOLD && current.questionHintExtra && (
              <p className="mt-2 rounded-lg border border-secondary bg-secondary/10 px-3 py-2 text-sm text-primary">
                💡 <span className="font-semibold">Hint:</span> {current.questionHintExtra}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
