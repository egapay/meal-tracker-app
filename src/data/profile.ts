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

export async function updateDailyGoal(goal: number): Promise<number> {
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ daily_protein_goal: goal })
    .eq('id', userId)
    .select('daily_protein_goal')
    .single()

  if (error) throw error
  return data.daily_protein_goal
}
