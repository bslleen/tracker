import * as Popover from '@radix-ui/react-popover'
import { useReducedMotion } from 'motion/react'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { shiftAccentHue } from '@/lib/color'
import { getOverlayRoot } from '@/lib/overlay-root'
import { cn } from '@/lib/cn'
import { ChunkCell } from './ChunkCell'
import { ChunkGridCanvas } from './ChunkGridCanvas'
import { computeChunkGridLayout, getNeighborIndices, type ChunkGridLayout } from './chunkGridLayout'

export interface ChunkGridProps {
  total: number
  completed: number
  chunkMinutes: number
  /** 0-30 hue shift within the accent green family, distinguishing subjects. */
  accentShade?: number
  interactive?: boolean
  size?: 'auto' | 'sm' | 'lg'
  onFillTo?: (index: number) => void
  onUndoLast?: () => void
  /** Used to build the container's aria-label, e.g. "French: 120 of 480 chunks completed". */
  label?: string
  className?: string
}

const CANVAS_THRESHOLD = 1500
const GLOW_WINDOW = 12
const HOUR_LABEL_MIN_CONTAINER_WIDTH = 480
const LONG_PRESS_MS = 500
const PROXIMITY_RADIUS = 2

export function ChunkGrid({
  total,
  completed,
  chunkMinutes,
  accentShade = 0,
  interactive = false,
  size = 'auto',
  onFillTo,
  onUndoLast,
  label,
  className,
}: ChunkGridProps) {
  if (size === 'sm') {
    return (
      <MiniChunkGrid total={total} completed={completed} accentShade={accentShade} className={className} />
    )
  }

  if (total > CANVAS_THRESHOLD) {
    return (
      <ChunkGridCanvas
        total={total}
        completed={completed}
        chunkMinutes={chunkMinutes}
        accentShade={accentShade}
        interactive={interactive}
        onFillTo={onFillTo}
        onUndoLast={onUndoLast}
        label={label}
        className={className}
      />
    )
  }

  return (
    <FullChunkGrid
      total={total}
      completed={completed}
      chunkMinutes={chunkMinutes}
      accentShade={accentShade}
      interactive={interactive}
      size={size}
      onFillTo={onFillTo}
      onUndoLast={onUndoLast}
      label={label}
      className={className}
    />
  )
}

