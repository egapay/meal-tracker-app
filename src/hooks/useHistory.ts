import { useEffect, useState } from 'react'
import { listEntriesBetween } from '../data/entries'
import { getDailyGoal } from '../data/profile'
import { daysAgoISO, todayISO } from '../lib/date'
import type { FoodEntry } from '../lib/types'

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

  useEffect(() => {
    let cancelled = false

    // Exclusive of today, which has its own screen.
    Promise.all([getDailyGoal(), listEntriesBetween(daysAgoISO(HISTORY_DAYS), todayISO())])
      .then(([dailyGoal, rows]) => {
        if (cancelled) return
        setGoal(dailyGoal)
        setDays(groupByDate(rows))
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load history.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { days, goal, loading, error }
}
