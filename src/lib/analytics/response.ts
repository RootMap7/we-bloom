import type { Message } from '../parser/types'
import { mean, median, percentileSorted } from './math'
import { monthKey, monthLabel } from './time'
import type { AnalyticsConfig, PerPerson, ResponseStats } from './types'

interface Reply {
  author: string
  ms: number
  at: number
}

const BUCKETS: { label: string; upperMs: number }[] = [
  { label: '< 1m', upperMs: 60_000 },
  { label: '1–5m', upperMs: 5 * 60_000 },
  { label: '5–15m', upperMs: 15 * 60_000 },
  { label: '15–30m', upperMs: 30 * 60_000 },
  { label: '30m–1h', upperMs: 60 * 60_000 },
  { label: '1–3h', upperMs: 3 * 60 * 60_000 },
  { label: '3–6h', upperMs: 6 * 60 * 60_000 },
  { label: '6h+', upperMs: Number.POSITIVE_INFINITY },
]

/**
 * A "response" is a message from a different author than the one before it.
 * Consecutive messages from the same person are one turn, not many replies —
 * otherwise a rapid-fire sender scores an artificially fast response time.
 *
 * Gaps beyond `responseCapMs` are dropped: they are the start of a new
 * conversation, not a slow reply, and including them lets a single overnight
 * gap swamp the mean.
 */
export function collectReplies(messages: Message[], config: AnalyticsConfig): Reply[] {
  const replies: Reply[] = []

  for (let i = 1; i < messages.length; i++) {
    const cur = messages[i]
    const prev = messages[i - 1]
    if (cur.author === prev.author) continue

    const ms = cur.at - prev.at
    if (ms < 0 || ms > config.responseCapMs) continue

    replies.push({ author: cur.author, ms, at: cur.at })
  }

  return replies
}

export function buildResponseStats(replies: Reply[]): ResponseStats {
  if (!replies.length) return emptyResponseStats()

  const all = replies.map((r) => r.ms).sort((a, b) => a - b)

  const hourSamples: number[][] = Array.from({ length: 24 }, () => [])
  const weekdaySamples: number[][] = Array.from({ length: 7 }, () => [])
  const distribution = BUCKETS.map((b) => ({ ...b, count: 0 }))

  for (const r of replies) {
    const d = new Date(r.at)
    hourSamples[d.getHours()].push(r.ms)
    weekdaySamples[d.getDay()].push(r.ms)
    const bucket = distribution.find((b) => r.ms < b.upperMs)
    if (bucket) bucket.count++
  }

  return {
    samples: replies.length,
    meanMs: mean(all),
    medianMs: percentileSorted(all, 0.5),
    p90Ms: percentileSorted(all, 0.9),
    fastestMs: all[0],
    slowestMs: all[all.length - 1],
    byHour: hourSamples.map((xs) => (xs.length >= 3 ? median(xs) : null)),
    byWeekday: weekdaySamples.map((xs) => (xs.length >= 3 ? median(xs) : null)),
    distribution,
  }
}

export function emptyResponseStats(): ResponseStats {
  return {
    samples: 0,
    meanMs: null,
    medianMs: null,
    p90Ms: null,
    fastestMs: null,
    slowestMs: null,
    byHour: new Array(24).fill(null),
    byWeekday: new Array(7).fill(null),
    distribution: BUCKETS.map((b) => ({ ...b, count: 0 })),
  }
}

export function perPersonResponses(
  replies: Reply[],
  participants: string[],
): PerPerson<ResponseStats> {
  const grouped = new Map<string, Reply[]>()
  for (const p of participants) grouped.set(p, [])
  for (const r of replies) grouped.get(r.author)?.push(r)

  const out: PerPerson<ResponseStats> = {}
  for (const [author, list] of grouped) {
    out[author] = buildResponseStats(list)
  }
  return out
}

export function responseTrend(
  replies: Reply[],
): { key: string; label: string; medianMs: number | null }[] {
  const byMonth = new Map<string, number[]>()
  for (const r of replies) {
    const key = monthKey(r.at)
    const arr = byMonth.get(key)
    if (arr) arr.push(r.ms)
    else byMonth.set(key, [r.ms])
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, xs]) => ({
      key,
      label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
      // Below three samples a "median" is one person's one slow morning.
      medianMs: xs.length >= 3 ? median(xs) : null,
    }))
}
