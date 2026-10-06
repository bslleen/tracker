import { useMemo } from 'react'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { HeatmapCell } from './HeatmapCell'
import { computeIntensityLevel, dayIndexInYear, maxMinutesInGrid, type HeatmapGrid } from './heatmapGrid'

const CELL_SIZE = 13
const CELL_GAP = 3
const WEEKDAY_LABEL_MIN_CONTAINER_WIDTH = 420
const WEEKDAY_LABELS: { row: number; label: string }[] = [
  { row: 0, label: 'Mon' },
  { row: 2, label: 'Wed' },
  { row: 4, label: 'Fri' },
]
// Total entrance-wave budget (CLAUDE.md: "700ms total") minus one cell's own
// pop-in duration, so the LAST cell both starts and finishes within it.
const ENTRANCE_BUDGET_MS = 700 - 220
// A generous fixed denominator (not the currently-displayed grid's own
// column count) — see dayIndexInYear's own docs for why this must stay
// slice-independent.
const MAX_DAY_INDEX = 392

export interface HeatmapCalendarProps {
  grid: HeatmapGrid
  year: string
  hueShift: number
  selectedDate: string | null
  onSelectDate: (date: string) => void
  goalNameFor: (goalId: string) => string
  prefersReducedMotion: boolean
}

export function HeatmapCalendar({ grid, year, hueShift, selectedDate, onSelectDate, goalNameFor, prefersReducedMotion }: HeatmapCalendarProps) {
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const { ref: outerRef, width: containerWidth } = useContainerWidth<HTMLDivElement>()
  const showWeekdayLabels = containerWidth === 0 || containerWidth >= WEEKDAY_LABEL_MIN_CONTAINER_WIDTH

  const maxMinutes = useMemo(() => maxMinutesInGrid(grid), [grid])

  const weeks = useMemo(() => {
    const byColumn = new Map<number, typeof grid.cells>()
    for (const cell of grid.cells) {
      const column = byColumn.get(cell.col) ?? []
      column.push(cell)
      byColumn.set(cell.col, column)
    }
    return Array.from(byColumn.entries())
      .sort(([a], [b]) => a - b)
      .map(([, cells]) => cells.sort((a, b) => a.row - b.row))
  }, [grid])

  const weekColumnWidth = CELL_SIZE + CELL_GAP

  return (
    <div ref={outerRef} className="@container flex gap-3">
      {showWeekdayLabels && (
        <div className="relative shrink-0 pt-6" style={{ width: 24 }}>
          {WEEKDAY_LABELS.map(({ row, label }) => (
            <span
              key={label}
              className="absolute left-0 text-[length:var(--text-small)] text-text-2"
              style={{ top: row * weekColumnWidth }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div
        className="flex-1 overflow-x-auto pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
        role="img"
        aria-label={`Study heatmap for ${year}`}
      >
        <div className="relative" style={{ height: 24, width: grid.columns * weekColumnWidth }}>
          {grid.monthLabels.map(({ col, label }) => (
            <span
              key={`${label}-${col}`}
              className="absolute top-0 text-[length:var(--text-small)] text-text-2"
              style={{ left: col * weekColumnWidth }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex" style={{ gap: CELL_GAP }}>
          {weeks.map((week) => (
            // Keyed by the week's own first date, not its (post-slice,
            // renumbered) col index — col changes whenever the Year/6
            // months/Month toggle re-slices the grid, and keying on it would
            // make React remount every week column (and the cells inside
            // it) on every toggle, restarting their entrance animation with
            // whatever delay they'd compute next — long for the most recent
            // weeks — and leaving them invisible until it elapsed. Caught via
            // an actual screenshot, not by inspection.
            <div
              key={week[0]!.date}
              className="flex flex-col"
              style={{ gap: CELL_GAP, scrollSnapAlign: 'start' }}
            >
              {week.map((cell) => {
                const level = computeIntensityLevel(cell.minutes, maxMinutes)
                const dayIndex = dayIndexInYear(cell.date, year)
                const wave = (dayIndex + 10) / MAX_DAY_INDEX // +10 so leading padding days (negative index) don't go below 0
                const animationDelayMs = Math.max(0, Math.round(wave * ENTRANCE_BUDGET_MS))

                return (
                  <HeatmapCell
                    key={cell.date}
                    cell={cell}
                    level={level}
                    hueShift={hueShift}
                    cellSize={CELL_SIZE}
                    isSelected={cell.date === selectedDate}
                    isCoarsePointer={isCoarsePointer}
                    prefersReducedMotion={prefersReducedMotion}
                    animationDelayMs={animationDelayMs}
                    goalNameFor={goalNameFor}
                    onSelect={onSelectDate}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
