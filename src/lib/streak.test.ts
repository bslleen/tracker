import { describe, expect, it } from 'vitest'
import { computeLongestStreak, computeStreak, countActiveDays, dateKey, minutesFromDateMap, parseDateKey } from './streak'

const TODAY = new Date(2026, 9, 15) // October 15, 2026

function fromMap(minutesByKey: Record<string, number>) {
  return (date: Date) =>
    minutesByKey[`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`] ?? 0
}

describe('computeStreak', () => {
  it('is 0 when nothing was ever logged', () => {
    expect(computeStreak(() => 0, TODAY)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const getMinutes = fromMap({ '2026-10-15': 20, '2026-10-14': 15, '2026-10-13': 30 })
    expect(computeStreak(getMinutes, TODAY)).toBe(3)
  })

  it('stops at the first gap', () => {
    const getMinutes = fromMap({ '2026-10-15': 20, '2026-10-14': 15, '2026-10-12': 30 })
    expect(computeStreak(getMinutes, TODAY)).toBe(2)
  })

  it("doesn't break the streak just because today hasn't been logged yet", () => {
    const getMinutes = fromMap({ '2026-10-14': 15, '2026-10-13': 30 })
    expect(computeStreak(getMinutes, TODAY)).toBe(2)
  })

  it('is 0 when today is empty and yesterday is also empty', () => {
    const getMinutes = fromMap({ '2026-10-13': 30 })
    expect(computeStreak(getMinutes, TODAY)).toBe(0)
  })

  it('crosses a month boundary', () => {
    const getMinutes = fromMap({ '2026-10-1': 10, '2026-9-30': 10, '2026-9-29': 10 })
    const firstOfMonth = new Date(2026, 9, 1)
    expect(computeStreak(getMinutes, firstOfMonth)).toBe(3)
  })
})

describe('dateKey / parseDateKey', () => {
  it('round-trips without drifting a day in either direction', () => {
    const date = new Date(2026, 0, 1) // January 1st — the boundary most likely to break under a UTC-based implementation
    expect(dateKey(date)).toBe('2026-01-01')
    expect(parseDateKey(dateKey(date)).getTime()).toBe(date.getTime())
  })

  it('pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 8, 5))).toBe('2026-09-05')
  })

  it('never goes through toISOString/UTC parsing (would shift at negative UTC offsets)', () => {
    // A direct `new Date('2026-01-01').getDate()` is 31 (December) in any
    // timezone west of UTC — this is the exact bug class dateKey/parseDateKey
    // exist to avoid. If parseDateKey ever regresses to UTC parsing, this
    // assertion (local midnight, local getDate()) is what would catch it.
    expect(parseDateKey('2026-01-01').getDate()).toBe(1)
    expect(parseDateKey('2026-01-01').getMonth()).toBe(0)
  })
})

describe('minutesFromDateMap', () => {
  it('looks up minutes by the date\'s local-time key', () => {
    const getMinutes = minutesFromDateMap({ '2026-10-15': 42 })
    expect(getMinutes(new Date(2026, 9, 15))).toBe(42)
    expect(getMinutes(new Date(2026, 9, 16))).toBe(0)
  })
})

describe('computeLongestStreak', () => {
  it('is 0 for an empty map', () => {
    expect(computeLongestStreak({})).toBe(0)
  })

  it('finds the longest run even when it is not the most recent one', () => {
    const map = {
      '2026-10-01': 10,
      '2026-10-02': 10,
      '2026-10-03': 10,
      '2026-10-04': 10,
      '2026-10-05': 10, // 5-day run
      '2026-10-10': 10,
      '2026-10-11': 10, // later, shorter 2-day run
    }
    expect(computeLongestStreak(map)).toBe(5)
  })

  it('ignores days with zero minutes when looking for adjacency', () => {
    const map = { '2026-10-01': 10, '2026-10-02': 0, '2026-10-03': 10 }
    expect(computeLongestStreak(map)).toBe(1)
  })

  it('is bounded to the dates actually present — does not assume a streak continues outside the map', () => {
    // Only January exists in this map (e.g. a single fetched year) — a
    // streak that in reality started the previous December should read as
    // starting January 1st, not silently extend further back.
    const map = { '2026-01-01': 10, '2026-01-02': 10, '2026-01-03': 10 }
    expect(computeLongestStreak(map)).toBe(3)
  })
})

describe('countActiveDays', () => {
  it('counts only days with minutes > 0', () => {
    expect(countActiveDays({ '2026-10-01': 10, '2026-10-02': 0, '2026-10-03': 5 })).toBe(2)
  })

  it('is 0 for an empty map', () => {
    expect(countActiveDays({})).toBe(0)
  })
})
