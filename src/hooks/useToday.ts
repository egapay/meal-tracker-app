import { useCallback, useEffect, useState } from 'react'
import { createEntry, listEntriesByDate } from '../data/entries'
import { getDailyGoal } from '../data/profile'
import type { FoodEntry, NewFoodEntry } from '../lib/types'

/** Goal and entries for one calendar date, plus the add action. */
export function useToday(date: string) {
  const [goal, setGoal] = useState(0)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([getDailyGoal(), listEntriesByDate(date)])
      .then(([dailyGoal, rows]) => {
        if (cancelled) return
        setGoal(dailyGoal)
        setEntries(rows)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load today.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [date])

  const addEntry = useCallback(
    async (entry: NewFoodEntry) => {
      const created = await createEntry(entry)
      // The form allows back-dating, so an entry saved for another day must not
      // appear in this day's list.
      if (created.entry_date === date) setEntries((prev) => [...prev, created])
    },
    [date],
  )

  return { goal, entries, loading, error, addEntry }
}
