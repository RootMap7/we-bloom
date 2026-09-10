import type { MediaKind } from './types'

/**
 * WhatsApp writes one of a handful of header shapes depending on platform and
 * locale. We match them all with a single permissive regex and then normalise,
 * rather than keeping a per-locale table that will always be incomplete.
 *
 * iOS:      [12/08/2026, 20:14:03] Alex: Hey
 * iOS (AM): [12/08/2026, 8:14:03 PM] Alex: Hey
 * Android:  12/08/2026, 20:14 - Alex: Hey
 * Android:  12/08/2026, 8:14 pm - Alex: Hey
 *
 * The narrow-nbsp before AM/PM (U+202F) is real and appears in recent iOS
 * exports; a plain \s class would miss it.
 */
const SP = '[\\s\\u00a0\\u202f]'

const DATE = '(\\d{1,4})[./-](\\d{1,2})[./-](\\d{2,4})'
const TIME = `(\\d{1,2}):(\\d{2})(?::(\\d{2}))?(?:${SP}*([APap])\\.?${SP}*[Mm]\\.?)?`

/** Bracketed (iOS) header. */
const IOS_HEADER = new RegExp(
  `^${SP}*\\[${SP}*${DATE},?${SP}+${TIME}${SP}*\\]${SP}*(.*)$`,
)

/** Dash-separated (Android) header. */
const ANDROID_HEADER = new RegExp(
  `^${SP}*${DATE},?${SP}+${TIME}${SP}*[-–—]${SP}*(.*)$`,
)

export interface HeaderMatch {
  a: number
  b: number
  year: number
  hour: number
  minute: number
  second: number
  meridiem: 'a' | 'p' | null
  rest: string
}

/**
 * Parse a line's timestamp header. Returns null for continuation lines, which
 * belong to the previous message.
 */
export function matchHeader(line: string): HeaderMatch | null {
  const m = IOS_HEADER.exec(line) ?? ANDROID_HEADER.exec(line)
  if (!m) return null

  const [, d1, d2, d3, hh, mm, ss, ap] = m
  const rest = m[8] ?? ''

  const year = normaliseYear(Number(d3))
  if (!Number.isFinite(year)) return null

  return {
    a: Number(d1),
    b: Number(d2),
    year,
    hour: Number(hh),
    minute: Number(mm),
    second: ss ? Number(ss) : 0,
    meridiem: ap ? (ap.toLowerCase() as 'a' | 'p') : null,
    rest,
  }
}

function normaliseYear(y: number): number {
  if (y >= 1000) return y
  // Two-digit years: WhatsApp did not exist before 2009, so everything is 20xx.
  return 2000 + y
}

/**
 * Split "Alex: Hey" into author and body. Returns null when there is no author,
 * which means the line is a system event.
 *
 * Authors can contain colons (a phone number never does, but a saved contact
 * name can), so we take the FIRST colon followed by a space and additionally
 * reject candidates that look like sentences.
 */
export function splitAuthor(rest: string): { author: string; text: string } | null {
  const idx = rest.indexOf(': ')
  if (idx === -1) {
    // "Alex:" with an empty body is still a message.
    if (rest.endsWith(':') && rest.length > 1) {
      const name = rest.slice(0, -1).trim()
      if (isPlausibleAuthor(name)) return { author: name, text: '' }
    }
    return null
  }

  const author = rest.slice(0, idx).trim()
  if (!isPlausibleAuthor(author)) return null

  return { author, text: rest.slice(idx + 2) }
}

/**
 * System messages ("Alex joined using this group's invite link") have no colon,
 * but some locales produce lines that do. A contact name is short and does not
 * read like a clause, so we cap length and reject obvious prose.
 */
function isPlausibleAuthor(name: string): boolean {
  if (!name || name.length > 60) return false
  if (name.includes('\n')) return false
  // A name with five or more words is almost certainly a system sentence.
  if (name.split(/\s+/).length > 5) return false
  return true
}

