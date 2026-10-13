import type { ContentItem, SkillTemplate } from '../../../types';

export type Phase = 'start' | 'approach' | 'ask' | 'passing' | 'done';
export type GateKind = 'portal' | 'listen' | 'bridge' | 'boss';

export interface PortalOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface BridgeLetter {
  id: string;
  char: string;
}

export interface Gate {
  id: string;
  kind: GateKind;
  item: ContentItem;
  /** Three answer portals (portal + listen gates). */
  options: PortalOption[];
  /** Shuffled letter blocks (bridge gates). */
  letters: BridgeLetter[];
}

export const MAX_GATES = 10;

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function speak(text: string) {
  if (!speechAvailable()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

const BRIDGE_RE = /^\p{L}{2,10}$/u;

/** A letter bridge needs a single word of 2-10 letters. */
export function canBridge(term: string): boolean {
  return BRIDGE_RE.test(term.trim());
}

/** "river" -> "r _ _ _ _" (reveal = how many letters to show). Word gaps show as "/". */
export function maskHint(term: string, reveal: number): string {
  return term
    .trim()
    .split('')
    .map((c, i) => (c === ' ' ? '/' : i < reveal ? c : '_'))
    .join(' ');
}

function buildOptions(gateId: string, item: ContentItem, all: ContentItem[]): PortalOption[] {
  const seen = new Set<string>([norm(item.term)]);
  const distractors: string[] = [];
  for (const other of shuffle(all)) {
    const key = norm(other.term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    distractors.push(other.term.trim());
    if (distractors.length === 2) break;
  }
  const options: PortalOption[] = [
    { id: `${gateId}-a`, label: item.term.trim(), correct: true },
    ...distractors.map((label, i) => ({ id: `${gateId}-d${i}`, label, correct: false })),
  ];
  return shuffle(options);
}

/**
 * Turns a content set into one run: up to MAX_GATES gates, one item per gate.
 * The last gate is always a typing "boss" when there are at least 4 gates.
 * Gate type depends on the skill so the game suits each kind of content:
 *  - spelling   : letter bridges + listen gates
 *  - vocabulary : portals, with the odd listen gate and letter bridge
 *  - grammar / reading : portals (the clue is the sentence or question)
 */
export function buildGates(items: ContentItem[], skill: SkillTemplate | undefined): Gate[] {
  const picked = shuffle(items).slice(0, Math.min(MAX_GATES, items.length));
  const speech = speechAvailable();

  return picked.map((item, i) => {
    const id = `g${i}`;
    let kind: GateKind = 'portal';

    if (i === picked.length - 1 && picked.length >= 4) {
      kind = 'boss';
    } else if (skill === 'spelling') {
      if (canBridge(item.term) && i % 2 === 0) kind = 'bridge';
      else if (speech && i % 2 === 1) kind = 'listen';
    } else if (skill === 'vocabulary' && !item.imageUrl) {
      if (speech && i % 3 === 2) kind = 'listen';
      else if (canBridge(item.term) && i % 4 === 1) kind = 'bridge';
    }

    const options = kind === 'portal' || kind === 'listen' ? buildOptions(id, item, items) : [];
    const letters: BridgeLetter[] =
      kind === 'bridge'
        ? shuffle(item.term.trim().split('').map((char, n) => ({ id: `${id}-l${n}`, char })))
        : [];

    return { id, kind, item, options, letters };
  });
}
