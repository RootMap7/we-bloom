import {
  classifySystem,
  detectMedia,
  extractEmoji,
  extractLinks,
  isDeleted,
  matchHeader,
  splitAuthor,
  type HeaderMatch,
} from './patterns'
import {
  ParseError,
  type DateOrder,
  type Message,
  type ParseResult,
  type ParseWarning,
  type SystemEvent,
} from './types'

export * from './types'

/** Below this we can still show a report, but most trends are noise. */
const MIN_MESSAGES = 5

interface RawLine {
  header: HeaderMatch
  body: string
}

export function parseWhatsAppExport(
  input: string,
  onProgress?: (fraction: number) => void,
): ParseResult {
  const text = stripBom(input)
  if (!text.trim()) {
    throw new ParseError(
      'empty-file',
      "That file is empty.",
      'Pick the .txt file WhatsApp gave you — it should be a few hundred KB or more.',
    )
  }

  const lines = text.split(/\r\n|\r|\n/)
  const raw: RawLine[] = []
  let continuationLines = 0
  let unparsedLines = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (i % 20000 === 0) onProgress?.((i / lines.length) * 0.5)

    const header = matchHeader(line)
    if (header) {
      raw.push({ header, body: header.rest })
      continue
    }

    if (raw.length > 0) {
      // Continuation of the previous message.
      raw[raw.length - 1].body += '\n' + line
      if (line.trim()) continuationLines++
      continue
    }

    if (line.trim()) unparsedLines++
  }

  if (raw.length === 0) {
    throw new ParseError(
      'not-a-chat-export',
      "We couldn't find any messages in that file.",
      "Make sure you exported the chat from WhatsApp itself (Chat → Export chat → Without media) and uploaded the .txt file it produced.",
    )
  }

  const { order, ambiguous } = inferDateOrder(raw)

  const messages: Message[] = []
  const system: SystemEvent[] = []
  const participantSet = new Set<string>()

  for (let i = 0; i < raw.length; i++) {
    const { header, body } = raw[i]
    if (i % 20000 === 0) onProgress?.(0.5 + (i / raw.length) * 0.5)

    const at = toEpoch(header, order)
    if (at === null) continue

    const split = splitAuthor(body)
    if (!split) {
      const clean = body.trim()
      if (clean) system.push({ at, text: clean, kind: classifySystem(clean) })
      continue
    }

    const { author, text: bodyText } = split
    const deleted = isDeleted(bodyText)
    const media = deleted ? null : detectMedia(bodyText)
    // Placeholder text is WhatsApp's, not the participant's — exclude it from
    // word and emoji counts so "omitted" never lands in the top-words list.
    const counted = media || deleted ? '' : bodyText

    participantSet.add(author)
    messages.push({
      i: messages.length,
      at,
      author,
      text: bodyText,
      media,
      deleted,
      links: counted ? extractLinks(counted) : [],
      emoji: counted ? extractEmoji(counted) : [],
      wordCount: counted ? countWords(counted) : 0,
      charCount: counted.length,
    })
  }

  if (messages.length === 0) {
    throw new ParseError(
      'no-messages',
      "We found timestamps, but no messages from anyone.",
      'This export may contain only system notices. Try exporting the chat again.',
    )
  }

  if (messages.length < MIN_MESSAGES) {
    throw new ParseError(
      'too-few-messages',
      `Only ${messages.length} message${messages.length === 1 ? '' : 's'} in there.`,
      'We need a bit more conversation before any of this means anything. Try a longer chat.',
    )
  }

  // Exports are chronological, but a merged or edited file may not be.
  messages.sort((a, b) => a.at - b.at)
  messages.forEach((m, idx) => (m.i = idx))
  system.sort((a, b) => a.at - b.at)

  const participants = rankParticipants(messages, participantSet)
  const warnings = collectWarnings({
    ambiguous,
    unparsedLines,
    participants,
  })

  onProgress?.(1)

  return {
    messages,
    system,
    participants,
    dateOrder: order,
    dateOrderAmbiguous: ambiguous,
    warnings,
    stats: {
      totalLines: lines.length,
      parsedLines: messages.length,
      continuationLines,
      systemLines: system.length,
      unparsedLines,
    },
  }
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

/**
 * Decide whether the first number in each date is the day or the month.
 *
 * A single value > 12 in either position settles it for the whole file. If
 * neither position ever exceeds 12 the file is genuinely ambiguous — we default
 * to DMY (WhatsApp's majority locale behaviour) and flag it so the UI can ask.
 */
function inferDateOrder(raw: RawLine[]): { order: DateOrder; ambiguous: boolean } {
  let aOver12 = false
  let bOver12 = false

  for (const { header } of raw) {
    if (header.a > 31 || header.a > 1000) return { order: 'YMD', ambiguous: false }
    if (header.a > 12) aOver12 = true
    if (header.b > 12) bOver12 = true
    if (aOver12 && bOver12) break
  }

  // Both over 12 means the file mixes formats; trust the first-position signal.
  if (aOver12) return { order: 'DMY', ambiguous: false }
  if (bOver12) return { order: 'MDY', ambiguous: false }
  return { order: 'DMY', ambiguous: true }
}

function toEpoch(h: HeaderMatch, order: DateOrder): number | null {
  let day: number
  let month: number
  let year = h.year

  if (order === 'YMD') {
    year = h.a
    month = h.b
    day = h.year % 100 // third field held the day
  } else if (order === 'MDY') {
    month = h.a
    day = h.b
  } else {
    day = h.a
    month = h.b
  }

  let hour = h.hour
  if (h.meridiem === 'p' && hour < 12) hour += 12
  if (h.meridiem === 'a' && hour === 12) hour = 0

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || h.minute > 59) {
    return null
  }

  // Local time: a WhatsApp export has no timezone, and every timestamp was
  // written in the exporter's local zone. Treating it as local keeps
  // "most active hour" honest.
  const d = new Date(year, month - 1, day, hour, h.minute, h.second)
  const t = d.getTime()
  return Number.isFinite(t) ? t : null
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

function rankParticipants(messages: Message[], set: Set<string>): string[] {
  const counts = new Map<string, number>()
  for (const name of set) counts.set(name, 0)
  for (const m of messages) counts.set(m.author, (counts.get(m.author) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
}

function collectWarnings(args: {
  ambiguous: boolean
  unparsedLines: number
  participants: string[]
}): ParseWarning[] {
  const warnings: ParseWarning[] = []

  if (args.ambiguous) {
    warnings.push({
      code: 'ambiguous-date-order',
      message: "We couldn't tell whether the dates are day-first or month-first.",
      detail: 'We assumed day-first. If the timeline looks wrong, switch it in the setup step.',
    })
  }

  if (args.unparsedLines > 0) {
    warnings.push({
      code: 'unparsed-lines',
      message: `${args.unparsedLines} line${args.unparsedLines === 1 ? '' : 's'} at the top of the file didn't look like messages.`,
      detail: 'They were skipped. This is normal for some exports.',
    })
  }

  if (args.participants.length < 2) {
    warnings.push({
      code: 'single-participant',
      message: 'Only one person appears in this chat.',
      detail: 'Comparison and response-time insights need at least two people.',
    })
  }

  return warnings
}