const SYSTEM_SIGNALS: Array<[RegExp, 'join' | 'leave' | 'subject' | 'encryption']> = [
  [/end-to-end encrypt|cifrado de extremo|chiffrement de bout/i, 'encryption'],
  [/\b(joined|added|se unió|añadió|a rejoint)\b/i, 'join'],
  [/\b(left|removed|salió|eliminó|a quitté)\b/i, 'leave'],
  [/\b(changed the subject|changed this group|group description|cambió el asunto)\b/i, 'subject'],
]

export function classifySystem(text: string): 'join' | 'leave' | 'subject' | 'encryption' | 'other' {
  for (const [re, kind] of SYSTEM_SIGNALS) {
    if (re.test(text)) return kind
  }
  return 'other'
}

/**
 * Attachment placeholders. WhatsApp localises these, so we match on the
 * distinctive noun plus the "omitted"/"attached" marker rather than exact
 * strings. Order matters: sticker and GIF must be tested before photo/video.
 */
const MEDIA_PATTERNS: Array<[RegExp, MediaKind]> = [
  [/sticker[\s ]*(omitted|omitido|omesso)?/i, 'sticker'],
  [/\bgif\b[\s ]*(omitted|omitido)?/i, 'gif'],
  [/(voice[\s ]*(note|message)|audio[\s ]*omitted|ptt-\d|opus)/i, 'voice'],
  [/(audio|\.mp3|\.m4a|\.ogg|\.wav)/i, 'audio'],
  [/(video[\s ]*omitted|video[\s ]*(note)?[\s ]*(attached|adjunto)|\.mp4|\.mov|vid-\d)/i, 'video'],
  [/(image[\s ]*omitted|photo[\s ]*omitted|imagen[\s ]*omitida|\.jpg|\.jpeg|\.png|\.webp|img-\d)/i, 'photo'],
  [/(document[\s ]*omitted|\.pdf|\.docx?|\.xlsx?|\.pptx?|\.zip|documento)/i, 'document'],
  [/(contact[\s ]*card|\.vcf|contacto)/i, 'contact'],
  [/(location:|ubicación|maps\.google|live[\s ]*location)/i, 'location'],
]

/**
 * Generic "something was attached and stripped" marker. If this fires but no
 * specific pattern matched, we still know media was exchanged.
 */
const GENERIC_MEDIA =
  /(<[\s ]*(media|attached|archivo|fichier)[^>]*>|\bomitted\b|\bomitido\b|\bomessa\b|weggelassen|<attached:)/i

export function detectMedia(text: string): MediaKind | null {
  if (!GENERIC_MEDIA.test(text) && !/<attached:/i.test(text)) {
    // Location shares carry no "omitted" marker.
    if (/^location: https?:\/\/|live location shared/i.test(text.trim())) return 'location'
    return null
  }
  for (const [re, kind] of MEDIA_PATTERNS) {
    if (re.test(text)) return kind
  }
  return 'other'
}

const DELETED =
  /(this message was deleted|you deleted this message|se eliminó este mensaje|message supprimé|deleted by admin)/i

export function isDeleted(text: string): boolean {
  return DELETED.test(text)
}

const URL_RE = /\bhttps?:\/\/[^\s<>()]+|(?:^|\s)(www\.[^\s<>()]+)/gi

export function extractLinks(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(URL_RE)) {
    const raw = (m[0] ?? '').trim()
    if (raw) out.push(raw.replace(/[.,;:!?)]+$/, ''))
  }
  return out
}

/**
 * Emoji extraction. `Extended_Pictographic` catches the pictographs; we then
 * glue on variation selectors, skin-tone modifiers and ZWJ sequences so that
 * "👩‍👩‍👧" counts as one emoji rather than three people and two joiners.
 */
const EMOJI_RE =
  /\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|⃣)?(?:‍\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️)?)*/gu

export function extractEmoji(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(EMOJI_RE)) {
    const e = m[0]
    // Bare digits and '#' pick up Emoji_Component matches; skip unless keycapped.
    if (/^[0-9#*]$/.test(e)) continue
    out.push(e)
  }
  return out
}
