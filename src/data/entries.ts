import { supabase } from '../lib/supabase'
import type { FoodEntry, NewFoodEntry } from '../lib/types'

const COLUMNS = 'id, entry_date, meal_type, name, protein_grams'

/**
 * PostgREST can serialise a numeric column as either a JSON number or a string
 * depending on version. Coercing at this boundary means every caller can trust
 * protein_grams is a number -- without it, a string would turn 18 + 20 into
 * "1820" in the daily total.
 */
function normalize(row: FoodEntry): FoodEntry {
  return { ...row, protein_grams: Number(row.protein_grams) }
}

export async function listEntriesByDate(date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select(COLUMNS)
    .eq('entry_date', date)
    .order('created_at')

  if (error) throw error
  return data.map(normalize)
}

export async function createEntry(entry: NewFoodEntry): Promise<FoodEntry> {
  // Reads the cached session from localStorage, no network round trip.
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('food_entries')
    .insert({ ...entry, user_id: userId })
    .select(COLUMNS)
    .single()

  if (error) throw error
  return normalize(data)
}

// No user_id filter on these two: the RLS policy already restricts both to rows
// this user owns, so an id belonging to someone else simply matches nothing.
export async function updateEntry(id: string, entry: NewFoodEntry): Promise<FoodEntry> {
  const { data, error } = await supabase
    .from('food_entries')
    .update(entry)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return normalize(data)
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id)
  if (error) throw error
}
