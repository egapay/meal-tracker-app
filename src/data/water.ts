import { supabase } from '../lib/supabase'
import type { NewWaterEntry, WaterEntry } from '../lib/types'

const COLUMNS = 'id, entry_date, drank_at, amount_oz'

/** Same numeric-over-JSON coercion as food entries; see data/entries.ts. */
function normalize(row: WaterEntry): WaterEntry {
  return { ...row, amount_oz: Number(row.amount_oz) }
}

export async function listWaterByDate(date: string): Promise<WaterEntry[]> {
  const { data, error } = await supabase
    .from('water_entries')
    .select(COLUMNS)
    .eq('entry_date', date)
    .order('drank_at')

  if (error) throw error
  return data.map(normalize)
}

/** Entries in [from, to). Ordered newest day first, chronological within a day. */
export async function listWaterBetween(from: string, to: string): Promise<WaterEntry[]> {
  const { data, error } = await supabase
    .from('water_entries')
    .select(COLUMNS)
    .gte('entry_date', from)
    .lt('entry_date', to)
    .order('entry_date', { ascending: false })
    .order('drank_at')

  if (error) throw error
  return data.map(normalize)
}

export async function createWater(entry: NewWaterEntry): Promise<WaterEntry> {
  const { data: auth } = await supabase.auth.getSession()
  const userId = auth.session?.user.id
  if (!userId) throw new Error('Not signed in.')

  const { data, error } = await supabase
    .from('water_entries')
    .insert({ ...entry, user_id: userId })
    .select(COLUMNS)
    .single()

  if (error) throw error
  return normalize(data)
}

// No user_id filter: the RLS policy already scopes both to rows this user owns.
export async function updateWater(id: string, entry: NewWaterEntry): Promise<WaterEntry> {
  const { data, error } = await supabase
    .from('water_entries')
    .update(entry)
    .eq('id', id)
    .select(COLUMNS)
    .single()

  if (error) throw error
  return normalize(data)
}

export async function deleteWater(id: string): Promise<void> {
  const { error } = await supabase.from('water_entries').delete().eq('id', id)
  if (error) throw error
}
