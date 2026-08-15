export type Tab = 'today' | 'history' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

type Props = {
  tab: Tab
  onChange: (tab: Tab) => void
}

export default function NavBar({ tab, onChange }: Props) {
  return (
    <nav className="nav">
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className="nav__tab"
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
