import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { UploadDropzone } from '@/components/upload/UploadDropzone'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressBar, SegmentedControl, Toggle } from '@/components/ui/Controls'
import { ErrorState } from '@/components/ui/States'
import { fade, fadeRise, transition } from '@/lib/motion'
import { useStore } from '@/lib/store'

export function Upload() {
  const {
    phase,
    progress,
    progressLabel,
    error,
    analytics,
    analyseFile,
    loadDemo,
    reset,
    saveLocally,
    setSaveLocally,
  } = useStore()
  const navigate = useNavigate()

  const busy = phase === 'reading' || phase === 'parsing' || phase === 'analyzing'

  useEffect(() => {
    if (phase === 'ready' && analytics) navigate('/report')
  }, [phase, analytics, navigate])

  return (
    <div className="min-h-dvh bg-cream">
      <header className="shell flex h-16 items-center justify-between sm:h-20">
        <Logo />
        <Link
          to="/privacy"
          className="rounded-pill px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
        >
          Privacy
        </Link>
      </header>

      <main className="shell pb-20 pt-6 sm:pt-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-display-lg text-ink text-balance">
            Let's have a look at your conversation.
          </h1>
          <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-ink-muted text-pretty">
            Everything happens in this browser tab. Your messages are never uploaded, and nothing
            is kept unless you tick the box below.
          </p>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div
                  key="progress"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fade}
                >
                  <ProgressPanel progress={progress} label={progressLabel} />
                </motion.div>
              ) : phase === 'error' && error ? (
                <motion.div
                  key="error"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fadeRise}
                >
                  <ErrorState
                    title={error.message}
                    hint={error.hint}
                    action={
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={reset}>Try another file</Button>
                        <Button variant="secondary" onClick={loadDemo}>
                          See the sample instead
                        </Button>
                      </div>
                    }
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="dropzone"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={fade}
                >
                  <UploadDropzone onFile={analyseFile} disabled={busy} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Card className="mt-6">
            <Toggle
              checked={saveLocally}
              onChange={setSaveLocally}
              label="Keep this report on this device"
              description="Saves the finished report — not your messages — in this browser, so it's still here next time. You can delete it at any point from the Privacy page."
            />
          </Card>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-ink-muted">Don't have an export to hand?</span>
            <button
              type="button"
              onClick={loadDemo}
              disabled={busy}
              className="font-semibold text-clay-600 underline-offset-4 hover:underline disabled:opacity-50"
            >
              Open the sample conversation
            </button>
          </div>

          <ExportInstructions />
        </div>
      </main>
    </div>
  )
}

function ProgressPanel({ progress, label }: { progress: number; label: string }) {
  return (
    <Card className="py-10 text-center">
      <p className="font-display text-display-sm text-ink text-balance">{label || 'Reading…'}</p>
      <div className="mx-auto mt-6 max-w-sm">
        <ProgressBar value={progress} label="Analysis progress" />
        <p className="mt-2 tnum text-sm text-ink-faint" aria-live="polite">
          {Math.round(progress * 100)}%
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-[42ch] text-sm leading-relaxed text-ink-muted text-pretty">
        Large conversations take a few seconds. This is your device doing the work, not a server.
      </p>
    </Card>
  )
}

/**
 * Exporting is where people get stuck, so the instructions are a real section
 * rather than a tooltip.
 */
function ExportInstructions() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')

  const steps: Record<'ios' | 'android', string[]> = {
    ios: [
      'Open the conversation in WhatsApp.',
      'Tap the contact or group name at the top.',
      'Scroll down and tap Export Chat.',
      'Choose Without Media — media files are stripped out anyway, and the export is much faster.',
      'Save the file somewhere you can reach it, then come back here and drop it in.',
    ],
    android: [
      'Open the conversation in WhatsApp.',
      'Tap the three dots in the top right.',
      'Tap More → Export chat.',
      'Choose Without media.',
      'Save or share the file to this device, then drop it in above.',
    ],
  }

  return (
    <section className="mt-14">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-display-sm text-ink">How to export a chat</h2>
        <SegmentedControl
          label="Platform"
          value={platform}
          onChange={setPlatform}
          options={[
            { value: 'ios', label: 'iPhone' },
            { value: 'android', label: 'Android' },
          ]}
        />
      </div>

      <Card>
        <AnimatePresence mode="wait">
          <motion.ol
            key={platform}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition.fast}
            className="space-y-3"
          >
            {steps[platform].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-clay-100 text-xs font-semibold text-clay-700"
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-ink-muted text-pretty">{step}</span>
              </li>
            ))}
          </motion.ol>
        </AnimatePresence>

        <p className="mt-5 border-t border-surface-line pt-4 text-sm leading-relaxed text-ink-muted">
          A WhatsApp export contains the full text of your conversation. It is worth knowing that
          before you share one with anything — including us.{' '}
          <Link to="/privacy" className="font-medium text-clay-600 underline underline-offset-4">
            What we do with it
          </Link>
        </p>
      </Card>
    </section>
  )
}
