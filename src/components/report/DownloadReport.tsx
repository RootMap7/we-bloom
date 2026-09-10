import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RevealCard } from '@/components/ui/Card'
import { shortName } from '@/lib/format'
import { downloadKeyMetricsPdf } from '@/lib/report-pdf'
import { useAnalytics, useStore } from '@/lib/store'

type State = 'idle' | 'working' | 'done' | 'error'

/**
 * PRODUCT.md §30 — a downloadable report, restricted to the headline numbers.
 * The PDF is built in the browser; nothing is uploaded to produce it.
 */
export function DownloadReport() {
  const a = useAnalytics()
  const { name } = useStore()
  const [state, setState] = useState<State>('idle')

  const displayAll = a.meta.participants.map(name)
  const display = (author: string) => shortName(name(author), displayAll)

  const run = async () => {
    setState('working')
    try {
      await downloadKeyMetricsPdf(a, display)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <RevealCard className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-clay-600">
          Take it with you
        </p>
        <h3 className="mt-1.5 font-display text-display-sm text-ink text-balance">
          Download the key numbers
        </h3>
        <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-ink-muted text-pretty">
          One page of headline figures — totals, rhythm, replies, who starts it, and a line per
          person. No charts, and none of your messages. Built here in your browser, so nothing is
          uploaded to make it.
        </p>

        {state === 'error' ? (
          <p className="mt-3 text-sm font-medium text-clay-700">
            That didn't work. Refresh the page and try once more.
          </p>
        ) : null}
        {state === 'done' ? (
          <p className="mt-3 text-sm font-medium text-ink-muted">
            Saved to your downloads.
          </p>
        ) : null}
      </div>

      <div className="shrink-0">
        <Button onClick={run} disabled={state === 'working'}>
          {state === 'working' ? 'Building the PDF…' : 'Download PDF'}
        </Button>
      </div>
    </RevealCard>
  )
}
