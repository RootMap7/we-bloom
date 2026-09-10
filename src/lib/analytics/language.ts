import type { Message } from '../parser/types'
import { bump, rank, share } from './math'
import { isStopword, tokenize } from './stopwords'
import { monthKey, monthLabel } from './time'
import type {
  Analytics,
  AnalyticsConfig,
  Counted,
  EmojiUsage,
  PerPerson,
  WordUsage,
} from './types'

/** How many words get a full explorer entry. Beyond this is long-tail noise. */
const INDEX_SIZE = 400
const PHRASE_MIN_COUNT = 3

export function buildWords(
  messages: Message[],
  participants: string[],
  config: AnalyticsConfig,
): Analytics['words'] {
  const totals = new Map<string, number>()
  const perAuthor = new Map<string, Map<string, number>>()
  const phrases = new Map<string, number>()
  const openers = new Map<string, number>()
  const closers = new Map<string, number>()
  for (const p of participants) perAuthor.set(p, new Map())

  let totalTokens = 0

  for (const m of messages) {
    if (!m.text || m.media || m.deleted) continue
    const tokens = tokenize(m.text)
    if (!tokens.length) continue

    totalTokens += tokens.length
    const authorMap = perAuthor.get(m.author) ?? new Map()
    perAuthor.set(m.author, authorMap)

    for (const t of tokens) {
      bump(totals, t)
      bump(authorMap, t)
    }

    // Bigrams, stopword-trimmed at the edges so "of the" never wins.
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i]
      const b = tokens[i + 1]
      if (isStopword(a) && isStopword(b)) continue
      bump(phrases, `${a} ${b}`)
    }

    bump(openers, tokens[0])
    bump(closers, tokens[tokens.length - 1])
  }

  const totalWordUses = [...totals.values()].reduce((t, n) => t + n, 0)

  const top: Counted[] = rank(totals, config.topN).map(([key, count]) => ({
    key,
    count,
    share: share(count, totalWordUses),
  }))

  const meaningful = new Map<string, number>()
  for (const [word, count] of totals) {
    if (!isStopword(word) && word.length > 2) meaningful.set(word, count)
  }

  const topMeaningful: Counted[] = rank(meaningful, config.topN).map(([key, count]) => ({
    key,
    count,
    share: share(count, totalWordUses),
  }))

  const topPhrases: Counted[] = rank(phrases, config.topN)
    .filter(([, count]) => count >= PHRASE_MIN_COUNT)
    .map(([key, count]) => ({ key, count, share: share(count, totalWordUses) }))

  const index = buildWordIndex(messages, meaningful, totals, totalWordUses)

  const longestMessages = [...messages]
    .filter((m) => !m.media && !m.deleted && m.wordCount > 0)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 5)
    .map((m) => ({
      author: m.author,
      at: m.at,
      words: m.wordCount,
      preview: preview(m.text, 220),
    }))

  return {
    totalTokens,
    uniqueWords: totals.size,
    top,
    topMeaningful,
    topPhrases,
    openers: rank(openers, 8).map(([key, count]) => ({
      key,
      count,
      share: share(count, messages.length),
    })),
    closers: rank(closers, 8).map(([key, count]) => ({
      key,
      count,
      share: share(count, messages.length),
    })),
    index,
    longestMessages,
  }
}

function buildWordIndex(
  messages: Message[],
  meaningful: Map<string, number>,
  totals: Map<string, number>,
  totalWordUses: number,
): Record<string, WordUsage> {
  const wanted = new Set(rank(meaningful, INDEX_SIZE).map(([w]) => w))
  if (!wanted.size) return {}

  const byAuthor = new Map<string, PerPerson<number>>()
  const firstAt = new Map<string, number>()
  const lastAt = new Map<string, number>()
  const overTime = new Map<string, Map<string, number>>()

  for (const m of messages) {
    if (!m.text || m.media || m.deleted) continue
    const tokens = tokenize(m.text)
    if (!tokens.length) continue
    const mk = monthKey(m.at)

    // Count each word once per message for first/last, but every use for totals.
    for (const t of tokens) {
      if (!wanted.has(t)) continue

      const authors = byAuthor.get(t) ?? {}
      authors[m.author] = (authors[m.author] ?? 0) + 1
      byAuthor.set(t, authors)

      if (!firstAt.has(t)) firstAt.set(t, m.at)
      lastAt.set(t, m.at)

      const months = overTime.get(t) ?? new Map<string, number>()
      bump(months, mk)
      overTime.set(t, months)
    }
  }

  const out: Record<string, WordUsage> = {}
  for (const word of wanted) {
    const authors = byAuthor.get(word) ?? {}
    const months = overTime.get(word) ?? new Map<string, number>()
    const monthList = [...months.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({
        key,
        label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
        count,
      }))

    const topAuthor =
      Object.entries(authors).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
    const peak = monthList.reduce<{ label: string; count: number } | null>(
      (best, m) => (!best || m.count > best.count ? m : best),
      null,
    )

    out[word] = {
      word,
      count: totals.get(word) ?? 0,
      share: share(totals.get(word) ?? 0, totalWordUses),
      byAuthor: authors,
      topAuthor,
      firstAt: firstAt.get(word) ?? 0,
      lastAt: lastAt.get(word) ?? 0,
      overTime: monthList,
      peakPeriod: peak?.label ?? '',
    }
  }

  return out
}

