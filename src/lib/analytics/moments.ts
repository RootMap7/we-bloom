import { dateShort, duration, hourRange, num, plural, shortName } from '../format'
import type { Analytics, Moment } from './types'

/**
 * Moments are the scrapbook (PRODUCT.md §20) and the timeline (§21). Every one
 * is derived from a computed metric — nothing here is invented, and each keeps
 * a `source` so the UI can point at the chart behind it.
 */
export function buildMoments(a: Omit<Analytics, 'milestones' | 'timeline' | 'dna'>): {
  milestones: Moment[]
  timeline: Moment[]
} {
  const names = a.meta.participants
  const moments: Moment[] = []

  const push = (m: Moment | null) => {
    if (m) moments.push(m)
  }

  push({
    id: 'first-message',
    at: a.meta.firstAt,
    title: 'The first message',
    detail: `This is where the record starts — ${dateShort(a.meta.firstAt)}.`,
    source: 'overview',
  })

  const firstConversation = a.conversations.list[0]
  if (firstConversation && firstConversation.messages > 3) {
    push({
      id: 'first-conversation',
      at: firstConversation.startAt,
      title: 'The first real conversation',
      detail: `${plural(firstConversation.messages, 'message')} in one sitting, started by ${shortName(firstConversation.starter, names)}.`,
      source: 'conversations',
      stat: duration(firstConversation.durationMs),
    })
  }

  const longestConvo = a.conversations.longestByDuration
  if (longestConvo && longestConvo.durationMs > 30 * 60_000) {
    push({
      id: 'longest-conversation',
      at: longestConvo.startAt,
      title: 'The longest conversation',
      detail: `${duration(longestConvo.durationMs, { long: true })} of back and forth, ${plural(longestConvo.messages, 'message')} deep.`,
      source: 'conversations',
      stat: duration(longestConvo.durationMs),
    })
  }

  const busiest = a.activity.busiestDay
  if (busiest && busiest.messages > (a.meta.messagesPerActiveDay || 0) * 2) {
    push({
      id: 'busiest-day',
      at: busiest.at,
      title: 'The busiest day',
      detail: `${plural(busiest.messages, 'message')} in a single day — more than double a typical one.`,
      source: 'activity',
      stat: num(busiest.messages),
    })
  }

  const longestStreak = a.streaks.longest
  if (longestStreak && longestStreak.days >= 3) {
    push({
      id: 'longest-streak',
      at: longestStreak.startAt,
      title: 'The longest streak',
      detail: `${longestStreak.days} days in a row without a gap, ${plural(longestStreak.messages, 'message')} in total.`,
      source: 'activity',
      stat: `${longestStreak.days} days`,
    })
  }

  const longestSilence = a.silences.longest
  if (longestSilence) {
    push({
      id: 'longest-silence',
      at: longestSilence.startAt,
      title: 'The longest quiet spell',
      detail: `${duration(longestSilence.durationMs, { long: true })} between messages. ${shortName(longestSilence.brokenBy, names)} spoke first afterwards.`,
      source: 'activity',
      stat: duration(longestSilence.durationMs),
    })
  }

  const topSpike = a.activity.spikes[0]
  if (topSpike) {
    push({
      id: 'activity-spike',
      at: topSpike.at,
      title: 'A sudden spike',
      detail: `${plural(topSpike.messages, 'message')} — about ${topSpike.ratio.toFixed(1)}× the surrounding weeks.`,
      source: 'activity',
      stat: `${topSpike.ratio.toFixed(1)}×`,
    })
  }

  const signature = a.emojis.signature
  if (signature && signature.count >= 10) {
    push({
      id: 'signature-emoji',
      at: signature.firstAt,
      title: `The first ${signature.emoji}`,
      detail: `It would go on to appear ${num(signature.count)} times — your most-used emoji by a distance.`,
      source: 'emojis',
      stat: signature.emoji,
    })
  }

  const topWord = a.words.topMeaningful[0]
  const wordEntry = topWord ? a.words.index[topWord.key] : undefined
  if (wordEntry && wordEntry.firstAt) {
    push({
      id: 'signature-word',
      at: wordEntry.firstAt,
      title: `The first "${wordEntry.word}"`,
      detail: `Used ${num(wordEntry.count)} times since, mostly by ${shortName(wordEntry.topAuthor, names)}.`,
      source: 'words',
      stat: `${num(wordEntry.count)}×`,
    })
  }

  const longestMessage = a.words.longestMessages[0]
  if (longestMessage && longestMessage.words > 60) {
    push({
      id: 'longest-message',
      at: longestMessage.at,
      title: 'The longest single message',
      detail: `${plural(longestMessage.words, 'word')} from ${shortName(longestMessage.author, names)} in one go.`,
      source: 'words',
      stat: `${num(longestMessage.words)} words`,
    })
  }

  push({
    id: 'last-message',
    at: a.meta.lastAt,
    title: 'The most recent message',
    detail: `${dateShort(a.meta.lastAt)} — where this export stops.`,
    source: 'overview',
  })

  const timeline = [...moments].sort((x, y) => x.at - y.at)

  // The scrapbook leads with the superlatives; the timeline stays chronological.
  const priority = [
    'longest-streak',
    'longest-conversation',
    'busiest-day',
    'signature-emoji',
    'signature-word',
    'longest-silence',
    'activity-spike',
    'longest-message',
    'first-conversation',
    'first-message',
    'last-message',
  ]
  const milestones = [...moments].sort(
    (x, y) => priority.indexOf(x.id) - priority.indexOf(y.id),
  )

  return { milestones, timeline }
}

/** Used by the rhythm copy in several places, so it lives with the moments. */
export function rhythmPhrase(peakHour: number | null): string {
  if (peakHour === null) return 'Your rhythm is spread evenly across the day.'
  if (peakHour >= 23 || peakHour < 4) return `You come alive after dark — ${hourRange(peakHour)} is your busiest window.`
  if (peakHour < 9) return `You're early risers — ${hourRange(peakHour)} is when you talk most.`
  if (peakHour < 12) return `Mornings are yours — ${hourRange(peakHour)} is the busiest stretch.`
  if (peakHour < 17) return `You're an afternoon conversation — ${hourRange(peakHour)} tops the chart.`
  return `Evenings are your time — ${hourRange(peakHour)} is the busiest window.`
}
