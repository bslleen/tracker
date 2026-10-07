import { useAnimate } from 'motion/react'
import { memo, useEffect, useState } from 'react'
import { shiftAccentHue } from '@/lib/color'
import { cn } from '@/lib/cn'
import { SPRING_BOUNCY } from '@/lib/motion'

export interface ChunkCellProps {
  index: number
  filled: boolean
  isNext: boolean
  isGlowing: boolean
  isRippleOrigin: boolean
  /** Stagger delay for this cell's fill animation, ms. Irrelevant (and ignored by memo) unless `filled` just flipped true. */
  delayMs: number
  cellSize: number
  marginBottom: number
  hueShiftDeg: number
  interactive: boolean
  tabbable: boolean
  prefersReducedMotion: boolean
  label: string
}

/**
 * Memoized on (filled, isNext, isGlowing, index, cellSize) only — exactly
 * the props from CLAUDE.md's instruction, so a fill/undo only re-renders the
 * handful of cells whose state actually changed, not the full grid. Click,
 * keyboard, and hover handling all live on the grid container (see
 * ChunkGrid's pointer/keydown handlers), not here — a cell has no onClick of
 * its own, both for that performance reason and because adjacent cells'
 * enlarged hit areas overlap by design (resolved by nearest-cell-from-point
 * at the container level instead of per-cell DOM hit-testing).
 */
export const ChunkCell = memo(
  function ChunkCell({
    index,
    filled,
    isNext,
    isGlowing,
    isRippleOrigin,
    delayMs,
    cellSize,
    marginBottom,
    hueShiftDeg,
    interactive,
    tabbable,
    prefersReducedMotion,
    label,
  }: ChunkCellProps) {
    const [scope, animate] = useAnimate<HTMLDivElement>()
    const [wasFilled, setWasFilled] = useState(filled)
    const justChanged = filled !== wasFilled
    if (justChanged) {
      setWasFilled(filled)
    }

    useEffect(() => {
      if (!justChanged || prefersReducedMotion) return
      const controls = filled
        ? animate(scope.current, { scale: [0.6, 1] }, { ...SPRING_BOUNCY, delay: delayMs / 1000 })
        : animate(scope.current, { scale: [1, 0.9, 1] }, SPRING_BOUNCY)
      return () => controls.stop()
      // Only the fact that it JUST changed should retrigger this — delayMs
      // and `animate`/`scope` are stable for the lifetime of this trigger.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [justChanged])

    return (
      <div
        ref={scope}
        data-chunk-index={index}
        role={interactive ? 'option' : undefined}
        aria-label={interactive ? label : undefined}
        aria-selected={interactive ? filled : undefined}
        tabIndex={interactive ? (tabbable ? 0 : -1) : undefined}
        className={cn('relative rounded-[28%] transition-colors', !filled && 'bg-chunk-empty', interactive && 'cursor-pointer')}
        style={{
          width: cellSize,
          height: cellSize,
          marginBottom,
          transitionDuration: 'var(--duration-base)',
          backgroundColor: filled ? shiftAccentHue(hueShiftDeg) : undefined,
          boxShadow: isGlowing ? '0 0 12px var(--accent-glow)' : isNext ? 'inset 0 0 0 1px var(--accent)' : undefined,
          animation: isNext && !prefersReducedMotion ? 'chunk-breathe 2.4s ease-in-out infinite' : undefined,
          transform: 'scale(calc(1 + 0.35 * var(--prox, 0)))',
          filter: 'brightness(calc(1 + 0.15 * var(--prox, 0)))',
        }}
      >
        {isRippleOrigin && !prefersReducedMotion && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[28%] bg-accent"
            style={{ animation: 'chunk-ripple 500ms ease-out forwards' }}
          />
        )}
        {/* Enlarged invisible hit area for touch targets — ownership of overlapping
            regions is resolved by nearest-cell-from-point on the container, not by
            which element this technically sits on top of. */}
        <span aria-hidden="true" className="absolute -inset-[3px]" />
      </div>
    )
  },
  // delayMs and isRippleOrigin are deliberately excluded: they only matter
  // during the one render where `filled` itself changes, so a stale value
  // on an otherwise-unchanged cell is harmless. Everything else that can
  // change the cell's static appearance (hue shift, label text, the
  // interactive/reduced-motion flags) must stay in the comparison, or a
  // goal's accent shade or chunk size changing wouldn't repaint already
  // -rendered cells.
  (prev, next) =>
    prev.filled === next.filled &&
    prev.isNext === next.isNext &&
    prev.isGlowing === next.isGlowing &&
    prev.index === next.index &&
    prev.cellSize === next.cellSize &&
    prev.marginBottom === next.marginBottom &&
    prev.tabbable === next.tabbable &&
    prev.hueShiftDeg === next.hueShiftDeg &&
    prev.interactive === next.interactive &&
    prev.prefersReducedMotion === next.prefersReducedMotion &&
    prev.label === next.label,
)
