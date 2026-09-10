import type { MediaKind, Message } from '../parser/types'
import { bump, rank, share } from './math'
import { monthKey, monthLabel } from './time'
import type { Analytics, Counted, PerPerson } from './types'

const MEDIA_ORDER: MediaKind[] = [
  'photo',
  'video',
  'voice',
  'sticker',
  'gif',
  'audio',
  'document',
  'location',
  'contact',
  'other',
]

export const MEDIA_LABELS: Record<MediaKind, string> = {
  photo: 'Photos',
  video: 'Videos',
  gif: 'GIFs',
  sticker: 'Stickers',
  voice: 'Voice notes',
  audio: 'Audio files',
  document: 'Documents',
  contact: 'Contacts',
  location: 'Locations',
  other: 'Other',
}

export function buildMedia(
  messages: Message[],
  participants: string[],
): Analytics['media'] {
  const byKind = new Map<MediaKind, number>()
  const perPerson: PerPerson<number> = {}
  const monthly = new Map<string, number>()
  const voicePerPerson: PerPerson<number> = {}
  const voiceMonthly = new Map<string, number>()
  for (const p of participants) {
    perPerson[p] = 0
    voicePerPerson[p] = 0
  }

  let total = 0
  let voiceTotal = 0

  for (const m of messages) {
    if (!m.media) continue
    total++
    bump(byKind, m.media)
    perPerson[m.author] = (perPerson[m.author] ?? 0) + 1
    bump(monthly, monthKey(m.at))

    if (m.media === 'voice') {
      voiceTotal++
      voicePerPerson[m.author] = (voicePerPerson[m.author] ?? 0) + 1
      bump(voiceMonthly, monthKey(m.at))
    }
  }

  const kindList: Counted<MediaKind>[] = MEDIA_ORDER.filter((k) => (byKind.get(k) ?? 0) > 0).map(
    (k) => ({ key: k, count: byKind.get(k) ?? 0, share: share(byKind.get(k) ?? 0, total) }),
  ).sort((a, b) => b.count - a.count)

  return {
    total,
    share: share(total, messages.length),
    byKind: kindList,
    perPerson,
    trend: toTrend(monthly),
    voiceNotes: {
      total: voiceTotal,
      perPerson: voicePerPerson,
      shares: participants
        .map((p) => ({
          key: p,
          count: voicePerPerson[p] ?? 0,
          share: share(voicePerPerson[p] ?? 0, voiceTotal),
        }))
        .sort((a, b) => b.count - a.count),
      trend: toTrend(voiceMonthly),
    },
  }
}

export function buildLinks(messages: Message[], participants: string[]): Analytics['links'] {
  const perPerson: PerPerson<number> = {}
  const domains = new Map<string, number>()
  const monthly = new Map<string, number>()
  for (const p of participants) perPerson[p] = 0

  let total = 0

  for (const m of messages) {
    if (!m.links.length) continue
    for (const link of m.links) {
      total++
      perPerson[m.author] = (perPerson[m.author] ?? 0) + 1
      bump(monthly, monthKey(m.at))
      const d = domainOf(link)
      if (d) bump(domains, d)
    }
  }

  return {
    total,
    perPerson,
    domains: rank(domains, 12).map(([key, count]) => ({
      key,
      count,
      share: share(count, total),
    })),
    trend: toTrend(monthly),
  }
}

function domainOf(link: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(link) ? link : `https://${link}`
    const host = new URL(withScheme).hostname.toLowerCase()
    return host.replace(/^www\./, '')
  } catch {
    return null
  }
}

function toTrend(map: Map<string, number>) {
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => ({
      key,
      label: monthLabel(new Date(`${key}-01T00:00:00`).getTime()),
      count,
    }))
}
