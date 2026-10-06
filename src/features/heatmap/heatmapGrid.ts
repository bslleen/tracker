import type { Month } from '@/data/types'
import { dateKey, parseDateKey } from '@/lib/streak'

export interface HeatmapCell {
  /** "yyyy-mm-dd" */
  date: string
  col: number
  /** 0 = Monday .. 6 = Sunday. */
  row: number
  minutes: number
  byGoal: Record<string, number>
  /** False for the leading/trailing padding days needed to complete the first/last week — these render as quiet placeholders, never hoverable/selectable. */
  inYear: boolean
}

export interface HeatmapGrid {
  cells: HeatmapCell[]
  /** Total week-columns in the grid (52 or 53, depending on how `year` aligns to Monday). */
  columns: number
  monthLabels: { col: number; label: string }[]
}

/** JS's Sun=0..Sat=6 reindexed to ISO's Mon=0..Sun=6 — the grid's own row order, and CLAUDE.md's Mon/Wed/Fri weekday labels only make sense against a Monday-start week. */
function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

/**
 * Builds a Monday-start, 7-row grid spanning `year`'s Jan 1 - Dec 31, padded
 * out to whole weeks at both ends (the de-facto GitHub contribution-graph
 * layout) — never reaching into an adjacent year's data, so a single
 * useYearSummary(year) fetch (12 reads) is always enough to fill it.
 */
export function buildYearGrid(year: string, months: Month[]): HeatmapGrid {
  const yearNum = Number(year)
  const jan1 = new Date(yearNum, 0, 1)
  const dec31 = new Date(yearNum, 11, 31)

  const gridStart = new Date(jan1)
  gridStart.setDate(gridStart.getDate() - isoWeekday(jan1))
  const gridEnd = new Date(dec31)
  gridEnd.setDate(gridEnd.getDate() + (6 - isoWeekday(dec31)))

  const dayMap = new Map<string, { total: number; byGoal: Record<string, number> }>()
  for (const month of months) {
    for (const [day, entry] of Object.entries(month.days)) {
      dayMap.set(`${month.id}-${day}`, entry)
    }
  }

  const cells: HeatmapCell[] = []
  const monthLabels: { col: number; label: string }[] = []
  const cursor = new Date(gridStart)
  let col = 0

  while (cursor <= gridEnd) {
    const row = isoWeekday(cursor)
    const key = dateKey(cursor)
    const inYear = cursor.getFullYear() === yearNum
    const entry = dayMap.get(key)

    if (inYear && cursor.getDate() === 1) {
      monthLabels.push({ col, label: cursor.toLocaleDateString('en-US', { month: 'short' }) })
    }

    cells.push({ date: key, col, row, minutes: entry?.total ?? 0, byGoal: entry?.byGoal ?? {}, inYear })

    cursor.setDate(cursor.getDate() + 1)
    if (row === 6) col += 1
  }

  return { cells, columns: col, monthLabels }
}

export type HeatmapRange = 'year' | '6months' | 'month'

const RANGE_WEEKS: Record<HeatmapRange, number> = {
  year: Number.POSITIVE_INFINITY,
  '6months': 26,
  // Any month needs at most 5 week-columns to show every one of its days once padded to whole weeks.
  month: 5,
}

/** Slices a grid down to its last N week-columns (the most recent ones) — "year" returns it untouched. */
export function sliceToRange(grid: HeatmapGrid, range: HeatmapRange): HeatmapGrid {
  const weeks = RANGE_WEEKS[range]
  if (!Number.isFinite(weeks) || grid.columns <= weeks) return grid

  const firstKeptCol = grid.columns - weeks
  const cells = grid.cells
    .filter((cell) => cell.col >= firstKeptCol)
    .map((cell) => ({ ...cell, col: cell.col - firstKeptCol }))
  const monthLabels = grid.monthLabels
    .filter((label) => label.col >= firstKeptCol)
    .map((label) => ({ ...label, col: label.col - firstKeptCol }))

  return { cells, columns: grid.columns - firstKeptCol, monthLabels }
}

/** Replaces each cell's minutes with just one goal's share — the filtered view "A filter chip row ... one goal" needs. */
export function filterGridToGoal(grid: HeatmapGrid, goalId: string): HeatmapGrid {
  return {
    ...grid,
    cells: grid.cells.map((cell) => ({ ...cell, minutes: cell.byGoal[goalId] ?? 0 })),
  }
}

export type IntensityLevel = 0 | 1 | 2 | 3 | 4

/** 0, 20, 40, 65, 100% — the accent-over-empty alpha stops per CLAUDE.md's heatmap spec. */
export const INTENSITY_ALPHA_PERCENT: Record<IntensityLevel, number> = { 0: 0, 1: 20, 2: 40, 3: 65, 4: 100 }

/**
 * Data-driven quartile buckets against the grid's own max (not a fixed
 * minute threshold) so a light-study goal and a heavy one each still use the
 * full 5-level range instead of one washing out the other.
 */
export function computeIntensityLevel(minutes: number, maxMinutes: number): IntensityLevel {
  if (minutes <= 0 || maxMinutes <= 0) return 0
  const ratio = minutes / maxMinutes
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

export function maxMinutesInGrid(grid: HeatmapGrid): number {
  return grid.cells.reduce((max, cell) => (cell.inYear && cell.minutes > max ? cell.minutes : max), 0)
}

/**
 * Day offset from `year`'s January 1st — stable regardless of which range
 * slice (Year/6 months/Month) is currently displayed, so switching the
 * toggle never changes an already-rendered cell's entrance-animation delay
 * (which would otherwise restart it; see HeatmapCalendar.tsx).
 */
export function dayIndexInYear(dateStr: string, year: string): number {
  const jan1 = new Date(Number(year), 0, 1)
  const date = parseDateKey(dateStr)
  return Math.round((date.getTime() - jan1.getTime()) / 86_400_000)
}
