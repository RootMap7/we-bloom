/**
 * Mock data — PRODUCT.md §39.
 *
 * Rather than hand-writing a fake Analytics object, this generates a realistic
 * WhatsApp export and runs it through the real parser and the real analytics
 * engine. Every screen therefore develops against the same code path a real
 * upload takes, and a mock that renders is evidence the pipeline works.
 */

const MESSAGES_TARGET = 18_492
const SPAN_DAYS = 247

/** Deterministic PRNG so the demo looks identical on every load. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALEX_LINES = [
  'morning you',
  'how did you sleep',
  "i'm just leaving now",
  'okay that is genuinely funny 😂',
  'wait what',
  'no way',
  "i'll call you in ten",
  'do you want me to pick anything up',
  'that place was so good',
  'i keep thinking about what you said yesterday',
  'love that',
  "you're going to laugh at this",
  'sorry was in a meeting',
  'i miss you',
  'okay bed. night ❤️',
  'send me the photo again',
  'the train is late obviously',
  'i made the soup. it worked',
  'guess who just walked in',
  'this is why i like you',
  'can we do sunday instead',
  'i booked it 🎉',
  "i'm so tired today",
  'you were right',
  'have you eaten',
  'be there in 5',
  'ok that is a lot of information',
  'hahahaha stop 😂😂',
  'i love that for you',
  'reading this again and still laughing',
]

const JAMIE_LINES = [
  'morning 🙂',
  'badly. very badly',
  'take your time',
  'i knew you would say that',
  "it's honestly not that deep",
  'okay but hear me out',
  'call me when you can',
  'milk if you pass a shop',
  'we are going back there',
  "i've been thinking about it too",
  'obsessed',
  'go on',
  'no worries at all',
  'miss you more',
  'night night ❤️',
  'sending it now',
  'of course it is',
  'proud of you honestly',
  'WHO',
  'this is the nicest thing',
  'sunday works better yeah',
  'wait really?? 🎉',
  'go to sleep then',
  'i usually am',
  'not yet. you?',
  "i'm outside",
  'sorry that was a lot',
  '😂😂😂',
  'thank you, genuinely',
  'ok one more thing',
]

const MEDIA_LINES = [
  '<Media omitted>',
  'image omitted',
  'video omitted',
  'sticker omitted',
  'audio omitted',
  'GIF omitted',
]

const LINK_LINES = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'look at this https://www.theguardian.com/food/2026/mar/02/soup',
  'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
  'https://www.instagram.com/p/abc123/',
  'https://www.bbc.co.uk/news/uk-12345678',
]

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Weight the hour of day so the demo has a real rhythm: a morning bump, a
 * midday lull, and a heavy late-evening peak (this chat's signature).
 */
const HOUR_WEIGHTS = [
  3, 1.5, 0.6, 0.3, 0.2, 0.3, 1, 3, 6, 5, 4, 4,
  5, 4.5, 4, 4, 5, 6.5, 8, 10, 13, 16, 15, 8,
]

function pickHour(rnd: () => number): number {
  const total = HOUR_WEIGHTS.reduce((t, n) => t + n, 0)
  let r = rnd() * total
  for (let h = 0; h < 24; h++) {
    r -= HOUR_WEIGHTS[h]
    if (r <= 0) return h
  }
  return 21
}

export function generateMockExport(): string {
  const rnd = mulberry32(20260908)
  const lines: string[] = []

  const end = new Date(2026, 7, 24, 23, 30, 0) // 24 Aug 2026
  const start = new Date(end.getTime() - SPAN_DAYS * 86_400_000)

  lines.push(
    `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}, 09:12 - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.`,
  )

  // A handful of shaped periods so the trend charts have something to show.
  const quietStart = 120
  const quietEnd = 131 // an 11-day silence
  const spikeDay = 168

  let written = 0

  for (let day = 0; day < SPAN_DAYS && written < MESSAGES_TARGET; day++) {
    const date = new Date(start.getTime() + day * 86_400_000)

    if (day >= quietStart && day < quietEnd) continue

    // Volume grows slowly over the chat's life, with weekend lift and noise.
    const growth = 0.75 + (day / SPAN_DAYS) * 0.7
    const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.25 : 1
    const spike = day === spikeDay ? 4.5 : 1
    const noise = 0.55 + rnd() * 0.9
    let count = Math.round(62 * growth * weekend * spike * noise)

    // Two or three days off a month, so streaks are finite.
    if (rnd() < 0.07 && day !== spikeDay) count = 0
    if (count <= 0) continue

    let speaker = rnd() < 0.63 ? 'Alex' : 'Jamie' // Alex opens more often
    let cursorHour = pickHour(rnd)
    let cursorMin = Math.floor(rnd() * 60)

    for (let n = 0; n < count && written < MESSAGES_TARGET; n++) {
      // Bursts: same speaker continues ~35% of the time.
      if (n > 0 && rnd() > 0.35) speaker = speaker === 'Alex' ? 'Jamie' : 'Alex'

      cursorMin += 1 + Math.floor(rnd() * 9)
      if (cursorMin >= 60) {
        cursorHour = (cursorHour + Math.floor(cursorMin / 60)) % 24
        cursorMin %= 60
      }

      const body = pickBody(rnd, speaker)
      lines.push(
        `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${pad(cursorHour)}:${pad(cursorMin)} - ${speaker}: ${body}`,
      )
      written++
    }
  }

  return lines.join('\n')
}

function pickBody(rnd: () => number, speaker: string): string {
  const r = rnd()
  if (r < 0.07) return MEDIA_LINES[Math.floor(rnd() * MEDIA_LINES.length)]
  if (r < 0.09) return LINK_LINES[Math.floor(rnd() * LINK_LINES.length)]
  if (r < 0.095) return 'This message was deleted'

  const pool = speaker === 'Alex' ? ALEX_LINES : JAMIE_LINES
  let text = pool[Math.floor(rnd() * pool.length)]

  // Occasional long message, so "longest message" has something to find.
  if (rnd() < 0.012) {
    text = `${text} ${LONG_TAIL[Math.floor(rnd() * LONG_TAIL.length)]}`
  }
  return text
}

const LONG_TAIL = [
  "i've been turning it over all afternoon and i think the thing that got me is that you noticed before i said anything, which is either very annoying or the nicest thing anyone has done this year, and i genuinely cannot decide which one it is right now",
  'okay so the full version: the train was cancelled, then the replacement bus went the long way, then i got to the restaurant twenty minutes late and they had given the table away, and honestly by that point i was laughing about it, which i think says something about how the week has gone',
  'i keep coming back to what you said about not needing to have it figured out yet. i think i have been treating every decision like it is permanent when almost none of them are, and that is a very tiring way to live, so thank you for that',
]
