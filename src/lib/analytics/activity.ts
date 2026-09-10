import type { Message } from '../parser/types'
import { argmax, bump, mean, stdev } from './math'
import {
  DAY_MS,
  dayKey,
  dayLabel,
  monthKey,
  monthLabel,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  weekKey,
  weekLabel,
  yearKey,
} from './time'
import type { Analytics, DayBucket, PeriodBucket, PerPerson } from './types'

type Activity = Analytics['activity']

export function buildActivity(messages: Message[], participants: string[]): Activity {
  const byDayMap = new Map<string, DayBucket>()
  const byHour = new Array(24).fill(0)
  const byWeekday = new Array(7).fill(0)
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

  for (const m of messages) {
    const d = new Date(m.at)
    const hour = d.getHours()
    const weekday = d.getDay()

    byHour[hour]++
    byWeekday[weekday]++
    heatmap[weekday][hour]++

    const key = dayKey(m.at)
    let bucket = byDayMap.get(key)
    if (!bucket) {
      bucket = {
        date: key,
        at: startOfDay(m.at),
        messages: 0,
        words: 0,
        perPerson: emptyPerPerson(participants),
      }
      byDayMap.set(key, bucket)
    }
    bucket.messages++
    bucket.words += m.wordCount
    bucket.perPerson[m.author] = (bucket.perPerson[m.author] ?? 0) + 1
  }

  const byDay = [...byDayMap.values()].sort((a, b) => a.at - b.at)

  const byWeek = rollUp(byDay, participants, weekKey, startOfWeek, weekLabel)
  const byMonth = rollUp(byDay, participants, monthKey, startOfMonth, monthLabel)
  const byYear = rollUp(byDay, participants, yearKey, startOfYear, (at) =>
    String(new Date(at).getFullYear()),
  )

  const busiestDay = byDay.reduce<DayBucket | null>(
    (best, d) => (!best || d.messages > best.messages ? d : best),
    null,
  )
  const quietestActiveDay = byDay.reduce<DayBucket | null>(
    (best, d) => (!best || d.messages < best.messages ? d : best),
    null,
  )

  let heatmapMax = 0
  for (const row of heatmap) for (const v of row) if (v > heatmapMax) heatmapMax = v

  return {
    byDay,
    byWeek,
    byMonth,
    byYear,
    byHour,
    byWeekday,
    heatmap,
    heatmapMax,
    busiestDay,
    quietestActiveDay,
    peakHour: argmax(byHour),
    peakWeekday: argmax(byWeekday),
    spikes: findSpikes(byDay),
  }
}

function emptyPerPerson(participants: string[]): PerPerson<number> {
  const out: PerPerson<number> = {}
  for (const p of participants) out[p] = 0
  return out
}

function rollUp(
  byDay: DayBucket[],
  participants: string[],
  keyOf: (at: number) => string,
  startOf: (at: number) => number,
  labelOf: (at: number) => string,
): PeriodBucket[] {
  const map = new Map<string, PeriodBucket>()
  for (const d of byDay) {
    const key = keyOf(d.at)
    let b = map.get(key)
    if (!b) {
      b = {
        key,
        label: labelOf(d.at),
        at: startOf(d.at),
        messages: 0,
        words: 0,
        perPerson: emptyPerPerson(participants),
      }
      map.set(key, b)
    }
    b.messages += d.messages
    b.words += d.words
    for (const [author, n] of Object.entries(d.perPerson)) {
      b.perPerson[author] = (b.perPerson[author] ?? 0) + n
    }
  }
  return [...map.values()].sort((a, b) => a.at - b.at)
}

/**
 * A spike is a day more than two standard deviations above the trailing
 * 30-day mean. Trailing rather than global, so a chat that grows over time
 * doesn't report its whole second half as one long spike.
 */
function findSpikes(byDay: DayBucket[]): Activity['spikes'] {
  if (byDay.length < 14) return []

  const out: Activity['spikes'] = []
  const window = 30

  for (let i = 7; i < byDay.length; i++) {
    const slice = byDay.slice(Math.max(0, i - window), i).map((d) => d.messages)
    if (slice.length < 7) continue
    const m = mean(slice)
    const s = stdev(slice)
    if (m === null || m < 1) continue
    const day = byDay[i]
    if (s > 0 && day.messages > m + 2 * s && day.messages >= m * 1.6) {
      out.push({
        date: day.date,
        at: day.at,
        messages: day.messages,
        ratio: day.messages / m,
      })
    }
  }

  return out.sort((a, b) => b.ratio - a.ratio).slice(0, 8)
}

/** Day-of-week × hour label used by the heatmap's accessible description. */
export function describeHeatmap(heatmap: number[][], total: number): string {
  if (!total) return 'No activity recorded.'
  let peak = { weekday: 0, hour: 0, count: -1 }
  for (let w = 0; w < 7; w++) {
    for (let h = 0; h < 24; h++) {
      if (heatmap[w][h] > peak.count) peak = { weekday: w, hour: h, count: heatmap[w][h] }
    }
  }
  return `Peak activity is on day ${peak.weekday} at hour ${peak.hour}, with ${peak.count} messages.`
}

/** Trailing mean gap between messages, used by the silence trend. */
export function meanGapPerMonth(
  messages: Message[],
): { key: string; label: string; meanGapMs: number | null }[] {
  const gaps = new Map<string, number[]>()
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].at - messages[i - 1].at
    if (gap <= 0) continue
    const key = monthKey(messages[i].at)
    const arr = gaps.get(key)
    if (arr) arr.push(gap)
    else gaps.set(key, [gap])
  }
  return [...gaps.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, arr]) => ({
      key,
      label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
      meanGapMs: mean(arr),
    }))
}

export { DAY_MS, dayLabel }

export function countActiveDays(byDay: DayBucket[]): number {
  return byDay.filter((d) => d.messages > 0).length
}

export function bumpPerPerson(map: PerPerson<number>, author: string): void {
  map[author] = (map[author] ?? 0) + 1
}

export { bump }
