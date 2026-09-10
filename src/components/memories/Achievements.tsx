import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Controls'
import { burst } from '@/lib/celebrate'
import { buildAchievements, earnedCount, type Achievement } from '@/lib/achievements'
import { fadeRise, stagger } from '@/lib/motion'
import { sound } from '@/lib/sound'
import { useAnalytics, useStore } from '@/lib/store'

/**
 * Badges awarded from the chat data. An unearned badge shows the measurement
 * that fell short instead of hiding it, so the section reads as honest rather
 * than as a tease.
 */
export function Achievements() {
  const a = useAnalytics()
  const { messages } = useStore()
  const [opened, setOpened] = useState<string | null>(null)

  const badges = useMemo(() => buildAchievements(a, messages), [a, messages])
  const earned = earnedCount(badges)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone="clay">
          {earned} of {badges.length} earned
        </Badge>
        <p className="text-sm text-ink-muted">Pick a badge to see the number behind it.</p>
      </div>

      <motion.ul
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={stagger(0.04)}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            open={opened === badge.id}
            onToggle={(event) => {
              const next = opened === badge.id ? null : badge.id
              setOpened(next)
              if (next && badge.earned) {
                sound.badge()
                const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
                void burst({
                  x: (rect.left + rect.width / 2) / window.innerWidth,
                  y: (rect.top + rect.height / 2) / window.innerHeight,
                })
              } else if (next) {
                sound.tap()
              }
            }}
          />
        ))}
      </motion.ul>
    </div>
  )
}

function BadgeCard({
  badge,
  open,
  onToggle,
}: {
  badge: Achievement
  open: boolean
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <motion.li variants={fadeRise}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`h-full w-full rounded-card border p-5 text-left transition-all duration-250 ease-bloom hover:-translate-y-0.5 hover:shadow-lift ${
          badge.earned
            ? 'border-clay-200 bg-clay-50'
            : 'border-dashed border-surface-line bg-surface-sunk/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-xl ${
              badge.earned ? 'bg-clay-500 text-white' : 'bg-surface text-ink-faint'
            }`}
          >
            {badge.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-lg ${badge.earned ? 'text-ink' : 'text-ink-muted'}`}
            >
              {badge.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted text-pretty">
              {badge.description}
            </p>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2">
          {badge.earned ? (
            <Badge tone="sage">Earned</Badge>
          ) : (
            <Badge tone="neutral">Not yet</Badge>
          )}
        </p>

        {open ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 overflow-hidden border-t border-surface-line pt-3 text-sm leading-relaxed text-ink-muted text-pretty"
          >
            {badge.detail}
          </motion.p>
        ) : null}
      </button>
    </motion.li>
  )
}
