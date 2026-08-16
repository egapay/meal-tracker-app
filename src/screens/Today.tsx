import { useState } from 'react'
import EntryForm from '../components/EntryForm'
import WaterForm from '../components/WaterForm'
import { useToday } from '../hooks/useToday'
import { todayISO } from '../lib/date'
import { formatAmount, formatLongDate, formatTime } from '../lib/format'
import { MEAL_LABELS, MEAL_TYPES } from '../lib/types'
import type { FoodEntry, WaterEntry } from '../lib/types'

export type Sheet = 'food' | 'water'

type Props = {
  sheet: Sheet | null
  onCloseSheet: () => void
}

export default function Today({ sheet, onCloseSheet }: Props) {
  // Captured once on mount. An app left open across midnight keeps showing the
  // old day until relaunched, which is fine for a phone app that gets reopened.
  const [date] = useState(todayISO)
  const {
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
  } = useToday(date)

  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null)
  const [editingWater, setEditingWater] = useState<WaterEntry | null>(null)

  const consumed = entries.reduce((sum, entry) => sum + entry.protein_grams, 0)
  const remaining = Math.max(0, goals.protein - consumed)
  const percent = goals.protein > 0 ? Math.min(100, (consumed / goals.protein) * 100) : 0

  const drunk = water.reduce((sum, entry) => sum + entry.amount_oz, 0)
  const waterMet = goals.waterOz > 0 && drunk >= goals.waterOz
  const waterPercent = goals.waterOz > 0 ? Math.min(100, (drunk / goals.waterOz) * 100) : 0

  const groups = MEAL_TYPES.map((type) => ({
    type,
    items: entries.filter((entry) => entry.meal_type === type),
  })).filter((group) => group.items.length > 0)

  function closeSheets() {
    setEditingFood(null)
    setEditingWater(null)
    onCloseSheet()
  }

  // The sheets render outside this branch: an early return here would leave
  // App's add buttons visible but dead whenever the day failed to load.
  const body = loading ? (
    <p className="screen__note">Loading…</p>
  ) : error ? (
    <p className="error">{error}</p>
  ) : (
    <>
      <header>
        <p className="summary__date">{formatLongDate(date)}</p>
        <p className="summary__total">
          <span className="summary__consumed">{formatAmount(consumed)}</span>
          <span className="summary__goal">/ {formatAmount(goals.protein)} g</span>
        </p>
        <div className="bar">
          <div
            className={remaining === 0 ? 'bar__fill bar__fill--met' : 'bar__fill'}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="summary__remaining">
          {remaining === 0 ? 'Goal reached' : `${formatAmount(remaining)} g remaining`}
        </p>
      </header>

      <section className="water">
        <div className="water__head">
          <span className="water__label">Water</span>
          <span className={waterMet ? 'water__value water__value--met' : 'water__value'}>
            {waterMet ? '✓ ' : ''}
            {formatAmount(drunk)} / {formatAmount(goals.waterOz)} oz
          </span>
        </div>
        <div className="bar">
          <div
            className={waterMet ? 'bar__fill bar__fill--met' : 'bar__fill bar__fill--water'}
            style={{ width: `${waterPercent}%` }}
          />
        </div>
      </section>

      {groups.length === 0 && water.length === 0 && (
        <p className="screen__note">Nothing logged yet today.</p>
      )}

      {groups.map(({ type, items }) => (
        <section className="meal" key={type}>
          <div className="meal__head">
            <h2 className="meal__title">{MEAL_LABELS[type]}</h2>
            <span className="meal__total">
              {formatAmount(items.reduce((sum, item) => sum + item.protein_grams, 0))} g
            </span>
          </div>
          <ul className="entries">
            {items.map((item) => (
              <li key={item.id}>
                <button className="entry" type="button" onClick={() => setEditingFood(item)}>
                  <span className="entry__name">{item.name}</span>
                  <span className="entry__grams">{formatAmount(item.protein_grams)} g</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {water.length > 0 && (
        <section className="meal">
          <div className="meal__head">
            <h2 className="meal__title">Water</h2>
            <span className="meal__total">{formatAmount(drunk)} oz</span>
          </div>
          <ul className="entries">
            {water.map((item) => (
              <li key={item.id}>
                <button className="entry" type="button" onClick={() => setEditingWater(item)}>
                  <span className="entry__name">{formatAmount(item.amount_oz)} oz</span>
                  <span className="entry__grams">{formatTime(item.drank_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )

  return (
    <>
      {body}

      {(sheet === 'food' || editingFood) && (
        // Keyed so switching between entries resets the form's fields.
        <EntryForm
          key={editingFood?.id ?? 'new-food'}
          defaultDate={date}
          entry={editingFood ?? undefined}
          recentFoods={recentFoods}
          onCancel={closeSheets}
          onSubmit={async (values) => {
            if (editingFood) await editEntry(editingFood.id, values)
            else await addEntry(values)
            closeSheets()
          }}
          onDelete={
            editingFood
              ? async () => {
                  await removeEntry(editingFood.id)
                  closeSheets()
                }
              : undefined
          }
        />
      )}

      {(sheet === 'water' || editingWater) && (
        <WaterForm
          key={editingWater?.id ?? 'new-water'}
          defaultDate={date}
          entry={editingWater ?? undefined}
          onCancel={closeSheets}
          onSubmit={async (values) => {
            if (editingWater) await editWater(editingWater.id, values)
            else await addWater(values)
            closeSheets()
          }}
          onDelete={
            editingWater
              ? async () => {
                  await removeWater(editingWater.id)
                  closeSheets()
                }
              : undefined
          }
        />
      )}
    </>
  )
}
