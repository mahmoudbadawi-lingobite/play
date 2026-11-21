import { useEffect } from 'react';
import { speakNatural, speechAvailable, stopSpeaking } from '../../lib/speech';

/**
 * Plays an item's audio text (listening content). Plays once when it appears (`auto`), and again on tap.
 * Without speech support the text is shown so the game is still playable.
 */
export function ListenButton({ text, auto = true, className = '' }: { text: string; auto?: boolean; className?: string }) {
  useEffect(() => {
    if (auto) speakNatural(text);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  if (!speechAvailable()) return <p dir="auto" className={`rounded-lg bg-muted p-2 text-sm italic ${className}`}>🎧 {text}</p>;
  return (
    <button type="button" onClick={() => speakNatural(text)} aria-label="Listen again" className={`inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground shadow ${className}`}>
      🔊 Listen
    </button>
  );
}
