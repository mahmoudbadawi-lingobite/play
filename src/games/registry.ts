import type { ContentItem, GameKey, SkillTemplate } from '../types';

export interface GameDefinition {
  key: GameKey;
  name: string;
  description: string;
  icon: string; // simple emoji/glyph, swap for real icons later
  minItems: number;
  requiresImages: boolean;
  isCompatible: (items: ContentItem[]) => boolean;
}

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    key: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to match each term with its clue.',
    icon: '🧠',
    minItems: 4,
    requiresImages: false,
    isCompatible: (items) => items.length >= 4,
  },
  {
    key: 'typing-race',
    name: 'Typing Race',
    description: 'Read the clue, type the term before time runs out.',
    icon: '⌨️',
    minItems: 5,
    requiresImages: false,
    isCompatible: (items) => items.length >= 5,
  },
  {
    key: 'word-builder',
    name: 'Word Builder',
    description: 'Drag scrambled letters into place to build the term.',
    icon: '🔤',
    minItems: 5,
    requiresImages: false,
    isCompatible: (items) => items.length >= 5 && items.every(i => i.term.replace(/\s/g, '').length <= 12),
  },
  {
    key: 'crossword',
    name: 'Crossword',
    description: 'Fill the grid using the clues.',
    icon: '🔳',
    minItems: 5,
    requiresImages: false,
    isCompatible: (items) => items.length >= 5 && items.length <= 15,
  },
  {
    key: 'picture-match',
    name: 'Picture Match',
    description: 'Match each picture with the correct term.',
    icon: '🖼️',
    minItems: 4,
    requiresImages: true,
    isCompatible: (items) => items.filter(i => !!i.imageUrl).length >= 4,
  },
  {
    key: 'hangman',
    name: 'Hangman',
    description: 'Guess the letters of the term before you run out of tries.',
    icon: '🎯',
    minItems: 1,
    requiresImages: false,
    isCompatible: (items) => items.length >= 1,
  },
];

// Some games don't fit certain skills conceptually - grammar and spelling
// are about correctness of a specific answer, not free-association matching
// or visual recognition, so those game types are excluded regardless of
// whether the content would otherwise technically qualify.
const SKILL_EXCLUSIONS: Record<SkillTemplate, GameKey[]> = {
  vocabulary: [],
  reading: [],
  grammar: ['memory-match', 'word-builder', 'picture-match'],
  spelling: ['memory-match', 'picture-match'],
};

export function compatibleGames(items: ContentItem[], skill: SkillTemplate): GameDefinition[] {
  const excluded = SKILL_EXCLUSIONS[skill];
  return GAME_DEFINITIONS.filter(g => !excluded.includes(g.key) && g.isCompatible(items));
}

export function getGameDefinition(key: GameKey): GameDefinition {
  const def = GAME_DEFINITIONS.find(g => g.key === key);
  if (!def) throw new Error(`Unknown game key: ${key}`);
  return def;
}
