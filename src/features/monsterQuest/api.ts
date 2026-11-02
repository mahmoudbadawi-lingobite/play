import { supabase } from '../../lib/supabase';
import type { AnswerResult, BankQuestion, Encounter, Item, OwnedMonster, PlayerState, Question, Species, ThrowResult, Zone } from './types';

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
export const leaderboard = (kind: 'xp' | 'monsters' | 'weekly') =>
  rpc<{ rank: number; user_id: string; display_name: string | null; value: number; level: number }[]>('mq_leaderboard', { p_kind: kind });

// Definitions (read-only for students)
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

export async function loadMonsters(): Promise<OwnedMonster[]> {
  const { data, error } = await supabase.from('mq_player_monsters').select('*').order('captured_at', { ascending: false });
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
