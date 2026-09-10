import { duration, hourRange, pct } from '../format'
import { mean, stdev } from './math'
import type { Analytics, Dna, DnaDimension } from './types'

/**
 * Relationship DNA — PRODUCT.md §26/§27.
 *
 * Every score is a deterministic function of computed analytics, and every one
 * carries the sentence describing how it was derived. Nothing here is an
 * opinion, and nothing here is a psychological claim: the archetype is a label
 * for a communication pattern, shown with an explicit disclaimer in the UI.
 */
export function buildDna(a: Omit<Analytics, 'dna'>): Dna {
  const dimensions: DnaDimension[] = [
    rhythmScore(a),
    initiationBalance(a),
    responseStyle(a),
    messageLength(a),
    emojiEnergy(a),
    topicDiversity(a),
    consistency(a),
    activityTiming(a),
  ]

  const { archetype, blurb } = pickArchetype(a, dimensions)
  return { archetype, blurb, dimensions }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** Messages per active day, mapped so ~60/day sits near the top of the scale. */
function rhythmScore(a: Omit<Analytics, 'dna'>): DnaDimension {
  const perDay = a.meta.messagesPerActiveDay
  const score = clamp((Math.log10(Math.max(perDay, 1)) / Math.log10(80)) * 100)
  return {
    key: 'rhythm',
    label: 'Conversation rhythm',
    score,
    basis: `${perDay.toFixed(1)} messages on a typical active day.`,
  }
}

/** 100 = perfectly even split of who says hello first. */
function initiationBalance(a: Omit<Analytics, 'dna'>): DnaDimension {
  const shares = a.conversations.initiation.shares
  const top = shares[0]?.share ?? 0.5
  const evenShare = 1 / Math.max(a.meta.participants.length, 2)
  const skew = Math.abs(top - evenShare) / (1 - evenShare)
  return {
    key: 'initiation',
    label: 'Initiation balance',
    score: clamp((1 - skew) * 100),
    basis: shares[0]
      ? `${shares[0].key} starts ${pct(shares[0].share)} of conversations.`
      : 'Not enough conversations to measure.',
  }
}

/** Faster median reply → higher score. 1 minute ≈ 100, 2 hours ≈ 0. */
function responseStyle(a: Omit<Analytics, 'dna'>): DnaDimension {
  const med = a.responseTimes.overall.medianMs
  if (med === null) {
    return {
      key: 'response',
      label: 'Response style',
      score: 0,
      basis: 'Not enough replies to measure.',
    }
  }
  const minutes = med / 60_000
  const score = clamp(100 - (Math.log10(Math.max(minutes, 0.5)) / Math.log10(120)) * 100)
  return {
    key: 'response',
    label: 'Response style',
    score,
    basis: `Median reply lands in ${duration(med)}.`,
  }
}

/** Words per message, where ~40 words is a long-form conversation. */
function messageLength(a: Omit<Analytics, 'dna'>): DnaDimension {
  const wpm = a.meta.totalMessages ? a.meta.totalWords / a.meta.totalMessages : 0
  return {
    key: 'length',
    label: 'Message length',
    score: clamp((wpm / 40) * 100),
    basis: `${wpm.toFixed(1)} words in an average message.`,
  }
}

/** Emoji per message, where 1.5 per message is maximum energy. */
function emojiEnergy(a: Omit<Analytics, 'dna'>): DnaDimension {
  const per = a.emojis.perMessage
  return {
    key: 'emoji',
    label: 'Emoji energy',
    score: clamp((per / 1.5) * 100),
    basis: `${per.toFixed(2)} emoji per message across ${a.emojis.unique} distinct ones.`,
  }
}

/**
 * Vocabulary breadth via type–token ratio, normalised for length — a longer
 * chat mechanically repeats more, so raw unique-word count would just measure
 * size. Not a claim about what you talk about, only how varied the wording is.
 */
function topicDiversity(a: Omit<Analytics, 'dna'>): DnaDimension {
  const tokens = a.words.totalTokens
  const unique = a.words.uniqueWords
  if (tokens < 100) {
    return {
      key: 'diversity',
      label: 'Vocabulary range',
      score: 0,
      basis: 'Not enough words yet to measure range.',
    }
  }
  // Root TTR keeps the measure stable as the corpus grows.
  const rttr = unique / Math.sqrt(tokens)
  return {
    key: 'diversity',
    label: 'Vocabulary range',
    score: clamp((rttr / 25) * 100),
    basis: `${unique.toLocaleString('en-GB')} distinct words across ${tokens.toLocaleString('en-GB')} used.`,
  }
}

/** How evenly messages spread across the calendar. Low variance → high score. */
function consistency(a: Omit<Analytics, 'dna'>): DnaDimension {
  const daily = a.activity.byDay.map((d) => d.messages)
  if (daily.length < 7) {
    return {
      key: 'consistency',
      label: 'Consistency',
      score: 0,
      basis: 'Needs at least a week of history.',
    }
  }
  const m = mean(daily) ?? 0
  const cv = m > 0 ? stdev(daily) / m : 2
  const coverage = a.meta.spanDays > 0 ? a.meta.activeDays / a.meta.spanDays : 0
  // Two halves: how often you talk at all, and how steady the volume is.
  const score = clamp((coverage * 0.6 + Math.max(0, 1 - cv / 2) * 0.4) * 100)
  return {
    key: 'consistency',
    label: 'Consistency',
    score,
    basis: `Active on ${a.meta.activeDays} of ${a.meta.spanDays} days.`,
  }
}

/** How concentrated activity is in a few hours, rather than spread out. */
function activityTiming(a: Omit<Analytics, 'dna'>): DnaDimension {
  const hours = a.activity.byHour
  const total = hours.reduce((t, n) => t + n, 0)
  if (!total) {
    return { key: 'timing', label: 'Timing focus', score: 0, basis: 'No activity recorded.' }
  }
  const sorted = [...hours].sort((x, y) => y - x)
  const topFour = sorted.slice(0, 4).reduce((t, n) => t + n, 0) / total
  // 4/24 hours = 16.7% would be perfectly flat.
  const focus = (topFour - 4 / 24) / (1 - 4 / 24)
  return {
    key: 'timing',
    label: 'Timing focus',
    score: clamp(focus * 100),
    basis: `${pct(topFour)} of messages land in just four hours of the day.`,
  }
}

function pickArchetype(
  a: Omit<Analytics, 'dna'>,
  dims: DnaDimension[],
): { archetype: string; blurb: string } {
  const by = (key: string) => dims.find((d) => d.key === key)?.score ?? 0
  const peak = a.activity.peakHour

  const nocturnal = peak !== null && (peak >= 22 || peak < 4)
  const morning = peak !== null && peak >= 5 && peak < 10

  if (nocturnal && by('rhythm') > 55) {
    return {
      archetype: 'The Late-Night Bloom',
      blurb: `You come alive when everyone else is asleep. ${hourRange(peak)} is your busiest window, and the volume holds up night after night.`,
    }
  }
  if (by('response') > 70 && by('rhythm') > 60) {
    return {
      archetype: 'The Rapid Fire',
      blurb: `Short gaps, high volume. Your median reply lands in ${duration(a.responseTimes.overall.medianMs)}, and the conversation rarely sits still.`,
    }
  }
  if (by('length') > 60) {
    return {
      archetype: 'The Long Letter',
      blurb: 'You write in paragraphs, not pings. Fewer messages, more in each one.',
    }
  }
  if (by('consistency') > 65) {
    return {
      archetype: 'The Steady Signal',
      blurb: `Active on ${a.meta.activeDays} of ${a.meta.spanDays} days. Not the loudest chat — the most reliable one.`,
    }
  }
  if (by('emoji') > 60) {
    return {
      archetype: 'The Emoji Fluent',
      blurb: `${a.emojis.unique} distinct emoji and counting. A lot of what you say isn't in words at all.`,
    }
  }
  if (morning) {
    return {
      archetype: 'The Early Signal',
      blurb: `Your conversation starts before most people's day does — ${hourRange(peak)} is the busiest stretch.`,
    }
  }
  if (by('initiation') < 35) {
    const leader = a.conversations.initiation.shares[0]
    return {
      archetype: 'The One Who Calls',
      blurb: leader
        ? `${leader.key} opens ${pct(leader.share)} of conversations. One of you tends to make the first move.`
        : 'One of you tends to make the first move.',
    }
  }

  return {
    archetype: 'The Slow Burn',
    blurb: 'No single pattern dominates. Your conversation shows up in bursts, on its own schedule.',
  }
}
