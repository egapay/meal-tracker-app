type Props = {
  /** Centres in the viewport rather than in the screen body. */
  full?: boolean
  label?: string
}

export default function Loading({ full = false, label = 'Loading…' }: Props) {
  return (
    <div className={full ? 'loading loading--full' : 'loading'} role="status" aria-live="polite">
      <div className="spinner" />
      <p className="loading__text">{label}</p>
    </div>
  )
}
