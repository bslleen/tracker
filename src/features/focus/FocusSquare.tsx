import { cn } from '@/lib/cn'
import { shiftAccentHue } from '@/lib/color'
import { FOCUS_TICK_MS } from './focusSession'

export interface FocusSquareProps {
  /** 0..1 fill of the current chunk. */
  progress: number
  hue: number
  isComplete: boolean
  prefersReducedMotion: boolean
}

/**
 * The one square. Fill is a `clip-path: inset(...)` on a solid layer rather
 * than a `scaleY` transform so the edge-glow bar (a separate element) can
 * track the same fill line without being squashed by the same scale. Both
 * are driven by a CSS transition keyed to FOCUS_TICK_MS rather than per-frame
 * JS, so the ~5fps progress updates from the parent read as a smooth,
 * continuous fill instead of visible steps.
 */
export function FocusSquare({ progress, hue, isComplete, prefersReducedMotion }: FocusSquareProps) {
  const fillColor = shiftAccentHue(hue)
  const clamped = Math.min(1, Math.max(0, progress))
  const transition = prefersReducedMotion ? undefined : `all ${FOCUS_TICK_MS}ms linear`

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[28%] bg-chunk-empty',
        isComplete && !prefersReducedMotion && 'animate-[focus-pop_560ms_var(--ease-out)]',
      )}
      style={{ width: 'min(56vmin, 360px)', height: 'min(56vmin, 360px)' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: fillColor,
          clipPath: `inset(${(1 - clamped) * 100}% 0 0 0)`,
          transition,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 h-2"
        style={{
          bottom: `calc(${clamped * 100}% - 4px)`,
          opacity: clamped > 0 && clamped < 1 ? 0.85 : 0,
          boxShadow: `0 0 18px 4px ${fillColor}`,
          transition,
        }}
      />
    </div>
  )
}
