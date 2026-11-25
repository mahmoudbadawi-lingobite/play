import type { ContentItem } from '../../../types';
import type { Question } from './ccGame';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** One multiple-choice question per item: the right term plus two wrong ones (the set's own wrong answers, else other terms). */
function build(item: ContentItem, all: ContentItem[]): Question {
  const seen = new Set([norm(item.term)]);
  const wrong: string[] = [];
  for (const w of item.wrong ?? []) { const k = norm(w); if (k && !seen.has(k) && wrong.length < 2) { seen.add(k); wrong.push(w.trim()); } }
  for (const o of shuffle(all)) {
    if (wrong.length >= 2) break;
    const k = norm(o.term);
    if (!k || seen.has(k)) continue;
    seen.add(k); wrong.push(o.term.trim());
  }
  const options = shuffle([item.term.trim(), ...wrong]);
  return { prompt: item.clue, passage: item.passage, audio: item.audio, options, correct: options.indexOf(item.term.trim()) };
}

/** Endless supply: goes through the items in random order, then reshuffles. */
export function makeQuestionSource(items: ContentItem[]): () => Question {
  let queue: ContentItem[] = [];
  return () => {
    if (!queue.length) queue = shuffle(items);
    return build(queue.pop()!, items);
  };
}
