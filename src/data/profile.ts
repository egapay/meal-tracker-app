import { supabase } from '../lib/supabase'

/**
 * RLS restricts profiles to the caller's single row, so no filter is needed --
 * .single() is what asserts that assumption holds.
 */
export async function getDailyGoal(): Promise<number> {
  const { data, error } = await supabase.from('profiles').select('daily_protein_goal').single()

  if (error) throw error
  return data.daily_protein_goal
}
