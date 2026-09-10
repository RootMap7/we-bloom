import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { dateShort } from '@/lib/format'
import { useStore } from '@/lib/store'
import { Logo } from './Logo'
import { PRIMARY_NAV, SECONDARY_NAV, UTILITY_NAV, type NavItem } from './nav'

export function Sidebar() {
  const { analytics, sourceLabel, isDemo, reset } = useStore()

  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-surface-line bg-surface/60 lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="px-5 py-6">
          <Logo />
        </div>

        <nav aria-label="Report sections" className="flex-1 overflow-y-auto px-3">
          <Group items={PRIMARY_NAV} />
          <Divider label="Deeper" />
          <Group items={SECONDARY_NAV} />
          <Divider label="More" />
          <Group items={UTILITY_NAV} />
        </nav>

        <div className="border-t border-surface-line px-5 py-4">
          {analytics ? (
            <>
              <p className="truncate text-sm font-medium text-ink" title={sourceLabel}>
                {isDemo ? 'Sample conversation' : sourceLabel || 'Your conversation'}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {dateShort(analytics.meta.firstAt)} — {dateShort(analytics.meta.lastAt)}
              </p>
            </>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-sm font-medium text-clay-600 underline-offset-4 transition-colors hover:text-clay-700 hover:underline"
          >
            Analyse a different chat
          </button>
        </div>
      </div>
    </aside>
  )
}

function Group({ items }: { items: NavItem[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.to === '/report'}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                'transition-colors duration-200 ease-bloom touch-target',
                isActive ? 'text-ink' : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 rounded-xl bg-clay-50"
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn('relative z-10 w-4 text-center', isActive && 'text-clay-600')}
                >
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <p className="px-3 pb-1.5 pt-5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
      {label}
    </p>
  )
}