/**
 * Words this person uses far more than everyone else, by relative frequency
 * rather than raw count — otherwise the chattier participant owns every word.
 * Requires a floor of uses so a single typo doesn't read as a signature.
 */
export function distinctiveFor(
  authorCounts: Map<string, number>,
  otherCounts: Map<string, number>,
  limit: number,
  minCount = 4,
): Counted[] {
  const authorTotal = [...authorCounts.values()].reduce((t, n) => t + n, 0)
  const otherTotal = [...otherCounts.values()].reduce((t, n) => t + n, 0)
  if (!authorTotal) return []

  const scored: { key: string; count: number; score: number }[] = []

  for (const [word, count] of authorCounts) {
    if (count < minCount) continue
    if (isStopword(word) || word.length < 3) continue
    const mine = count / authorTotal
    // Add-one smoothing: a word nobody else used should score high, not divide
    // by zero.
    const theirs = ((otherCounts.get(word) ?? 0) + 1) / (otherTotal + 1)
    scored.push({ key: word, count, score: mine / theirs })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({ key: s.key, count: s.count, share: s.score }))
}

export function buildEmojis(
  messages: Message[],
  participants: string[],
  config: AnalyticsConfig,
): Analytics['emojis'] {
  const totals = new Map<string, number>()
  const byAuthor = new Map<string, PerPerson<number>>()
  const firstAt = new Map<string, number>()
  const overTime = new Map<string, Map<string, number>>()
  const combos = new Map<string, number>()
  const byHour = new Array(24).fill(0)
  const monthTotals = new Map<string, number>()

  let total = 0
  let messagesWithEmoji = 0

  for (const m of messages) {
    if (!m.emoji.length) continue
    messagesWithEmoji++
    const mk = monthKey(m.at)
    const hour = new Date(m.at).getHours()

    for (const e of m.emoji) {
      total++
      byHour[hour]++
      bump(totals, e)
      bump(monthTotals, mk)

      const authors = byAuthor.get(e) ?? {}
      authors[m.author] = (authors[m.author] ?? 0) + 1
      byAuthor.set(e, authors)

      if (!firstAt.has(e)) firstAt.set(e, m.at)

      const months = overTime.get(e) ?? new Map<string, number>()
      bump(months, mk)
      overTime.set(e, months)
    }

    // Repeated-emoji runs read as one gesture: "😂😂😂" is a combo.
    if (m.emoji.length >= 2) {
      const run = m.emoji.slice(0, 3).join('')
      bump(combos, run)
    }
  }

  const top: EmojiUsage[] = rank(totals, config.topN).map(([emoji, count]) => {
    const authors = byAuthor.get(emoji) ?? {}
    const months = overTime.get(emoji) ?? new Map<string, number>()
    return {
      emoji,
      count,
      share: share(count, total),
      byAuthor: authors,
      topAuthor: Object.entries(authors).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
      firstAt: firstAt.get(emoji) ?? 0,
      overTime: [...months.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, c]) => ({
          key,
          label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
          count: c,
        })),
    }
  })

  void participants
  void messagesWithEmoji

  return {
    total,
    perMessage: share(total, messages.length),
    unique: totals.size,
    top,
    combos: rank(combos, 8)
      .filter(([, c]) => c >= 3)
      .map(([key, count]) => ({ key, count, share: share(count, total) })),
    byHour,
    trend: [...monthTotals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({
        key,
        label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
        count,
      })),
    signature: top[0] ?? null,
  }
}

/** Per-author token maps, needed for distinctiveness scoring. */
export function tokenMapsByAuthor(
  messages: Message[],
  participants: string[],
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>()
  for (const p of participants) out.set(p, new Map())

  for (const m of messages) {
    if (!m.text || m.media || m.deleted) continue
    const map = out.get(m.author) ?? new Map<string, number>()
    out.set(m.author, map)
    for (const t of tokenize(m.text)) bump(map, t)
  }

  return out
}

export function emojiMapsByAuthor(
  messages: Message[],
  participants: string[],
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>()
  for (const p of participants) out.set(p, new Map())

  for (const m of messages) {
    if (!m.emoji.length) continue
    const map = out.get(m.author) ?? new Map<string, number>()
    out.set(m.author, map)
    for (const e of m.emoji) bump(map, e)
  }

  return out
}

export function mergeExcept(
  maps: Map<string, Map<string, number>>,
  exclude: string,
): Map<string, number> {
  const merged = new Map<string, number>()
  for (const [author, map] of maps) {
    if (author === exclude) continue
    for (const [k, v] of map) bump(merged, k, v)
  }
  return merged
}

export function preview(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
