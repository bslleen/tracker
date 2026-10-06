import type { Month } from '@/data/types'
import { dateKey } from '@/lib/streak'

export type SleepRange = '7d' | '30d' | '1y'

export const RANGE_DAYS: Record<SleepRange, number> = { '7d': 7, '30d': 30, '1y': 365 }

export interface SleepPoint {
  date: string
  hours: number
}

function buildDateMap(months: Month[]): Map<string, number> {
  const byDate = new Map<string, number>()
  for (const month of months) {
    for (const [day, entry] of Object.entries(month.sleep ?? {})) {
      byDate.set(`${month.id}-${day}`, entry.hours)
    }
  }
  return byDate
}

/**
 * The full daily series ending at `today` (inclusive), 0 for any day with no
 * sleep entry. Bounded to whichever months are supplied — same "one
 * fetched year, never reach outside it" trade-off as the heatmap's streak
 * math (see src/lib/streak.ts), so a 1-year range in early January won't
 * silently pull December of the previous year.
 */
export function buildDailySleepSeries(months: Month[], today: Date, range: SleepRange): SleepPoint[] {
  const byDate = buildDateMap(months)
  const days = RANGE_DAYS[range]
  const points: SleepPoint[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const key = dateKey(date)
    points.push({ date: key, hours: byDate.get(key) ?? 0 })
  }
  return points
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function averageHours(points: SleepPoint[]): number {
  return average(points.map((point) => point.hours))
}

export interface WeekComparison {
  thisWeekAverage: number
  lastWeekAverage: number
  /** Positive = sleeping more than last week. 0 when there's no prior week to compare against. */
  deltaPercent: number
}

/** This week's average vs. the 7 days before that — the giant numeral's sub-line. */
export function compareToLastWeek(months: Month[], today: Date): WeekComparison {
  const byDate = buildDateMap(months)
  const last14: number[] = []
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    last14.push(byDate.get(dateKey(date)) ?? 0)
  }

  const thisWeekAverage = average(last14.slice(7, 14))
  const lastWeekAverage = average(last14.slice(0, 7))
  const deltaPercent = lastWeekAverage === 0 ? 0 : Math.round(((thisWeekAverage - lastWeekAverage) / lastWeekAverage) * 100)

  return { thisWeekAverage, lastWeekAverage, deltaPercent }
}

export const CHART_SAMPLE_COUNT = 30

/**
 * Resamples a daily series to a FIXED point count via linear interpolation
 * along the index domain, regardless of the range's real day-count (7, 30,
 * or 365). Every range's chart path then has the same number of coordinate
 * pairs, which is what lets Motion's `d`-attribute animation read as a
 * genuine smooth morph between ranges rather than a jump-cut between
 * differently-shaped paths (see SleepChart.tsx).
 */
export function resampleToFixedCount(points: SleepPoint[], sampleCount: number = CHART_SAMPLE_COUNT): number[] {
  if (points.length === 0) return Array(sampleCount).fill(0)
  if (points.length === 1) return Array(sampleCount).fill(points[0]!.hours)

  const result: number[] = []
  for (let i = 0; i < sampleCount; i += 1) {
    const t = (i / (sampleCount - 1)) * (points.length - 1)
    const lowerIndex = Math.floor(t)
    const upperIndex = Math.min(points.length - 1, lowerIndex + 1)
    const fraction = t - lowerIndex
    const lower = points[lowerIndex]!.hours
    const upper = points[upperIndex]!.hours
    result.push(lower + (upper - lower) * fraction)
  }
  return result
}

export interface SleepStudyInsight {
  overlappingDays: number
  averageMinutesHighSleep: number
  averageMinutesLowSleep: number
  /** Positive = more study minutes on nights with >= thresholdHours of sleep. */
  percentDifference: number
}

const MIN_OVERLAPPING_DAYS = 10

/**
 * "You study N% more after 7+ hours of sleep" — client-computed from the
 * same month docs' `days`/`sleep` maps, no extra reads. Null (hide the card)
 * when there isn't enough overlapping data to say anything honest: fewer
 * than 10 days with both a sleep entry and a study total, or every day
 * landing in just one of the two buckets.
 */
export function computeSleepStudyInsight(months: Month[], thresholdHours = 7): SleepStudyInsight | null {
  const highMinutes: number[] = []
  const lowMinutes: number[] = []

  for (const month of months) {
    for (const [day, sleepEntry] of Object.entries(month.sleep ?? {})) {
      const dayEntry = month.days[day]
      if (!dayEntry) continue
      if (sleepEntry.hours >= thresholdHours) highMinutes.push(dayEntry.total)
      else lowMinutes.push(dayEntry.total)
    }
  }

  const overlappingDays = highMinutes.length + lowMinutes.length
  if (overlappingDays < MIN_OVERLAPPING_DAYS || highMinutes.length === 0 || lowMinutes.length === 0) return null

  const averageMinutesHighSleep = average(highMinutes)
  const averageMinutesLowSleep = average(lowMinutes)
  const percentDifference =
    averageMinutesLowSleep === 0 ? 0 : Math.round(((averageMinutesHighSleep - averageMinutesLowSleep) / averageMinutesLowSleep) * 100)

  return { overlappingDays, averageMinutesHighSleep, averageMinutesLowSleep, percentDifference }
}
