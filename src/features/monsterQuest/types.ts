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
  /** scenery style for blocking tiles */
  style?: 'tree' | 'palm' | 'cactus' | 'pine' | 'crystal' | 'rock' | 'building';
  liquid?: 'water' | 'lava';
  water_bias?: number; tree_density?: number;
}
export interface Zone {
  id: string; name: string; description: string | null; unlock_level: number; min_level: number; max_level: number;
  difficulty: number; palette: ZonePalette; sort: number;
}
export interface Species {
  id: string; name: string; type: ElementType; rarity: Rarity; description: string | null;
  base_hp: number; base_attack: number; base_defense: number; base_speed: number;
  zones: string[]; capture_difficulty: number; required_correct: number; art: ArtSpec; sprite_url: string | null;
  stage: number; evolves_to: string | null; evolve_level: number | null; evolve_item: string | null;
}
export type ItemKind = 'ball' | 'potion' | 'booster' | 'stone';
export interface Item { key: string; name: string; kind: ItemKind; effect: number; description: string | null; price_coins: number | null; price_gems: number | null; catch_multiplier: number; color: string; sort: number }

export interface PlayerState {
  coins: number; gems: number; xp: number; level: number; correct_total: number; wrong_total: number;
  xp_today: number; xp_daily_cap: number; inventory: Record<string, number>;
  battles_won: number; battles_lost: number; outfit: Record<string, string>;
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
export interface MonsterXpResult { level: number; xp: number; levels_gained: number; next: number }
export interface AnswerResult {
  correct: boolean; late: boolean; explanation: string | null; correct_answer: any; xp: number; coins: number; meter: number; streak: number;
  correct_count: number; wrong_count: number; required_correct: number; can_throw: boolean; escaped: boolean;
  monster_xp: number; monster: MonsterXpResult | null; finished: boolean; total_questions: number;
}
export interface ThrowResult { success: boolean; chance: number; escaped?: boolean; meter?: number; monster_id?: string; xp?: number; coins?: number; level_after?: number }

/** A row of the staff-managed question bank (includes the answer). */
export interface BankQuestion {
  id: string; type: QuestionType; subject: string; topic: string | null; grade: number | null; difficulty: number;
  prompt: string; passage: string | null; image_url: string | null; audio_url: string | null; tts_text: string | null;
  options: any; answer: any; explanation: string | null; xp_reward: number; time_limit_s: number | null; active: boolean;
  created_by: string | null; created_at: string;
}

// ---- trainer look / wardrobe
export interface Look {
  gender: 'boy' | 'girl'; skin: string; hair: string; hairStyle: 'short' | 'spiky' | 'long' | 'ponytail' | 'bun';
  hat: 'cap' | 'beanie' | 'crown' | 'wizard' | 'none'; hatColor: string; top: string; pants: string; shoes: string;
  backpack: 'none' | 'pack' | 'wings'; packColor: string; accessory: 'none' | 'glasses' | 'scarf' | 'headphones' | 'cape'; accColor: string;
}
export type CosmeticSlot = 'body' | 'skin' | 'haircolor' | 'hairstyle' | 'hat' | 'top' | 'pants' | 'shoes' | 'backpack' | 'accessory';
export interface Cosmetic { key: string; slot: CosmeticSlot; name: string; price_coins: number | null; price_gems: number | null; unlock_level: number; data: Partial<Look>; sort: number }

// ---- missions
export interface Mission { key: string; title: string; period: 'daily' | 'weekly'; kind: string; target: number; progress: number; claimed: boolean; reward_coins: number; reward_gems: number }

// ---- battles
export interface BMon { id: string | null; species_id: string; name: string; type: ElementType; level: number; hp: number; max: number; atk: number; def: number; spd: number; fainted: boolean; used: boolean }
export interface BEvent {
  side: 'player' | 'opp'; kind: 'attack' | 'special' | 'defend' | 'switch' | 'item' | 'faint' | 'info' | 'quiz'; text: string;
  target?: 'player' | 'opp'; idx?: number; dmg?: number; hp_after?: number; eff?: 'super' | 'weak' | null; crit?: boolean; blocked?: boolean; heal?: number;
  correct?: boolean; explanation?: string | null; answer?: any;
}
export interface BattleResult { won: boolean; xp: number; coins: number; monster_xp: number; levels: { id: string; name: string; level: number; levels_gained: number }[]; forfeit?: boolean }
export interface Battle {
  id: string; status: 'active' | 'won' | 'lost' | 'forfeit'; opp_name: string; difficulty: 'easy' | 'normal' | 'hard'; zone_id: string;
  player: BMon[]; opp: BMon[]; p_active: number; o_active: number; turn: number; pending: Question | null; result: BattleResult | null; events: BEvent[];
}
