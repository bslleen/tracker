import type { Transition } from 'motion/react'

/**
 * The app's only three spring presets (CLAUDE.md: "Motion is physical
 * (springs)... purposeful"). Every animated component picks one of these
 * instead of inventing its own stiffness/damping — consolidated from what
 * was already in use across the app, which had drifted into ~6 near-
 * duplicate ad hoc values.
 */

/** Calm, slightly slower settle — card hover/tap feedback, chart line reveals, review slide entrances. */
export const SPRING_SOFT: Transition = { type: 'spring', stiffness: 300, damping: 30 }

/** The default for most UI motion — dialogs, drawers, pills, list/card entrances. */
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 380, damping: 32 }

/** Punchier, a touch of overshoot — chunk fill/ripple, completion bursts, numbers ticking in. */
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 480, damping: 26 }
