// ============================================================
// LingoBite Play - Core Type Definitions
// ============================================================

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  teacherStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  lastLoginAt: Date;
  totalXP: number;
  currentStreak: number;
  badges: string[];
  classIds: string[];
  consentGiven: boolean;
  parentEmail?: string;
}

// --- Content model ---
// One "content set" is a batch of items, filled by a teacher from a
// downloadable template. The same items array can power any game whose
// requirements it satisfies (see GAME_DEFINITIONS in games/registry.ts) —
// a teacher never edits content per-game.

export type SkillTemplate = 'vocabulary' | 'grammar' | 'reading' | 'spelling';

export interface ContentItem {
  id: string;
  term: string;            // the target word/phrase/answer
  clue: string;            // definition / sentence-with-blank / question / description
  imageUrl?: string;       // optional - required for Picture Match to be offered
}

export type Visibility = 'public' | 'private';

export interface ContentSet {
  id: string;
  title: string;
  skill: SkillTemplate;
  teacherId: string;
  teacherName: string;
  visibility: Visibility;
  items: ContentItem[];
  playCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- Games ---

export type GameKey =
  | 'memory-match'
  | 'typing-race'
  | 'word-builder'
  | 'crossword'
  | 'picture-match'
  | 'hangman';

export interface GameResult {
  id: string;
  contentSetId: string;
  contentSetTitle: string;
  gameKey: GameKey;
  studentId: string;
  studentName: string;
  classId?: string;
  xpEarned: number;
  accuracy: number;      // 0-100
  durationSeconds: number;
  playedAt: Date;
}

// --- Classes / rosters (independent within LingoBite Play) ---

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  joinCode: string;
  createdAt: Date;
}

export interface ClassStudent {
  id: string;               // Firestore doc id (also used as studentId)
  displayName: string;
  classId: string;
  totalXP: number;
  joinCode?: string;
}

// --- Escape Room (separate game type - see supabase/schema.sql for why) ---

export type AnswerMode = 'type' | 'choice';

export interface EscapeRoomHotspot {
  id: string;
  orderIndex: number;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  clueText: string;
  answerMode: AnswerMode;
  correctAnswer: string;
  choices?: string[];
}

export interface EscapeRoom {
  id: string;
  title: string;
  teacherId: string;
  teacherName: string;
  imageUrl: string;
  storyText: string | null;
  theme: string | null;
  visibility: Visibility;
  playCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}
