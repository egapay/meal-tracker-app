import { useCallback, useEffect, useState } from 'react'
import { deleteEntry, listEntriesBetween, updateEntry } from '../data/entries'
import { getDailyGoal } from '../data/profile'
import { daysAgoISO, todayISO } from '../lib/date'
import type { FoodEntry, NewFoodEntry } from '../lib/types'

/** How far back History reaches. Bounded so the query can't grow forever. */
const HISTORY_DAYS = 90

export type DaySummary = {
  date: string
  total: number
  entries: FoodEntry[]
}

function groupByDate(rows: FoodEntry[]): DaySummary[] {
  const byDate = new Map<string, FoodEntry[]>()
  for (const row of rows) {
    const existing = byDate.get(row.entry_date)
    if (existing) existing.push(row)
    else byDate.set(row.entry_date, [row])
  }

  // Rows arrive newest day first and a Map keeps insertion order, so the
  // result is already sorted -- no second sort needed.
  return [...byDate].map(([date, entries]) => ({
    date,
    total: entries.reduce((sum, entry) => sum + entry.protein_grams, 0),
    entries,
  }))
}

/**
 * Previous days, newest first. One query fetches the whole window, so expanding
 * a day is instant rather than a second round trip.
 */
export function useHistory() {
  const [days, setDays] = useState<DaySummary[]>([])
  const [goal, setGoal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Exclusive of today, which has its own screen.
    const [dailyGoal, rows] = await Promise.all([
      getDailyGoal(),
      listEntriesBetween(daysAgoISO(HISTORY_DAYS), todayISO()),
    ])
    setGoal(dailyGoal)
    setDays(groupByDate(rows))
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    load()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [load])

  // Both mutations refetch rather than patching state. An edit can move an
  // entry to another day or onto today (dropping it from this window), and a
  // delete can empty a day entirely -- reconciling all that by hand would be
  // more code than one query, and easier to get subtly wrong.
  const editEntry = useCallback(
    async (id: string, entry: NewFoodEntry) => {
      await updateEntry(id, entry)
      await load()
    },
    [load],
  )

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteEntry(id)
      await load()
    },
    [load],
  )

  return { days, goal, loading, error, editEntry, removeEntry }
}
