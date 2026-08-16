import { useState } from 'react'
import type { FormEvent } from 'react'
import { formatAmount } from '../lib/format'
import { MEAL_LABELS, MEAL_TYPES } from '../lib/types'
import type { FoodEntry, MealType, NewFoodEntry, RecentFood } from '../lib/types'

/** Saves a tap in the common case: log what you just ate, now. */
function mealTypeForNow(): MealType {
  const hour = new Date().getHours()
  if (hour < 11) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

type Props = {
  defaultDate: string
  /** Present in edit mode; absent means add. */
  entry?: FoodEntry
  /** One-tap fills. Only meaningful when adding. */
  recentFoods?: RecentFood[]
  onSubmit: (entry: NewFoodEntry) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

export default function EntryForm({
  defaultDate,
  entry,
  recentFoods,
  onSubmit,
  onDelete,
  onCancel,
}: Props) {
  const [name, setName] = useState(entry?.name ?? '')
  const [grams, setGrams] = useState(entry ? String(entry.protein_grams) : '')
  const [mealType, setMealType] = useState<MealType>(() => entry?.meal_type ?? mealTypeForNow())
  const [date, setDate] = useState(entry?.entry_date ?? defaultDate)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const protein = Number(grams)
    if (!Number.isFinite(protein) || protein < 0) {
      setError('Enter the protein amount in grams.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        protein_grams: protein,
        meal_type: mealType,
        entry_date: date,
      })
      // On success the parent unmounts this form, so nothing to reset here.
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save.')
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    setBusy(true)
    setError(null)
    try {
      await onDelete()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not delete.')
      setBusy(false)
    }
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={entry ? 'Edit food' : 'Add food'}>
      <form className="sheet__panel" onSubmit={handleSubmit}>
        <h2 className="sheet__title">{entry ? 'Edit food' : 'Add food'}</h2>

        {/* Add mode only: when editing, the fields are already filled. */}
        {!entry && recentFoods && recentFoods.length > 0 && (
          <div className="field">
            <span className="field__label">Recent</span>
            <div className="chips">
              {recentFoods.map((food) => (
                <button
                  key={food.name}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setName(food.name)
                    setGrams(String(food.protein_grams))
                  }}
                >
                  {food.name}
                  <span className="chip__meta">{formatAmount(food.protein_grams)} g</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span className="field__label">Food</span>
          <input
            className="field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="3 Eggs"
            maxLength={80}
            // Only when adding; editing shouldn't force the keyboard open.
            autoFocus={!entry}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Protein (g)</span>
          <input
            className="field__input"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="18"
            // Brings up the numeric keypad instead of the full keyboard.
            inputMode="decimal"
            required
          />
        </label>

        <div className="field">
          <span className="field__label">Meal</span>
          <div className="segmented">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="segmented__option"
                aria-pressed={mealType === type}
                onClick={() => setMealType(type)}
              >
                {MEAL_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">Date</span>
          <input
            className="field__input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="sheet__actions">
          <button className="btn btn--secondary" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Two taps, because this sits a thumb-width from Save and is not undoable. */}
        {onDelete && (
          <button
            className="btn btn--danger"
            type="button"
            disabled={busy}
            onClick={confirmingDelete ? handleDelete : () => setConfirmingDelete(true)}
          >
            {confirmingDelete ? 'Tap again to delete' : 'Delete'}
          </button>
        )}
      </form>
    </div>
  )
}
