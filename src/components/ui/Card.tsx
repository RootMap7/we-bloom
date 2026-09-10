import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { fadeRise, transition } from '@/lib/motion'

export function Card({
  children,
  className,
  interactive,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'card-base p-5 sm:p-6',
        interactive && 'transition-shadow duration-250 ease-bloom hover:shadow-lift',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Card that rises into view the first time it is scrolled past. */
export function RevealCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeRise}
      transition={{ ...transition.base, delay }}
      className={cn('card-base p-5 sm:p-6', className)}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-display-sm text-ink">{title}</h3>
        {subtitle ? (
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-muted text-pretty">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  blurb?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6', className)}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-display-md text-ink text-balance">{title}</h2>
      {blurb ? (
        <p className="mt-2 max-w-[62ch] text-base leading-relaxed text-ink-muted text-pretty">
          {blurb}
        </p>
      ) : null}
    </header>
  )
}
