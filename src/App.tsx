import { useState } from 'react'
import NavBar, { type Tab } from './components/NavBar'
import Today from './screens/Today'
import History from './screens/History'
import Settings from './screens/Settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')

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
        <button className="add" type="button">
          + Add food
        </button>
      )}

      <NavBar tab={tab} onChange={setTab} />
    </div>
  )
}
