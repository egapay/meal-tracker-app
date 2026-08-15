import { useCallback, useEffect, useState } from 'react'
import { createEntry, deleteEntry, listEntriesByDate, updateEntry } from '../data/entries'
import { getDailyGoal } from '../data/profile'
import type { FoodEntry, NewFoodEntry } from '../lib/types'

/** Goal and entries for one calendar date, plus the actions that mutate them. */
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

  const editEntry = useCallback(
    async (id: string, entry: NewFoodEntry) => {
      const updated = await updateEntry(id, entry)
      setEntries((prev) =>
        // Same reason as above: an edit can move an entry off this day entirely.
        updated.entry_date === date
          ? prev.map((row) => (row.id === id ? updated : row))
          : prev.filter((row) => row.id !== id),
      )
    },
    [date],
  )

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id)
    setEntries((prev) => prev.filter((row) => row.id !== id))
  }, [])

  return { goal, entries, loading, error, addEntry, editEntry, removeEntry }
}
