import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { EASE_BLOOM } from '@/lib/motion'

/**
 * Counts up to a number when it scrolls into view. Reduced motion skips
 * straight to the final value — a counter is decoration, and PRODUCT.md §42
 * says decoration is the first thing to go.
 */
export function CountUp({
  value,
  format,
  durationMs = 900,
  className,
}: {
  value: number
  format?: (n: number) => string
  durationMs?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    if (!inView) return

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      // Same easing curve as every other transition in the product.
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, durationMs, reduced])

  const render = format ?? ((n: number) => Math.round(n).toLocaleString('en-GB'))

  return (
    <span ref={ref} className={cn('tnum', className)}>
      {render(shown)}
    </span>
  )
}

export function Metric({
  label,
  value,
  hint,
  footnote,
  align = 'left',
  size = 'md',
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  footnote?: ReactNode
  align?: 'left' | 'center'
  size?: 'sm' | 'md' | 'lg'
}) {
  const valueSize =
    size === 'lg'
      ? 'text-display-md'
      : size === 'sm'
        ? 'text-2xl'
        : 'text-[2rem] leading-[1.1] sm:text-[2.4rem]'

  return (
    <div className={cn(align === 'center' && 'text-center')}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={cn('mt-1.5 font-display tnum text-ink', valueSize)}>{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted text-pretty">{hint}</p> : null}
      {footnote ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-faint text-pretty">{footnote}</p>
      ) : null}
    </div>
  )
}

/**
 * A stat presented as a sentence rather than a number — PRODUCT.md §3.1 and
 * §44. The number stays big; the copy gives it a reason to exist.
 */
export function StatCard({
  label,
  value,
  story,
  accent = 'clay',
  delay = 0,
  className,
}: {
  label: ReactNode
  value: ReactNode
  story?: ReactNode
  accent?: 'clay' | 'honey' | 'sage' | 'dusk' | 'plain'
  delay?: number
  className?: string
}) {
  const accents: Record<string, string> = {
    clay: 'before:bg-clay-500',
    honey: 'before:bg-honey-300',
    sage: 'before:bg-sage',
    dusk: 'before:bg-dusk',
    plain: 'before:bg-surface-line',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: EASE_BLOOM, delay }}
      className={cn(
        'card-base relative overflow-hidden p-5',
        'before:absolute before:inset-x-0 before:top-0 before:h-1 before:content-[""]',
        accents[accent],
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-2 font-display tnum text-[2rem] leading-[1.05] text-ink sm:text-[2.3rem]">
        {value}
      </p>
      {story ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">{story}</p>
      ) : null}
    </motion.div>
  )
}
