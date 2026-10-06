import { groupByCategory } from '@/features/spending/spendingChart'
import type { Goal, Month, SpendingEntry } from '@/data/types'
import { chunkCount, minutesBanked, percentComplete } from '@/lib/chunks'
import { dateKey, parseDateKey } from '@/lib/streak'

export interface IntroSlide {
  type: 'intro'
  year: string
  totalChunks: number
}

export interface TotalHoursSlide {
  type: 'totalHours'
  hours: number
  days: number
}

export interface TopSubjectSlide {
  type: 'topSubject'
  name: string
  hours: number
  totalChunks: number
  chunkMinutes: number
  hue: number
}

export interface SubjectSummary {
  name: string
  totalChunks: number
  chunkMinutes: number
  hue: number
}

export interface SubjectsFinishedSlide {
  type: 'subjectsFinished'
  subjects: SubjectSummary[]
}

export interface LongestStreakSlide {
  type: 'longestStreak'
  days: number
  startDate: string
  endDate: string
}

export interface BestMonthSlide {
  type: 'bestMonth'
  /** 12 values, January first. */
  monthlyHours: number[]
  bestMonthIndex: number
  bestMonthHours: number
}

export interface ConsistentWeekdaySlide {
  type: 'consistentWeekday'
  weekday: string
  percent: number
}

export interface BestFocusWeekSlide {
  type: 'bestFocusWeek'
  startDate: string
  endDate: string
  minutes: number
}

export interface SleepSlide {
  type: 'sleep'
  averageHours: number
  bestWeekAverage: number
}

export interface SpendingSlide {
  type: 'spending'
  topCategory: string
  topCategoryTotal: number
  total: number
}

export interface OutroSlide {
  type: 'outro'
  year: string
  totalHours: number
  totalChunks: number
  topSubjectName: string
}

export type ReviewSlide =
  | IntroSlide
  | TotalHoursSlide
  | TopSubjectSlide
  | SubjectsFinishedSlide
  | LongestStreakSlide
  | BestMonthSlide
  | ConsistentWeekdaySlide
  | BestFocusWeekSlide
  | SleepSlide
  | SpendingSlide
  | OutroSlide

export interface ReviewData {
  year: string
  /** Every goal whose month falls within `year`, any status. */
  goals: Goal[]
  /** The year's month docs (days + sleep maps) — from useYearSummary. */
  months: Month[]
  /** The year's spending entries. */
  spending: SpendingEntry[]
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildDateMinutesMap(months: Month[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const month of months) {
    for (const [day, entry] of Object.entries(month.days)) {
      map[`${month.id}-${day}`] = entry.total
    }
  }
  return map
}

function buildSleepHoursMap(months: Month[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const month of months) {
    for (const [day, entry] of Object.entries(month.sleep ?? {})) {
      map[`${month.id}-${day}`] = entry.hours
    }
  }
  return map
}

/**
 * Longest run of consecutive calendar days with minutes > 0, with its date
 * range — unlike src/lib/streak.ts's computeLongestStreak (which only this
 * module needs the range from, not just the length, so it lives here rather
 * than growing that module's public surface for a single caller).
 */
export function computeLongestStreakRange(map: Record<string, number>): { days: number; startDate: string; endDate: string } | null {
  const activeDates = Object.entries(map)
    .filter(([, minutes]) => minutes > 0)
    .map(([key]) => key)
    .sort()
  if (activeDates.length === 0) return null

  let bestLength = 1
  let bestStart = activeDates[0]!
  let bestEnd = activeDates[0]!
  let currentLength = 1
  let currentStart = activeDates[0]!

  for (let i = 1; i < activeDates.length; i += 1) {
    const previousKey = activeDates[i - 1]!
    const key = activeDates[i]!
    const expectedNext = parseDateKey(previousKey)
    expectedNext.setDate(expectedNext.getDate() + 1)

    if (dateKey(expectedNext) === key) {
      currentLength += 1
    } else {
      currentLength = 1
      currentStart = key
    }

    if (currentLength > bestLength) {
      bestLength = currentLength
      bestStart = currentStart
      bestEnd = key
    }
  }

  return { days: bestLength, startDate: bestStart, endDate: bestEnd }
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MIN_ACTIVE_DAYS_FOR_WEEKDAY_INSIGHT = 14

/** Which weekday shows up most often among active (minutes > 0) days — "You are a Tuesday person." Needs at least two weeks of active days to say anything credible. */
export function computeConsistentWeekday(map: Record<string, number>): { weekday: string; percent: number } | null {
  const activeDates = Object.entries(map)
    .filter(([, minutes]) => minutes > 0)
    .map(([key]) => key)
  if (activeDates.length < MIN_ACTIVE_DAYS_FOR_WEEKDAY_INSIGHT) return null

  const counts = new Array(7).fill(0) as number[]
  for (const key of activeDates) {
    const weekday = parseDateKey(key).getDay()
    counts[weekday] = counts[weekday]! + 1
  }
  const maxCount = Math.max(...counts)
  if (maxCount === 0) return null
  const weekdayIndex = counts.indexOf(maxCount)
  const percent = Math.round((maxCount / activeDates.length) * 100)

  return { weekday: WEEKDAY_NAMES[weekdayIndex]!, percent }
}

export interface BestWindow {
  startDate: string
  endDate: string
  total: number
  average: number
}

/**
 * The best `windowDays`-day sliding window anywhere in the calendar year —
 * used for both "best focus week" (read `.total` minutes) and the sleep
 * slide's "best week" (read `.average` hours). Walks every day of the year
 * (including ones absent from `map`, as 0), not just the map's own keys, so
 * the window is never thrown off by gaps.
 */
export function computeBestWindow(map: Record<string, number>, year: string, windowDays: number): BestWindow | null {
  const yearNum = Number(year)
  const keys: string[] = []
  const values: number[] = []
  const cursor = new Date(yearNum, 0, 1)
  while (cursor.getFullYear() === yearNum) {
    const key = dateKey(cursor)
    keys.push(key)
    values.push(map[key] ?? 0)
    cursor.setDate(cursor.getDate() + 1)
  }
  if (values.length < windowDays) return null

  let windowSum = values.slice(0, windowDays).reduce((sum, value) => sum + value, 0)
  let bestSum = windowSum
  let bestStartIndex = 0

  for (let i = windowDays; i < values.length; i += 1) {
    windowSum += values[i]! - values[i - windowDays]!
    if (windowSum > bestSum) {
      bestSum = windowSum
      bestStartIndex = i - windowDays + 1
    }
  }

  if (bestSum <= 0) return null

  return {
    startDate: keys[bestStartIndex]!,
    endDate: keys[bestStartIndex + windowDays - 1]!,
    total: bestSum,
    average: bestSum / windowDays,
  }
}

const MIN_SLEEP_DAYS_FOR_SLIDE = 7
const MIN_STREAK_DAYS_TO_CELEBRATE = 2

/**
 * The ordered slide deck for /review. Every slide individually guards its
 * own "enough, non-zero data" condition and is simply omitted when it isn't
 * met — CLAUDE.md: "Slides without enough data are skipped automatically.
 * Never show a slide with zeros."
 */
export function buildReviewSlides({ year, goals, months, spending }: ReviewData): ReviewSlide[] {
  const slides: ReviewSlide[] = []

  const totalChunks = goals.reduce((sum, goal) => sum + goal.completedChunks, 0)
  const totalMinutes = goals.reduce((sum, goal) => sum + minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes), 0)
  const totalHours = totalMinutes / 60

  if (totalChunks > 0) {
    slides.push({ type: 'intro', year, totalChunks })
  }

  if (totalHours > 0) {
    slides.push({ type: 'totalHours', hours: totalHours, days: totalHours / 24 })
  }

  let topGoal: Goal | null = null
  let topGoalMinutes = 0
  for (const goal of goals) {
    const minutes = minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes)
    if (minutes > topGoalMinutes) {
      topGoalMinutes = minutes
      topGoal = goal
    }
  }
  if (topGoal && topGoalMinutes > 0) {
    slides.push({
      type: 'topSubject',
      name: topGoal.name,
      hours: topGoalMinutes / 60,
      totalChunks: chunkCount(topGoal.totalMinutes, topGoal.chunkMinutes),
      chunkMinutes: topGoal.chunkMinutes,
      hue: topGoal.hue,
    })
  }

