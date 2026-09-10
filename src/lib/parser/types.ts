/** Kinds of attachment WhatsApp leaves a placeholder for in a text export. */
export type MediaKind =
  | 'photo'
  | 'video'
  | 'gif'
  | 'sticker'
  | 'voice'
  | 'audio'
  | 'document'
  | 'contact'
  | 'location'
  | 'other'

export interface Message {
  /** Index in the original file order. */
  i: number
  /** Epoch ms. */
  at: number
  author: string
  text: string
  /** Set when the line was an attachment placeholder rather than real text. */
  media: MediaKind | null
  /** WhatsApp's "This message was deleted" / "You deleted this message". */
  deleted: boolean
  /** Bare URLs found in the message body. */
  links: string[]
  /** Emoji found in the message body, in order, duplicates kept. */
  emoji: string[]
  wordCount: number
  charCount: number
}

/** Joins, leaves, encryption notices, subject changes — no author attribution. */
export interface SystemEvent {
  at: number
  text: string
  kind: 'join' | 'leave' | 'subject' | 'encryption' | 'other'
}

export type DateOrder = 'DMY' | 'MDY' | 'YMD'

export interface ParseWarning {
  code:
    | 'ambiguous-date-order'
    | 'unparsed-lines'
    | 'single-participant'
    | 'no-timestamps'
  message: string
  detail?: string
}

export interface ParseResult {
  messages: Message[]
  system: SystemEvent[]
  participants: string[]
  dateOrder: DateOrder
  /** True when no day value > 12 existed anywhere, so DMY vs MDY was a guess. */
  dateOrderAmbiguous: boolean
  warnings: ParseWarning[]
  stats: {
    totalLines: number
    parsedLines: number
    continuationLines: number
    systemLines: number
    unparsedLines: number
  }
}

export class ParseError extends Error {
  code:
    | 'empty-file'
    | 'not-a-chat-export'
    | 'no-messages'
    | 'too-few-messages'
  /** User-facing next step. Kept out of `message` so the UI can style it. */
  hint: string

  constructor(code: ParseError['code'], message: string, hint: string) {
    super(message)
    this.name = 'ParseError'
    this.code = code
    this.hint = hint
  }
}
