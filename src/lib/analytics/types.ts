import type { MediaKind } from '../parser/types'

export interface AnalyticsConfig {
  /**
   * Silence after which the next message starts a new conversation.
   * PRODUCT.md §9 — configurable, lives here so every module agrees.
   */
  conversationGapMs: number
  /** A day counts toward a streak if it has at least this many messages. */
  streakMinMessages: number
  /** Gaps at or above this are surfaced as "silences". */
  silenceMinMs: number
  /** Replies slower than this are excluded from response-time averages. */
  responseCapMs: number
  topN: number
}

export const DEFAULT_CONFIG: AnalyticsConfig = {
  conversationGapMs: 4 * 60 * 60 * 1000,
  streakMinMessages: 1,
  silenceMinMs: 24 * 60 * 60 * 1000,
  // A 12h+ "reply" is a new conversation, not a slow response. Including it
  // would let one overnight gap dominate an average.
  responseCapMs: 12 * 60 * 60 * 1000,
  topN: 12,
}

export interface Counted<T = string> {
  key: T
  count: number
  share: number
}

export interface PerPerson<T> {
  [author: string]: T
}

export interface PersonStats {
  author: string
  messages: number
  messageShare: number
  words: number
  wordsPerMessage: number
  chars: number
  charsPerMessage: number
  longestMessage: { chars: number; words: number; at: number; preview: string } | null
  conversationsStarted: number
  initiationShare: number
  responseTime: ResponseStats
  emoji: { total: number; perMessage: number; top: Counted[]; distinctive: Counted[] }
  words_: { unique: number; top: Counted[]; distinctive: Counted[] }
  media: { total: number; byKind: Counted<MediaKind>[] }
  links: number
  deleted: number
  /** Messages by hour, 24 buckets. */
  byHour: number[]
  /** Messages by weekday, Sunday-first, 7 buckets. */
  byWeekday: number[]
  peakHour: number | null
  peakWeekday: number | null
}

export interface ResponseStats {
  /** Number of replies that fed these numbers. */
  samples: number
  meanMs: number | null
  medianMs: number | null
  p90Ms: number | null
  fastestMs: number | null
  slowestMs: number | null
  /** Median response time per hour of day; null where no samples. */
  byHour: (number | null)[]
  /** Median response time per weekday; null where no samples. */
  byWeekday: (number | null)[]
  /** Histogram over log-ish buckets, for the distribution chart. */
  distribution: { label: string; upperMs: number; count: number }[]
}

export interface DayBucket {
  /** Local date, YYYY-MM-DD. */
  date: string
  at: number
  messages: number
  words: number
  perPerson: PerPerson<number>
}

export interface PeriodBucket {
  key: string
  label: string
  at: number
  messages: number
  words: number
  perPerson: PerPerson<number>
}

export interface Conversation {
  index: number
  startAt: number
  endAt: number
  durationMs: number
  messages: number
  starter: string
  /** Author of the last message in the conversation. */
  ender: string
  perPerson: PerPerson<number>
  opener: string
}

export interface Streak {
  startAt: number
  endAt: number
  days: number
  messages: number
}

export interface Silence {
  startAt: number
  endAt: number
  durationMs: number
  /** Who spoke last before the silence, and who broke it. */
  lastSpeaker: string
  brokenBy: string
}

export interface Moment {
  id: string
  at: number
  title: string
  detail: string
  /** Which analytics section this came from, for the "see the chart" link. */
  source: string
  stat?: string
}

export interface WordUsage {
  word: string
  count: number
  share: number
  byAuthor: PerPerson<number>
  topAuthor: string
  firstAt: number
  lastAt: number
  /** Monthly counts for the sparkline. */
  overTime: { key: string; label: string; count: number }[]
  peakPeriod: string
}

export interface EmojiUsage {
  emoji: string
  count: number
  share: number
  byAuthor: PerPerson<number>
  topAuthor: string
  firstAt: number
  overTime: { key: string; label: string; count: number }[]
}

export interface DnaDimension {
  key: string
  label: string
  score: number
  /** Plain-language statement of how the score was derived. */
  basis: string
}

export interface Dna {
  archetype: string
  blurb: string
  dimensions: DnaDimension[]
}

export type InsightConfidence = 'observation' | 'pattern' | 'interpretation'

