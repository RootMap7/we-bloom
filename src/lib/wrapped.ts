import type { Analytics, WrappedSlideData } from './analytics/types'
import type { Insight } from './analytics/types'
import { dateShort, duration, hourLabel, hourRange, num, pct, plural, shortName } from './format'

/**
 * Chat Wrapped — PRODUCT.md §28.
 *
 * Slides are suppressed rather than zero-filled when the data behind them is
 * thin, so a two-week chat produces a short honest deck instead of a long
 * embarrassing one. §36: never fabricate a statistic to fill a slot.
 */
export function buildWrapped(a: Analytics, insights: Insight[]): WrappedSlideData[] {
  const names = a.meta.participants
  const slides: WrappedSlideData[] = []

  slides.push({
    id: 'title',
    kind: 'title',
    headline: 'Your conversation, wrapped.',
    sub: `${dateShort(a.meta.firstAt)} — ${dateShort(a.meta.lastAt)}`,
    accent: 'clay',
  })

  slides.push({
    id: 'messages',
    kind: 'stat',
    eyebrow: 'You said a lot',
    headline: `${num(a.meta.totalMessages)}`,
    value: num(a.meta.totalMessages),
    sub: 'messages',
    detail: `That's ${num(a.meta.totalWords)} words between you.`,
    accent: 'clay',
  })

  slides.push({
    id: 'days',
    kind: 'stat',
    eyebrow: 'Across',
    headline: `${num(a.meta.activeDays)}`,
    value: num(a.meta.activeDays),
    sub: a.meta.activeDays === 1 ? 'day of talking' : 'days of talking',
    detail: `Out of ${num(a.meta.spanDays)} days in total — about ${a.meta.messagesPerActiveDay.toFixed(0)} messages on a day you spoke.`,
    accent: 'honey',
  })

  if (a.activity.peakHour !== null && a.meta.totalMessages >= 60) {
    slides.push({
      id: 'peak-hour',
      kind: 'rhythm',
      eyebrow: 'Your busiest hour?',
      headline: hourLabel(a.activity.peakHour),
      sub: hourRange(a.activity.peakHour),
      detail: `${pct(a.activity.byHour[a.activity.peakHour] / a.meta.totalMessages, 1)} of everything you've said landed in that hour.`,
      accent: 'dusk',
    })
  }

  const starter = a.conversations.initiation.shares[0]
  if (starter && a.conversations.total >= 10 && starter.share > 0.5) {
    slides.push({
      id: 'starter',
      kind: 'person',
      eyebrow: 'Who says hello first?',
      headline: shortName(starter.key, names),
      value: pct(starter.share),
      sub: `of ${num(a.conversations.total)} conversations`,
      accent: 'sage',
    })
  }

  const sig = a.emojis.signature
  if (sig && sig.count >= 10) {
    slides.push({
      id: 'emoji',
      kind: 'emoji',
      eyebrow: 'Your signature emoji',
      headline: sig.emoji,
      value: `${num(sig.count)}×`,
      sub: `${pct(sig.share)} of every emoji you sent`,
      detail: `${shortName(sig.topAuthor, names)} reaches for it most.`,
      accent: 'honey',
    })
  }

  const streak = a.streaks.longest
  if (streak && streak.days >= 3) {
    slides.push({
      id: 'streak',
      kind: 'stat',
      eyebrow: 'Your longest streak',
      headline: `${streak.days}`,
      value: `${streak.days}`,
      sub: streak.days === 1 ? 'day' : 'days in a row',
      detail: `${dateShort(streak.startAt)} — ${dateShort(streak.endAt)}. ${plural(streak.messages, 'message')} without missing a day.`,
      accent: 'clay',
    })
  }

  const convo = a.conversations.longestByDuration
  if (convo && convo.durationMs >= 45 * 60_000) {
    slides.push({
      id: 'longest-conversation',
      kind: 'stat',
      eyebrow: 'Your longest conversation',
      headline: duration(convo.durationMs),
      sub: `${plural(convo.messages, 'message')}, without a real break`,
      detail: `${dateShort(convo.startAt)}, started by ${shortName(convo.starter, names)}.`,
      accent: 'dusk',
    })
  }

  const word = a.words.topMeaningful[0]
  if (word && word.count >= 15) {
    const entry = a.words.index[word.key]
    slides.push({
      id: 'word',
      kind: 'word',
      eyebrow: 'Your most-used word',
      headline: `"${word.key}"`,
      value: `${num(word.count)}×`,
      sub: entry?.topAuthor ? `mostly ${shortName(entry.topAuthor, names)}` : undefined,
      detail: entry?.peakPeriod ? `Peaked in ${entry.peakPeriod}.` : undefined,
      accent: 'sage',
    })
  }

  const silence = a.silences.longest
  if (silence && silence.durationMs >= 3 * 86_400_000) {
    slides.push({
      id: 'silence',
      kind: 'stat',
      eyebrow: 'Your longest quiet spell',
      headline: duration(silence.durationMs),
      sub: 'between messages',
      detail: `${shortName(silence.brokenBy, names)} spoke first when it ended.`,
      accent: 'ink',
    })
  }

  if (a.responseTimes.overall.medianMs !== null && a.responseTimes.overall.samples >= 25) {
    slides.push({
      id: 'reply',
      kind: 'stat',
      eyebrow: 'You usually reply in',
      headline: duration(a.responseTimes.overall.medianMs),
      sub: 'half the time, faster than that',
      detail: `Measured across ${num(a.responseTimes.overall.samples)} replies.`,
      accent: 'honey',
    })
  }

  if (a.media.total >= 25) {
    slides.push({
      id: 'media',
      kind: 'stat',
      eyebrow: 'And you sent',
      headline: num(a.media.total),
      sub: 'photos, videos and voice notes',
      detail: a.media.byKind[0]
        ? `Mostly ${a.media.byKind[0].key}s — ${num(a.media.byKind[0].count)} of them.`
        : undefined,
      accent: 'dusk',
    })
  }

  slides.push({
    id: 'dna',
    kind: 'rhythm',
    eyebrow: 'Your conversation rhythm',
    headline: a.dna.archetype,
    detail: a.dna.blurb,
    accent: 'clay',
  })

  // "One thing the data noticed" — the strongest observation we actually have.
  const noticed =
    insights.find((i) => i.category === 'interesting-patterns' && i.confidence === 'observation') ??
    insights.find((i) => i.confidence === 'observation')
  if (noticed) {
    slides.push({
      id: 'noticed',
      kind: 'insight',
      eyebrow: 'One thing the data noticed',
      headline: noticed.headline,
      detail: noticed.body,
      accent: 'sage',
    })
  }

  slides.push({
    id: 'outro',
    kind: 'outro',
    headline: 'Some conversations are just numbers.',
    sub: 'This one became a story.',
    accent: 'clay',
  })

  return slides
}
