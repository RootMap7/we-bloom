import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { RevealCard } from '../ui/Card'

/**
 * Every chart lives in one of these. `question` is the thing the chart is
 * meant to answer — CLAUDE.md and PRODUCT.md §33 both insist a chart that
 * can't state its question shouldn't exist. `description` is the screen-reader
 * summary (§41).
 */
export function ChartCard({
  title,
  question,
  description,
  action,
  children,
  footnote,
  className,
  delay = 0,
}: {
  title: ReactNode
  question?: ReactNode
  description: string
  action?: ReactNode
  children: ReactNode
  footnote?: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <RevealCard className={cn('overflow-hidden', className)} delay={delay}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-display-sm text-ink text-balance">{title}</h3>
          {question ? (
            <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-ink-muted text-pretty">
              {question}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <figure className="m-0">
        <figcaption className="sr-only">{description}</figcaption>
        {children}
      </figure>

      {footnote ? (
        <p className="mt-4 border-t border-surface-line pt-3 text-xs leading-relaxed text-ink-faint text-pretty">
          {footnote}
        </p>
      ) : null}
    </RevealCard>
  )
}
