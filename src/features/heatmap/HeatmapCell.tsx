import * as Popover from '@radix-ui/react-popover'
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Tooltip } from '@/components/ui'
import { accentOverlayColor } from '@/lib/color'
import { getOverlayRoot } from '@/lib/overlay-root'
import { cn } from '@/lib/cn'
import { HeatmapCellDetails } from './HeatmapCellDetails'
import { INTENSITY_ALPHA_PERCENT, type HeatmapCell as HeatmapCellData, type IntensityLevel } from './heatmapGrid'

const LONG_PRESS_MS = 500

export interface HeatmapCellProps {
  cell: HeatmapCellData
  level: IntensityLevel
  hueShift: number
  cellSize: number
  isSelected: boolean
  isCoarsePointer: boolean
  prefersReducedMotion: boolean
  animationDelayMs: number
  goalNameFor: (goalId: string) => string
  onSelect: (date: string) => void
}

export function HeatmapCell({
  cell,
  level,
  hueShift,
  cellSize,
  isSelected,
  isCoarsePointer,
  prefersReducedMotion,
  animationDelayMs,
  goalNameFor,
  onSelect,
}: HeatmapCellProps) {
  const [isLongPressOpen, setIsLongPressOpen] = useState(false)
  const longPressTimerRef = useRef<number | null>(null)
  const longPressFiredRef = useRef(false)

  if (!cell.inYear) {
    return <div aria-hidden="true" style={{ width: cellSize, height: cellSize }} />
  }

  const style = {
    width: cellSize,
    height: cellSize,
    backgroundColor: accentOverlayColor(hueShift, INTENSITY_ALPHA_PERCENT[level]),
    transition: 'background-color 300ms var(--ease-out)',
    animation: prefersReducedMotion ? undefined : 'chunk-pop-in 220ms var(--ease-out) backwards',
    animationDelay: prefersReducedMotion ? undefined : `${animationDelayMs}ms`,
    outline: isSelected ? '2px solid var(--accent)' : undefined,
    outlineOffset: isSelected ? 1 : undefined,
  }

  const label = `${cell.date}: ${cell.minutes} minute${cell.minutes === 1 ? '' : 's'}`

  if (isCoarsePointer) {
    function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
      event.preventDefault()
      longPressFiredRef.current = false
      longPressTimerRef.current = window.setTimeout(() => {
        longPressFiredRef.current = true
        setIsLongPressOpen(true)
      }, LONG_PRESS_MS)
    }
    function clearLongPress() {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
    function handlePointerUp() {
      clearLongPress()
      if (!longPressFiredRef.current) onSelect(cell.date)
    }

    return (
      <Popover.Root open={isLongPressOpen} onOpenChange={setIsLongPressOpen}>
        <Popover.Anchor asChild>
          <button
            type="button"
            aria-label={label}
            className="rounded-[28%]"
            style={style}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={clearLongPress}
          />
        </Popover.Anchor>
        <Popover.Portal container={getOverlayRoot()}>
          <Popover.Content
            side="top"
            sideOffset={8}
            className="z-tooltip rounded-md border border-hairline bg-surface-2 px-3 py-2 text-[length:var(--text-small)] shadow-lg"
            onPointerDownOutside={() => setIsLongPressOpen(false)}
          >
            <HeatmapCellDetails cell={cell} goalNameFor={goalNameFor} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  }

  return (
    <Tooltip content={<HeatmapCellDetails cell={cell} goalNameFor={goalNameFor} />}>
      <button type="button" aria-label={label} className={cn('rounded-[28%]', isSelected && 'cursor-default')} style={style} tabIndex={0} />
    </Tooltip>
  )
}