  const finishedGoals = goals.filter((goal) => percentComplete(goal.completedChunks, chunkCount(goal.totalMinutes, goal.chunkMinutes)) >= 100)
  if (finishedGoals.length > 0) {
    slides.push({
      type: 'subjectsFinished',
      subjects: finishedGoals.map((goal) => ({
        name: goal.name,
        totalChunks: chunkCount(goal.totalMinutes, goal.chunkMinutes),
        chunkMinutes: goal.chunkMinutes,
        hue: goal.hue,
      })),
    })
  }

  const dateMinutes = buildDateMinutesMap(months)

  const longestStreak = computeLongestStreakRange(dateMinutes)
  if (longestStreak && longestStreak.days >= MIN_STREAK_DAYS_TO_CELEBRATE) {
    slides.push({ type: 'longestStreak', ...longestStreak })
  }

  const monthlyHours = Array.from({ length: 12 }, (_, index) => {
    const monthId = `${year}-${String(index + 1).padStart(2, '0')}`
    const month = months.find((m) => m.id === monthId)
    if (!month) return 0
    return Object.values(month.days).reduce((sum, entry) => sum + entry.total, 0) / 60
  })
  const bestMonthHours = Math.max(...monthlyHours)
  if (bestMonthHours > 0) {
    slides.push({ type: 'bestMonth', monthlyHours, bestMonthIndex: monthlyHours.indexOf(bestMonthHours), bestMonthHours })
  }

  const weekdayInsight = computeConsistentWeekday(dateMinutes)
  if (weekdayInsight && weekdayInsight.percent > 0) {
    slides.push({ type: 'consistentWeekday', ...weekdayInsight })
  }

  const bestFocusWeek = computeBestWindow(dateMinutes, year, 7)
  if (bestFocusWeek && bestFocusWeek.total > 0) {
    slides.push({ type: 'bestFocusWeek', startDate: bestFocusWeek.startDate, endDate: bestFocusWeek.endDate, minutes: bestFocusWeek.total })
  }

  const sleepMap = buildSleepHoursMap(months)
  const sleepDayCount = Object.keys(sleepMap).length
  if (sleepDayCount >= MIN_SLEEP_DAYS_FOR_SLIDE) {
    const averageSleepHours = average(Object.values(sleepMap))
    const bestSleepWeek = computeBestWindow(sleepMap, year, 7)
    if (averageSleepHours > 0) {
      slides.push({ type: 'sleep', averageHours: averageSleepHours, bestWeekAverage: bestSleepWeek?.average ?? averageSleepHours })
    }
  }

  if (spending.length > 0) {
    const categories = groupByCategory(spending)
    const spendingTotal = categories.reduce((sum, category) => sum + category.total, 0)
    if (categories.length > 0 && spendingTotal > 0) {
      slides.push({ type: 'spending', topCategory: categories[0]!.category, topCategoryTotal: categories[0]!.total, total: spendingTotal })
    }
  }

  if (slides.length > 0) {
    slides.push({ type: 'outro', year, totalHours, totalChunks, topSubjectName: topGoal?.name ?? '' })
  }

  return slides
}
