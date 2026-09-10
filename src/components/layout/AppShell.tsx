import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { transition } from '@/lib/motion'
import { useStore } from '@/lib/store'
import { BottomNav } from './BottomNav'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'
import { ALL_NAV } from './nav'

export function AppShell() {
  const location = useLocation()
  const { analytics, isDemo } = useStore()

  // Announce the section change and reset scroll on navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const current = ALL_NAV.find((n) =>
    n.to === '/report' ? location.pathname === '/report' : location.pathname.startsWith(n.to),
  )

  return (
    <div className="flex min-h-dvh bg-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-surface-line bg-cream/90 backdrop-blur lg:hidden">
          <div className="shell flex h-14 items-center justify-between">
            <Logo to="/report" />
            {isDemo ? (
              <span className="rounded-pill bg-honey-100 px-2.5 py-1 text-xs font-semibold text-honey-700">
                Sample
              </span>
            ) : null}
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 pb-24 pt-6 focus:outline-none sm:pt-8 lg:pb-16"
        >
          <div className="shell">
            {isDemo ? <DemoBanner /> : null}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={transition.base}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <p aria-live="polite" className="sr-only">
          {current ? `${current.label} section` : ''}
          {analytics ? '' : ''}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}

function DemoBanner() {
  const { reset } = useStore()
  return (
    <div className="mb-6 hidden items-center justify-between gap-4 rounded-card border border-honey-200 bg-honey-50 px-4 py-3 lg:flex">
      <p className="text-sm text-ink-muted">
        <span className="font-semibold text-ink">This is a sample conversation.</span> Everything
        here is generated data between two people who don't exist.
      </p>
      <button
        type="button"
        onClick={reset}
        className="shrink-0 text-sm font-semibold text-clay-600 underline-offset-4 hover:underline"
      >
        Upload your own
      </button>
    </div>
  )
}
