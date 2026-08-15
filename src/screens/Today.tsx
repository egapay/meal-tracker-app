// Phase 1 placeholder: hardcoded so the layout can be checked on a real iPhone.
// Phase 3 replaces GOAL with profiles.daily_protein_goal and MEALS with today's
// food_entries from Supabase. The markup and totals logic below carry over.
const GOAL = 150

const MEALS = [
  {
    meal: 'Breakfast',
    items: [
      { name: '3 Eggs', grams: 18 },
      { name: 'Greek Yogurt', grams: 20 },
    ],
  },
  { meal: 'Lunch', items: [{ name: 'Chicken Thighs', grams: 42 }] },
  { meal: 'Snack', items: [{ name: 'Protein Shake', grams: 30 }] },
]

export default function Today() {
  const consumed = MEALS.flatMap((m) => m.items).reduce((sum, i) => sum + i.grams, 0)
  const remaining = Math.max(0, GOAL - consumed)
  const percent = Math.min(100, (consumed / GOAL) * 100)

  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <header>
        <p className="summary__date">{date}</p>
        <p className="summary__total">
          <span className="summary__consumed">{consumed}</span>
          <span className="summary__goal">/ {GOAL} g</span>
        </p>
        <div className="bar">
          <div
            className={remaining === 0 ? 'bar__fill bar__fill--met' : 'bar__fill'}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="summary__remaining">
          {remaining === 0 ? 'Goal reached' : `${remaining} g remaining`}
        </p>
      </header>

      {MEALS.map(({ meal, items }) => (
        <section className="meal" key={meal}>
          <div className="meal__head">
            <h2 className="meal__title">{meal}</h2>
            <span className="meal__total">{items.reduce((s, i) => s + i.grams, 0)} g</span>
          </div>
          <ul className="entries">
            {items.map((item) => (
              <li className="entry" key={item.name}>
                <span className="entry__name">{item.name}</span>
                <span className="entry__grams">{item.grams} g</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
