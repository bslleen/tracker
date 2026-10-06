import { describe, expect, it } from 'vitest'
import type { Month } from '@/data/types'
import {
  averageHours,
  buildDailySleepSeries,
  compareToLastWeek,
  computeSleepStudyInsight,
  resampleToFixedCount,
} from './sleepChartData'

const TODAY = new Date(2026, 9, 15) // October 15, 2026

function month(id: string, sleep: Record<string, { hours: number; quality: number }>, days: Record<string, { total: number; byGoal: Record<string, number> }> = {}): Month {
  return { id, days, sleep }
}

describe('buildDailySleepSeries', () => {
  it('returns one point per day in the range, defaulting missing days to 0', () => {
    const months = [month('2026-10', { '15': { hours: 7.5, quality: 4 } })]
    const series = buildDailySleepSeries(months, TODAY, '7d')
    expect(series).toHaveLength(7)
    expect(series[6]).toEqual({ date: '2026-10-15', hours: 7.5 })
    expect(series[0]!.hours).toBe(0)
  })

  it('ends at today (inclusive), oldest first', () => {
    const series = buildDailySleepSeries([], TODAY, '7d')
    expect(series[0]!.date).toBe('2026-10-09')
    expect(series[6]!.date).toBe('2026-10-15')
  })

  it('reads a full year for the 1y range', () => {
    expect(buildDailySleepSeries([], TODAY, '1y')).toHaveLength(365)
  })
})

describe('averageHours', () => {
  it('is 0 for an empty series', () => {
    expect(averageHours([])).toBe(0)
  })

  it('averages the hours across points', () => {
    expect(averageHours([{ date: 'a', hours: 6 }, { date: 'b', hours: 8 }])).toBe(7)
  })
})

describe('compareToLastWeek', () => {
  it('computes this-week vs last-week averages and the delta', () => {
    const months = [
      month('2026-10', {
        // Last week (Oct 2-8): average 6h
        '02': { hours: 6, quality: 3 },
        '03': { hours: 6, quality: 3 },
        '04': { hours: 6, quality: 3 },
        '05': { hours: 6, quality: 3 },
        '06': { hours: 6, quality: 3 },
        '07': { hours: 6, quality: 3 },
        '08': { hours: 6, quality: 3 },
        // This week (Oct 9-15): average 9h
        '09': { hours: 9, quality: 4 },
        '10': { hours: 9, quality: 4 },
        '11': { hours: 9, quality: 4 },
        '12': { hours: 9, quality: 4 },
        '13': { hours: 9, quality: 4 },
        '14': { hours: 9, quality: 4 },
        '15': { hours: 9, quality: 4 },
      }),
    ]
    const comparison = compareToLastWeek(months, TODAY)
    expect(comparison.thisWeekAverage).toBe(9)
    expect(comparison.lastWeekAverage).toBe(6)
    expect(comparison.deltaPercent).toBe(50)
  })

  it('is 0% delta when there is no prior week logged (avoids a divide-by-zero)', () => {
    expect(compareToLastWeek([], TODAY).deltaPercent).toBe(0)
  })
})

describe('resampleToFixedCount', () => {
  it('always returns exactly `sampleCount` values', () => {
    expect(resampleToFixedCount([{ date: 'a', hours: 7 }], 30)).toHaveLength(30)
    expect(resampleToFixedCount(Array.from({ length: 365 }, (_, i) => ({ date: String(i), hours: i % 10 })), 30)).toHaveLength(30)
  })

  it('upsamples a short series by interpolating between its points, not repeating the first value', () => {
    const result = resampleToFixedCount([{ date: 'a', hours: 0 }, { date: 'b', hours: 10 }], 11)
    expect(result[0]).toBe(0)
    expect(result[10]).toBe(10)
    expect(result[5]).toBeCloseTo(5, 5) // the midpoint of a straight line from 0 to 10
  })

  it('is flat when every input point has the same value', () => {
    const flat = Array.from({ length: 10 }, () => ({ date: 'x', hours: 7 }))
    expect(resampleToFixedCount(flat, 5)).toEqual([7, 7, 7, 7, 7])
  })

  it('handles an empty series without throwing', () => {
    expect(resampleToFixedCount([], 5)).toEqual([0, 0, 0, 0, 0])
  })
})

describe('computeSleepStudyInsight', () => {
  it('is null when there are fewer than 10 overlapping days', () => {
    const months = [month('2026-10', { '01': { hours: 8, quality: 4 } }, { '01': { total: 60, byGoal: {} } })]
    expect(computeSleepStudyInsight(months)).toBeNull()
  })

  it('is null when every overlapping day falls in just one bucket', () => {
    const sleep: Record<string, { hours: number; quality: number }> = {}
    const days: Record<string, { total: number; byGoal: Record<string, number> }> = {}
    for (let i = 1; i <= 12; i += 1) {
      const key = String(i).padStart(2, '0')
      sleep[key] = { hours: 8, quality: 4 } // always >= 7h — no "low sleep" bucket at all
      days[key] = { total: 60, byGoal: {} }
    }
    expect(computeSleepStudyInsight([month('2026-10', sleep, days)])).toBeNull()
  })

  it('computes the percent difference once there is enough data in both buckets', () => {
    const sleep: Record<string, { hours: number; quality: number }> = {}
    const days: Record<string, { total: number; byGoal: Record<string, number> }> = {}
    // 6 "high sleep" days at 60 study minutes, 6 "low sleep" days at 30 — a clean +100%.
    for (let i = 1; i <= 6; i += 1) {
      const highKey = String(i).padStart(2, '0')
      sleep[highKey] = { hours: 8, quality: 4 }
      days[highKey] = { total: 60, byGoal: {} }
      const lowKey = String(i + 6).padStart(2, '0')
      sleep[lowKey] = { hours: 5, quality: 2 }
      days[lowKey] = { total: 30, byGoal: {} }
    }
    const insight = computeSleepStudyInsight([month('2026-10', sleep, days)])
    expect(insight).not.toBeNull()
    expect(insight!.overlappingDays).toBe(12)
    expect(insight!.percentDifference).toBe(100)
  })

  it('ignores sleep entries with no matching study-day entry (not "overlapping")', () => {
    const months = [month('2026-10', { '01': { hours: 8, quality: 4 } }, {})]
    expect(computeSleepStudyInsight(months)).toBeNull()
  })
})
