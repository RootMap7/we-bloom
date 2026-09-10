import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { fadeRise } from '@/lib/motion'
import { Card } from './Card'

/**
 * Empty states — PRODUCT.md §34. Never "No data available".
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-surface-line',
        'bg-surface-sunk/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="mb-4 text-3xl" aria-hidden="true">{icon}</div> : null}
      <h3 className="font-display text-display-sm text-ink text-balance">{title}</h3>
      {body ? (
        <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-muted text-pretty">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/**
 * Shown where a metric exists but the sample behind it is too small to mean
 * anything — PRODUCT.md §36. We say so instead of printing a number.
 */
export function NotEnoughData({
  what,
  need,
  className,
}: {
  what: string
  need?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-surface-line bg-surface-sunk/50 p-5 text-center',
        className,
      )}
    >
      <p className="font-display text-lg text-ink">Not enough data yet.</p>
      <p className="mx-auto mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-muted text-pretty">
        We need a little more conversation history before {what} means anything.
        {need ? ` ${need}` : ''}
      </p>
    </div>
  )
}

export function ErrorState({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeRise}>
      <Card className={cn('border-clay-200 bg-clay-50', className)}>
        <div className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-clay-100 text-lg"
          >
            !
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-display-sm text-ink text-balance">{title}</h3>
            {hint ? (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">{hint}</p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export function LoadingBlock({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: `${100 - i * 12}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="skeleton w-full" style={{ height }} role="status" aria-label="Loading chart" />
  )
}
