import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-clay-500 text-white shadow-soft hover:bg-clay-600 active:bg-clay-700 disabled:bg-clay-200',
  secondary:
    'bg-surface text-ink border border-surface-line shadow-soft hover:border-clay-200 hover:bg-clay-50 active:bg-clay-100',
  ghost: 'text-ink hover:bg-surface-sunk active:bg-surface-line',
  quiet: 'text-ink-muted hover:text-ink hover:bg-surface-sunk',
}

const SIZES: Record<Size, string> = {
  sm: 'h-11 px-3.5 text-sm gap-1.5',
  md: 'h-12 px-5 text-[0.95rem] gap-2',
  lg: 'h-14 px-7 text-base gap-2.5',
}

const BASE = cn(
  'inline-flex items-center justify-center rounded-pill font-medium',
  'transition-all duration-200 ease-bloom',
  'touch-target select-none',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'active:scale-[0.98]',
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', full, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className)}
      {...rest}
    />
  )
})

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  full,
  className,
  children,
  ...rest
}: {
  to: string
  variant?: Variant
  size?: Size
  full?: boolean
  className?: string
  children: React.ReactNode
} & Omit<React.ComponentProps<typeof Link>, 'to' | 'className'>) {
  return (
    <Link
      to={to}
      className={cn(BASE, VARIANTS[variant], SIZES[size], full && 'w-full', className)}
      {...rest}
    >
      {children}
    </Link>
  )
}
