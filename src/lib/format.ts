import { MONTH_FULL, MONTH_LABELS, WEEKDAY_FULL } from './analytics/time'

const nf = new Intl.NumberFormat('en-GB')

export function num(n: number): string {
  return nf.format(Math.round(n))
}

export function decimal(n: number, places = 1): string {
  return n.toLocaleString('en-GB', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

export function pct(fraction: number, places = 0): string {
  return `${(fraction * 100).toFixed(places)}%`
}

/**
 * Human duration. Two units maximum — "1h 4m", never "1h 4m 22s" — because the
 * third unit is noise at every scale a conversation operates on.
 */
export function duration(ms: number | null | undefined, opts?: { long?: boolean }): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '—'
  if (ms < 1000) return opts?.long ? 'under a second' : '<1s'

  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  if (d >= 1) {
    const rh = h % 24
    if (opts?.long) return rh ? `${d} day${d === 1 ? '' : 's'}, ${rh}h` : `${d} day${d === 1 ? '' : 's'}`
    return rh ? `${d}d ${rh}h` : `${d}d`
  }
  if (h >= 1) {
    const rm = m % 60
    return rm ? `${h}h ${rm}m` : `${h}h`
  }
  if (m >= 1) {
    const rs = s % 60
    return rs && m < 10 ? `${m}m ${rs}s` : `${m}m`
  }
  return `${s}s`
}

export function hourLabel(hour: number | null): string {
  if (hour === null) return '—'
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

export function hourRange(hour: number | null): string {
  if (hour === null) return '—'
  const next = (hour + 1) % 24
  return `${hourLabel(hour)}–${hourLabel(next)}`
}

export function weekdayLabel(day: number | null): string {
  return day === null ? '—' : WEEKDAY_FULL[day]
}

export function dateShort(at: number): string {
  const d = new Date(at)
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
}

export function dateLong(at: number): string {
  const d = new Date(at)
  return `${d.getDate()} ${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`
}

export function dateTime(at: number): string {
  const d = new Date(at)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dateShort(at)}, ${hh}:${mm}`
}

export function dateRange(from: number, to: number): string {
  return `${dateShort(from)} — ${dateShort(to)}`
}

/** "18,492 messages" / "1 message". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${num(n)} ${n === 1 ? one : many}`
}

/** Short display name: first name only when it's unambiguous in the group. */
export function shortName(name: string, all: string[]): string {
  const first = name.trim().split(/\s+/)[0]
  const clash = all.filter((n) => n !== name && n.trim().split(/\s+/)[0] === first)
  return clash.length ? name : first
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Signed change, phrased for copy: "up 34%" / "down 12%" / "about the same". */
export function changePhrase(ratio: number | null): string {
  if (ratio === null) return 'not enough data to compare'
  const abs = Math.abs(ratio)
  if (abs < 0.05) return 'about the same'
  return `${ratio > 0 ? 'up' : 'down'} ${pct(abs)}`
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
