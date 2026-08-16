import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { getGoals, updateGoals } from '../data/profile'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [protein, setProtein] = useState('')
  const [waterOz, setWaterOz] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getGoals()
      .then((goals) => {
        if (cancelled) return
        setProtein(String(goals.protein))
        setWaterOz(String(goals.waterOz))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your goals.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function change(setter: (value: string) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value)
      setSaved(false)
      setError(null)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // These bounds match the CHECK constraints on profiles, so an invalid value
    // is caught here rather than coming back as a Postgres error.
    const proteinValue = Number(protein)
    const waterValue = Number(waterOz)

    if (!Number.isInteger(proteinValue) || proteinValue < 1 || proteinValue > 1000) {
      setError('Protein goal must be a whole number between 1 and 1000.')
      return
    }
    if (!Number.isInteger(waterValue) || waterValue < 1 || waterValue > 500) {
      setError('Water goal must be a whole number between 1 and 500.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const next = await updateGoals({ protein: proteinValue, waterOz: waterValue })
      setProtein(String(next.protein))
      setWaterOz(String(next.waterOz))
      setSaved(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your goals.')
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
              value={protein}
              onChange={change(setProtein)}
              inputMode="numeric"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Daily water goal (oz)</span>
            <input
              className="field__input"
              value={waterOz}
              onChange={change(setWaterOz)}
              inputMode="numeric"
              required
            />
          </label>

          {error && <p className="error">{error}</p>}
          {saved && <p className="screen__note">Saved.</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save goals'}
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
