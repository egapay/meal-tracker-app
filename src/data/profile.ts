import { supabase } from '../lib/supabase'
import type { Goals } from '../lib/types'

const COLUMNS = 'daily_protein_goal, daily_water_goal_oz'

/**
 * RLS restricts profiles to the caller's single row, so no filter is needed --
 * .single() is what asserts that assumption holds.
 */
export async function getGoals(): Promise<Goals> {
  const { data, error } = await supabase.from('profiles').select(COLUMNS).single()

  if (error) throw error
  return { protein: data.daily_protein_goal, waterOz: data.daily_water_goal_oz }
}

export async function updateGoals(goals: Goals): Promise<Goals> {
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ daily_protein_goal: goals.protein, daily_water_goal_oz: goals.waterOz })
    .eq('id', userId)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return { protein: data.daily_protein_goal, waterOz: data.daily_water_goal_oz }
}
