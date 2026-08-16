import { useCallback, useEffect, useState } from 'react'
import {
  RECENT_LIMIT,
  createEntry,
  deleteEntry,
  listEntriesByDate,
  listRecentFoods,
  updateEntry,
} from '../data/entries'
import { getDailyGoal } from '../data/profile'
import type { FoodEntry, NewFoodEntry, RecentFood } from '../lib/types'

/** Goal, entries and recent foods for one calendar date, plus the mutations. */
export function useToday(date: string) {
  const [goal, setGoal] = useState(0)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    // Fetched in parallel, so the chips cost no extra latency and the sheet
    // opens with them already in hand.
    Promise.all([getDailyGoal(), listEntriesByDate(date), listRecentFoods()])
      .then(([dailyGoal, rows, recents]) => {
        if (cancelled) return
        setGoal(dailyGoal)
        setEntries(rows)
        setRecentFoods(recents)
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

      // Promote what was just logged to the front of the chips, in place rather
      // than by refetching -- a round trip here would slow down every save.
      setRecentFoods((prev) => {
        const key = created.name.trim().toLowerCase()
        const rest = prev.filter((food) => food.name.trim().toLowerCase() !== key)
        return [{ name: created.name, protein_grams: created.protein_grams }, ...rest].slice(
          0,
          RECENT_LIMIT,
        )
      })
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

  return { goal, entries, recentFoods, loading, error, addEntry, editEntry, removeEntry }
}
