import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import logomark from '@/logomark.png'

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

/** The wordmark carries the name, so the mark itself is decorative. */
function Mark() {
  return (
    <img
      src={logomark}
      width={22}
      height={22}
      alt=""
      aria-hidden="true"
      decoding="async"
      className="h-[22px] w-[22px] translate-y-[2px]"
    />
  )
}
