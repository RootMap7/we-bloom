import type { Message } from '../parser/types'
import { bump, mean, rank, share } from './math'
import { DAY_MS, dayKey, monthKey, monthLabel, startOfDay } from './time'
import type {
  Analytics,
  AnalyticsConfig,
  Conversation,
  Counted,
  DayBucket,
  PerPerson,
  Silence,
  Streak,
} from './types'

/**
 * Split the message stream into conversations at every gap longer than the
 * configured threshold (PRODUCT.md §9, default 4h).
 */
export function buildConversations(
  messages: Message[],
  participants: string[],
  config: AnalyticsConfig,
): Analytics['conversations'] {
  const list: Conversation[] = []
  let current: Message[] = []

  const flush = () => {
    if (!current.length) return
    const first = current[0]
    const last = current[current.length - 1]
    const perPerson: PerPerson<number> = {}
    for (const p of participants) perPerson[p] = 0
    for (const m of current) perPerson[m.author] = (perPerson[m.author] ?? 0) + 1

    list.push({
      index: list.length,
      startAt: first.at,
      endAt: last.at,
      durationMs: last.at - first.at,
      messages: current.length,
      starter: first.author,
      ender: last.author,
      perPerson,
      opener: openingPhrase(first),
    })
    current = []
  }

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (i > 0 && m.at - messages[i - 1].at > config.conversationGapMs) flush()
    current.push(m)
  }
  flush()

  const initiationCounts: PerPerson<number> = {}
  const endingCounts: PerPerson<number> = {}
  const byHour: PerPerson<number[]> = {}
  const byWeekday: PerPerson<number[]> = {}
  for (const p of participants) {
    initiationCounts[p] = 0
    endingCounts[p] = 0
    byHour[p] = new Array(24).fill(0)
    byWeekday[p] = new Array(7).fill(0)
  }

  const openers = new Map<string, number>()
  const trendMap = new Map<string, PerPerson<number>>()

  for (const c of list) {
    initiationCounts[c.starter] = (initiationCounts[c.starter] ?? 0) + 1
    endingCounts[c.ender] = (endingCounts[c.ender] ?? 0) + 1

    const d = new Date(c.startAt)
    byHour[c.starter] ??= new Array(24).fill(0)
    byWeekday[c.starter] ??= new Array(7).fill(0)
    byHour[c.starter][d.getHours()]++
    byWeekday[c.starter][d.getDay()]++

    if (c.opener) bump(openers, c.opener)

    const key = monthKey(c.startAt)
    let month = trendMap.get(key)
    if (!month) {
      month = {}
      for (const p of participants) month[p] = 0
      trendMap.set(key, month)
    }
    month[c.starter] = (month[c.starter] ?? 0) + 1
  }

  const totalStarts = list.length
  const shares: Counted[] = participants
    .map((p) => ({
      key: p,
      count: initiationCounts[p] ?? 0,
      share: share(initiationCounts[p] ?? 0, totalStarts),
    }))
    .sort((a, b) => b.count - a.count)

  const trend = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, perPerson]) => {
      const total = Object.values(perPerson).reduce((t, n) => t + n, 0)
      const asShare: PerPerson<number> = {}
      for (const [p, n] of Object.entries(perPerson)) asShare[p] = share(n, total)
      return {
        key,
        label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
        perPerson: asShare,
      }
    })

  const durations = list.map((c) => c.durationMs)
  const counts = list.map((c) => c.messages)

  return {
    list,
    total: list.length,
    averageMessages: mean(counts) ?? 0,
    averageDurationMs: mean(durations) ?? 0,
    longestByDuration: list.reduce<Conversation | null>(
      (best, c) => (!best || c.durationMs > best.durationMs ? c : best),
      null,
    ),
    longestByMessages: list.reduce<Conversation | null>(
      (best, c) => (!best || c.messages > best.messages ? c : best),
      null,
    ),
    initiation: {
      perPerson: initiationCounts,
      shares,
      byHour,
      byWeekday,
      trend,
      commonOpeners: rank(openers, 10).map(([key, count]) => ({
        key,
        count,
        share: share(count, totalStarts),
      })),
    },
    endings: endingCounts,
  }
}

/**
 * The first few words of a conversation's opening message, normalised so
 * "Hey!" and "hey" collapse together. Media-only openers have no phrase.
 */
function openingPhrase(m: Message): string {
  if (m.media || m.deleted) return ''
  const clean = m.text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')
  return clean.length >= 2 ? clean : ''
}

/**
 * A streak is consecutive calendar days that each clear the minimum message
 * count. Calendar days, not 24h windows — "we talked every day for 17 days" is
 * how a person counts it.
 */
export function buildStreaks(byDay: DayBucket[], config: AnalyticsConfig): Analytics['streaks'] {
  const qualifying = byDay.filter((d) => d.messages >= config.streakMinMessages)
  const all: Streak[] = []

  let runStart: DayBucket | null = null
  let runEnd: DayBucket | null = null
  let runMessages = 0

  const closeRun = () => {
    if (runStart && runEnd) {
      all.push({
        startAt: runStart.at,
        endAt: runEnd.at,
        days: Math.round((runEnd.at - runStart.at) / DAY_MS) + 1,
        messages: runMessages,
      })
    }
    runStart = null
    runEnd = null
    runMessages = 0
  }

  for (const day of qualifying) {
    if (runEnd && day.at - runEnd.at === DAY_MS) {
      runEnd = day
      runMessages += day.messages
      continue
    }
    closeRun()
    runStart = day
    runEnd = day
    runMessages = day.messages
  }
  closeRun()

  const longest = all.reduce<Streak | null>(
    (best, s) => (!best || s.days > best.days ? s : best),
    null,
  )

  // "Current" only means anything relative to the export's own end date, since
  // we have no idea how stale the file is.
  const lastDay = byDay.length ? byDay[byDay.length - 1] : null
  const current =
    lastDay && all.length && all[all.length - 1].endAt === lastDay.at
      ? all[all.length - 1]
      : null

  return {
    longest,
    current,
    all: [...all].sort((a, b) => b.days - a.days).slice(0, 20),
    count: all.length,
    averageDays: mean(all.map((s) => s.days)) ?? 0,
  }
}

export function buildSilences(
  messages: Message[],
  config: AnalyticsConfig,
): Analytics['silences'] {
  const found: Silence[] = []
  const gaps: number[] = []

  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].at - messages[i - 1].at
    if (gap <= 0) continue
    gaps.push(gap)
    if (gap >= config.silenceMinMs) {
      found.push({
        startAt: messages[i - 1].at,
        endAt: messages[i].at,
        durationMs: gap,
        lastSpeaker: messages[i - 1].author,
        brokenBy: messages[i].author,
      })
    }
  }

  const sorted = [...found].sort((a, b) => b.durationMs - a.durationMs)

  return {
    longest: sorted[0] ?? null,
    top: sorted.slice(0, 8),
    averageGapMs: mean(gaps) ?? 0,
    trend: monthlyMeanGap(messages),
  }
}

function monthlyMeanGap(messages: Message[]) {
  const byMonth = new Map<string, number[]>()
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].at - messages[i - 1].at
    if (gap <= 0) continue
    const key = monthKey(messages[i].at)
    const arr = byMonth.get(key)
    if (arr) arr.push(gap)
    else byMonth.set(key, [gap])
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, xs]) => ({
      key,
      label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
      meanGapMs: mean(xs),
    }))
}

export { dayKey, startOfDay }
