import type { Analytics, Insight } from './analytics/types'
import {
  changePhrase,
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
 * The insight layer reads the analytics object and nothing else — never raw
 * message text. That is what makes PRODUCT.md §23's "every insight is traceable
 * to available analytics" true by construction rather than by good intentions.
 *
 * `confidence` is surfaced in the UI so an interpretation never reads as an
 * observation. Nothing here diagnoses, and nothing here claims to know what
 * anyone felt.
 */

/** Below these thresholds an insight is noise, so it is not produced at all. */
const MIN_MESSAGES_FOR_TRENDS = 200
const MIN_SPAN_DAYS_FOR_TRENDS = 45
const MIN_CONVERSATIONS = 10

export function buildInsights(a: Analytics): Insight[] {
  const names = a.meta.participants
  const out: Insight[] = []
  const add = (i: Insight | null) => {
    if (i) out.push(i)
  }

  const enoughForTrends =
    a.meta.totalMessages >= MIN_MESSAGES_FOR_TRENDS &&
    a.meta.spanDays >= MIN_SPAN_DAYS_FOR_TRENDS

  // ── Communication style ────────────────────────────────────────────────
  const [top, second] = a.people
  if (top && second && a.conversations.total >= MIN_CONVERSATIONS) {
    const gap = top.messageShare - second.messageShare
    add({
      id: 'balance',
      category: 'communication-style',
      confidence: 'observation',
      headline:
        gap < 0.06
          ? 'You send almost exactly the same amount'
          : `${shortName(top.author, names)} sends more of the messages`,
      body:
        gap < 0.06
          ? `${shortName(top.author, names)} accounts for ${pct(top.messageShare)} and ${shortName(second.author, names)} for ${pct(second.messageShare)}. That's about as even as it gets.`
          : `${pct(top.messageShare)} of messages come from ${shortName(top.author, names)}, against ${pct(second.messageShare)} from ${shortName(second.author, names)}.`,
      basis: 'Message counts per participant.',
      evidence: { to: '/report/people', label: 'See the split' },
    })
  }

  const lengths = a.people.filter((p) => p.messages >= 20)
  if (lengths.length >= 2) {
    const sorted = [...lengths].sort((x, y) => y.wordsPerMessage - x.wordsPerMessage)
    const longer = sorted[0]
    const shorter = sorted[sorted.length - 1]
    if (longer.wordsPerMessage > shorter.wordsPerMessage * 1.35) {
      add({
        id: 'length-style',
        category: 'communication-style',
        confidence: 'observation',
        headline: `${shortName(longer.author, names)} writes longer messages`,
        body: `${longer.wordsPerMessage.toFixed(1)} words per message on average, against ${shorter.wordsPerMessage.toFixed(1)} from ${shortName(shorter.author, names)}.`,
        basis: 'Mean words per message, participants with 20+ messages.',
        evidence: { to: '/report/people', label: 'Compare people' },
      })
    }
  }

  const overall = a.responseTimes.overall
  if (overall.samples >= 30 && overall.medianMs !== null) {
    add({
      id: 'reply-speed',
      category: 'communication-style',
      confidence: 'observation',
      headline: `Half of all replies arrive within ${duration(overall.medianMs)}`,
      body: `Across ${num(overall.samples)} replies, the median is ${duration(overall.medianMs)} and nine in ten land inside ${duration(overall.p90Ms)}.`,
      basis: `Median reply gap, excluding gaps over ${duration(a.config.responseCapMs)}.`,
      evidence: { to: '/report/conversations', label: 'See response times' },
    })
  }

  // ── Conversation rhythm ────────────────────────────────────────────────
  if (a.activity.peakHour !== null && a.meta.totalMessages >= 100) {
    const hours = a.activity.byHour
    const total = hours.reduce((t, n) => t + n, 0)
    const peakShare = total ? hours[a.activity.peakHour] / total : 0
    add({
      id: 'peak-hour',
      category: 'conversation-rhythm',
      confidence: 'observation',
      headline: `${hourRange(a.activity.peakHour)} is your busiest hour`,
      body: `${pct(peakShare, 1)} of everything you've said landed in that one hour of the day.`,
      basis: 'Message counts bucketed by hour of day, local time.',
      evidence: { to: '/report/activity', label: 'See the heatmap' },
    })
  }

  if (a.meta.totalMessages >= 200) {
    const wd = a.activity.byWeekday
    const total = wd.reduce((t, n) => t + n, 0)
    const weekend = (wd[0] + wd[6]) / (total || 1)
    const expected = 2 / 7
    if (Math.abs(weekend - expected) > 0.07) {
      add({
        id: 'weekend-shape',
        category: 'conversation-rhythm',
        confidence: 'pattern',
        headline: weekend > expected ? 'Weekends carry the conversation' : 'This is a weekday conversation',
        body: `${pct(weekend)} of messages fall on Saturday or Sunday, against the ${pct(expected)} you'd expect if the week were flat. Your busiest single day is ${weekdayLabel(a.activity.peakWeekday)}.`,
        basis: 'Weekday distribution compared against a uniform week.',
        evidence: { to: '/report/activity', label: 'See weekday activity' },
      })
    }
  }

  const streak = a.streaks.longest
  if (streak && streak.days >= 5) {
    add({
      id: 'streak',
      category: 'conversation-rhythm',
      confidence: 'observation',
      headline: `${streak.days} days without a break`,
      body: `From ${dateShort(streak.startAt)} to ${dateShort(streak.endAt)} you spoke every single day — ${plural(streak.messages, 'message')} in that run.`,
      basis: 'Longest run of consecutive calendar days with at least one message.',
      evidence: { to: '/report/activity', label: 'See streaks' },
    })
  }

  const silence = a.silences.longest
  if (silence && silence.durationMs >= 3 * 86_400_000) {
    add({
      id: 'silence',
      category: 'conversation-rhythm',
      confidence: 'observation',
      headline: `Your longest quiet spell was ${duration(silence.durationMs, { long: true })}`,
      body: `Between ${dateShort(silence.startAt)} and ${dateShort(silence.endAt)}. ${shortName(silence.brokenBy, names)} spoke first when it ended.`,
      basis: 'Largest gap between consecutive messages.',
      evidence: { to: '/report/activity', label: 'See quiet periods' },
    })
  }

  // ── Shared language ────────────────────────────────────────────────────
  const sig = a.emojis.signature
  if (sig && sig.count >= 15) {
    add({
      id: 'signature-emoji',
      category: 'shared-language',
      confidence: 'observation',
      headline: `${sig.emoji} is your signature`,
      body: `Used ${num(sig.count)} times, ${pct(sig.share)} of every emoji in the chat. ${shortName(sig.topAuthor, names)} reaches for it most.`,
      basis: 'Emoji frequency counts.',
      evidence: { to: '/report/emojis', label: 'See emoji breakdown' },
    })
  }

  const phrase = a.words.topPhrases[0]
  if (phrase && phrase.count >= 8) {
    add({
      id: 'shared-phrase',
      category: 'shared-language',
      confidence: 'pattern',
      headline: `"${phrase.key}" keeps coming back`,
      body: `It appears ${num(phrase.count)} times — the most repeated two-word pairing in the whole conversation.`,
      basis: 'Bigram frequency, excluding pairs of common words.',
      evidence: { to: '/report/words', label: 'Explore words' },
    })
  }

  for (const person of a.people.slice(0, 2)) {
    const d = person.words_.distinctive[0]
    if (d && d.count >= 6) {
      add({
        id: `distinctive-${person.author}`,
        category: 'shared-language',
        confidence: 'pattern',
        headline: `"${d.key}" is a word that belongs to ${shortName(person.author, names)}`,
        body: `${shortName(person.author, names)} uses it ${num(d.count)} times, far more often than anyone else in the chat does, relative to how much each person writes.`,
        basis: 'Relative word frequency per participant, smoothed.',
        evidence: { to: '/report/people', label: 'See their words' },
      })
      break
    }
  }

  // ── Changes over time ──────────────────────────────────────────────────
  if (enoughForTrends) {
    const v = a.trends.volumeChange
    if (v !== null && Math.abs(v) >= 0.15) {
      add({
        id: 'volume-trend',
        category: 'changes-over-time',
        confidence: 'observation',
        headline: v > 0 ? 'You talk more now than you used to' : 'The conversation has slowed down',
        body: `Daily message volume is ${changePhrase(v)} in the second half of this chat compared to the first.`,
        basis: 'Messages per day, first half of the date range vs second.',
        evidence: { to: '/report/activity', label: 'See activity over time' },
      })
    }

    const r = a.trends.responseTimeChange
    if (r !== null && Math.abs(r) >= 0.2) {
      add({
        id: 'response-trend',
        category: 'changes-over-time',
        confidence: 'pattern',
        headline: r > 0 ? 'Replies take longer than they used to' : 'You reply faster than you used to',
        body: `Median response time is ${changePhrase(r)} across the life of the chat. Response time reflects availability and habit as much as anything else — it isn't a measure of interest.`,
        basis: 'Monthly median response times, early months vs later months.',
        evidence: { to: '/report/conversations', label: 'See the trend' },
      })
    }

    const l = a.trends.messageLengthChange
    if (l !== null && Math.abs(l) >= 0.2) {
      add({
        id: 'length-trend',
        category: 'changes-over-time',
        confidence: 'observation',
        headline: l > 0 ? 'Your messages have got longer' : 'Your messages have got shorter',
        body: `Average message length is ${changePhrase(l)} between the first and second halves of the conversation.`,
        basis: 'Mean words per message, first half vs second.',
        evidence: { to: '/report/words', label: 'See word stats' },
      })
    }

    for (const [author, delta] of Object.entries(a.trends.initiationChange)) {
      if (Math.abs(delta) >= 0.12) {
        add({
          id: `initiation-trend-${author}`,
          category: 'changes-over-time',
          confidence: 'pattern',
          headline: `${shortName(author, names)} ${delta > 0 ? 'starts more conversations than before' : 'starts fewer conversations than before'}`,
          body: `Their share of conversation openings moved by ${(Math.abs(delta) * 100).toFixed(0)} percentage points between the first and second halves.`,
          basis: 'Share of conversation-opening messages, split by date range.',
          evidence: { to: '/report/conversations', label: 'See who starts' },
        })
        break
      }
    }
  }

  // ── Interesting patterns ───────────────────────────────────────────────
  const spike = a.activity.spikes[0]
  if (spike) {
    add({
      id: 'spike',
      category: 'interesting-patterns',
      confidence: 'observation',
      headline: `Something happened on ${dateShort(spike.at)}`,
      body: `${plural(spike.messages, 'message')} that day — roughly ${spike.ratio.toFixed(1)} times the surrounding month. We can see the spike, not the reason for it.`,
      basis: 'Days more than two standard deviations above the trailing 30-day mean.',
      evidence: { to: '/report/activity', label: 'See the day' },
    })
  }

  const fastest = [...a.people]
    .filter((p) => p.responseTime?.samples >= 20 && p.responseTime.medianMs !== null)
    .sort((x, y) => (x.responseTime.medianMs as number) - (y.responseTime.medianMs as number))
  if (fastest.length >= 2) {
    const quick = fastest[0]
    const slow = fastest[fastest.length - 1]
    const ratio = (slow.responseTime.medianMs as number) / (quick.responseTime.medianMs as number)
    if (ratio >= 1.5) {
      add({
        id: 'reply-gap',
        category: 'interesting-patterns',
        confidence: 'observation',
        headline: `${shortName(quick.author, names)} replies about ${ratio.toFixed(1)}× faster`,
        body: `Median reply of ${duration(quick.responseTime.medianMs)} against ${duration(slow.responseTime.medianMs)}. Phones, jobs and time zones all live inside this number.`,
        basis: 'Median reply gap per participant, 20+ replies each.',
        evidence: { to: '/report/conversations', label: 'See response times' },
      })
    }
  }

  const night = a.activity.byHour.slice(0, 5).reduce((t, n) => t + n, 0)
  const nightShare = night / (a.meta.totalMessages || 1)
  if (nightShare > 0.1) {
    add({
      id: 'night-owls',
      category: 'interesting-patterns',
      confidence: 'observation',
      headline: `${pct(nightShare)} of your messages happen between midnight and 5 AM`,
      body: 'A meaningful slice of this conversation takes place while most people are asleep.',
      basis: 'Share of messages in hours 00:00–04:59, local time.',
      evidence: { to: '/report/activity', label: 'See the heatmap' },
    })
  }

  if (a.media.total >= 50) {
    const kind = a.media.byKind[0]
    add({
      id: 'media-habit',
      category: 'interesting-patterns',
      confidence: 'observation',
      headline: `${plural(a.media.total, 'attachment')} changed hands`,
      body: `${pct(a.media.share)} of all messages were media rather than text, most often ${kind.key}s.`,
      basis: 'Attachment placeholders counted from the export.',
      evidence: { to: '/report/media', label: 'See media' },
    })
  }

  return out
}

export const CONFIDENCE_COPY: Record<
  Insight['confidence'],
  { label: string; tooltip: string }
> = {
  observation: {
    label: 'Observed',
    tooltip: 'Counted directly from your export. This is what the data says.',
  },
  pattern: {
    label: 'Pattern',
    tooltip:
      'A statistical pattern across the whole conversation. Real in the data, but it may have a mundane explanation.',
  },
  interpretation: {
    label: 'Interpretation',
    tooltip:
      "A reading of the numbers, not a fact about the conversation. Treat it as a suggestion, not a conclusion.",
  },
}

export const CATEGORY_COPY: Record<Insight['category'], { label: string; blurb: string }> = {
  'communication-style': {
    label: 'Communication style',
    blurb: 'How each of you tends to write.',
  },
  'conversation-rhythm': {
    label: 'Conversation rhythm',
    blurb: 'When the conversation happens, and how steadily.',
  },
  'shared-language': {
    label: 'Shared language',
    blurb: 'The words and emoji that belong to this chat.',
  },
  'changes-over-time': {
    label: 'Changes over time',
    blurb: 'What looks different now compared to the start.',
  },
  'interesting-patterns': {
    label: 'Interesting patterns',
    blurb: 'The things that stood out from everything else.',
  },
}
