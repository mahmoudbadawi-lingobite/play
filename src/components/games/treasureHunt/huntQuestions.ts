import type { ContentItem, SkillTemplate } from '../../../types';
import { norm, shuffle } from '../blockQuest/engine';

export type Tier = 'bronze' | 'silver' | 'gold';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface HuntOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface HuntQuestion {
  id: string;
  item: ContentItem;
  tier: Tier;
  /** bronze / silver: pick one. gold: empty (the player types the answer) */
  options: HuntOption[];
  answer: string;
  /** seconds for this chest, or null for no timer */
  timeLimit: number | null;
}

export const TIER_COINS: Record<Tier, number> = { bronze: 3, silver: 5, gold: 8 };
export const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze chest', silver: 'Silver chest', gold: 'Gold chest' };

export interface DifficultyDef {
  label: string;
  blurb: string;
  lives: number;
  hints: number;
  /** how many chests a run has (never more than the set has items) */
  chests: number;
  /** the chest tiers, in play order */
  tiers: Tier[];
}

export const DIFFICULTY: Record<Difficulty, DifficultyDef> = {
  easy: {
    label: 'Easy',
    blurb: '5 hearts, pick the answer, no timers',
    lives: 5,
    hints: 4,
    chests: 6,
    tiers: ['bronze', 'bronze', 'bronze', 'silver', 'bronze', 'silver'],
  },
  medium: {
    label: 'Medium',
    blurb: '4 hearts, some chests need you to type',
    lives: 4,
    hints: 3,
    chests: 8,
    tiers: ['bronze', 'silver', 'bronze', 'silver', 'gold', 'silver', 'silver', 'gold'],
  },
  hard: {
    label: 'Hard',
    blurb: '3 hearts, timers, lots of typing',
    lives: 3,
    hints: 2,
    chests: 10,
    tiers: ['silver', 'gold', 'silver', 'gold', 'gold', 'silver', 'gold', 'gold', 'silver', 'gold'],
  },
};

/** The easiest way to see what a typed answer needs: short, no strange symbols. */
const canType = (term: string) => term.trim().length >= 1 && term.trim().length <= 26;

function distractors(item: ContentItem, all: ContentItem[], n: number): string[] {
  const seen = new Set<string>([norm(item.term)]);
  const out: string[] = [];
  for (const other of shuffle(all)) {
    const key = norm(other.term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(other.term.trim());
    if (out.length === n) break;
  }
  return out;
}

/** One question per chest, taken from the teacher's content set. The clue is the question, the term is the answer. */
export function buildQuestions(items: ContentItem[], _skill: SkillTemplate | undefined, difficulty: Difficulty, wanted?: number): HuntQuestion[] {
  const def = DIFFICULTY[difficulty];
  const count = Math.max(2, Math.min(wanted ?? def.chests, def.chests, items.length, 12));
  const picked = shuffle(items).slice(0, count);
  return picked.map((item, i) => {
    let tier: Tier = def.tiers[i % def.tiers.length];
    if (tier === 'gold' && !canType(item.term)) tier = 'silver';
    const need = tier === 'bronze' ? 2 : 3;
    const wrong = tier === 'gold' ? [] : distractors(item, items, need);
    // not enough different terms for a silver chest: it becomes a bronze one
    if (tier === 'silver' && wrong.length < 3) tier = 'bronze';
    const id = `q${i}`;
    const options: HuntOption[] =
      tier === 'gold'
        ? []
        : shuffle([
            { id: `${id}-a`, label: item.term.trim(), correct: true },
            ...wrong.slice(0, tier === 'bronze' ? 2 : 3).map((label, k) => ({ id: `${id}-d${k}`, label, correct: false })),
          ]);
    const timeLimit = tier === 'gold' ? 30 : tier === 'silver' && difficulty === 'hard' ? 25 : null;
    return { id, item, tier, options, answer: item.term.trim(), timeLimit };
  });
}

/** Splits the chests between the two worlds (the first world gets the extra one). */
export function splitChests(total: number): [number, number] {
  const a = Math.ceil(total / 2);
  return [a, total - a];
}
