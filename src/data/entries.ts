import { supabase } from '../lib/supabase'
import type { FoodEntry, NewFoodEntry, RecentFood } from '../lib/types'

const COLUMNS = 'id, entry_date, meal_type, name, protein_grams'

/** How many chips the add sheet offers. */
export const RECENT_LIMIT = 8

/** How many rows to scan for those chips. */
const RECENT_SCAN = 60

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

/**
 * Distinct foods you've logged before, most recent first.
 *
 * Deduped here rather than in SQL because PostgREST exposes no DISTINCT ON, and
 * a view or RPC would be more machinery than this needs. Scanning the last
 * RECENT_SCAN rows is plenty to surface the handful of things eaten repeatedly.
 */
export async function listRecentFoods(): Promise<RecentFood[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('name, protein_grams')
    .order('created_at', { ascending: false })
    .limit(RECENT_SCAN)

  if (error) throw error

  const seen = new Map<string, RecentFood>()
  for (const row of data) {
    // Case-insensitive key so "Greek yogurt" and "Greek Yogurt" aren't both
    // offered; the first (most recent) spelling and amount win.
    const key = row.name.trim().toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, { name: row.name, protein_grams: Number(row.protein_grams) })
      if (seen.size === RECENT_LIMIT) break
    }
  }

  return [...seen.values()]
}

/** Entries in [from, to). Ordered newest day first, chronological within a day. */
export async function listEntriesBetween(from: string, to: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select(COLUMNS)
    .gte('entry_date', from)
    .lt('entry_date', to)
    .order('entry_date', { ascending: false })
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
