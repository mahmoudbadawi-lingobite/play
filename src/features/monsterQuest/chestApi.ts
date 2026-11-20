import { supabase } from '../../lib/supabase';

export interface ChestResult { already: boolean; coins?: number; gems?: number; items?: Record<string, number> }
/** Opens a chest on the server (mq_open_chest). One reward per chest per day (UTC); the server decides what is inside. Kept in its own file so api.ts stays untouched. */
export async function openChest(chest: string, world: number, puzzle: boolean): Promise<ChestResult> {
  const { data, error } = await supabase.rpc('mq_open_chest', { p_chest: chest, p_world: world, p_puzzle: puzzle });
  if (error) throw new Error(error.message);
  return data as ChestResult;
}
