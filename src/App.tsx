import { useState } from 'react'
import Loading from './components/Loading'
import NavBar, { type Tab } from './components/NavBar'
import { useAuth } from './hooks/useAuth'
import SignIn from './screens/SignIn'
import Today, { type Sheet } from './screens/Today'
import History from './screens/History'
import Settings from './screens/Settings'

export default function App() {
  const { session, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const [sheet, setSheet] = useState<Sheet | null>(null)

  // Reading the stored session is usually instant, but on a cold PWA launch it
  // can take long enough that a blank screen looks like a hang.
  if (loading) return <Loading full />
  if (!session) return <SignIn />

  return (
    <div className="app">
      <main className="main">
        {tab === 'today' && <Today sheet={sheet} onCloseSheet={() => setSheet(null)} />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>

      {/* Lives outside .main so it stays pinned above the tab bar, in thumb
          reach. App owns only which sheet is open; Today owns the data and
          renders the sheets itself. */}
      {tab === 'today' && (
        <div className="add-bar">
          <button className="btn" type="button" onClick={() => setSheet('food')}>
            + Food
          </button>
          <button className="btn btn--water" type="button" onClick={() => setSheet('water')}>
            + Water
          </button>
        </div>
      )}

      <NavBar tab={tab} onChange={setTab} />
    </div>
  )
}
