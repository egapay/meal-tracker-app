import { useState } from 'react'
import NavBar, { type Tab } from './components/NavBar'
import { useAuth } from './hooks/useAuth'
import SignIn from './screens/SignIn'
import Today from './screens/Today'
import History from './screens/History'
import Settings from './screens/Settings'

export default function App() {
  const { session, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('today')

  // Empty shell rather than a spinner: reading the stored session is fast, and
  // a spinner that flashes for 30ms reads as jank.
  if (loading) return <div className="app" />
  if (!session) return <SignIn />

  return (
    <div className="app">
      <main className="main">
        {tab === 'today' && <Today />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>

      {/* Lives outside .main so it stays pinned above the tab bar, in thumb
          reach. Inert until Phase 3 wires up the add-entry sheet. */}
      {tab === 'today' && (
        <button className="btn add" type="button">
          + Add food
        </button>
      )}

      <NavBar tab={tab} onChange={setTab} />
    </div>
  )
}
