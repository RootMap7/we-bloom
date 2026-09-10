export const DAY_MS = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date key. Local, not UTC — see parser's timezone note. */
export function dayKey(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function monthKey(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function yearKey(at: number): string {
  return String(new Date(at).getFullYear())
}

/** ISO-ish week key, Monday-start, good enough for bucketing. */
export function weekKey(at: number): string {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - dow)
  return `${d.getFullYear()}-W${pad(weekOfYear(d))}`
}

function weekOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1)
  const diff = (d.getTime() - start.getTime()) / DAY_MS
  return Math.floor(diff / 7) + 1
}

export function startOfDay(at: number): number {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function startOfMonth(at: number): number {
  const d = new Date(at)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export function startOfWeek(at: number): number {
  const d = new Date(at)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export function startOfYear(at: number): number {
  return new Date(new Date(at).getFullYear(), 0, 1).getTime()
}

export function daysBetween(a: number, b: number): number {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS)
}

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
]

export function monthLabel(at: number): string {
  const d = new Date(at)
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export function dayLabel(at: number): string {
  const d = new Date(at)
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export function weekLabel(at: number): string {
  const d = new Date(at)
  return `w/c ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`
}
