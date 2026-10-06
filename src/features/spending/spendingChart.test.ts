import { describe, expect, it } from 'vitest'
import type { SpendingEntry } from '@/data/types'
import {
  categoryColor,
  computeDonutSegments,
  computeTreemapLayout,
  groupByCategory,
  groupByDay,
  monthTotal,
} from './spendingChart'

const FAKE_TIMESTAMP = {} as SpendingEntry['createdAt']

function entry(partial: Pick<SpendingEntry, 'id' | 'date' | 'amount' | 'category'>): SpendingEntry {
  return { ...partial, createdAt: FAKE_TIMESTAMP }
}

const ENTRIES: SpendingEntry[] = [
  entry({ id: '1', date: '2026-10-03', amount: 20, category: 'Food' }),
  entry({ id: '2', date: '2026-10-03', amount: 5, category: 'Transport' }),
  entry({ id: '3', date: '2026-10-02', amount: 30, category: 'Food' }),
  entry({ id: '4', date: '2026-10-01', amount: 10, category: 'Fun' }),
]

describe('groupByCategory', () => {
  it('sums amounts per category, sorted largest first', () => {
    expect(groupByCategory(ENTRIES)).toEqual([
      { category: 'Food', total: 50 },
      { category: 'Fun', total: 10 },
      { category: 'Transport', total: 5 },
    ])
  })

  it('is empty for no entries', () => {
    expect(groupByCategory([])).toEqual([])
  })
})

describe('groupByDay', () => {
  it('groups entries by date, most recent day first', () => {
    const groups = groupByDay(ENTRIES)
    expect(groups.map((g) => g.date)).toEqual(['2026-10-03', '2026-10-02', '2026-10-01'])
    expect(groups[0]!.entries).toHaveLength(2)
    expect(groups[0]!.total).toBe(25)
  })
})

describe('monthTotal', () => {
  it('sums every entry regardless of category/day', () => {
    expect(monthTotal(ENTRIES)).toBe(65)
  })

  it('is 0 for no entries', () => {
    expect(monthTotal([])).toBe(0)
  })
})

describe('categoryColor', () => {
  it('uses color-mix with the accent and --text-2 — never a raw hue (no rainbow)', () => {
    const color = categoryColor(0)
    expect(color).toContain('color-mix(in srgb,')
    expect(color).toContain('var(--accent)')
    expect(color).toContain('var(--text-2)')
  })

  it('cycles through a fixed palette rather than growing unbounded', () => {
    expect(categoryColor(0)).toBe(categoryColor(8))
  })
})

describe('computeDonutSegments', () => {
  it('splits into cumulative fractions summing to 1', () => {
    const segments = computeDonutSegments(groupByCategory(ENTRIES))
    expect(segments).toHaveLength(3)
    expect(segments[0]).toMatchObject({ category: 'Food', startFraction: 0 })
    expect(segments[0]!.fraction).toBeCloseTo(50 / 65, 5)
    expect(segments[1]!.startFraction).toBeCloseTo(50 / 65, 5)
    const totalFraction = segments.reduce((sum, s) => sum + s.fraction, 0)
    expect(totalFraction).toBeCloseTo(1, 5)
  })

  it('is empty when there is nothing to show', () => {
    expect(computeDonutSegments([])).toEqual([])
  })
})

describe('computeTreemapLayout', () => {
  it('fills the full width/height, sized proportionally', () => {
    const rects = computeTreemapLayout(groupByCategory(ENTRIES), 100, 50)
    expect(rects).toHaveLength(3)
    const totalWidth = rects.reduce((sum, r) => sum + r.width, 0)
    expect(totalWidth).toBeCloseTo(100, 5)
    expect(rects[0]!.height).toBe(50)
    // Largest category gets the most space.
    expect(rects[0]!.category).toBe('Food')
    expect(rects[0]!.width).toBeGreaterThan(rects[1]!.width)
  })

  it('is empty for a zero-size container or no data', () => {
    expect(computeTreemapLayout(groupByCategory(ENTRIES), 0, 50)).toEqual([])
    expect(computeTreemapLayout([], 100, 50)).toEqual([])
  })
})