/** size="sm": a quiet static preview for cards and the heatmap row. No labels, no hover, no glow. */
function MiniChunkGrid({
  total,
  completed,
  accentShade = 0,
  className,
}: Pick<ChunkGridProps, 'total' | 'completed' | 'accentShade' | 'className'>) {
  const prefersReducedMotion = useReducedMotion()
  const count = Math.max(0, total)

  return (
    <div
      className={cn('grid grid-cols-[repeat(auto-fill,minmax(6px,1fr))] gap-1', className)}
      role="img"
      aria-label={`${completed} of ${total} chunks completed`}
    >
      {Array.from({ length: count }, (_, index) => {
        const filled = index < (completed ?? 0)
        return (
          <div
            key={index}
            className={cn('aspect-square rounded-[2px]', !filled && 'bg-chunk-empty')}
            style={{
              backgroundColor: filled ? shiftAccentHue(accentShade) : undefined,
              animation: prefersReducedMotion ? undefined : 'chunk-pop-in 180ms var(--ease-out) backwards',
              animationDelay: prefersReducedMotion ? undefined : `${Math.min(index, 40) * 3}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

interface FullChunkGridProps extends Required<Pick<ChunkGridProps, 'total' | 'completed' | 'chunkMinutes' | 'accentShade' | 'interactive' | 'size'>> {
  onFillTo?: (index: number) => void
  onUndoLast?: () => void
  label?: string
  className?: string
}

function FullChunkGrid({
  total,
  completed,
  chunkMinutes,
  accentShade,
  interactive,
  size,
  onFillTo,
  onUndoLast,
  label,
  className,
}: FullChunkGridProps) {
  const prefersReducedMotion = useReducedMotion()
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const { ref: outerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>()
  const gridRef = useRef<HTMLDivElement>(null)

  const layout = computeChunkGridLayout({
    containerWidth: containerWidth || 1,
    chunkMinutes,
    pointerKind: isCoarsePointer ? 'coarse' : 'fine',
  })
  const effectiveLayout: ChunkGridLayout =
    size === 'lg' ? { ...layout, cellSize: Math.min(32, Math.max(16, layout.cellSize * 1.2)) } : layout

  const showHourLabels = effectiveLayout.rowsPerHour !== null && containerWidth >= HOUR_LABEL_MIN_CONTAINER_WIDTH

  // "Adjust state when a prop changes" (React's documented pattern) rather
  // than an effect: the previous `completed` is needed synchronously, in
  // this same render, to compute the fill/undo range and stagger delays.
  const [previousCompleted, setPreviousCompleted] = useState(completed)
  if (completed !== previousCompleted) {
    setPreviousCompleted(completed)
  }
  const rangeStart = Math.min(previousCompleted, completed)
  const rangeEnd = Math.max(previousCompleted, completed)
  const isFilling = completed > previousCompleted

  const [focusedIndex, setFocusedIndex] = useState(() => Math.min(completed, Math.max(0, total - 1)))
  const [popover, setPopover] = useState<{ index: number; x: number; y: number } | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

  const resolveIndexFromPoint = (clientX: number, clientY: number): number | null => {
    const container = gridRef.current
    if (!container) return null
    const target = document.elementFromPoint(clientX, clientY)
    const startEl = target instanceof Element ? target.closest('[data-chunk-index]') : null
    if (!startEl) return null
    const startIndex = Number(startEl.getAttribute('data-chunk-index'))

    let bestIndex = startIndex
    let bestDist = Number.POSITIVE_INFINITY
    for (const candidate of getNeighborIndices(startIndex, total, effectiveLayout.columns, 1)) {
      const el = container.children[candidate] as HTMLElement | undefined
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const dist = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2))
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = candidate
      }
    }
    return bestIndex
  }

  function activate(index: number) {
    if (!interactive) return
    if (index === completed - 1) {
      onUndoLast?.()
    } else if (index >= completed) {
      onFillTo?.(index)
    }
    // Taps on an already-filled cell that isn't the last one are a no-op —
    // we don't want a mis-tap silently undoing history.
  }

  // Hover proximity + press elevation: one listener on the container (not
  // per cell), imperative DOM writes only (no React state), so 1,000+ cells
  // never re-render from a pointermove. --prox drives transform/filter only
  // (no layout shift); the single nearest cell also gets the `raised` token
  // so it paints above its neighbors — scoped to this grid's own isolated
  // stacking context, cleared the moment the pointer leaves it.
  useEffect(() => {
    if (!interactive || prefersReducedMotion || isCoarsePointer) return
    const container = gridRef.current
    if (!container) return

    let rafId: number | null = null
    let affected: number[] = []
    let raisedIndex: number | null = null

    function clearAffected() {
      const c = gridRef.current
      if (!c) return
      for (const index of affected) {
        const el = c.children[index] as HTMLElement | undefined
        el?.style.removeProperty('--prox')
      }
      if (raisedIndex !== null) {
        const el = c.children[raisedIndex] as HTMLElement | undefined
        el?.style.removeProperty('z-index')
        raisedIndex = null
      }
      affected = []
    }

    function handleMove(event: PointerEvent) {
      if (rafId !== null) return
      const { clientX, clientY } = event
      rafId = requestAnimationFrame(() => {
        rafId = null
        const c = gridRef.current
        if (!c) return
        const centerIndex = resolveIndexFromPoint(clientX, clientY)
        if (centerIndex === null) {
          clearAffected()
          return
        }

        const neighbors = getNeighborIndices(centerIndex, total, effectiveLayout.columns, PROXIMITY_RADIUS)
        const maxDist = effectiveLayout.cellSize * (PROXIMITY_RADIUS + 0.5)
        const nextAffected: number[] = []

        for (const index of neighbors) {
          const el = c.children[index] as HTMLElement | undefined
          if (!el) continue
          const rect = el.getBoundingClientRect()
          const dist = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2))
          const prox = Math.max(0, 1 - dist / maxDist)
          if (prox > 0.02) {
            el.style.setProperty('--prox', prox.toFixed(3))
            nextAffected.push(index)
          } else {
            el.style.removeProperty('--prox')
          }
        }

        for (const index of affected) {
          if (!nextAffected.includes(index)) {
            const el = c.children[index] as HTMLElement | undefined
            el?.style.removeProperty('--prox')
          }
        }
        affected = nextAffected

        if (raisedIndex !== centerIndex) {
          if (raisedIndex !== null) {
            const prevEl = c.children[raisedIndex] as HTMLElement | undefined
            prevEl?.style.removeProperty('z-index')
          }
          const nextEl = c.children[centerIndex] as HTMLElement | undefined
          nextEl?.style.setProperty('z-index', 'var(--z-raised)')
          raisedIndex = centerIndex
        }
      })
    }

    function handleLeave() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      clearAffected()
    }

    container.addEventListener('pointermove', handleMove)
    container.addEventListener('pointerleave', handleLeave)
    return () => {
      container.removeEventListener('pointermove', handleMove)
      container.removeEventListener('pointerleave', handleLeave)
      if (rafId !== null) cancelAnimationFrame(rafId)
      clearAffected()
    }
    // effectiveLayout.columns/cellSize and total are read fresh each time
    // this effect re-subscribes (on interactive/reduced-motion/pointer
    // changes); a resize re-running this is cheap and correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, prefersReducedMotion, isCoarsePointer, effectiveLayout.columns, effectiveLayout.cellSize, total])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!interactive || longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    const index = resolveIndexFromPoint(event.clientX, event.clientY)
    if (index !== null) activate(index)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!interactive) return
    const index = resolveIndexFromPoint(event.clientX, event.clientY)
    if (index === null) return
    longPressFiredRef.current = false
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true
      setPopover({ index, x: event.clientX, y: event.clientY })
    }, LONG_PRESS_MS)
  }

  function clearLongPress() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return
    const columns = effectiveLayout.columns
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(total - 1, focusedIndex + 1)
        break
      case 'ArrowLeft':
        next = Math.max(0, focusedIndex - 1)
        break
      case 'ArrowDown':
        next = Math.min(total - 1, focusedIndex + columns)
        break
      case 'ArrowUp':
        next = Math.max(0, focusedIndex - columns)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = total - 1
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        activate(focusedIndex)
        return
      default:
        return
    }
    event.preventDefault()
    setFocusedIndex(next)
    const el = gridRef.current?.children[next] as HTMLElement | undefined
    el?.focus()
  }

  const chunksPerHour = effectiveLayout.chunksPerHour

  return (
    <div ref={outerRef} className={cn('@container relative', className)}>
      {/*
        Centered as one unit (labels + grid together), not left-stuck: when
        hour-alignment caps the cell size (e.g. a wide container but a chunk
        size whose largest hour-aligned column count still fits comfortably
        under 26-32px), the grid is narrower than the space it's given, and
        without this it would hug the left edge with a lopsided empty gap on
        the right — found via an actual screenshot, not by inspection.
      */}
      <div className="flex justify-center">
        <div className="flex items-start">
          {showHourLabels && (
            <div
              className="relative mr-2 w-6 shrink-0 text-[length:var(--text-small)] text-text-2"
              style={{ height: Math.ceil(Math.max(0, total) / effectiveLayout.columns) * (effectiveLayout.cellSize + effectiveLayout.gap) }}
            >
              {buildHourLabels(total, effectiveLayout).map(({ hour, top }) => (
                <span key={hour} className="absolute left-0" style={{ top }}>
                  {hour}h
                </span>
              ))}
            </div>
          )}

          <div
            ref={gridRef}
            role={interactive ? 'grid' : 'img'}
            aria-label={label ? `${label}: ${completed} of ${total} chunks completed` : `${completed} of ${total} chunks completed`}
            className="isolate grid"
            style={{
              gridTemplateColumns: `repeat(${effectiveLayout.columns}, ${effectiveLayout.cellSize}px)`,
              gap: effectiveLayout.gap,
            }}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
            onKeyDown={interactive ? handleKeyDown : undefined}
          >
            {Array.from({ length: Math.max(0, total) }, (_, index) => {
          const filled = index < completed
          const isNext = interactive && index === completed && index < total
          const isGlowing = index >= completed - GLOW_WINDOW && index < completed
          const isRippleOrigin = isFilling && index === rangeEnd - 1
          const delayMs = isFilling ? Math.min(400, 14 * (index - rangeStart)) : 0
          const isHourBoundary = effectiveLayout.rowsPerHour !== null && (index + 1) % (effectiveLayout.columns * effectiveLayout.rowsPerHour) === 0

          return (
            <ChunkCell
              key={index}
              index={index}
              filled={filled}
              isNext={isNext}
              isGlowing={isGlowing}
              isRippleOrigin={isRippleOrigin}
              delayMs={delayMs}
              cellSize={effectiveLayout.cellSize}
              marginBottom={isHourBoundary ? 4 : 0}
              hueShiftDeg={accentShade}
              interactive={interactive}
              tabbable={index === focusedIndex}
              prefersReducedMotion={prefersReducedMotion ?? false}
              label={cellLabel(index, chunkMinutes, chunksPerHour, filled)}
            />
          )
        })}
          </div>
        </div>
      </div>

      {interactive && (
        <p className="sr-only">Use arrow keys to move, Enter or Space to fill or undo the focused chunk.</p>
      )}

      {popover && (
        <Popover.Root open onOpenChange={(open) => !open && setPopover(null)}>
          <Popover.Anchor asChild>
            <span className="pointer-events-none fixed" style={{ left: popover.x, top: popover.y }} />
          </Popover.Anchor>
          <Popover.Portal container={getOverlayRoot()}>
            <Popover.Content
              side="top"
              sideOffset={8}
              className="z-tooltip rounded-sm border border-hairline bg-surface-2 px-2 py-1 text-[length:var(--text-small)] text-text shadow-lg"
              onPointerDownOutside={() => setPopover(null)}
            >
              {cellLabel(popover.index, chunkMinutes, chunksPerHour, popover.index < completed)}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  )
}

function cellLabel(index: number, chunkMinutes: number, chunksPerHour: number, filled: boolean): string {
  const startMinute = index * chunkMinutes
  const hour = Math.floor(startMinute / 60) + 1
  const minuteOfHour = startMinute % 60
  const chunkOfHour = Math.floor(minuteOfHour / chunkMinutes) + 1
  const roundedPerHour = Math.max(1, Math.round(chunksPerHour))
  return `Hour ${hour} · chunk ${chunkOfHour} of ${roundedPerHour} · ${minuteOfHour} min${filled ? ' · filled' : ''}`
}

function buildHourLabels(total: number, layout: ChunkGridLayout): { hour: number; top: number }[] {
  if (layout.rowsPerHour === null) return []
  const rowHeight = layout.cellSize + layout.gap
  const rowsPerHour = layout.rowsPerHour
  const totalRows = Math.ceil(total / layout.columns)
  const labels: { hour: number; top: number }[] = []

  for (let row = 0; row < totalRows; row += rowsPerHour) {
    const hour = row / rowsPerHour + 1
    const extraGap = Math.floor(row / rowsPerHour) * 4
    labels.push({ hour, top: row * rowHeight + extraGap })
  }
  return labels
}
