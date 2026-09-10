import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { transition } from '@/lib/motion'
import { PRIMARY_NAV, SECONDARY_NAV, UTILITY_NAV } from './nav'

/**
 * Mobile navigation — PRODUCT.md §31/§32. Four primary destinations plus a
 * "More" sheet for the rest. Every target clears 44×44.
 */
export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  // A navigation always dismisses the sheet, however it was triggered.
  useEffect(() => setMoreOpen(false), [location.pathname])

  const secondaryActive = [...SECONDARY_NAV, ...UTILITY_NAV].some((i) =>
    location.pathname.startsWith(i.to),
  )

  return (
    <>
      <AnimatePresence>
        {moreOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition.fast}
              onClick={() => setMoreOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="more-sheet"
              className={cn(
                'fixed inset-x-0 bottom-0 z-40 rounded-t-card border-t border-surface-line',
                'bg-surface pb-[calc(76px+env(safe-area-inset-bottom))] pt-5 shadow-lift lg:hidden',
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={transition.base}
              role="dialog"
              aria-label="More sections"
            >
              <div className="shell">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  More
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {[...SECONDARY_NAV, ...UTILITY_NAV].map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            'flex touch-target items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium',
                            isActive
                              ? 'bg-clay-50 text-clay-700'
                              : 'bg-surface-sunk text-ink-muted',
                          )
                        }
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        {item.short ?? item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <nav
        aria-label="Main"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-surface-line bg-surface/95 backdrop-blur',
          'pb-[env(safe-area-inset-bottom)] lg:hidden',
        )}
      >
        <ul className="flex">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/report'}
                className={({ isActive }) =>
                  cn(
                    'flex touch-target flex-col items-center justify-center gap-0.5 px-1 py-2',
                    'text-[0.68rem] font-medium transition-colors duration-200',
                    isActive ? 'text-clay-600' : 'text-ink-faint',
                  )
                }
              >
                <span aria-hidden="true" className="text-base leading-none">
                  {item.icon}
                </span>
                {item.short ?? item.label}
              </NavLink>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="more-sheet"
              className={cn(
                'flex w-full touch-target flex-col items-center justify-center gap-0.5 px-1 py-2',
                'text-[0.68rem] font-medium transition-colors duration-200',
                moreOpen || secondaryActive ? 'text-clay-600' : 'text-ink-faint',
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">
                ⋯
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
