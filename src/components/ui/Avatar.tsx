import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

/**
 * Per-person colour. Assigned by position in the participant list rather than
 * hashed from the name, so the two people in a 1:1 chat always get the two
 * most distinguishable colours.
 */
export const PERSON_COLORS = [
  { bg: 'bg-clay-500', text: 'text-white', soft: 'bg-clay-100', ink: 'text-clay-700', hex: '#E07A5F' },
  { bg: 'bg-dusk', text: 'text-white', soft: 'bg-[#E6EAF2]', ink: 'text-[#41527A]', hex: '#6C7A9C' },
  { bg: 'bg-sage', text: 'text-white', soft: 'bg-[#E4EFE9]', ink: 'text-[#3F6B55]', hex: '#81B29A' },
  { bg: 'bg-honey-500', text: 'text-ink', soft: 'bg-honey-100', ink: 'text-honey-700', hex: '#DFA85B' },
  { bg: 'bg-ink', text: 'text-white', soft: 'bg-surface-sunk', ink: 'text-ink', hex: '#2B2220' },
  { bg: 'bg-clay-700', text: 'text-white', soft: 'bg-clay-100', ink: 'text-clay-800', hex: '#A24A2E' },
] as const

export function personColor(author: string, participants: string[]) {
  const idx = Math.max(0, participants.indexOf(author))
  return PERSON_COLORS[idx % PERSON_COLORS.length]
}

export function Avatar({
  name,
  participants,
  size = 'md',
  className,
}: {
  name: string
  participants: string[]
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const color = personColor(name, participants)
  const sizes = {
    xs: 'h-6 w-6 text-[0.6rem]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill font-semibold tracking-wide',
        color.bg,
        color.text,
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function PersonChip({
  name,
  participants,
  className,
}: {
  name: string
  participants: string[]
  className?: string
}) {
  const color = personColor(name, participants)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 text-sm font-medium',
        color.soft,
        color.ink,
        className,
      )}
    >
      <Avatar name={name} participants={participants} size="xs" />
      {name}
    </span>
  )
}
