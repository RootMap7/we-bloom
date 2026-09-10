import type { Analytics } from './analytics/types'
import {
  dateShort,
  duration,
  hourRange,
  num,
  pct,
  plural,
  shortName,
  weekdayLabel,
} from './format'

/**
 * Ask Your Chat — PRODUCT.md §24.
 *
 * This answers from the analytics object, in the browser. It matches a question
 * against a set of known intents and formats the corresponding metric. It does
 * not read raw messages, and it does not generate text it cannot back up: an
 * unmatched question, or a matched one with too little data behind it, returns
 * the honest "I don't have enough data" answer rather than a guess.
 */

export interface Answer {
  text: string
  /** The metric this came from, shown under the answer. */
  basis?: string
  evidence?: { to: string; label: string }
  /** True when we declined to answer. */
  unresolved?: boolean
}

interface Intent {
  id: string
  /** All must appear (as substrings of the normalised question). */
  all?: string[]
  /** At least one must appear. */
  any: string[]
  /** None may appear. */
  not?: string[]
  answer: (a: Analytics) => Answer | null
}

const NO_ANSWER: Answer = {
  text: "I don't have enough data to answer that.",
  unresolved: true,
}

const UNKNOWN: Answer = {
  text: "I can't answer that one. I only know what's in the numbers from your export — try asking about messages, timing, replies, words, emoji or media.",
  unresolved: true,
}

