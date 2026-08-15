/**
 * The device's local calendar date as YYYY-MM-DD.
 *
 * Not toISOString(): that converts to UTC first, so any evening west of UTC
 * would log against tomorrow's date. entry_date is meant to be the day the user
 * experienced, so it has to be read off the local clock.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}
