import { useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { dateNightCoupon, loveLetter } from '@/content/rewards'
import { celebrate } from '@/lib/celebrate'
import { sound } from '@/lib/sound'

/**
 * The reward for passing a round. Copy lives in src/content/rewards.ts so the
 * personal part of the app is one file, editable without touching components.
 */
export function UnlockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    sound.unlock()
    void celebrate()
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="You unlocked something" size="lg">
      <div className="space-y-8">
        <article>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
            {loveLetter.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-display-sm text-ink text-balance">
            {loveLetter.title}
          </h3>
          <div className="mt-3 space-y-3">
            {loveLetter.lines.map((line, i) => (
              <p key={i} className="text-base leading-relaxed text-ink-muted text-pretty">
                {line}
              </p>
            ))}
          </div>
          <p className="mt-4 font-display text-lg text-clay-600">{loveLetter.signature}</p>
        </article>

        <article className="rounded-card border-2 border-dashed border-clay-200 bg-clay-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-clay-600">
            {dateNightCoupon.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-display-sm text-ink text-balance">
            {dateNightCoupon.title}
          </h3>
          <p className="mt-1.5 text-sm text-ink-muted">{dateNightCoupon.subtitle}</p>

          <ul className="mt-4 space-y-2">
            {dateNightCoupon.terms.map((term) => (
              <li key={term} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
                <span aria-hidden="true" className="text-clay-500">
                  ✓
                </span>
                {term}
              </li>
            ))}
          </ul>

          <p className="mt-5 flex items-center justify-between border-t border-clay-200 pt-4">
            <span className="text-xs uppercase tracking-[0.12em] text-ink-faint">Code</span>
            <span className="tnum font-display text-xl text-ink">{dateNightCoupon.code}</span>
          </p>
        </article>

        <p className="text-xs leading-relaxed text-ink-faint text-pretty">
          Written by whoever set this up, not by the data. Edit it in
          src/content/rewards.ts.
        </p>
      </div>
    </Modal>
  )
}
