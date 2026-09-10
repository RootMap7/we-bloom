import type { Message } from './parser/types'

/**
 * Selectors over the in-memory conversation.
 *
 * The analytics layer answers "how much" and "how often"; this answers "which
 * message", which the games, the word cloud and the throwback section all need.
 * Everything here is a pure read over the array the store holds in memory — no
 * persistence, and no rewriting of anyone's words.
 */

/** Deterministic PRNG, so a given seed always produces the same round. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pickSome<T>(items: T[], count: number, rand: () => number): T[] {
  return shuffle(items, rand).slice(0, count)
}

/** Strips emoji and whitespace, to test whether anything else was said. */
function withoutEmoji(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, '')
    .trim()
}

/** Messages with real words in them: no attachments, no deletions, no system lines. */
export function textMessages(messages: Message[]): Message[] {
  return messages.filter(
    (m) => !m.media && !m.deleted && m.wordCount > 0 && m.text.trim().length > 0,
  )
}

/**
 * Short, self-contained lines that read well out of context — the material for
 * "Who said it?". Very long messages are excluded because they are usually
 * identifiable by length alone, which makes the game trivial.
 */
export function quotableMessages(messages: Message[]): Message[] {
  return textMessages(messages).filter(
    (m) => m.wordCount >= 3 && m.wordCount <= 18 && m.charCount <= 140 && !m.links.length,
  )
}

/** Long enough that redacting the tail still leaves a readable run-up. */
export function completableMessages(messages: Message[]): Message[] {
  return textMessages(messages).filter((m) => m.wordCount >= 8 && m.wordCount <= 30)
}

/**
 * Messages sent in the small hours. PRODUCT.md §46 keeps sentiment analysis
 * out of scope, so "notable" here means unusually timed rather than
 * emotionally loaded — a claim the data can actually support.
 */
export function lateNightMessages(messages: Message[], fromHour = 1, toHour = 5): Message[] {
  return quotableMessages(messages).filter((m) => {
    const h = new Date(m.at).getHours()
    return h >= fromHour && h < toHour
  })
}

/** Messages that are nothing but emoji. */
export function emojiOnlyMessages(messages: Message[]): Message[] {
  return messages.filter(
    (m) =>
      !m.media &&
      !m.deleted &&
      m.emoji.length > 0 &&
      m.text.trim().length > 0 &&
      withoutEmoji(m.text) === '',
  )
}

/** The message immediately after this one, when someone else sent it. */
export function replyTo(messages: Message[], index: number): Message | null {
  const source = messages[index]
  if (!source) return null
  for (let i = index + 1; i < Math.min(messages.length, index + 6); i++) {
    const candidate = messages[i]
    if (candidate.author !== source.author && !candidate.media && !candidate.deleted) {
      return candidate.text.trim() ? candidate : null
    }
  }
  return null
}

export interface DatedMessage {
  message: Message
  /** Whole years between then and the reference date. */
  yearsAgo: number
}

/**
 * "On this day" — messages sent on the same calendar day in an earlier year.
 * Falls back to nothing rather than to an approximate date; §36 forbids
 * inventing a milestone that isn't there.
 */
export function onThisDay(messages: Message[], today = new Date()): DatedMessage[] {
  const month = today.getMonth()
  const day = today.getDate()
  const thisYear = today.getFullYear()

  return textMessages(messages)
    .filter((m) => {
      const d = new Date(m.at)
      return d.getMonth() === month && d.getDate() === day && d.getFullYear() < thisYear
    })
    .map((m) => ({ message: m, yearsAgo: thisYear - new Date(m.at).getFullYear() }))
}

export interface MemoryDay {
  items: DatedMessage[]
  /** True when these really are from today's calendar date. */
  exact: boolean
  /** How many days off today's date the fallback landed, 0 when exact. */
  daysOff: number
}

/**
 * Messages from today's date in an earlier year; failing that, the nearest
 * calendar day that has any.
 *
 * The window reaches most of the way round the year, because a chat that
 * stopped months ago should still surface something rather than an empty
 * section. How far it had to travel is reported back, so the UI can say
 * "nothing from today, here is the closest" instead of quietly passing off
 * another date as this one.
 */
export function nearestMemoryDay(messages: Message[], today = new Date()): MemoryDay {
  const direct = onThisDay(messages, today)
  if (direct.length) return { items: direct, exact: true, daysOff: 0 }

  const pool = textMessages(messages)
  if (!pool.length) return { items: [], exact: true, daysOff: 0 }

  for (let offset = 1; offset <= 182; offset++) {
    for (const sign of [-1, 1]) {
      const probe = new Date(today)
      probe.setDate(probe.getDate() + offset * sign)
      const hits = pool.filter((m) => {
        const d = new Date(m.at)
        return d.getMonth() === probe.getMonth() && d.getDate() === probe.getDate()
      })
      if (hits.length) {
        return {
          items: hits.map((m) => ({
            message: m,
            yearsAgo: today.getFullYear() - new Date(m.at).getFullYear(),
          })),
          exact: false,
          daysOff: offset,
        }
      }
    }
  }
  return { items: [], exact: true, daysOff: 0 }
}

export interface WordSnippet {
  author: string
  at: number
  text: string
}

/**
 * Messages containing a given word, for the word cloud. Whole-word matching, so
 * "love" does not drag in "glove".
 */
export function snippetsForWord(
  messages: Message[],
  word: string,
  limit = 8,
): WordSnippet[] {
  const needle = word.toLowerCase()
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}'])${escapeRegExp(needle)}(?:[^\\p{L}\\p{N}']|$)`, 'iu')

  const hits: WordSnippet[] = []
  for (const m of textMessages(messages)) {
    if (!pattern.test(m.text)) continue
    hits.push({ author: m.author, at: m.at, text: m.text })
    if (hits.length >= limit) break
  }
  return hits
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Runs of consecutive messages from the same person, for the badges. */
export function longestDoubleTextRun(messages: Message[]): { author: string; length: number } {
  let best = { author: '', length: 0 }
  let currentAuthor = ''
  let run = 0

  for (const m of messages) {
    if (m.author === currentAuthor) {
      run++
    } else {
      currentAuthor = m.author
      run = 1
    }
    if (run > best.length) best = { author: currentAuthor, length: run }
  }
  return best
}
