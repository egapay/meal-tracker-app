import { useState } from 'react'
import EntryForm from '../components/EntryForm'
import WaterForm from '../components/WaterForm'
import { useHistory } from '../hooks/useHistory'
import { formatAmount, formatShortDate, formatTime } from '../lib/format'
import type { FoodEntry, WaterEntry } from '../lib/types'

export default function History() {
  const { days, goals, loading, error, editEntry, removeEntry, editWater, removeWater } =
    useHistory()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null)
  const [editingWater, setEditingWater] = useState<WaterEntry | null>(null)

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
            const proteinMet = day.proteinTotal >= goals.protein
            const waterMet = day.waterTotal >= goals.waterOz
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
                  <span className="day__totals">
                    {/* Not colour alone -- the check has to carry the meaning too. */}
                    <span className={proteinMet ? 'day__total day__total--met' : 'day__total'}>
                      {proteinMet ? '✓ ' : ''}
                      {formatAmount(day.proteinTotal)} / {formatAmount(goals.protein)} g
                    </span>
                    <span className={waterMet ? 'day__total day__total--met' : 'day__total'}>
                      {waterMet ? '✓ ' : ''}
                      {formatAmount(day.waterTotal)} / {formatAmount(goals.waterOz)} oz
                    </span>
                  </span>
                </button>

                {open && (
                  <ul className="day__entries">
                    {day.entries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          className="day__entry"
                          type="button"
                          onClick={() => setEditingFood(entry)}
                        >
                          <span className="entry__name">{entry.name}</span>
                          <span className="entry__grams">
                            {formatAmount(entry.protein_grams)} g
                          </span>
                        </button>
                      </li>
                    ))}

                    {day.water.map((entry) => (
                      <li key={entry.id}>
                        <button
                          className="day__entry"
                          type="button"
                          onClick={() => setEditingWater(entry)}
                        >
                          <span className="entry__name">{formatAmount(entry.amount_oz)} oz</span>
                          <span className="entry__grams">{formatTime(entry.drank_at)}</span>
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

      {editingFood && (
        <EntryForm
          key={editingFood.id}
          defaultDate={editingFood.entry_date}
          entry={editingFood}
          onCancel={() => setEditingFood(null)}
          onSubmit={async (values) => {
            await editEntry(editingFood.id, values)
            setEditingFood(null)
          }}
          onDelete={async () => {
            await removeEntry(editingFood.id)
            setEditingFood(null)
          }}
        />
      )}

      {editingWater && (
        <WaterForm
          key={editingWater.id}
          defaultDate={editingWater.entry_date}
          entry={editingWater}
          onCancel={() => setEditingWater(null)}
          onSubmit={async (values) => {
            await editWater(editingWater.id, values)
            setEditingWater(null)
          }}
          onDelete={async () => {
            await removeWater(editingWater.id)
            setEditingWater(null)
          }}
        />
      )}
    </>
  )
}
