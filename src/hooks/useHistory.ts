import { useCallback, useEffect, useState } from 'react'
import { deleteEntry, listEntriesBetween, updateEntry } from '../data/entries'
import { getGoals } from '../data/profile'
import { deleteWater, listWaterBetween, updateWater } from '../data/water'
import { daysAgoISO, todayISO } from '../lib/date'
import type { FoodEntry, Goals, NewFoodEntry, NewWaterEntry, WaterEntry } from '../lib/types'

/** How far back History reaches. Bounded so the query can't grow forever. */
const HISTORY_DAYS = 90

const NO_GOALS: Goals = { protein: 0, waterOz: 0 }

export type DaySummary = {
  date: string
  proteinTotal: number
  waterTotal: number
  entries: FoodEntry[]
  water: WaterEntry[]
}

function groupByDate(food: FoodEntry[], water: WaterEntry[]): DaySummary[] {
  const byDate = new Map<string, DaySummary>()

  const dayFor = (date: string) => {
    let day = byDate.get(date)
    if (!day) {
      day = { date, proteinTotal: 0, waterTotal: 0, entries: [], water: [] }
      byDate.set(date, day)
    }
    return day
  }

  for (const row of food) {
    const day = dayFor(row.entry_date)
    day.entries.push(row)
    day.proteinTotal += row.protein_grams
  }

  for (const row of water) {
    const day = dayFor(row.entry_date)
    day.water.push(row)
    day.waterTotal += row.amount_oz
  }

  // Sorted explicitly. This used to rely on insertion order from a single
  // already-sorted query, which stopped being true once days could be created
  // by either source -- a water-only day would otherwise land out of order.
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}

/**
 * Previous days, newest first. Two queries fetch the whole window, so expanding
 * a day is instant rather than another round trip.
 */
export function useHistory() {
  const [days, setDays] = useState<DaySummary[]>([])
  const [goals, setGoals] = useState<Goals>(NO_GOALS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Exclusive of today, which has its own screen.
    const from = daysAgoISO(HISTORY_DAYS)
    const to = todayISO()

    const [dailyGoals, food, water] = await Promise.all([
      getGoals(),
      listEntriesBetween(from, to),
      listWaterBetween(from, to),
    ])

    setGoals(dailyGoals)
    setDays(groupByDate(food, water))
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

  // All four mutations refetch rather than patching state. An edit can move an
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

  const editWater = useCallback(
    async (id: string, entry: NewWaterEntry) => {
      await updateWater(id, entry)
      await load()
    },
    [load],
  )

  const removeWater = useCallback(
    async (id: string) => {
      await deleteWater(id)
      await load()
    },
    [load],
  )

  return { days, goals, loading, error, editEntry, removeEntry, editWater, removeWater }
}
