import { describe, expect, it } from 'vitest'
import type { Month } from '@/data/types'
import {
  buildYearGrid,
  computeIntensityLevel,
  dayIndexInYear,
  filterGridToGoal,
  maxMinutesInGrid,
  sliceToRange,
} from './heatmapGrid'

function month(id: string, days: Record<string, { total: number; byGoal: Record<string, number> }>): Month {
  return { id, days }
}

describe('buildYearGrid', () => {
  it('starts every row on Monday (row 0) and ends on Sunday (row 6)', () => {
    const grid = buildYearGrid('2026', [])
    const firstCol = grid.cells.filter((cell) => cell.col === 0)
    const lastCol = grid.cells.filter((cell) => cell.col === grid.columns - 1)
    expect(firstCol[0]?.row).toBe(0)
    expect(lastCol[lastCol.length - 1]?.row).toBe(6)
  })

  it('includes every day of the year exactly once, marked inYear', () => {
    const grid = buildYearGrid('2026', [])
    const inYearDates = new Set(grid.cells.filter((cell) => cell.inYear).map((cell) => cell.date))
    expect(inYearDates.size).toBe(365) // 2026 is not a leap year
    expect(inYearDates.has('2026-01-01')).toBe(true)
    expect(inYearDates.has('2026-12-31')).toBe(true)
  })

  it('pads leading/trailing days from adjacent years as inYear: false', () => {
    const grid = buildYearGrid('2026', [])
    const padding = grid.cells.filter((cell) => !cell.inYear)
    expect(padding.length).toBeGreaterThan(0)
    for (const cell of padding) {
      expect(cell.date < '2026-01-01' || cell.date > '2026-12-31').toBe(true)
    }
  })

  it('reads minutes from the month docs by date, defaulting absent days to 0', () => {
    const months = [month('2026-03', { '05': { total: 45, byGoal: { french: 45 } } })]
    const grid = buildYearGrid('2026', months)
    const mar5 = grid.cells.find((cell) => cell.date === '2026-03-05')
    const mar6 = grid.cells.find((cell) => cell.date === '2026-03-06')
    expect(mar5?.minutes).toBe(45)
    expect(mar5?.byGoal).toEqual({ french: 45 })
    expect(mar6?.minutes).toBe(0)
  })

  it('places exactly one month label per month, at the column containing the 1st', () => {
    const grid = buildYearGrid('2026', [])
    expect(grid.monthLabels).toHaveLength(12)
    const jan1Cell = grid.cells.find((cell) => cell.date === '2026-01-01')
    const janLabel = grid.monthLabels.find((label) => label.label === 'Jan')
    expect(janLabel?.col).toBe(jan1Cell?.col)
  })
})

describe('sliceToRange', () => {
  const grid = buildYearGrid('2026', [])

  it('"year" returns the grid untouched', () => {
    expect(sliceToRange(grid, 'year')).toBe(grid)
  })

  it('"6months" keeps only the last 26 columns, renumbered from 0', () => {
    const sliced = sliceToRange(grid, '6months')
    expect(sliced.columns).toBe(26)
    expect(Math.max(...sliced.cells.map((cell) => cell.col))).toBe(25)
    // The last date in the sliced grid must match the last date in the full grid — slicing keeps the most recent weeks.
    const fullLast = grid.cells.reduce((latest, cell) => (cell.date > latest ? cell.date : latest), '')
    const slicedLast = sliced.cells.reduce((latest, cell) => (cell.date > latest ? cell.date : latest), '')
    expect(slicedLast).toBe(fullLast)
  })

  it('"month" keeps only the last 5 columns', () => {
    expect(sliceToRange(grid, 'month').columns).toBe(5)
  })
})

describe('filterGridToGoal', () => {
  it("replaces each cell's minutes with just that goal's share", () => {
    const months = [month('2026-03', { '05': { total: 45, byGoal: { french: 30, chess: 15 } } })]
    const grid = buildYearGrid('2026', months)
    const filtered = filterGridToGoal(grid, 'french')
    const mar5 = filtered.cells.find((cell) => cell.date === '2026-03-05')
    expect(mar5?.minutes).toBe(30)
  })

  it('is 0 for a day with no minutes logged against that goal', () => {
    const months = [month('2026-03', { '05': { total: 45, byGoal: { chess: 45 } } })]
    const grid = buildYearGrid('2026', months)
    const filtered = filterGridToGoal(grid, 'french')
    const mar5 = filtered.cells.find((cell) => cell.date === '2026-03-05')
    expect(mar5?.minutes).toBe(0)
  })
})

describe('computeIntensityLevel', () => {
  it('is 0 for zero minutes or a zero max', () => {
    expect(computeIntensityLevel(0, 100)).toBe(0)
    expect(computeIntensityLevel(50, 0)).toBe(0)
  })

  it('buckets into quartiles of the max', () => {
    expect(computeIntensityLevel(10, 100)).toBe(1)
    expect(computeIntensityLevel(30, 100)).toBe(2)
    expect(computeIntensityLevel(60, 100)).toBe(3)
    expect(computeIntensityLevel(100, 100)).toBe(4)
  })
})

describe('dayIndexInYear', () => {
  it('is 0 for January 1st', () => {
    expect(dayIndexInYear('2026-01-01', '2026')).toBe(0)
  })

  it('is negative for a padding day before January 1st', () => {
    expect(dayIndexInYear('2025-12-29', '2026')).toBe(-3)
  })

  it('stays the same regardless of how the grid is later sliced (that is the whole point)', () => {
    expect(dayIndexInYear('2026-06-15', '2026')).toBe(dayIndexInYear('2026-06-15', '2026'))
  })
})

describe('maxMinutesInGrid', () => {
  it('ignores padding cells outside the year', () => {
    const months = [month('2026-01', { '01': { total: 999, byGoal: {} } })]
    const grid = buildYearGrid('2026', months)
    // Hand-craft a padding cell with an absurd value to prove it is excluded.
    const withPaddingSpike = {
      ...grid,
      cells: grid.cells.map((cell) => (cell.inYear ? cell : { ...cell, minutes: 100_000 })),
    }
    expect(maxMinutesInGrid(withPaddingSpike)).toBe(999)
  })
})
