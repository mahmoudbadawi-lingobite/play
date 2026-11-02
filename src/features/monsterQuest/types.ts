export type ElementType = 'fire' | 'water' | 'grass' | 'electric' | 'earth' | 'ice' | 'air' | 'shadow' | 'light' | 'crystal';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ArtSpec {
  body: 'round' | 'tall' | 'wide' | 'bean';
  c1: string; c2: string; belly: string;
  ears: 'pointy' | 'round' | 'long' | 'horn' | 'none';
  tail: 'flame' | 'leaf' | 'fin' | 'bolt' | 'curl' | 'none';
  eyes: 'cute' | 'fierce' | 'sleepy';
  mark: 'cheeks' | 'stripes' | 'spots' | 'gem' | 'none';
  extra: 'wings' | 'shell' | 'crest' | 'none';
}

export interface ZonePalette {
  grass: [string, string]; path: [string, string]; tall: string; tree: string; trunk: string; rock: string; water: string; sky: [string, string];
}
export interface Zone {
  id: string; name: string; description: string | null; unlock_level: number; min_level: number; max_level: number;
  difficulty: number; palette: ZonePalette; sort: number;
}
export interface Species {
  id: string; name: string; type: ElementType; rarity: Rarity; description: string | null;
  base_hp: number; base_attack: number; base_defense: number; base_speed: number;
  zones: string[]; capture_difficulty: number; required_correct: number; art: ArtSpec; sprite_url: string | null;
}
export interface Item { key: string; name: string; kind: 'ball'; description: string | null; price_coins: number | null; price_gems: number | null; catch_multiplier: number; color: string; sort: number }

export interface PlayerState {
  coins: number; gems: number; xp: number; level: number; correct_total: number; wrong_total: number;
  xp_today: number; xp_daily_cap: number; inventory: Record<string, number>;
}
export interface OwnedMonster {
  id: string; species_id: string; level: number; xp: number; hp: number; attack: number; defense: number; speed: number;
  nickname: string | null; favorite: boolean; team_slot: number | null; zone_id: string | null; ball_key: string | null; captured_at: string;
}
export interface Encounter { id: string; zone_id: string; species_id: string; level: number; required_correct: number; meter: number; status: string }

export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'spelling' | 'type_answer' | 'listening' | 'reading' | 'sentence_order' | 'word_match';
export interface Question {
  id: string; type: QuestionType; prompt: string; passage: string | null; image_url: string | null; audio_url: string | null;
  tts_text: string | null; options: any; difficulty: number; time_limit_s: number | null; topic: string | null; subject: string;
}
export interface AnswerResult {
  correct: boolean; late: boolean; explanation: string | null; correct_answer: any; xp: number; coins: number; meter: number; streak: number;
  correct_count: number; wrong_count: number; required_correct: number; can_throw: boolean; escaped: boolean;
}
export interface ThrowResult { success: boolean; chance: number; escaped?: boolean; meter?: number; monster_id?: string; xp?: number; coins?: number; level_after?: number }

/** A row of the staff-managed question bank (includes the answer). */
export interface BankQuestion {
  id: string; type: QuestionType; subject: string; topic: string | null; grade: number | null; difficulty: number;
  prompt: string; passage: string | null; image_url: string | null; audio_url: string | null; tts_text: string | null;
  options: any; answer: any; explanation: string | null; xp_reward: number; time_limit_s: number | null; active: boolean;
  created_by: string | null; created_at: string;
}
