import type { Transition, Variants } from 'framer-motion'

/**
 * Motion tokens — CLAUDE.md §Motion, PRODUCT.md §42.
 *
 * Everything sits in the 200–600ms band on a single easing curve, so the whole
 * product moves like one thing. Components read these rather than inventing
 * their own durations.
 *
 * Reduced motion is handled two ways: the CSS media query in index.css kills
 * transitions globally, and components that animate presence use
 * `useReducedMotion()` to swap to a plain cross-fade.
 */
export const EASE_BLOOM = [0.22, 1, 0.36, 1] as const

export const transition: Record<'fast' | 'base' | 'slow', Transition> = {
  fast: { duration: 0.2, ease: EASE_BLOOM },
  base: { duration: 0.35, ease: EASE_BLOOM },
  slow: { duration: 0.6, ease: EASE_BLOOM },
}

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -8, transition: transition.fast },
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
}

/** Parent that reveals children one after another. */
export const stagger = (delay = 0.06): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
})

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transition.base },
  exit: { opacity: 0, scale: 0.98, transition: transition.fast },
}

/** Wrapped slide transitions, direction-aware. */
export const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0, transition: { ...transition.slow, duration: 0.45 } },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -48 : 48,
    transition: transition.fast,
  }),
}

/** Scroll-reveal props, applied with `{...revealOnScroll}`. */
export const revealOnScroll = {
  initial: 'hidden' as const,
  whileInView: 'visible' as const,
  viewport: { once: true, margin: '-60px' },
  variants: fadeRise,
}
