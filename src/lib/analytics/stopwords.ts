/**
 * Stop words are removed for the "meaningful words" ranking only. Raw counts
 * keep everything — PRODUCT.md §15.
 *
 * English plus the most common Spanish / Portuguese / French / German /
 * Indonesian function words, because WhatsApp is not an English-only product
 * and an unfiltered list is dominated by "de", "que", "the" everywhere.
 */
const EN = `a about above after again all am an and any are aren't as at be because been
before being below between both but by can can't cannot could couldn't did didn't do does
doesn't doing don't down during each few for from further had hadn't has hasn't have
haven't having he he'd he'll he's her here here's hers herself him himself his how how's i
i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my
myself no nor not of off on once only or other ought our ours ourselves out over own same
shan't she she'd she'll she's should shouldn't so some such than that that's the their
theirs them themselves then there there's these they they'd they'll they're they've this
those through to too under until up very was wasn't we we'd we'll we're we've were weren't
what what's when when's where where's which while who who's whom why why's with won't
would wouldn't you you'd you'll you're you've your yours yourself yourselves
u ur im dont didnt doesnt cant wont ive ill id thats its
ok okay yeah yes yea yep nope nah oh ah hey hi hello lol haha hahaha hmm hm um uh
just really very quite gonna wanna gotta got get go going went like well now then
one two three also still even much many bit lot`

const ES = `de la que el en y a los se del las un por con no una su para es al lo como más
o pero sus le ha me si sin sobre este ya entre cuando todo esta ser son dos también fue
era muy hay porque qué sí sólo yo tu te nos mi eso esa ese está estoy vale`

const PT = `de a o que e do da em um para com não uma os no se na por mais as dos como mas
ao ele das à seu sua ou quando muito nos já eu também só pelo pela até isso ela entre
está estou tá né pra pro vc você`

const FR = `de la le et les des en un une du dans est que qui pour pas au sur ne se plus
par avec tout il elle nous vous je tu on ce cette ces mais ou où donc car si bien être
avoir fait très moi toi oui non ça`

const DE = `der die das und in den von zu mit sich des auf für ist im dem nicht ein eine
als auch es an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem
über so zum war haben nur oder aber vor bin ich du wir ihr ja nein`

const ID = `yang dan di ke dari untuk dengan pada ini itu tidak ada saya kamu aku kita
mereka sudah akan bisa juga saja atau kalau nya lah kok sih gak nggak ya iya`

export const STOPWORDS: ReadonlySet<string> = new Set(
  [EN, ES, PT, FR, DE, ID]
    .join(' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean),
)

/** Words that only ever come from WhatsApp itself, never from a person. */
export const SYSTEM_TOKENS: ReadonlySet<string> = new Set([
  'omitted',
  'attached',
  'media',
  'image',
  'sticker',
  'gif',
  'audio',
  'video',
  'document',
  'null',
  'https',
  'http',
  'www',
  'com',
])

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word) || SYSTEM_TOKENS.has(word)
}

/**
 * Normalise a token for counting: lowercase, strip surrounding punctuation,
 * keep internal apostrophes and hyphens ("don't", "long-term").
 */
export function normaliseToken(raw: string): string | null {
  const t = raw
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')
  if (!t) return null
  if (t.length < 2) return null
  if (/^\d+$/.test(t)) return null
  if (/^https?/.test(t)) return null
  return t
}

export function tokenize(text: string): string[] {
  const out: string[] = []
  for (const raw of text.split(/[\s ]+/)) {
    const t = normaliseToken(raw)
    if (t) out.push(t)
  }
  return out
}
