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
  const [adding, setAdding] = useState(false)

  // Empty shell rather than a spinner: reading the stored session is fast, and
  // a spinner that flashes for 30ms reads as jank.
  if (loading) return <div className="app" />
  if (!session) return <SignIn />

  return (
    <div className="app">
      <main className="main">
        {tab === 'today' && <Today adding={adding} onCloseAdd={() => setAdding(false)} />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>

      {/* Lives outside .main so it stays pinned above the tab bar, in thumb
          reach. App owns only the open/closed flag; Today owns the entry data
          and renders the sheet itself. */}
      {tab === 'today' && (
        <button className="btn add" type="button" onClick={() => setAdding(true)}>
          + Add food
        </button>
      )}

      <NavBar tab={tab} onChange={setTab} />
    </div>
  )
}
