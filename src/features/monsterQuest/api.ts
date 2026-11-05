import { supabase } from '../../lib/supabase';
import type { AnswerResult, BankQuestion, Battle, Cosmetic, Encounter, Item, Mission, MonsterXpResult, OwnedMonster, PlayerState, Question, Species, ThrowResult, Zone } from './types';

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? 'Something went wrong');
}
async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) fail(error);
  return data as T;
}

export const getState = () => rpc<PlayerState>('mq_state');
export const startEncounter = (zone: string) => rpc<Encounter>('mq_start_encounter', { p_zone: zone });
export const nextQuestion = (id: string) => rpc<Question>('mq_next_question', { p_encounter: id });
export const answerQuestion = (id: string, answer: unknown) => rpc<AnswerResult>('mq_answer', { p_encounter: id, p_answer: answer });
export const throwBall = (id: string, ball: string) => rpc<ThrowResult>('mq_throw_ball', { p_encounter: id, p_ball: ball });
export const flee = (id: string) => rpc<void>('mq_flee', { p_encounter: id });
export const buy = (item: string, qty: number) => rpc<PlayerState>('mq_buy', { p_item: item, p_qty: qty });
export const setTeam = (ids: string[]) => rpc<void>('mq_set_team', { p_ids: ids });
export const toggleFavorite = (id: string) => rpc<void>('mq_toggle_favorite', { p_id: id });
export const leaderboard = (kind: 'xp' | 'monsters' | 'weekly' | 'wins') =>
  rpc<{ rank: number; user_id: string; display_name: string | null; value: number; level: number }[]>('mq_leaderboard', { p_kind: kind });

// Definitions (read-only for students)
export const trainStart = (monsterId: string) => rpc<{ id: string; monster_id: string; total_questions: number }>('mq_train_start', { p_monster: monsterId });
export const evolve = (monsterId: string) => rpc<{ from: string; to: string; monster_id: string }>('mq_evolve', { p_monster: monsterId });
export const useItem = (item: string, monsterId: string) => rpc<MonsterXpResult>('mq_use_item', { p_item: item, p_monster: monsterId });
export const buyCosmetic = (key: string) => rpc<PlayerState>('mq_buy_cosmetic', { p_key: key });
export const equip = (key: string) => rpc<PlayerState>('mq_equip', { p_key: key });
export const unequip = (slot: string) => rpc<PlayerState>('mq_unequip', { p_slot: slot });
/** Free, once per player: the first explorer. More explorers are bought with buyCosmetic and worn with equip. */
export const chooseCharacter = (key: string) => rpc<PlayerState>('mq_choose_character', { p_key: key });
export const missionsList = () => rpc<Mission[]>('mq_missions_list');
export const claimMission = (key: string) => rpc<PlayerState>('mq_claim_mission', { p_key: key });
export const battleStart = (zone: string, difficulty: string) => rpc<Battle>('mq_battle_start', { p_zone: zone, p_difficulty: difficulty });
export const battleState = (id: string) => rpc<Battle>('mq_battle_state', { p_battle: id });
export const battleAct = (id: string, action: string, arg?: string | null, answer?: unknown) =>
  rpc<Battle>('mq_battle_act', { p_battle: id, p_action: action, p_arg: arg ?? null, p_answer: answer ?? null });
export const battleForfeit = (id: string) => rpc<Battle>('mq_battle_forfeit', { p_battle: id });
export async function activeBattleId(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('mq_battles').select('id').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1);
  if (error) fail(error);
  return data?.[0]?.id ?? null;
}
export async function loadCosmetics(userId: string): Promise<{ cosmetics: Cosmetic[]; owned: string[] }> {
  const [c, o] = await Promise.all([
    supabase.from('mq_cosmetics').select('*').eq('active', true).order('sort'),
    supabase.from('mq_player_cosmetics').select('cosmetic_key').eq('user_id', userId),
  ]);
  if (c.error) fail(c.error);
  if (o.error) fail(o.error);
  return { cosmetics: c.data as Cosmetic[], owned: (o.data ?? []).map((r: any) => r.cosmetic_key as string) };
}

export async function loadDefinitions(): Promise<{ zones: Zone[]; species: Species[]; items: Item[] }> {
  const [z, s, i] = await Promise.all([
    supabase.from('mq_zones').select('*').eq('active', true).order('sort'),
    supabase.from('mq_species').select('*').eq('active', true).order('id'),
    supabase.from('mq_items').select('*').eq('active', true).order('sort'),
  ]);
  if (z.error) fail(z.error);
  if (s.error) fail(s.error);
  if (i.error) fail(i.error);
  return { zones: z.data as Zone[], species: s.data as Species[], items: i.data as Item[] };
}

/** Only the player's OWN monsters. (Teachers and admins are allowed by the database to read every student's monsters, so the list must be filtered here.) */
export async function loadMonsters(userId: string): Promise<OwnedMonster[]> {
  const { data, error } = await supabase.from('mq_player_monsters').select('*').eq('user_id', userId).order('captured_at', { ascending: false });
  if (error) fail(error);
  return data as OwnedMonster[];
}
export async function loadSeenSpecies(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('mq_encounters').select('species_id').eq('user_id', userId);
  if (error) fail(error);
  return Array.from(new Set((data ?? []).map((r: any) => r.species_id as string)));
}

// Staff question bank (RLS limits rows to the caller's own, or all for admins)
export async function listBankQuestions(): Promise<BankQuestion[]> {
  const { data, error } = await supabase.from('mq_questions').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) fail(error);
  return data as BankQuestion[];
}
export async function saveBankQuestion(q: Partial<BankQuestion> & { id?: string }, userId: string): Promise<void> {
  const row = { ...q };
  if (q.id) {
    const { id, ...rest } = row;
    const { error } = await supabase.from('mq_questions').update(rest).eq('id', id!);
    if (error) fail(error);
  } else {
    const { error } = await supabase.from('mq_questions').insert({ ...row, created_by: userId });
    if (error) fail(error);
  }
}
export async function insertBankQuestions(rows: Partial<BankQuestion>[], userId: string): Promise<number> {
  let n = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100).map((r) => ({ ...r, created_by: userId }));
    const { error } = await supabase.from('mq_questions').insert(chunk);
    if (error) fail(error);
    n += chunk.length;
  }
  return n;
}
export async function deleteBankQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('mq_questions').delete().eq('id', id);
  if (error) fail(error);
}
export async function questionStats(): Promise<Record<string, { asked: number; correct: number }>> {
  const { data, error } = await supabase.rpc('mq_question_stats');
  if (error) fail(error);
  const out: Record<string, { asked: number; correct: number }> = {};
  for (const r of (data ?? []) as any[]) out[r.question_id] = { asked: Number(r.asked), correct: Number(r.correct) };
  return out;
}
