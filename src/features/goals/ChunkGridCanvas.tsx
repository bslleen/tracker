import { useEffect, useRef, type MouseEvent } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { shiftColorHue } from '@/lib/color'
import { computeChunkGridLayout } from './chunkGridLayout'

export interface ChunkGridCanvasProps {
  total: number
  completed: number
  chunkMinutes: number
  accentShade?: number
  interactive?: boolean
  onFillTo?: (index: number) => void
  onUndoLast?: () => void
  label?: string
  className?: string
}

const GLOW_WINDOW = 12

/**
 * Same visual language as the DOM grid (empty/filled/glow-window/hue shift)
 * at a fraction of the cost for very large grids — one canvas draw instead
 * of 1,500+ DOM nodes. Click-to-fill/undo hit-testing reuses the same
 * layout math as the DOM renderer so both feel identical to use; the
 * per-cell hover-proximity micro-interaction and spring fill animation are
 * DOM-only — at this density a flat redraw is the right trade-off.
 */
export function ChunkGridCanvas({
  total,
  completed,
  chunkMinutes,
  accentShade = 0,
  interactive = false,
  onFillTo,
  onUndoLast,
  label,
  className,
}: ChunkGridCanvasProps) {
  const { ref: outerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>()
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const layout = computeChunkGridLayout({
    containerWidth: containerWidth || 1,
    chunkMinutes,
    pointerKind: isCoarsePointer ? 'coarse' : 'fine',
  })
  const rows = Math.ceil(Math.max(1, total) / layout.columns)
  const rowHeight = layout.cellSize + layout.gap
  const canvasHeight = rows * rowHeight - layout.gap

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth <= 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${canvasHeight}px`
    ctx.scale(dpr, dpr)

    const emptyColor = getComputedColor(canvas, '--chunk-empty')
    const accentColor = getComputedColor(canvas, '--accent')
    const glowColor = getComputedColor(canvas, '--accent-glow')
    const radius = layout.cellSize * 0.28

    ctx.clearRect(0, 0, containerWidth, canvasHeight)

    for (let index = 0; index < total; index += 1) {
      const row = Math.floor(index / layout.columns)
      const col = index % layout.columns
      const x = col * (layout.cellSize + layout.gap)
      const y = row * rowHeight
      const filled = index < completed
      const isGlowing = filled && index >= completed - GLOW_WINDOW

      if (isGlowing) {
        ctx.save()
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 8
      }

      ctx.fillStyle = filled ? shiftAccentColorForCanvas(accentColor, accentShade) : emptyColor
      drawRoundedRect(ctx, x, y, layout.cellSize, layout.cellSize, radius)
      ctx.fill()

      if (isGlowing) ctx.restore()
    }
  }, [total, completed, accentShade, containerWidth, canvasHeight, layout.cellSize, layout.gap, layout.columns, rowHeight])

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (!interactive) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const col = Math.floor(x / (layout.cellSize + layout.gap))
    const row = Math.floor(y / rowHeight)
    if (col < 0 || col >= layout.columns || row < 0) return
    const index = row * layout.columns + col
    if (index < 0 || index >= total) return

    if (index === completed - 1) {
      onUndoLast?.()
    } else if (index >= completed) {
      onFillTo?.(index)
    }
  }

  return (
    <div ref={outerRef} className={cn('@container', className)}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        role="img"
        aria-label={label ? `${label}: ${completed} of ${total} chunks completed` : `${completed} of ${total} chunks completed`}
        className={interactive ? 'cursor-pointer' : undefined}
      />
    </div>
  )
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function getComputedColor(el: HTMLElement, variable: string): string {
  return getComputedStyle(el).getPropertyValue(variable).trim() || '#000000'
}

/** --accent read from computed style (so a future theme change is picked up) and shifted via the shared color math. */
function shiftAccentColorForCanvas(color: string, shiftDeg: number): string {
  if (shiftDeg === 0) return color
  const rgb = parseColor(color)
  if (!rgb) return color
  return shiftColorHue(rgb, shiftDeg)
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = color
  const computed = ctx.fillStyle
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(computed)
  if (!match?.[1] || !match[2] || !match[3]) return null
  return { r: Number.parseInt(match[1], 16), g: Number.parseInt(match[2], 16), b: Number.parseInt(match[3], 16) }
}
