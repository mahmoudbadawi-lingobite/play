import type { ElementType, Rarity, QuestionType } from './types';

export const TYPE_META: Record<ElementType, { label: string; color: string; icon: string }> = {
  fire: { label: 'Fire', color: '#f76707', icon: '🔥' },
  water: { label: 'Water', color: '#1c7ed6', icon: '💧' },
  grass: { label: 'Grass', color: '#2f9e44', icon: '🌿' },
  electric: { label: 'Electric', color: '#f08c00', icon: '⚡' },
  earth: { label: 'Earth', color: '#a0702f', icon: '⛰️' },
  ice: { label: 'Ice', color: '#3bc9db', icon: '❄️' },
  air: { label: 'Air', color: '#74a7e8', icon: '🌪️' },
  shadow: { label: 'Shadow', color: '#7048e8', icon: '🌑' },
  light: { label: 'Light', color: '#e0a800', icon: '✨' },
  crystal: { label: 'Crystal', color: '#15aabf', icon: '💎' },
};
export const TYPE_ORDER = Object.keys(TYPE_META) as ElementType[];

export const RARITY_META: Record<Rarity, { label: string; color: string; order: number }> = {
  common: { label: 'Common', color: '#868e96', order: 1 },
  uncommon: { label: 'Uncommon', color: '#2f9e44', order: 2 },
  rare: { label: 'Rare', color: '#1c7ed6', order: 3 },
  epic: { label: 'Epic', color: '#9c36b5', order: 4 },
  legendary: { label: 'Legendary', color: '#f59f00', order: 5 },
};

/**
 * Type effectiveness. Data-driven: attacker -> { defender: multiplier }. Anything not listed is 1x.
 * Add a new element by adding it to ElementType/TYPE_META and giving it a row here.
 * (Used for display now; the Battle Arena will read the same table.)
 */
export const TYPE_CHART: Record<ElementType, Partial<Record<ElementType, number>>> = {
  fire: { grass: 2, ice: 2, crystal: 2, water: 0.5, earth: 0.5, fire: 0.5 },
  water: { fire: 2, earth: 2, grass: 0.5, electric: 0.5, water: 0.5 },
  grass: { water: 2, earth: 2, fire: 0.5, ice: 0.5, air: 0.5, grass: 0.5 },
  electric: { water: 2, air: 2, earth: 0.5, grass: 0.5, electric: 0.5 },
  earth: { fire: 2, electric: 2, crystal: 2, grass: 0.5, air: 0.5, water: 0.5 },
  ice: { grass: 2, air: 2, earth: 2, fire: 0.5, ice: 0.5, water: 0.5 },
  air: { grass: 2, shadow: 0.5, electric: 0.5, earth: 2, crystal: 0.5 },
  shadow: { light: 2, air: 2, shadow: 0.5, crystal: 0.5 },
  light: { shadow: 2, ice: 2, light: 0.5, crystal: 0.5 },
  crystal: { air: 2, shadow: 2, light: 2, fire: 0.5, earth: 0.5, crystal: 0.5 },
};

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / false' },
  { value: 'fill_blank', label: 'Fill in the blank' },
  { value: 'spelling', label: 'Spelling (listen & type)' },
  { value: 'type_answer', label: 'Type the answer' },
  { value: 'listening', label: 'Listening (audio + choices)' },
  { value: 'reading', label: 'Reading comprehension' },
  { value: 'sentence_order', label: 'Sentence ordering' },
  { value: 'word_match', label: 'Word matching' },
];

export const STAT_MAX = { hp: 140, attack: 60, defense: 60, speed: 60 };
export const MAX_TEAM = 6;