export interface Insight {
  id: string
  category:
    | 'communication-style'
    | 'conversation-rhythm'
    | 'shared-language'
    | 'changes-over-time'
    | 'interesting-patterns'
  /** PRODUCT.md §3.2 / §23 — every insight declares what kind of claim it is. */
  confidence: InsightConfidence
  headline: string
  body: string
  /** The metric this was computed from. Nothing is shown without one. */
  basis: string
  /** Route + section to jump to the supporting chart. */
  evidence?: { to: string; label: string }
}

export interface WrappedSlideData {
  id: string
  kind: 'title' | 'stat' | 'person' | 'emoji' | 'word' | 'rhythm' | 'insight' | 'outro'
  eyebrow?: string
  headline: string
  value?: string
  sub?: string
  detail?: string
  accent: 'clay' | 'honey' | 'sage' | 'dusk' | 'ink'
}

export interface Analytics {
  config: AnalyticsConfig
  meta: {
    participants: string[]
    isGroup: boolean
    totalMessages: number
    totalWords: number
    totalChars: number
    firstAt: number
    lastAt: number
    spanDays: number
    activeDays: number
    messagesPerActiveDay: number
    messagesPerSpanDay: number
    deletedMessages: number
    systemEvents: number
  }
  people: PersonStats[]
  activity: {
    byDay: DayBucket[]
    byWeek: PeriodBucket[]
    byMonth: PeriodBucket[]
    byYear: PeriodBucket[]
    byHour: number[]
    byWeekday: number[]
    /** 7 × 24 grid, [weekday][hour]. */
    heatmap: number[][]
    heatmapMax: number
    busiestDay: DayBucket | null
    quietestActiveDay: DayBucket | null
    peakHour: number | null
    peakWeekday: number | null
    /** Days whose volume is >2σ above the trailing mean. */
    spikes: { date: string; at: number; messages: number; ratio: number }[]
  }
  responseTimes: {
    overall: ResponseStats
    perPerson: PerPerson<ResponseStats>
    /** Median response time per month, for the trend chart. */
    trend: { key: string; label: string; medianMs: number | null }[]
  }
  conversations: {
    list: Conversation[]
    total: number
    averageMessages: number
    averageDurationMs: number
    longestByDuration: Conversation | null
    longestByMessages: Conversation | null
    initiation: {
      perPerson: PerPerson<number>
      shares: Counted[]
      byHour: PerPerson<number[]>
      byWeekday: PerPerson<number[]>
      /** Initiation share per month, per person. */
      trend: { key: string; label: string; perPerson: PerPerson<number> }[]
      commonOpeners: Counted[]
    }
    endings: PerPerson<number>
  }
  streaks: {
    longest: Streak | null
    current: Streak | null
    all: Streak[]
    count: number
    averageDays: number
  }
  silences: {
    longest: Silence | null
    top: Silence[]
    averageGapMs: number
    /** Mean gap per month — is the conversation loosening or tightening? */
    trend: { key: string; label: string; meanGapMs: number | null }[]
  }
  words: {
    totalTokens: number
    uniqueWords: number
    top: Counted[]
    topMeaningful: Counted[]
    topPhrases: Counted[]
    openers: Counted[]
    closers: Counted[]
    /** Index for the word explorer. Capped to keep memory sane. */
    index: Record<string, WordUsage>
    longestMessages: { author: string; at: number; words: number; preview: string }[]
  }
  emojis: {
    total: number
    perMessage: number
    unique: number
    top: EmojiUsage[]
    combos: Counted[]
    byHour: number[]
    trend: { key: string; label: string; count: number }[]
    signature: EmojiUsage | null
  }
  media: {
    total: number
    share: number
    byKind: Counted<MediaKind>[]
    perPerson: PerPerson<number>
    trend: { key: string; label: string; count: number }[]
    voiceNotes: {
      total: number
      perPerson: PerPerson<number>
      shares: Counted[]
      trend: { key: string; label: string; count: number }[]
    }
  }
  links: {
    total: number
    perPerson: PerPerson<number>
    domains: Counted[]
    trend: { key: string; label: string; count: number }[]
  }
  milestones: Moment[]
  timeline: Moment[]
  dna: Dna
  trends: {
    /** Positive = later half is higher. Fractions, not percentages. */
    volumeChange: number | null
    responseTimeChange: number | null
    messageLengthChange: number | null
    initiationChange: PerPerson<number>
  }
}
