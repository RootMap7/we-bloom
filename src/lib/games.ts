import type { Analytics } from './analytics/types'
import { WEEKDAY_FULL } from './analytics/time'
import { dateTime, hourLabel } from './format'
import {
  completableMessages,
  emojiOnlyMessages,
  lateNightMessages,
  pickSome,
  quotableMessages,
  replyTo,
  rng,
  shuffle,
} from './messages'
import type { Message } from './parser/types'

/**
 * Trivia rounds built from the conversation.
 *
 * Every question is answerable from the export, and every answer is revealed
 * with the date it came from. Nothing here judges a message as funny or
 * meaningful: PRODUCT.md §46 keeps sentiment out of scope, so "notable" is
 * defined by measurable things — an odd hour, a repeated word, an emoji-only
 * line.
 *
 * All four modes are multiple choice, so they share one question shape and one
 * player component rather than four near-copies.
 */

export type GameMode =
  | 'who-said-it'
  | 'finish-the-sentence'
  | 'guess-the-context'
  | 'emoji-decryption'

export interface Choice {
  id: string
  label: string
}

export interface Question {
  id: string
  mode: GameMode
  /** The line the player is being asked about. */
  prompt: string
  /** Optional framing above the prompt. */
  eyebrow?: string
  choices: Choice[]
  answerId: string
  /** Shown once answered — always the provenance of the real answer. */
  reveal: string
}

export interface ModeSpec {
  mode: GameMode
  title: string
  blurb: string
  /** Seconds per question, or null for untimed. */
  seconds: number | null
  icon: string
}

export const MODES: ModeSpec[] = [
  {
    mode: 'who-said-it',
    title: 'Who said it?',
    blurb: 'Rapid fire. A line appears, you pick who sent it. Ten seconds each.',
    seconds: 10,
    icon: '◐',
  },
  {
    mode: 'finish-the-sentence',
    title: 'Finish the sentence',
    blurb: 'The tail of a real message is missing. Pick the ending that actually happened.',
    seconds: null,
    icon: '❝',
  },
  {
    mode: 'guess-the-context',
    title: 'Guess the context',
    blurb: 'Something said in the small hours. Work out when it happened, and who said it.',
    seconds: null,
    icon: '◴',
  },
  {
    mode: 'emoji-decryption',
    title: 'Emoji decryption',
    blurb: 'A message with no words in it. Guess what the reply to it was.',
    seconds: null,
    icon: '☺',
  },
]

export const PASS_MARK = 0.8

const QUESTIONS_PER_ROUND = 8

/** Redacts the last few words, keeping the run-up. */
function redactTail(text: string, tailWords: number): { prefix: string; tail: string } | null {
  const words = text.trim().split(/\s+/)
  if (words.length <= tailWords + 3) return null
  return {
    prefix: words.slice(0, words.length - tailWords).join(' '),
    tail: words.slice(words.length - tailWords).join(' '),
  }
}

function contextLabel(at: number, author: string, display: (a: string) => string): string {
  const d = new Date(at)
  return `${hourLabel(d.getHours())} on a ${WEEKDAY_FULL[d.getDay()]}, from ${display(author)}`
}

export interface RoundInput {
  messages: Message[]
  analytics: Analytics
  display: (author: string) => string
  seed?: number
}

export function buildRound(mode: GameMode, input: RoundInput): Question[] {
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31)
  const rand = rng(seed)

  switch (mode) {
    case 'who-said-it':
      return whoSaidIt(input, rand)
    case 'finish-the-sentence':
      return finishTheSentence(input, rand)
    case 'guess-the-context':
      return guessTheContext(input, rand)
    case 'emoji-decryption':
      return emojiDecryption(input, rand)
  }
}

/**
 * How many questions each mode can actually produce.
 *
 * Deliberately builds a round rather than measuring the raw pool: a chat can
 * have hundreds of long messages that are all the same sentence, which yields
 * no usable multiple choice at all. Counting the pool would light up a Play
 * button that then does nothing.
 */
export function roundAvailability(input: RoundInput): Record<GameMode, number> {
  const count = (mode: GameMode) => buildRound(mode, { ...input, seed: 1 }).length
  return {
    'who-said-it': count('who-said-it'),
    'finish-the-sentence': count('finish-the-sentence'),
    'guess-the-context': count('guess-the-context'),
    'emoji-decryption': count('emoji-decryption'),
  }
}

function whoSaidIt({ messages, analytics, display }: RoundInput, rand: () => number): Question[] {
  const people = analytics.meta.participants
  if (people.length < 2) return []

  const pool = quotableMessages(messages)
  // Balance the round across authors so the answer isn't always the chattier
  // person — otherwise "always pick Alex" scores 60%.
  const perAuthor = new Map<string, Message[]>()
  for (const m of pool) {
    if (!perAuthor.has(m.author)) perAuthor.set(m.author, [])
    perAuthor.get(m.author)!.push(m)
  }

  const picks: Message[] = []
  const wanted = Math.ceil(QUESTIONS_PER_ROUND / perAuthor.size)
  for (const [, list] of perAuthor) picks.push(...pickSome(list, wanted, rand))

  return shuffle(picks, rand)
    .slice(0, QUESTIONS_PER_ROUND)
    .map((m, i) => {
      const others = people.filter((p) => p !== m.author)
      const distractors = pickSome(others, Math.min(3, others.length), rand)
      const choices = shuffle([m.author, ...distractors], rand).map((author) => ({
        id: author,
        label: display(author),
      }))

      return {
        id: `who-${m.i}-${i}`,
        mode: 'who-said-it' as const,
        eyebrow: 'Who sent this?',
        prompt: m.text.trim(),
        choices,
        answerId: m.author,
        reveal: `${display(m.author)}, ${dateTime(m.at)}.`,
      }
    })
}

