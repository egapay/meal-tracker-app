import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getDailyGoal, updateDailyGoal } from '../data/profile'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDailyGoal()
      .then((value) => {
        if (!cancelled) setGoal(String(value))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your goal.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Matches the CHECK constraint on profiles.daily_protein_goal, so an
    // invalid value is caught here rather than coming back as a Postgres error.
    const value = Number(goal)
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      setError('Enter a whole number between 1 and 1000.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const next = await updateDailyGoal(value)
      setGoal(String(next))
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your goal.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="screen__title">Settings</h1>

      {loading ? (
        <p className="screen__note">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Daily protein goal (g)</span>
            <input
              className="field__input"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value)
                setSaved(false)
                setError(null)
              }}
              inputMode="numeric"
              required
            />
          </label>

          {error && <p className="error">{error}</p>}
          {saved && <p className="screen__note">Saved.</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save goal'}
          </button>
        </form>
      )}

      <button
        className="btn btn--secondary settings__signout"
        type="button"
        onClick={() => supabase.auth.signOut()}
      >
        Sign out
      </button>
    </>
  )
}
