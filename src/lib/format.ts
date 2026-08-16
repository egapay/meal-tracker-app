/**
 * Whole numbers stay whole; 12.5 keeps its decimal. Shared by grams and ounces,
 * which want identical treatment.
 */
export function formatAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/**
 * Built from parts rather than new Date(isoDate): that parses a bare date as
 * UTC midnight, which renders as the previous day in western timezones.
 */
function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "Saturday, August 15" from a YYYY-MM-DD string. */
export function formatLongDate(isoDate: string): string {
  return parseISODate(isoDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** "Sat, Aug 15" from a YYYY-MM-DD string. */
export function formatShortDate(isoDate: string): string {
  return parseISODate(isoDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * "2:30 PM" from Postgres time ("14:30:00").
 *
 * The date carried by this throwaway Date is irrelevant -- only the clock
 * fields are read back out, so no timezone conversion happens.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/** Postgres time ("14:30:00") to the HH:MM an <input type="time"> expects. */
export function toTimeInputValue(time: string): string {
  return time.slice(0, 5)
}
