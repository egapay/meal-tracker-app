import { useState } from 'react'
import EntryForm from '../components/EntryForm'
import { useToday } from '../hooks/useToday'
import { todayISO } from '../lib/date'
import { formatGrams, formatLongDate } from '../lib/format'
import { MEAL_LABELS, MEAL_TYPES } from '../lib/types'
import type { FoodEntry } from '../lib/types'

type Props = {
  adding: boolean
  onCloseAdd: () => void
}

export default function Today({ adding, onCloseAdd }: Props) {
  // Captured once on mount. An app left open across midnight keeps showing the
  // old day until relaunched, which is fine for a phone app that gets reopened.
  const [date] = useState(todayISO)
  const { goal, entries, loading, error, addEntry, editEntry, removeEntry } = useToday(date)
  const [editing, setEditing] = useState<FoodEntry | null>(null)

  const consumed = entries.reduce((sum, entry) => sum + entry.protein_grams, 0)
  const remaining = Math.max(0, goal - consumed)
  const percent = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0

  const groups = MEAL_TYPES.map((type) => ({
    type,
    items: entries.filter((entry) => entry.meal_type === type),
  })).filter((group) => group.items.length > 0)

  function closeSheet() {
    setEditing(null)
    onCloseAdd()
  }

  // The sheet renders outside this branch: an early return here would leave
  // App's "+ Add food" button visible but dead whenever the day failed to load.
  const body = loading ? (
    <p className="screen__note">Loading…</p>
  ) : error ? (
    <p className="error">{error}</p>
  ) : (
    <>
      <header>
        <p className="summary__date">{formatLongDate(date)}</p>
        <p className="summary__total">
          <span className="summary__consumed">{formatGrams(consumed)}</span>
          <span className="summary__goal">/ {formatGrams(goal)} g</span>
        </p>
        <div className="bar">
          <div
            className={remaining === 0 ? 'bar__fill bar__fill--met' : 'bar__fill'}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="summary__remaining">
          {remaining === 0 ? 'Goal reached' : `${formatGrams(remaining)} g remaining`}
        </p>
      </header>

      {groups.length === 0 && <p className="screen__note">Nothing logged yet today.</p>}

      {groups.map(({ type, items }) => (
        <section className="meal" key={type}>
          <div className="meal__head">
            <h2 className="meal__title">{MEAL_LABELS[type]}</h2>
            <span className="meal__total">
              {formatGrams(items.reduce((sum, item) => sum + item.protein_grams, 0))} g
            </span>
          </div>
          <ul className="entries">
            {items.map((item) => (
              <li key={item.id}>
                <button className="entry" type="button" onClick={() => setEditing(item)}>
                  <span className="entry__name">{item.name}</span>
                  <span className="entry__grams">{formatGrams(item.protein_grams)} g</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )

  return (
    <>
      {body}

      {(adding || editing) && (
        // Keyed so switching between entries resets the form's fields.
        <EntryForm
          key={editing?.id ?? 'new'}
          defaultDate={date}
          entry={editing ?? undefined}
          onCancel={closeSheet}
          onSubmit={async (values) => {
            if (editing) await editEntry(editing.id, values)
            else await addEntry(values)
            closeSheet()
          }}
          onDelete={
            editing
              ? async () => {
                  await removeEntry(editing.id)
                  closeSheet()
                }
              : undefined
          }
        />
      )}
    </>
  )
}
