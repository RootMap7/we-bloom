import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'
import type { WrappedSlideData } from '@/lib/analytics'
import { fade, slideVariants, transition } from '@/lib/motion'
import { useStore } from '@/lib/store'

const ACCENTS: Record<WrappedSlideData['accent'], { panel: string; text: string; sub: string }> = {
  clay: { panel: 'bg-clay-500', text: 'text-white', sub: 'text-white/75' },
  honey: { panel: 'bg-honey-300', text: 'text-ink', sub: 'text-ink/70' },
  sage: { panel: 'bg-sage', text: 'text-white', sub: 'text-white/75' },
  dusk: { panel: 'bg-dusk', text: 'text-white', sub: 'text-white/75' },
  ink: { panel: 'bg-ink', text: 'text-cream', sub: 'text-cream/70' },
}

/** PRODUCT.md §28, §29 — the story version, full-bleed and outside the shell. */
export function Wrapped() {
  const { wrapped } = useStore()
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const total = wrapped.length
  const slide = wrapped[index]

  const go = useCallback(
    (delta: number) => {
      setDirection(delta)
      setIndex((current) => {
        const next = current + delta
        if (next < 0 || next >= total) return current
        return next
      })
    },
    [total],
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        setDirection(-1)
        setIndex(0)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [go])

  if (!total || !slide) {
    return (
      <div className="min-h-dvh bg-cream px-5 py-16">
        <div className="shell">
          <EmptyState
            title="Your story is still loading."
            body="There isn't enough in this conversation to build a Wrapped out of yet."
            icon="✦"
            action={<Link to="/report" className="font-semibold text-clay-600 underline underline-offset-4">Back to the report</Link>}
          />
        </div>
      </div>
    )
  }

  const accent = ACCENTS[slide.accent]
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1)
  }

  const shareText = buildShareText(slide)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'We Bloom', text: shareText })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      }
    } catch {
      // The user dismissed the sheet, or the browser refused. Nothing to fix.
    }
  }

  return (
    <div className={`relative flex min-h-dvh flex-col overflow-hidden ${accent.panel}`}>
      {/* Progress — PRODUCT.md §29 */}
      <div className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
        <ol
          className="flex gap-1.5"
          aria-label={`Slide ${index + 1} of ${total}`}
        >
          {wrapped.map((s, i) => (
            <li key={s.id} className="h-1 flex-1 overflow-hidden rounded-pill bg-black/15">
              <span
                className={`block h-full rounded-pill transition-all duration-400 ease-bloom ${
                  i <= index ? 'w-full bg-white/90' : 'w-0 bg-white/90'
                }`}
              />
            </li>
          ))}
        </ol>

        <div className="mt-3 flex items-center justify-between">
          <Link
            to="/report"
            className={`rounded-pill px-3 py-2 text-sm font-medium ${accent.sub} transition-colors hover:bg-black/10`}
          >
            ← The full report
          </Link>
          <span className={`tnum text-sm ${accent.sub}`}>
            {index + 1} / {total}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.section
            key={slide.id}
            custom={direction}
            variants={reduced ? fade : slideVariants}
            initial={reduced ? 'hidden' : 'enter'}
            animate={reduced ? 'visible' : 'center'}
            exit="exit"
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className="w-full max-w-[42rem] text-center"
            aria-live="polite"
          >
            {slide.eyebrow ? (
              <p
                className={`mb-4 text-sm font-semibold uppercase tracking-[0.16em] ${accent.sub}`}
              >
                {slide.eyebrow}
              </p>
            ) : null}

            <h1
              className={`font-display text-balance ${accent.text} ${
                slide.kind === 'emoji'
                  ? 'text-[5rem] leading-none sm:text-[7rem]'
                  : slide.kind === 'title' || slide.kind === 'outro'
                    ? 'text-display-lg'
                    : 'text-display-xl'
              }`}
            >
              {slide.headline}
            </h1>

            {slide.sub ? (
              <p className={`mt-4 text-xl leading-relaxed text-pretty sm:text-2xl ${accent.text}`}>
                {slide.sub}
              </p>
            ) : null}

            {slide.detail ? (
              <p
                className={`mx-auto mt-5 max-w-[42ch] text-base leading-relaxed text-pretty sm:text-lg ${accent.sub}`}
              >
                {slide.detail}
              </p>
            ) : null}

            {slide.kind === 'outro' ? (
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDirection(-1)
                    setIndex(0)
                  }}
                >
                  Watch it again
                </Button>
                <Link
                  to="/report"
                  className={`rounded-pill px-4 py-3 text-sm font-semibold ${accent.text} underline underline-offset-4`}
                >
                  See the full report
                </Link>
              </div>
            ) : null}
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="relative z-20 flex items-center justify-between gap-3 px-4 pb-6 sm:px-6 sm:pb-8">
        <NavButton
          onClick={() => go(-1)}
          disabled={index === 0}
          label="Previous slide"
          accent={accent.text}
        >
          ←
        </NavButton>

        <button
          type="button"
          onClick={share}
          className={`touch-target rounded-pill px-4 py-2 text-sm font-semibold ${accent.text} transition-colors hover:bg-black/10`}
        >
          Share this slide
        </button>

        <NavButton
          onClick={() => go(1)}
          disabled={index === total - 1}
          label="Next slide"
          accent={accent.text}
        >
          →
        </NavButton>
      </div>

      <p className="pb-4 text-center text-xs text-black/30 sm:pb-6">
        Swipe, or use the arrow keys.
      </p>

      {/* A soft wash behind the type, so long headlines stay readable. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition.slow}
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)',
        }}
      />
    </div>
  )
}

function NavButton({
  onClick,
  disabled,
  label,
  accent,
  children,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  accent: string
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`touch-target flex h-12 w-12 items-center justify-center rounded-pill border border-white/30 text-lg ${accent} transition-all duration-200 ease-bloom hover:bg-black/10 disabled:opacity-30`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}

/** Share copy is built from the slide, so we never share more than it shows. */
function buildShareText(slide: WrappedSlideData): string {
  const parts = [slide.eyebrow, slide.headline, slide.sub].filter(Boolean)
  return `${parts.join(' — ')}\n\nMy conversation, wrapped by We Bloom.`
}
