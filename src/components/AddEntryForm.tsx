import { useState } from 'react'
import type { FormEvent } from 'react'
import { MEAL_LABELS, MEAL_TYPES } from '../lib/types'
import type { MealType, NewFoodEntry } from '../lib/types'

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
  onSubmit: (entry: NewFoodEntry) => Promise<void>
  onCancel: () => void
}

export default function AddEntryForm({ defaultDate, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [grams, setGrams] = useState('')
  const [mealType, setMealType] = useState<MealType>(mealTypeForNow)
  const [date, setDate] = useState(defaultDate)
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

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Add food">
      <form className="sheet__panel" onSubmit={handleSubmit}>
        <h2 className="sheet__title">Add food</h2>

        <label className="field">
          <span className="field__label">Food</span>
          <input
            className="field__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="3 Eggs"
            maxLength={80}
            autoFocus
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
      </form>
    </div>
  )
}
