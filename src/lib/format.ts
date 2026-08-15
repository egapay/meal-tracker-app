/** Whole numbers stay whole; 12.5 keeps its decimal. Avoids "18.0 g" everywhere. */
export function formatGrams(grams: number): string {
  return Number.isInteger(grams) ? String(grams) : grams.toFixed(1)
}

/** "Saturday, August 15" from a YYYY-MM-DD string. */
export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  // Built from parts rather than new Date(isoDate): that parses a bare date as
  // UTC midnight, which renders as the previous day in western timezones.
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}
