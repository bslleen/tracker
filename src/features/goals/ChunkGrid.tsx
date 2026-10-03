import { useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

export interface ChunkGridProps {
  total: number
  completed?: number
  /**
   * Lightweight stand-in for the richer <ChunkGrid readOnly> that lands in
   * Phase 6 (tap-to-log interactions, etc). This version only ever renders
   * read-only; the prop exists so call sites don't need to change later.
   */
  readOnly?: boolean
  className?: string
}

const MAX_STAGGER_INDEX = 60
const STAGGER_STEP_MS = 4
const RIPPLE_STEP_MS = 35

export function ChunkGrid({ total, completed = 0, className }: ChunkGridProps) {
  const prefersReducedMotion = useReducedMotion()

  // Squares already on screen keep their DOM node across renders (same key,
  // same index), so re-setting the same `animation` value is a no-op and the
  // one-time pop-in only plays on mount/for newly-added squares. Indices that
  // just crossed from empty to filled (rippleStart..completed) instead get a
  // staggered transition-delay on their color transition — a ripple that
  // only fires on the squares that actually just filled. Tracked by
  // mirroring `completed` into state and comparing during render (React's
  // "adjusting state when a prop changes" pattern) rather than a ref, so the
  // comparison itself isn't a render-time ref read.
  const [previousCompleted, setPreviousCompleted] = useState(completed)
  const [rippleStart, setRippleStart] = useState(completed)
  if (completed !== previousCompleted) {
    setRippleStart(previousCompleted)
    setPreviousCompleted(completed)
  }

  const squares = Array.from({ length: Math.max(0, total) }, (_, index) => index < completed)

  return (
    <div
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(10px,1fr))] gap-1', className)}
      role="img"
      aria-label={`${completed} of ${total} chunks complete`}
    >
      {squares.map((filled, index) => {
        const isRippling = !prefersReducedMotion && filled && index >= rippleStart && index < completed
        return (
          <div
            key={index}
            className={cn(
              'aspect-square rounded-[2px] transition-colors duration-300',
              filled ? 'bg-accent' : 'bg-chunk-empty',
            )}
            style={{
              transitionDelay: isRippling ? `${(index - rippleStart) * RIPPLE_STEP_MS}ms` : undefined,
              ...(prefersReducedMotion
                ? undefined
                : {
                    animation: 'chunk-pop-in 220ms var(--ease-out) backwards',
                    animationDelay: `${Math.min(index, MAX_STAGGER_INDEX) * STAGGER_STEP_MS}ms`,
                  }),
            }}
          />
        )
      })}
    </div>
  )
}
