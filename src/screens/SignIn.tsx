import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)

    // On success onAuthStateChange fires and App swaps in the signed-in shell,
    // so there is nothing to navigate to here.
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <form className="auth" onSubmit={handleSubmit}>
      <h1 className="auth__title">Protein Tracker</h1>
      <p className="auth__subtitle">Sign in to see today's total.</p>

      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="field__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          // These four are what let iOS Keychain offer to fill the account.
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="field__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  )
}
