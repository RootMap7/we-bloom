import { motion } from 'framer-motion'
import { useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { transition } from '@/lib/motion'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const groupId = useId()

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex rounded-pill border border-surface-line bg-surface-sunk p-1',
        'scroll-x max-w-full',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative shrink-0 rounded-pill px-3.5 py-2 text-sm font-medium',
              'min-h-[36px] transition-colors duration-200 ease-bloom',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink',
            )}
          >
            {active ? (
              <motion.span
                layoutId={`segmented-${groupId}`}
                transition={transition.fast}
                className="absolute inset-0 rounded-pill bg-surface shadow-soft"
              />
            ) : null}
            <span className="relative z-10 whitespace-nowrap">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'clay' | 'honey' | 'sage' | 'dusk'
  className?: string
}) {
  const tones = {
    neutral: 'bg-surface-sunk text-ink-muted',
    clay: 'bg-clay-100 text-clay-700',
    honey: 'bg-honey-100 text-honey-700',
    sage: 'bg-[#E4EFE9] text-[#3F6B55]',
    dusk: 'bg-[#E6EAF2] text-[#41527A]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Tooltip that also works on touch: the trigger is a real button, and the
 * content is exposed to screen readers via aria-describedby whether or not it
 * is visible.
 */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode
  children?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const timer = useRef<number | null>(null)

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(true)
  }
  const hide = () => {
    timer.current = window.setTimeout(() => setOpen(false), 80)
  }

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-pill',
          'border border-surface-line bg-surface text-xs font-semibold text-ink-faint',
          'transition-colors duration-200 hover:border-clay-200 hover:text-clay-600',
        )}
      >
        {children ?? 'i'}
        <span className="sr-only">More information</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2',
          'rounded-xl bg-ink px-3 py-2 text-xs leading-relaxed text-cream shadow-lift',
          'transition-opacity duration-200 ease-bloom',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  )
}

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number
  label: string
  className?: string
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-pill bg-surface-sunk', className)}
    >
      <motion.div
        className="h-full rounded-pill bg-clay-500"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={transition.base}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
  children,
  color = '#E07A5F',
}: {
  value: number
  size?: number
  stroke?: number
  label: string
  children?: ReactNode
  color?: string
}) {
  const clamped = Math.min(1, Math.max(0, value))
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${Math.round(clamped * 100)}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E8E1D8"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - clamped) }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: ReactNode
  description?: ReactNode
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-pill transition-colors duration-250 ease-bloom',
          checked ? 'bg-clay-500' : 'bg-surface-line',
        )}
      >
        <motion.span
          layout
          transition={transition.fast}
          className={cn(
            'absolute top-1 h-5 w-5 rounded-pill bg-white shadow-soft',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted text-pretty">
            {description}
          </span>
        ) : null}
      </label>
    </div>
  )
}
