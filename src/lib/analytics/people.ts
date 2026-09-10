import type { MediaKind, Message } from '../parser/types'
import { argmax, bump, rank, share } from './math'
import {
  distinctiveFor,
  emojiMapsByAuthor,
  mergeExcept,
  preview,
  tokenMapsByAuthor,
} from './language'
import { isStopword } from './stopwords'
import type {
  Analytics,
  AnalyticsConfig,
  Counted,
  PerPerson,
  PersonStats,
  ResponseStats,
} from './types'

export function buildPeople(
  messages: Message[],
  participants: string[],
  config: AnalyticsConfig,
  responses: PerPerson<ResponseStats>,
  initiation: PerPerson<number>,
  totalConversations: number,
): PersonStats[] {
  const tokenMaps = tokenMapsByAuthor(messages, participants)
  const emojiMaps = emojiMapsByAuthor(messages, participants)

  const base = new Map<string, MutableStats>()
  for (const p of participants) base.set(p, blank(p))

  for (const m of messages) {
    const s = base.get(m.author) ?? blank(m.author)
    base.set(m.author, s)

    s.messages++
    s.words += m.wordCount
    s.chars += m.charCount
    s.links += m.links.length
    s.emojiTotal += m.emoji.length
    if (m.deleted) s.deleted++
    if (m.media) {
      s.mediaTotal++
      bump(s.mediaKinds, m.media)
    }

    const d = new Date(m.at)
    s.byHour[d.getHours()]++
    s.byWeekday[d.getDay()]++

    if (!m.media && !m.deleted && m.charCount > (s.longest?.chars ?? 0)) {
      s.longest = {
        chars: m.charCount,
        words: m.wordCount,
        at: m.at,
        preview: preview(m.text, 200),
      }
    }
  }

  const totalMessages = messages.length

  return participants.map((author) => {
    const s = base.get(author) ?? blank(author)
    const myTokens = tokenMaps.get(author) ?? new Map()
    const otherTokens = mergeExcept(tokenMaps, author)
    const myEmoji = emojiMaps.get(author) ?? new Map()
    const otherEmoji = mergeExcept(emojiMaps, author)

    const emojiTop: Counted[] = rank(myEmoji, 8).map(([key, count]) => ({
      key,
      count,
      share: share(count, s.emojiTotal),
    }))

    const wordTop: Counted[] = rank(filterMeaningful(myTokens), 10).map(([key, count]) => ({
      key,
      count,
      share: share(count, s.words),
    }))

    return {
      author,
      messages: s.messages,
      messageShare: share(s.messages, totalMessages),
      words: s.words,
      wordsPerMessage: share(s.words, s.messages),
      chars: s.chars,
      charsPerMessage: share(s.chars, s.messages),
      longestMessage: s.longest,
      conversationsStarted: initiation[author] ?? 0,
      initiationShare: share(initiation[author] ?? 0, totalConversations),
      responseTime: responses[author],
      emoji: {
        total: s.emojiTotal,
        perMessage: share(s.emojiTotal, s.messages),
        top: emojiTop,
        distinctive: distinctiveFor(myEmoji, otherEmoji, 5, 3),
      },
      words_: {
        unique: myTokens.size,
        top: wordTop,
        distinctive: distinctiveFor(myTokens, otherTokens, 8, config.topN >= 12 ? 4 : 3),
      },
      media: {
        total: s.mediaTotal,
        byKind: rank(s.mediaKinds, 10).map(([key, count]) => ({
          key,
          count,
          share: share(count, s.mediaTotal),
        })),
      },
      links: s.links,
      deleted: s.deleted,
      byHour: s.byHour,
      byWeekday: s.byWeekday,
      peakHour: argmax(s.byHour),
      peakWeekday: argmax(s.byWeekday),
    }
  })
}

interface MutableStats {
  author: string
  messages: number
  words: number
  chars: number
  links: number
  deleted: number
  emojiTotal: number
  mediaTotal: number
  mediaKinds: Map<MediaKind, number>
  byHour: number[]
  byWeekday: number[]
  longest: PersonStats['longestMessage']
}

function blank(author: string): MutableStats {
  return {
    author,
    messages: 0,
    words: 0,
    chars: 0,
    links: 0,
    deleted: 0,
    emojiTotal: 0,
    mediaTotal: 0,
    mediaKinds: new Map(),
    byHour: new Array(24).fill(0),
    byWeekday: new Array(7).fill(0),
    longest: null,
  }
}

function filterMeaningful(map: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>()
  for (const [word, count] of map) {
    if (word.length > 2 && !isCommon(word)) out.set(word, count)
  }
  return out
}

function isCommon(word: string): boolean {
  return isStopword(word)
}

export type { Analytics }
