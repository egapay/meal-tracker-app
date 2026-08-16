import { useState } from 'react'
import type { FormEvent } from 'react'
import { nowTimeHHMM } from '../lib/date'
import { formatAmount, toTimeInputValue } from '../lib/format'
import type { NewWaterEntry, WaterEntry } from '../lib/types'

/** Common vessels: glass, small bottle, standard bottle, owala water bottle, large bottle. */
const PRESETS_OZ = [8, 12, 16.9, 24, 32]

type Props = {
  defaultDate: string
  /** Present in edit mode; absent means add. */
  entry?: WaterEntry
  onSubmit: (entry: NewWaterEntry) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

export default function WaterForm({ defaultDate, entry, onSubmit, onDelete, onCancel }: Props) {
  const [amount, setAmount] = useState(entry ? String(entry.amount_oz) : '')
  const [time, setTime] = useState(() =>
    entry ? toTimeInputValue(entry.drank_at) : nowTimeHHMM(),
  )
  const [date, setDate] = useState(entry?.entry_date ?? defaultDate)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const ounces = Number(amount)
    if (!Number.isFinite(ounces) || ounces <= 0) {
      setError('Enter how much you drank, in ounces.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit({ amount_oz: ounces, drank_at: time, entry_date: date })
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
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={entry ? 'Edit water' : 'Log water'}
    >
      <form className="sheet__panel" onSubmit={handleSubmit}>
        <h2 className="sheet__title">{entry ? 'Edit water' : 'Log water'}</h2>

        <div className="field">
          <span className="field__label">Quick amounts</span>
          <div className="chips">
            {PRESETS_OZ.map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip"
                aria-pressed={Number(amount) === preset}
                onClick={() => setAmount(String(preset))}
              >
                {formatAmount(preset)} oz
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">Amount (oz)</span>
          <input
            className="field__input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="12"
            inputMode="decimal"
            autoFocus={!entry}
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Time</span>
          <input
            className="field__input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>

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
          <button className="btn btn--water" type="submit" disabled={busy}>
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
