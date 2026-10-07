import type { Variants } from 'motion/react'
import { SPRING_SOFT } from '@/lib/motion'

/** CLAUDE.md: "Elements enter with a stagger of 120ms." One shared file so every slide's timing feels consistent. */
export const REVEAL_STAGGER_SEC = 0.12

export const ENTER_SPRING = SPRING_SOFT

export function containerVariants(prefersReducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : REVEAL_STAGGER_SEC } },
  }
}

/** Fade + rise — captions, numerals, anything that isn't a masked word reveal. */
export function itemVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
  }
  return {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: ENTER_SPRING },
  }
}

/** The line wrapper needs `overflow: hidden` — the word itself translates up from 100%, masked by that wrapper. */
export function maskedWordVariants(prefersReducedMotion: boolean): Variants {
  if (prefersReducedMotion) {
    return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
  }
  return {
    hidden: { y: '100%' },
    visible: { y: '0%', transition: ENTER_SPRING },
  }
}
