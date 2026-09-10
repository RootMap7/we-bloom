import type { Analytics } from './analytics/types'
import { duration, num, pct, shortName } from './format'
import { longestDoubleTextRun } from './messages'
import type { Message } from './parser/types'

/**
 * Badges — a playful reading of the same numbers as everywhere else.
 *
 * Each badge states the threshold it was tested against, so an unearned one
 * explains itself instead of just being greyed out. Nothing here is a comment
 * on the relationship: PRODUCT.md §47 rules that out, so every badge describes
 * a measurable habit and stops there.
 */

export interface Achievement {
  id: string
  title: string
  icon: string
  /** What the badge is for, in plain language. */
  description: string
  earned: boolean
  /** The measurement behind the verdict, earned or not. */
  detail: string
}

export function buildAchievements(a: Analytics, messages: Message[]): Achievement[] {
  const names = a.meta.participants
  const display = (author: string) => shortName(author, names)
  const out: Achievement[] = []

  const total = a.meta.totalMessages || 1

  // ── Timing ────────────────────────────────────────────────────────────
  const smallHours = a.activity.byHour.slice(0, 5).reduce((t, n) => t + n, 0)
  const nightShare = smallHours / total
  out.push({
    id: 'night-owl',
    title: 'Night Owl',
    icon: '☾',
    description: 'A tenth of the conversation happens between midnight and 5 AM.',
    earned: nightShare >= 0.1,
    detail: `${pct(nightShare)} of messages land in those hours — ${num(smallHours)} of them.`,
  })

  const dawn = a.activity.byHour.slice(5, 9).reduce((t, n) => t + n, 0)
  out.push({
    id: 'early-bird',
    title: 'Early Bird',
    icon: '☀',
    description: 'At least a tenth of it happens between 5 and 9 in the morning.',
    earned: dawn / total >= 0.1,
    detail: `${pct(dawn / total)} of messages arrive before 9 AM.`,
  })

  // ── Habits ────────────────────────────────────────────────────────────
  const run = messages.length ? longestDoubleTextRun(messages) : { author: '', length: 0 }
  out.push({
    id: 'double-texter',
    title: 'Double Texter',
    icon: '⇉',
    description: 'Five or more messages in a row, without waiting for a reply.',
    earned: run.length >= 5,
    detail: run.length
      ? `${display(run.author)} once sent ${run.length} in a row.`
      : 'Needs the conversation in memory — re-upload the export to check this one.',
  })

  const median = a.responseTimes.overall.medianMs
  out.push({
    id: 'speed-demon',
    title: 'Speed Demon',
    icon: '⚡',
    description: 'Half of all replies arrive inside two minutes.',
    earned: median !== null && median <= 2 * 60_000,
    detail:
      median === null
        ? 'Not enough replies to measure.'
        : `Median reply is ${duration(median)}, across ${num(a.responseTimes.overall.samples)} replies.`,
  })

  const longest = a.conversations.longestByDuration
  out.push({
    id: 'marathon',
    title: 'Marathon Talkers',
    icon: '∞',
    description: 'One conversation ran for more than three hours straight.',
    earned: Boolean(longest && longest.durationMs >= 3 * 3_600_000),
    detail: longest
      ? `Longest was ${duration(longest.durationMs)} — ${num(longest.messages)} messages.`
      : 'No conversation long enough to measure.',
  })

  const streak = a.streaks.longest
  out.push({
    id: 'streak-keeper',
    title: 'Streak Keeper',
    icon: '▦',
    description: 'A week or more without missing a single day.',
    earned: Boolean(streak && streak.days >= 7),
    detail: streak
      ? `Longest run was ${streak.days} days.`
      : 'No multi-day run yet.',
  })

  out.push({
    id: 'never-quiet',
    title: 'Never Quiet',
    icon: '◉',
    description: 'The longest silence in the whole chat is under two days.',
    earned: Boolean(
      a.silences.longest && a.silences.longest.durationMs < 2 * 86_400_000,
    ),
    detail: a.silences.longest
      ? `Longest gap was ${duration(a.silences.longest.durationMs)}.`
      : 'Never a full day without talking.',
  })

  // ── Style ─────────────────────────────────────────────────────────────
  out.push({
    id: 'emoji-enthusiast',
    title: 'Emoji Enthusiast',
    icon: '☺',
    description: 'More than one emoji for every four messages.',
    earned: a.emojis.perMessage >= 0.25,
    detail: `${a.emojis.perMessage.toFixed(2)} emoji per message — ${num(a.emojis.total)} in total.`,
  })

  const wordsPerMessage = a.meta.totalWords / total
  out.push({
    id: 'wordsmith',
    title: 'Wordsmith',
    icon: '❝',
    description: 'Messages average more than ten words each.',
    earned: wordsPerMessage >= 10,
    detail: `${wordsPerMessage.toFixed(1)} words per message on average.`,
  })

  const longestMessage = a.words.longestMessages[0]
  out.push({
    id: 'essayist',
    title: 'Essayist',
    icon: '▤',
    description: 'Somebody once sent more than 150 words in a single message.',
    earned: Boolean(longestMessage && longestMessage.words >= 150),
    detail: longestMessage
      ? `${display(longestMessage.author)} once sent ${num(longestMessage.words)} words at once.`
      : 'No long messages in this export.',
  })

  // ── Media ─────────────────────────────────────────────────────────────
  out.push({
    id: 'voice-noter',
    title: 'Voice Noter',
    icon: '◴',
    description: 'Twenty or more voice notes exchanged.',
    earned: a.media.voiceNotes.total >= 20,
    detail: `${num(a.media.voiceNotes.total)} voice notes sent between you.`,
  })

  out.push({
    id: 'link-sharer',
    title: 'Link Sharer',
    icon: '⚯',
    description: 'Fifty or more links shared.',
    earned: a.links.total >= 50,
    detail: a.links.domains[0]
      ? `${num(a.links.total)} links, most often from ${a.links.domains[0].key}.`
      : `${num(a.links.total)} links shared.`,
  })

  out.push({
    id: 'shutterbug',
    title: 'Shutterbug',
    icon: '▣',
    description: 'A hundred or more photos and videos.',
    earned: a.media.total >= 100,
    detail: `${num(a.media.total)} attachments changed hands.`,
  })

  return out
}

export function earnedCount(list: Achievement[]): number {
  return list.filter((b) => b.earned).length
}
