import type { Message, ParseResult } from '../parser/types'
import { buildActivity, countActiveDays } from './activity'
import { buildLinks, buildMedia } from './attachments'
import { buildConversations, buildSilences, buildStreaks } from './conversations'
import { buildDna } from './dna'
import { buildEmojis, buildWords } from './language'
import { changeRatio, mean } from './math'
import { buildMoments } from './moments'
import { buildPeople } from './people'
import {
  buildResponseStats,
  collectReplies,
  perPersonResponses,
  responseTrend,
} from './response'
import { DAY_MS } from './time'
import { DEFAULT_CONFIG, type Analytics, type AnalyticsConfig, type PerPerson } from './types'

export * from './types'
export { DEFAULT_CONFIG } from './types'
export { MEDIA_LABELS } from './attachments'
export { rhythmPhrase } from './moments'

/**
 * The single place analytics are computed. Every screen reads from the object
 * this returns — PRODUCT.md §6 forbids components recomputing their own.
 */
export function buildAnalytics(
  parsed: ParseResult,
  overrides?: Partial<AnalyticsConfig>,
  onProgress?: (fraction: number, label: string) => void,
): Analytics {
  const config: AnalyticsConfig = { ...DEFAULT_CONFIG, ...overrides }
  const { messages, participants } = parsed

  const step = (fraction: number, label: string) => onProgress?.(fraction, label)

  step(0.05, 'Following the conversation…')
  const meta = buildMeta(parsed, config)

  step(0.2, 'Reading the rhythm…')
  const activity = buildActivity(messages, participants)
  meta.activeDays = countActiveDays(activity.byDay)
  meta.messagesPerActiveDay = meta.activeDays ? meta.totalMessages / meta.activeDays : 0

  step(0.35, 'Timing the replies…')
  const replies = collectReplies(messages, config)
  const responseTimes = {
    overall: buildResponseStats(replies),
    perPerson: perPersonResponses(replies, participants),
    trend: responseTrend(replies),
  }

  step(0.5, 'Finding where each conversation begins…')
  const conversations = buildConversations(messages, participants, config)
  const streaks = buildStreaks(activity.byDay, config)
  const silences = buildSilences(messages, config)

  step(0.65, 'Counting all those 😂…')
  const emojis = buildEmojis(messages, participants, config)

  step(0.75, 'Looking for the words you keep coming back to…')
  const words = buildWords(messages, participants, config)

  step(0.85, 'Sorting the photos and voice notes…')
  const media = buildMedia(messages, participants)
  const links = buildLinks(messages, participants)

  step(0.9, 'Comparing everyone…')
  const people = buildPeople(
    messages,
    participants,
    config,
    responseTimes.perPerson,
    conversations.initiation.perPerson,
    conversations.total,
  )

  step(0.95, 'Looking for the moments that stand out…')
  const trends = buildTrends(messages, conversations, responseTimes, participants)

  const partial = {
    config,
    meta,
    people,
    activity,
    responseTimes,
    conversations,
    streaks,
    silences,
    words,
    emojis,
    media,
    links,
    trends,
  }

  const { milestones, timeline } = buildMoments(partial)
  const dna = buildDna({ ...partial, milestones, timeline })

  step(1, 'Your conversation is blooming…')

  return { ...partial, milestones, timeline, dna }
}

function buildMeta(parsed: ParseResult, _config: AnalyticsConfig): Analytics['meta'] {
  const { messages, participants } = parsed
  const firstAt = messages[0].at
  const lastAt = messages[messages.length - 1].at

  let totalWords = 0
  let totalChars = 0
  let deleted = 0
  for (const m of messages) {
    totalWords += m.wordCount
    totalChars += m.charCount
    if (m.deleted) deleted++
  }

  const spanDays = Math.max(1, Math.round((lastAt - firstAt) / DAY_MS) + 1)

  return {
    participants,
    isGroup: participants.length > 2,
    totalMessages: messages.length,
    totalWords,
    totalChars,
    firstAt,
    lastAt,
    spanDays,
    activeDays: 0, // filled once activity is built
    messagesPerActiveDay: 0,
    messagesPerSpanDay: messages.length / spanDays,
    deletedMessages: deleted,
    systemEvents: parsed.system.length,
  }
}

/**
 * First half vs second half of the chat's lifetime. Split by time rather than
 * by message count, so "we talked more later" shows up as a change rather than
 * being normalised away.
 */
function buildTrends(
  messages: Message[],
  conversations: Analytics['conversations'],
  responseTimes: Analytics['responseTimes'],
  participants: string[],
): Analytics['trends'] {
  const first = messages[0].at
  const last = messages[messages.length - 1].at
  const mid = first + (last - first) / 2

  const early = messages.filter((m) => m.at < mid)
  const late = messages.filter((m) => m.at >= mid)

  const halfSpanDays = Math.max(1, (last - first) / 2 / DAY_MS)
  const volumeChange = changeRatio(early.length / halfSpanDays, late.length / halfSpanDays)

  const lengthChange = changeRatio(
    mean(early.filter((m) => m.wordCount > 0).map((m) => m.wordCount)),
    mean(late.filter((m) => m.wordCount > 0).map((m) => m.wordCount)),
  )

  const trend = responseTimes.trend.filter((t) => t.medianMs !== null)
  const half = Math.floor(trend.length / 2)
  const responseTimeChange =
    trend.length >= 4
      ? changeRatio(
          mean(trend.slice(0, half).map((t) => t.medianMs as number)),
          mean(trend.slice(half).map((t) => t.medianMs as number)),
        )
      : null

  const initiationChange: PerPerson<number> = {}
  const convosEarly = conversations.list.filter((c) => c.startAt < mid)
  const convosLate = conversations.list.filter((c) => c.startAt >= mid)
  for (const p of participants) {
    const e = convosEarly.length
      ? convosEarly.filter((c) => c.starter === p).length / convosEarly.length
      : null
    const l = convosLate.length
      ? convosLate.filter((c) => c.starter === p).length / convosLate.length
      : null
    // Percentage-point difference, not a ratio — shares are already normalised.
    initiationChange[p] = e !== null && l !== null ? l - e : 0
  }

  return { volumeChange, responseTimeChange, messageLengthChange: lengthChange, initiationChange }
}
