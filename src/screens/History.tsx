import { useState } from 'react'
import EntryForm from '../components/EntryForm'
import { useHistory } from '../hooks/useHistory'
import { formatGrams, formatShortDate } from '../lib/format'
import type { FoodEntry } from '../lib/types'

export default function History() {
  const { days, goal, loading, error, editEntry, removeEntry } = useHistory()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<FoodEntry | null>(null)

  if (loading) return <p className="screen__note">Loading…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <>
      <h1 className="screen__title">History</h1>

      {days.length === 0 ? (
        <p className="screen__note">No previous days logged yet.</p>
      ) : (
        <ul className="days">
          {days.map((day) => {
            const met = day.total >= goal
            const open = expanded === day.date

            return (
              <li className="day" key={day.date}>
                <button
                  className="day__head"
                  type="button"
                  aria-expanded={open}
                  onClick={() => setExpanded(open ? null : day.date)}
                >
                  <span className="day__date">{formatShortDate(day.date)}</span>
                  <span className={met ? 'day__total day__total--met' : 'day__total'}>
                    {/* Not colour alone -- the check has to carry the meaning too. */}
                    {met ? '✓ ' : ''}
                    {formatGrams(day.total)} / {formatGrams(goal)} g
                  </span>
                </button>

                {open && (
                  <ul className="day__entries">
                    {day.entries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          className="day__entry"
                          type="button"
                          onClick={() => setEditing(entry)}
                        >
                          <span className="entry__name">{entry.name}</span>
                          <span className="entry__grams">{formatGrams(entry.protein_grams)} g</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <EntryForm
          key={editing.id}
          defaultDate={editing.entry_date}
          entry={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await editEntry(editing.id, values)
            setEditing(null)
          }}
          onDelete={async () => {
            await removeEntry(editing.id)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
