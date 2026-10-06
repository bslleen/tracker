import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui'

export interface MonthReviewActionBarProps {
  isDone: boolean
  isApplying: boolean
  pendingCount: number
  doneMessage: string
  onApply: () => void
  /** Reports its own rendered height so the page can pad the content above it by exactly that much (see MonthReview.tsx). */
  onHeightChange: (height: number) => void
}

/**
 * `position: sticky`, not fixed — a real flow element at the end of the
 * page's content, so it only "floats" once the content taller than the
 * viewport has scrolled it to the bottom edge (CLAUDE.md asks for this
 * explicitly: "not a fixed hack"). z-sticky keeps it above the cards; the
 * bottom offset clears the mobile tab bar, which sits at --z-nav above it.
 */
export function MonthReviewActionBar({ isDone, isApplying, pendingCount, doneMessage, onApply, onHeightChange }: MonthReviewActionBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const fadeDuration = prefersReducedMotion ? 0 : 0.5

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) onHeightChange(entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onHeightChange])

  return (
    <div
      ref={ref}
      className="sticky bottom-[calc(var(--nav-bottom-height)+env(safe-area-inset-bottom))] z-sticky rounded-xl border border-hairline bg-surface p-4 shadow-lg md:bottom-0"
    >
      <AnimatePresence mode="wait">
        {isDone ? (
          <motion.p
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: fadeDuration }}
            className="text-center text-[length:var(--text-small)] text-text-2"
          >
            {doneMessage}
          </motion.p>
        ) : (
          <motion.div
            key="apply"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: fadeDuration }}
            className="flex items-center justify-between gap-4"
          >
            <span className="text-[length:var(--text-small)] text-text-2">
              {pendingCount} goal{pendingCount === 1 ? '' : 's'} to review
            </span>
            <Button onClick={onApply} disabled={isApplying}>
              {isApplying ? 'Applying…' : 'Apply choices'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
