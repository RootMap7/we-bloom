import { useRef, useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { insideJoke } from '@/content/rewards'
import { celebrate } from '@/lib/celebrate'
import { sound } from '@/lib/sound'

const TAPS_NEEDED = 5
/** Taps must land inside this window of each other to count as a run. */
const WINDOW_MS = 1500

/**
 * Wraps anything tappable and counts rapid taps. Five in quick succession
 * reveals the hidden message.
 *
 * The wrapper is deliberately not a button: it sits around an avatar that may
 * already be inside a link or panel, and nesting interactive elements breaks
 * both keyboard navigation and the accessibility tree. Instead it stays
 * invisible to assistive technology, which is the right call for an Easter egg
 * that nobody is meant to be told about.
 */
export function SecretTap({ children }: { children: ReactNode }) {
  const [found, setFound] = useState(false)
  const taps = useRef<number[]>([])

  const onTap = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < WINDOW_MS), now]

    if (taps.current.length >= TAPS_NEEDED) {
      taps.current = []
      setFound(true)
      sound.unlock()
      void celebrate()
    } else if (taps.current.length > 1) {
      // A quiet tick from the second tap onwards: enough of a hint that
      // something is happening, without announcing it.
      sound.tap()
    }
  }

  return (
    <>
      <span onClick={onTap} className="inline-flex cursor-pointer select-none">
        {children}
      </span>

      <Modal open={found} onClose={() => setFound(false)} title={insideJoke.title}>
        <div className="space-y-3">
          {insideJoke.lines.map((line, i) => (
            <p key={i} className="text-base leading-relaxed text-ink-muted text-pretty">
              {line}
            </p>
          ))}
          <p className="border-t border-surface-line pt-3 text-xs leading-relaxed text-ink-faint text-pretty">
            {insideJoke.footer}
          </p>
        </div>
      </Modal>
    </>
  )
}
