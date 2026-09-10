import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { LoadingBlock } from './components/ui/States'
import { useStore } from './lib/store'
import { Landing } from './routes/Landing'
import { Upload } from './routes/Upload'

/**
 * Report sections are lazy-loaded — PRODUCT.md §38. The landing and upload
 * routes are not, because they are the first thing every visitor sees.
 */
const Overview = lazy(() => import('./routes/Overview').then((m) => ({ default: m.Overview })))
const Activity = lazy(() => import('./routes/Activity').then((m) => ({ default: m.Activity })))
const People = lazy(() => import('./routes/People').then((m) => ({ default: m.People })))
const Words = lazy(() => import('./routes/Words').then((m) => ({ default: m.Words })))
const Emojis = lazy(() => import('./routes/Emojis').then((m) => ({ default: m.Emojis })))
const Media = lazy(() => import('./routes/Media').then((m) => ({ default: m.Media })))
const Conversations = lazy(() =>
  import('./routes/Conversations').then((m) => ({ default: m.Conversations })),
)
const Insights = lazy(() => import('./routes/Insights').then((m) => ({ default: m.Insights })))
const Ask = lazy(() => import('./routes/Ask').then((m) => ({ default: m.Ask })))
const Wrapped = lazy(() => import('./routes/Wrapped').then((m) => ({ default: m.Wrapped })))
const Privacy = lazy(() => import('./routes/Privacy').then((m) => ({ default: m.Privacy })))

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Wrapped sits outside the shell so it can go full-bleed. */}
        <Route
          path="/report/wrapped"
          element={
            <RequireReport>
              <Wrapped />
            </RequireReport>
          }
        />

        <Route
          path="/report"
          element={
            <RequireReport>
              <AppShell />
            </RequireReport>
          }
        >
          <Route index element={<Overview />} />
          <Route path="activity" element={<Activity />} />
          <Route path="people" element={<People />} />
          <Route path="words" element={<Words />} />
          <Route path="emojis" element={<Emojis />} />
          <Route path="media" element={<Media />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="insights" element={<Insights />} />
          <Route path="ask" element={<Ask />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

/** Report routes are meaningless without a loaded conversation. */
function RequireReport({ children }: { children: ReactNode }) {
  const { analytics, phase } = useStore()
  if (!analytics) {
    return <Navigate to={phase === 'empty' ? '/upload' : '/upload'} replace />
  }
  return <>{children}</>
}

function RouteFallback() {
  return (
    <div className="shell py-16">
      <LoadingBlock lines={4} />
    </div>
  )
}
