import { useCallback, useEffect, useState } from 'react'
import {
  RECENT_LIMIT,
  createEntry,
  deleteEntry,
  listEntriesByDate,
  listRecentFoods,
  updateEntry,
} from '../data/entries'
import { getGoals } from '../data/profile'
import { createWater, deleteWater, listWaterByDate, updateWater } from '../data/water'
import type { FoodEntry, Goals, NewFoodEntry, NewWaterEntry, RecentFood, WaterEntry } from '../lib/types'

const NO_GOALS: Goals = { protein: 0, waterOz: 0 }

/** Everything the Today screen needs for one calendar date, plus its mutations. */
export function useToday(date: string) {
  const [goals, setGoals] = useState<Goals>(NO_GOALS)
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [water, setWater] = useState<WaterEntry[]>([])
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    // All four in parallel, so water and the chips cost no extra latency.
    Promise.all([
      getGoals(),
      listEntriesByDate(date),
      listWaterByDate(date),
      listRecentFoods(),
    ])
      .then(([dailyGoals, foodRows, waterRows, recents]) => {
        if (cancelled) return
        setGoals(dailyGoals)
        setEntries(foodRows)
        setWater(waterRows)
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

  // Water rows are kept sorted by time, since the form lets you log a glass you
  // drank hours ago and it should slot into place rather than land at the end.
  const sortByTime = (rows: WaterEntry[]) =>
    [...rows].sort((a, b) => a.drank_at.localeCompare(b.drank_at))

  const addWater = useCallback(
    async (entry: NewWaterEntry) => {
      const created = await createWater(entry)
      if (created.entry_date === date) setWater((prev) => sortByTime([...prev, created]))
    },
    [date],
  )

  const editWater = useCallback(
    async (id: string, entry: NewWaterEntry) => {
      const updated = await updateWater(id, entry)
      setWater((prev) =>
        updated.entry_date === date
          ? sortByTime(prev.map((row) => (row.id === id ? updated : row)))
          : prev.filter((row) => row.id !== id),
      )
    },
    [date],
  )

  const removeWater = useCallback(async (id: string) => {
    await deleteWater(id)
    setWater((prev) => prev.filter((row) => row.id !== id))
  }, [])

  return {
    goals,
    entries,
    water,
    recentFoods,
    loading,
    error,
    addEntry,
    editEntry,
    removeEntry,
    addWater,
    editWater,
    removeWater,
  }
}