function finishTheSentence(
  { messages, display }: RoundInput,
  rand: () => number,
): Question[] {
  const pool = completableMessages(messages)
  if (pool.length < 8) return []

  const candidates = pickSome(pool, QUESTIONS_PER_ROUND * 2, rand)
  const questions: Question[] = []

  for (const m of candidates) {
    if (questions.length >= QUESTIONS_PER_ROUND) break

    const tailWords = 3 + Math.floor(rand() * 2) // 3 or 4
    const split = redactTail(m.text.trim(), tailWords)
    if (!split) continue

    // Decoy endings come from other real messages of a similar length, so every
    // option reads like something one of them would actually type. Deduplicated
    // against each other as well as against the answer: two identical options
    // make the question unanswerable.
    const seen = new Set([split.tail.toLowerCase()])
    const decoys: string[] = []
    for (const other of pickSome(pool.filter((o) => o.i !== m.i), 24, rand)) {
      if (decoys.length >= 3) break
      const tail = redactTail(other.text.trim(), tailWords)?.tail
      if (!tail) continue
      const key = tail.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      decoys.push(tail)
    }

    if (decoys.length < 2) continue

    const choices = shuffle([split.tail, ...decoys], rand).map((tail, idx) => ({
      id: `${idx}-${tail}`,
      label: tail,
    }))
    const answer = choices.find((c) => c.label === split.tail)
    if (!answer) continue

    questions.push({
      id: `finish-${m.i}`,
      mode: 'finish-the-sentence',
      eyebrow: 'How did this one end?',
      prompt: `${split.prefix} …`,
      choices,
      answerId: answer.id,
      reveal: `“${m.text.trim()}” — ${display(m.author)}, ${dateTime(m.at)}.`,
    })
  }

  return questions
}

function guessTheContext(
  { messages, analytics, display }: RoundInput,
  rand: () => number,
): Question[] {
  const pool = lateNightMessages(messages)
  if (pool.length < 3) return []

  const people = analytics.meta.participants

  return pickSome(pool, QUESTIONS_PER_ROUND, rand).map((m, i) => {
    const truth = contextLabel(m.at, m.author, display)

    // Decoys shift the hour, the weekday and sometimes the author — plausible
    // circumstances that are not the real ones.
    const labels = new Set<string>([truth])
    let guard = 0
    while (labels.size < 3 && guard++ < 40) {
      const shifted = new Date(m.at)
      shifted.setHours((shifted.getHours() + 3 + Math.floor(rand() * 14)) % 24)
      shifted.setDate(shifted.getDate() + Math.floor(rand() * 5) - 2)
      const author =
        people.length > 1 && rand() > 0.4
          ? people.filter((p) => p !== m.author)[0]
          : m.author
      labels.add(contextLabel(shifted.getTime(), author, display))
    }

    const choices = shuffle([...labels], rand).map((label) => ({ id: label, label }))

    return {
      id: `context-${m.i}-${i}`,
      mode: 'guess-the-context' as const,
      eyebrow: 'When was this sent, and by whom?',
      prompt: m.text.trim(),
      choices,
      answerId: truth,
      reveal: `Sent ${dateTime(m.at)} by ${display(m.author)}.`,
    }
  })
}

function emojiDecryption(
  { messages, display }: RoundInput,
  rand: () => number,
): Question[] {
  const emojiMessages = emojiOnlyMessages(messages)
  if (!emojiMessages.length) return []

  const indexOf = new Map<number, number>()
  messages.forEach((m, idx) => indexOf.set(m.i, idx))

  const withReplies = emojiMessages
    .map((m) => {
      const idx = indexOf.get(m.i)
      const reply = idx === undefined ? null : replyTo(messages, idx)
      return reply ? { message: m, reply } : null
    })
    .filter((x): x is { message: Message; reply: Message } => x !== null)

  if (withReplies.length < 3) return []

  const replyPool = withReplies.map((x) => x.reply)

  return pickSome(withReplies, QUESTIONS_PER_ROUND, rand).map(({ message, reply }, i) => {
    const truth = trim(reply.text)

    // Deduplicated against each other as well as the answer — a repeated
    // option would make the question unanswerable.
    const seen = new Set([truth.toLowerCase()])
    const decoys: string[] = []
    for (const other of pickSome(replyPool.filter((r) => r.i !== reply.i), 16, rand)) {
      if (decoys.length >= 2) break
      const label = trim(other.text)
      const key = label.toLowerCase()
      if (!label || seen.has(key)) continue
      seen.add(key)
      decoys.push(label)
    }

    const choices = shuffle([truth, ...decoys], rand).map((label, idx) => ({
      id: `${idx}-${label}`,
      label,
    }))
    const answer = choices.find((c) => c.label === truth)!

    return {
      id: `emoji-${message.i}-${i}`,
      mode: 'emoji-decryption' as const,
      eyebrow: 'No words. What was the reply?',
      prompt: message.text.trim(),
      choices,
      answerId: answer.id,
      reveal: `${display(reply.author)} replied “${truth}” — ${dateTime(reply.at)}.`,
    }
  })
}

function trim(text: string, max = 90): string {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
