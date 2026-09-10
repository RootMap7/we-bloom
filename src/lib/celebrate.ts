/**
 * Confetti, in brand colours, loaded on demand.
 *
 * PRODUCT.md §42 treats motion as decoration that goes first: if the visitor
 * asked for reduced motion, nothing fires at all. canvas-confetti is imported
 * dynamically so it never lands in the initial bundle.
 */

const COLORS = ['#E07A5F', '#F2CC8F', '#81B29A', '#6C7A9C', '#FADFD6']

function motionAllowed(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export async function burst(origin?: { x: number; y: number }): Promise<void> {
  if (!motionAllowed()) return
  try {
    const { default: confetti } = await import('canvas-confetti')
    void confetti({
      particleCount: 70,
      spread: 62,
      startVelocity: 34,
      decay: 0.92,
      scalar: 0.9,
      colors: COLORS,
      origin: origin ?? { x: 0.5, y: 0.6 },
      disableForReducedMotion: true,
    })
  } catch {
    // Confetti is decoration; failing to load it changes nothing that matters.
  }
}

/** The bigger one, for a passed round or an unlock. */
export async function celebrate(): Promise<void> {
  if (!motionAllowed()) return
  try {
    const { default: confetti } = await import('canvas-confetti')
    const fire = (particleRatio: number, opts: Record<string, unknown>) =>
      void confetti({
        particleCount: Math.floor(200 * particleRatio),
        colors: COLORS,
        disableForReducedMotion: true,
        ...opts,
      })

    fire(0.25, { spread: 26, startVelocity: 55, origin: { y: 0.65 } })
    fire(0.2, { spread: 60, origin: { y: 0.65 } })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { y: 0.65 } })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { y: 0.65 } })
    fire(0.1, { spread: 120, startVelocity: 45, origin: { y: 0.65 } })
  } catch {
    // As above.
  }
}