export function askYourChat(question: string, a: Analytics): Answer {
  const q = normalise(question)
  if (!q) return UNKNOWN

  for (const intent of INTENTS) {
    if (intent.not?.some((n) => q.includes(n))) continue
    if (intent.all && !intent.all.every((t) => q.includes(t))) continue
    if (!intent.any.some((t) => q.includes(t))) continue
    return intent.answer(a) ?? NO_ANSWER
  }

  return UNKNOWN
}

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const INTENTS: Intent[] = [
  {
    id: 'who-talks-more',
    any: ['who talks more', 'who talks the most', 'who sends more', 'who writes more', 'talks more', 'sends the most'],
    // "Who sends more media?" also contains "who sends more" — let the media,
    // emoji and link intents further down claim those.
    not: ['media', 'photo', 'video', 'voice', 'link', 'emoji', 'attachment'],
    answer: (a) => {
      const [top, second] = a.people
      if (!top || !second) return null
      const names = a.meta.participants
      if (Math.abs(top.messageShare - second.messageShare) < 0.03) {
        return {
          text: `It's basically even. ${shortName(top.author, names)} sent ${pct(top.messageShare)} of messages and ${shortName(second.author, names)} sent ${pct(second.messageShare)}.`,
          basis: 'Message counts per participant.',
          evidence: { to: '/report/people', label: 'See the split' },
        }
      }
      return {
        text: `${shortName(top.author, names)} — ${pct(top.messageShare)} of all messages (${num(top.messages)}), against ${pct(second.messageShare)} from ${shortName(second.author, names)}.`,
        basis: 'Message counts per participant.',
        evidence: { to: '/report/people', label: 'See the split' },
      }
    },
  },
  {
    id: 'who-starts',
    any: ['who starts', 'who usually starts', 'who initiates', 'says hello first', 'who begins', 'first move'],
    answer: (a) => {
      const shares = a.conversations.initiation.shares
      if (!shares.length || a.conversations.total < 5) return null
      const names = a.meta.participants
      return {
        text: `${shortName(shares[0].key, names)} — they open ${pct(shares[0].share)} of your ${num(a.conversations.total)} conversations.`,
        basis: `First message after a gap of ${duration(a.config.conversationGapMs)} or more.`,
        evidence: { to: '/report/conversations', label: 'See who starts' },
      }
    },
  },
  {
    id: 'who-ends',
    any: ['who ends', 'who has the last word', 'last word', 'who finishes'],
    answer: (a) => {
      const entries = Object.entries(a.conversations.endings).sort((x, y) => y[1] - x[1])
      if (!entries.length || a.conversations.total < 5) return null
      const names = a.meta.participants
      const total = entries.reduce((t, [, n]) => t + n, 0)
      return {
        text: `${shortName(entries[0][0], names)} — they send the final message in ${pct(entries[0][1] / total)} of conversations.`,
        basis: 'Last message before each conversation gap.',
        evidence: { to: '/report/conversations', label: 'See conversations' },
      }
    },
  },
  {
    id: 'when-most-active',
    any: ['when do we talk', 'when are we most active', 'most active', 'busiest hour', 'busiest time', 'what time', 'when do you talk'],
    not: ['day of the week', 'weekday'],
    answer: (a) => {
      if (a.activity.peakHour === null) return null
      return {
        text: `${hourRange(a.activity.peakHour)}, and ${weekdayLabel(a.activity.peakWeekday)} is your busiest day of the week.`,
        basis: 'Messages bucketed by hour and weekday, local time.',
        evidence: { to: '/report/activity', label: 'See the heatmap' },
      }
    },
  },
  {
    id: 'busiest-day',
    any: ['busiest day', 'most messages in a day', 'biggest day'],
    answer: (a) => {
      const d = a.activity.busiestDay
      if (!d) return null
      return {
        text: `${dateShort(d.at)} — ${plural(d.messages, 'message')} in one day.`,
        basis: 'Daily message totals.',
        evidence: { to: '/report/activity', label: 'See activity' },
      }
    },
  },
  {
    id: 'longest-conversation',
    all: ['longest'],
    any: ['conversation', 'chat session', 'session'],
    answer: (a) => {
      const c = a.conversations.longestByDuration
      if (!c) return null
      const names = a.meta.participants
      return {
        text: `${duration(c.durationMs, { long: true })} on ${dateShort(c.startAt)} — ${plural(c.messages, 'message')}, started by ${shortName(c.starter, names)}.`,
        basis: `Continuous stretch with no gap longer than ${duration(a.config.conversationGapMs)}.`,
        evidence: { to: '/report/conversations', label: 'See conversations' },
      }
    },
  },
  {
    id: 'longest-streak',
    all: ['longest'],
    any: ['streak', 'run', 'days in a row'],
    answer: (a) => {
      const s = a.streaks.longest
      if (!s) return null
      return {
        text: `${s.days} days in a row, from ${dateShort(s.startAt)} to ${dateShort(s.endAt)} — ${plural(s.messages, 'message')} across that run.`,
        basis: 'Consecutive calendar days with at least one message.',
        evidence: { to: '/report/activity', label: 'See streaks' },
      }
    },
  },
  {
    id: 'longest-silence',
    any: ['longest silence', 'longest gap', 'quiet spell', 'quietest', 'longest pause', 'ghosted'],
    answer: (a) => {
      const s = a.silences.longest
      if (!s) return null
      const names = a.meta.participants
      return {
        text: `${duration(s.durationMs, { long: true })}, between ${dateShort(s.startAt)} and ${dateShort(s.endAt)}. ${shortName(s.brokenBy, names)} broke it.`,
        basis: 'Largest gap between consecutive messages.',
        evidence: { to: '/report/activity', label: 'See quiet periods' },
      }
    },
  },
  {
    id: 'who-replies-faster',
    any: ['replies faster', 'reply faster', 'responds faster', 'who is faster', 'quicker to reply', 'who replies quicker'],
    answer: (a) => {
      const eligible = a.people.filter(
        (p) => p.responseTime?.samples >= 10 && p.responseTime.medianMs !== null,
      )
      if (eligible.length < 2) return null
      const sorted = [...eligible].sort(
        (x, y) => (x.responseTime.medianMs as number) - (y.responseTime.medianMs as number),
      )
      const names = a.meta.participants
      const quick = sorted[0]
      const slow = sorted[sorted.length - 1]

      // Naming a winner when the two medians round to the same string reads as
      // a finding when it isn't one.
      if ((slow.responseTime.medianMs as number) / (quick.responseTime.medianMs as number) < 1.15) {
        return {
          text: `Neither, really — ${shortName(quick.author, names)} and ${shortName(slow.author, names)} both sit around ${duration(quick.responseTime.medianMs)}.`,
          basis: 'Median gap before a reply, per participant.',
          evidence: { to: '/report/conversations', label: 'See response times' },
        }
      }

      return {
        text: `${shortName(quick.author, names)} — median reply of ${duration(quick.responseTime.medianMs)}, against ${duration(slow.responseTime.medianMs)} from ${shortName(slow.author, names)}. Worth saying: this measures availability, not interest.`,
        basis: 'Median gap before a reply, per participant.',
        evidence: { to: '/report/conversations', label: 'See response times' },
      }
    },
  },
  {
    id: 'response-time',
    any: ['response time', 'how fast do we reply', 'how quickly', 'average reply'],
    answer: (a) => {
      const r = a.responseTimes.overall
      if (r.medianMs === null) return null
      return {
        text: `Half of all replies land within ${duration(r.medianMs)}, and nine in ten within ${duration(r.p90Ms)}.`,
        basis: `${num(r.samples)} replies, excluding gaps over ${duration(a.config.responseCapMs)}.`,
        evidence: { to: '/report/conversations', label: 'See the distribution' },
      }
    },
  },
  {
    id: 'most-used-word',
    any: ['most used word', 'most common word', 'favourite word', 'favorite word', 'top word', 'what word'],
    // "What words are unique to each of us?" contains "what word"; that is a
    // different question, answered by the intent below.
    not: ['unique', 'distinctive', 'only i', 'only you'],
    answer: (a) => {
      const w = a.words.topMeaningful[0]
      if (!w) return null
      const entry = a.words.index[w.key]
      const names = a.meta.participants
      const who = entry?.topAuthor ? `, mostly from ${shortName(entry.topAuthor, names)}` : ''
      return {
        text: `"${w.key}" — used ${num(w.count)} times${who}.`,
        basis: 'Word frequency with common words filtered out.',
        evidence: { to: '/report/words', label: 'Explore words' },
      }
    },
  },
  {
    id: 'unique-words',
    any: ['unique to each', 'distinctive word', 'words only', 'signature word'],
    answer: (a) => {
      const lines = a.people
        .filter((p) => p.words_.distinctive.length)
        .slice(0, 3)
        .map((p) => `${shortName(p.author, a.meta.participants)}: "${p.words_.distinctive[0].key}"`)
      if (!lines.length) return null
      return {
        text: `${lines.join(' · ')}. These are words each person uses far more than the others do, relative to how much they write.`,
        basis: 'Relative word frequency per participant.',
        evidence: { to: '/report/people', label: 'See each person' },
      }
    },
  },
  {
    id: 'most-used-emoji',
    any: ['most used emoji', 'favourite emoji', 'favorite emoji', 'top emoji', 'which emoji', 'signature emoji', 'emoji defines'],
    not: ['who uses the most'],
    answer: (a) => {
      const e = a.emojis.signature
      if (!e) return null
      const names = a.meta.participants
      return {
        text: `${e.emoji} — ${num(e.count)} uses, ${pct(e.share)} of every emoji in the chat. ${shortName(e.topAuthor, names)} uses it most.`,
        basis: 'Emoji frequency counts.',
        evidence: { to: '/report/emojis', label: 'See emoji' },
      }
    },
  },
  {
    id: 'who-uses-most-emoji',
    any: ['who uses the most emoji', 'most emojis', 'who uses more emoji', 'emoji the most'],
    answer: (a) => {
      const sorted = [...a.people].filter((p) => p.messages >= 20).sort((x, y) => y.emoji.perMessage - x.emoji.perMessage)
      if (sorted.length < 2) return null
      const names = a.meta.participants
      return {
        text: `${shortName(sorted[0].author, names)} — ${sorted[0].emoji.perMessage.toFixed(2)} emoji per message, against ${sorted[sorted.length - 1].emoji.perMessage.toFixed(2)} from ${shortName(sorted[sorted.length - 1].author, names)}.`,
        basis: 'Emoji per message, participants with 20+ messages.',
        evidence: { to: '/report/emojis', label: 'See emoji' },
      }
    },
  },
  {
    id: 'who-sends-media',
    any: ['sends more media', 'sends the most media', 'more photos', 'most photos', 'who sends photos', 'more voice notes'],
    answer: (a) => {
      const entries = Object.entries(a.media.perPerson).sort((x, y) => y[1] - x[1])
      if (!entries.length || a.media.total < 10) return null
      const names = a.meta.participants
      return {
        text: `${shortName(entries[0][0], names)} — ${plural(entries[0][1], 'attachment')} of ${num(a.media.total)} in total.`,
        basis: 'Attachment placeholders counted per participant.',
        evidence: { to: '/report/media', label: 'See media' },
      }
    },
  },
  {
    id: 'total-messages',
    any: ['how many messages', 'total messages', 'message count', 'how much have we said'],
    answer: (a) => ({
      text: `${plural(a.meta.totalMessages, 'message')} across ${plural(a.meta.activeDays, 'active day')}, from ${dateShort(a.meta.firstAt)} to ${dateShort(a.meta.lastAt)}.`,
      basis: 'Totals from your export.',
      evidence: { to: '/report', label: 'See the overview' },
    }),
  },
  {
    id: 'what-changed',
    any: ['what changed', 'changed over time', 'different now', 'how has it changed'],
    answer: (a) => {
      const parts: string[] = []
      if (a.trends.volumeChange !== null && Math.abs(a.trends.volumeChange) >= 0.1) {
        parts.push(
          `daily volume is ${a.trends.volumeChange > 0 ? 'up' : 'down'} ${pct(Math.abs(a.trends.volumeChange))}`,
        )
      }
      if (a.trends.messageLengthChange !== null && Math.abs(a.trends.messageLengthChange) >= 0.1) {
        parts.push(
          `messages are ${a.trends.messageLengthChange > 0 ? 'longer' : 'shorter'} by ${pct(Math.abs(a.trends.messageLengthChange))}`,
        )
      }
      if (a.trends.responseTimeChange !== null && Math.abs(a.trends.responseTimeChange) >= 0.15) {
        parts.push(
          `replies take ${a.trends.responseTimeChange > 0 ? 'longer' : 'less time'} by ${pct(Math.abs(a.trends.responseTimeChange))}`,
        )
      }
      if (!parts.length) return null
      return {
        text: `Comparing the second half of this chat to the first: ${parts.join(', ')}.`,
        basis: 'First half vs second half of the date range.',
        evidence: { to: '/report/insights', label: 'See all insights' },
      }
    },
  },
  {
    id: 'interesting-pattern',
    any: ['interesting pattern', 'anything interesting', 'what surprised', 'notice anything', 'most interesting'],
    answer: (a) => {
      const spike = a.activity.spikes[0]
      if (spike) {
        return {
          text: `${dateShort(spike.at)} stands out — ${plural(spike.messages, 'message')}, about ${spike.ratio.toFixed(1)}× the surrounding month. The data shows the spike; it can't tell you what caused it.`,
          basis: 'Days more than two standard deviations above the trailing mean.',
          evidence: { to: '/report/insights', label: 'See all insights' },
        }
      }
      const night = a.activity.byHour.slice(0, 5).reduce((t, n) => t + n, 0) / (a.meta.totalMessages || 1)
      if (night > 0.08) {
        return {
          text: `${pct(night)} of your messages happen between midnight and 5 AM.`,
          basis: 'Share of messages in hours 00:00–04:59.',
          evidence: { to: '/report/activity', label: 'See the heatmap' },
        }
      }
      return null
    },
  },
  {
    id: 'communication-style',
    any: ['communication style', 'what are we like', 'describe us', 'our style', 'relationship dna'],
    answer: (a) => ({
      text: `${a.dna.archetype}. ${a.dna.blurb} This is a label for a pattern in the numbers — it's for fun and reflection, not an assessment of anyone.`,
      basis: a.dna.dimensions.map((d) => `${d.label} ${d.score}`).join(' · '),
      evidence: { to: '/report/insights', label: 'See the DNA' },
    }),
  },
]

/** PRODUCT.md §25 — the suggested prompts, grouped. */
export const SUGGESTED_QUESTIONS: { group: string; questions: string[] }[] = [
  {
    group: 'About us',
    questions: [
      'Who talks more?',
      'Who starts conversations?',
      "What's our communication style?",
      'When do we talk most?',
    ],
  },
  {
    group: 'The numbers',
    questions: [
      "What's our longest conversation?",
      "What's our longest streak?",
      "What's our longest silence?",
      'Who replies faster?',
    ],
  },
  {
    group: 'The language',
    questions: [
      "What's our most-used word?",
      'Which emoji defines us?',
      'Who uses the most emojis?',
      'What words are unique to each of us?',
    ],
  },
  {
    group: 'Discoveries',
    questions: [
      'What changed over time?',
      "What's the most interesting pattern?",
      'Who sends more media?',
    ],
  },
]
