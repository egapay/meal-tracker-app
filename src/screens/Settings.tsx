import { supabase } from '../lib/supabase'

export default function Settings() {
  return (
    <>
      <h1 className="screen__title">Settings</h1>
      <p className="screen__note">Your daily protein goal will be editable here.</p>

      <button className="btn btn--secondary" type="button" onClick={() => supabase.auth.signOut()}>
        Sign out
      </button>
    </>
  )
}
