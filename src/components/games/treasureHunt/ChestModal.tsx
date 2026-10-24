import { useEffect, useRef, useState } from 'react';
import { maskHint, norm } from '../blockQuest/engine';
import { huntImageUrl } from './huntAssets';
import { TIER_COINS, TIER_LABEL, type HuntQuestion } from './huntQuestions';

/**
 * The locked chest: the question that has to be answered to open it.
 * bronze / silver = pick the answer, gold = type it (with a timer on some).
 * The parent keeps the hearts; this only reports every attempt through onAnswer.
 */
export function ChestModal({
  q,
  result,
  place,
  onAnswer,
  onClose,
}: {
  q: HuntQuestion;
  /** set once the chest has been opened */
  result: { coins: number; firstTry: boolean } | null;
  /** the name of the landmark the chest was hiding at (shown once it is open) */
  place?: string | null;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
}) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [left, setLeft] = useState<number | null>(q.timeLimit);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fail = () => {
    setWrongCount((n) => n + 1);
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
    onAnswer(false);
  };

  // timer (only some chests have one); running out counts as a wrong try and starts again
  useEffect(() => {
    if (q.timeLimit === null || result) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        if (l === null) return l;
        if (l <= 1) {
          window.setTimeout(fail, 0);
          return q.timeLimit;
        }
        return l - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id, result]);

  useEffect(() => {
    if (q.tier === 'gold') inputRef.current?.focus();
  }, [q.id, q.tier]);

  const pick = (id: string, correct: boolean) => {
    if (result) return;
    if (correct) onAnswer(true);
    else {
      setWrongIds((w) => [...w, id]);
      fail();
    }
  };

  const submit = () => {
    if (result || !typed.trim()) return;
    if (norm(typed) === norm(q.answer)) onAnswer(true);
    else {
      setTyped('');
      fail();
    }
  };

  const open = !!result;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-3" role="dialog" aria-modal="true" aria-label="Locked chest">
      <div className={`relative max-h-full w-full max-w-md overflow-auto rounded-3xl border-4 border-[#2B2B6B] bg-[#FFF8E6] p-4 shadow-2xl ${shake ? 'hunt-shake' : ''}`}>
        {!open && (
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-2 rounded-full bg-[#2B2B6B] px-2.5 py-0.5 text-sm font-extrabold text-white">✕</button>
        )}
        <div className="flex items-center gap-3">
          <img src={huntImageUrl(`ui/${open ? 'open' : 'chest'}-${q.tier}`)} alt="" className="h-16 w-auto shrink-0" draggable={false} />
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold text-[#2B2B6B]">{open ? 'The chest is open!' : TIER_LABEL[q.tier]}</p>
            <p className="text-xs font-bold text-[#7a5b00]">
              {open ? `+${result?.coins} 🪙${result?.firstTry ? ' · first try bonus!' : ''}` : `Answer correctly to win ${TIER_COINS[q.tier]} 🪙`}
            </p>
            {open && place && <p className="mt-0.5 text-sm font-extrabold text-[#2B2B6B]">📍 You found: {place}</p>}
          </div>
          {!open && left !== null && (
            <span className={`ml-auto rounded-full px-2.5 py-1 text-sm font-extrabold ${left <= 8 ? 'bg-red-500 text-white' : 'bg-[#2B2B6B] text-white'}`} aria-label={`${left} seconds left`}>⏱ {left}</span>
          )}
        </div>

        {!open && (
          <>
            {q.item.imageUrl && <img src={q.item.imageUrl} alt="" className="mx-auto mt-3 max-h-32 rounded-xl border-2 border-[#2B2B6B]/30 object-contain" />}
            <p dir="auto" className="mt-3 rounded-2xl bg-white p-3 text-base font-bold text-[#2B2B6B] shadow-inner">{q.item.clue}</p>

            {q.tier === 'gold' ? (
              <div className="mt-3">
                <p className="mb-1 text-center font-mono text-xl font-extrabold tracking-widest text-[#7a5b00]" aria-label="letters hint">{maskHint(q.answer, Math.min(wrongCount, Math.max(0, q.answer.length - 1)))}</p>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    dir="auto"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()}
                    placeholder="Type the answer…"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-xl border-2 border-[#2B2B6B] bg-white px-3 py-2 text-base font-bold"
                  />
                  <button type="button" onClick={submit} className="rounded-xl bg-[#FF9A1F] px-4 py-2 font-extrabold text-white shadow">Open</button>
                </div>
                {wrongCount > 0 && <p className="mt-1 text-center text-xs font-bold text-red-600">Not quite! One more letter is shown.</p>}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {q.options.map((o) => {
                  const bad = wrongIds.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={bad}
                      onClick={() => pick(o.id, o.correct)}
                      dir="auto"
                      className={`rounded-xl border-2 px-3 py-2.5 text-left text-base font-extrabold shadow-sm transition ${bad ? 'border-red-300 bg-red-100 text-red-400 line-through' : 'border-[#2B2B6B] bg-white text-[#2B2B6B] hover:bg-[#FFE9A8] active:scale-[0.98]'}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
