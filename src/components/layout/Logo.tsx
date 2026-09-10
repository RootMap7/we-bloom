import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

export function Logo({ className, to = '/' }: { className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-baseline gap-2 font-display text-xl text-ink', className)}
    >
      <Mark />
      <span>
        We <span className="text-clay-600">Bloom</span>
      </span>
    </Link>
  )
}

function Mark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="translate-y-[2px]"
    >
      <circle cx="10" cy="6" r="3.4" fill="#E07A5F" />
      <circle cx="5.6" cy="12" r="3.4" fill="#F2CC8F" />
      <circle cx="14.4" cy="12" r="3.4" fill="#81B29A" opacity="0.9" />
    </svg>
  )
}
