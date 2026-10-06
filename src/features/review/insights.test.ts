import { describe, expect, it } from 'vitest'
import type { Goal, Month, SpendingEntry } from '@/data/types'
import {
  buildReviewSlides,
  computeBestWindow,
  computeConsistentWeekday,
  computeLongestStreakRange,
  type ReviewSlide,
} from './insights'

const FAKE_TIMESTAMP = {} as Goal['createdAt']
const YEAR = '2026'

function goal(partial: Pick<Goal, 'id' | 'name' | 'totalMinutes' | 'chunkMinutes' | 'completedChunks' | 'hue'> & Partial<Goal>): Goal {
  return {
    month: `${YEAR}-01`,
    carryMinutes: 0,
    status: 'active',
    createdAt: FAKE_TIMESTAMP,
    updatedAt: FAKE_TIMESTAMP,
    ...partial,
  }
}

function month(id: string, days: Record<string, { total: number; byGoal: Record<string, number> }>, sleep?: Record<string, { hours: number; quality: number }>): Month {
  return { id, days, sleep }
}

function spendingEntry(partial: Pick<SpendingEntry, 'id' | 'date' | 'amount' | 'category'>): SpendingEntry {
  return { ...partial, createdAt: FAKE_TIMESTAMP }
}

function slideTypes(slides: ReviewSlide[]): string[] {
  return slides.map((s) => s.type)
}

describe('computeLongestStreakRange', () => {
  it('is null for an empty map', () => {
    expect(computeLongestStreakRange({})).toBeNull()
  })

  it('finds the longest run and its date range, even when not the most recent', () => {
    const map = {
      '2026-01-01': 10,
      '2026-01-02': 10,
      '2026-01-03': 10,
      '2026-01-10': 10,
      '2026-01-11': 10,
      '2026-01-12': 10,
      '2026-01-13': 10,
      '2026-01-14': 10,
    }
    expect(computeLongestStreakRange(map)).toEqual({ days: 5, startDate: '2026-01-10', endDate: '2026-01-14' })
  })

  it('treats a lone active day as a 1-day streak', () => {
    expect(computeLongestStreakRange({ '2026-01-01': 10 })).toEqual({ days: 1, startDate: '2026-01-01', endDate: '2026-01-01' })
  })
})

describe('computeConsistentWeekday', () => {
  it('is null with fewer than 14 active days', () => {
    const map: Record<string, number> = {}
    for (let i = 1; i <= 10; i += 1) map[`2026-01-${String(i).padStart(2, '0')}`] = 10
    expect(computeConsistentWeekday(map)).toBeNull()
  })

  it('identifies the most frequent weekday once there is enough data', () => {
    // Every Tuesday in Jan/Feb 2026 (Jan 6, 13, 20, 27, Feb 3, 10) plus a few scattered other days.
    const map: Record<string, number> = {
      '2026-01-06': 10,
      '2026-01-13': 10,
      '2026-01-20': 10,
      '2026-01-27': 10,
      '2026-02-03': 10,
      '2026-02-10': 10,
      '2026-01-01': 10,
      '2026-01-02': 10,
      '2026-01-03': 10,
      '2026-01-04': 10,
      '2026-01-05': 10,
      '2026-01-07': 10,
      '2026-01-08': 10,
      '2026-01-09': 10,
    }
    const result = computeConsistentWeekday(map)
    expect(result?.weekday).toBe('Tuesday')
    expect(result?.percent).toBeGreaterThan(0)
  })
})

describe('computeBestWindow', () => {
  it('is null when the year has fewer days than the window', () => {
    expect(computeBestWindow({}, YEAR, 400)).toBeNull()
  })

  it('finds the best 7-day window across gaps (missing days count as 0)', () => {
    const map = { '2026-03-10': 100, '2026-03-11': 100, '2026-03-12': 100 }
    const result = computeBestWindow(map, YEAR, 7)
    expect(result?.total).toBe(300)
    expect((result?.startDate ?? '') <= '2026-03-10').toBe(true)
    expect((result?.endDate ?? '') >= '2026-03-12').toBe(true)
  })

  it('is null when every day is 0', () => {
    expect(computeBestWindow({}, YEAR, 7)).toBeNull()
  })
})

describe('buildReviewSlides', () => {
  it('returns no slides at all for a completely empty year', () => {
    expect(buildReviewSlides({ year: YEAR, goals: [], months: [], spending: [] })).toEqual([])
  })

  it('builds intro, totalHours, topSubject, and outro from a single goal', () => {
    const goals = [goal({ id: 'french', name: 'French', totalMinutes: 1200, chunkMinutes: 15, completedChunks: 40, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    expect(slideTypes(slides)).toEqual(['intro', 'totalHours', 'topSubject', 'outro'])

    const intro = slides[0] as Extract<ReviewSlide, { type: 'intro' }>
    expect(intro.totalChunks).toBe(40)

    const totalHours = slides[1] as Extract<ReviewSlide, { type: 'totalHours' }>
    expect(totalHours.hours).toBe(10) // 40 * 15 / 60
    expect(totalHours.days).toBeCloseTo(10 / 24, 5)

    const topSubject = slides[2] as Extract<ReviewSlide, { type: 'topSubject' }>
    expect(topSubject.name).toBe('French')
    expect(topSubject.totalChunks).toBe(80) // 1200/15

    const outro = slides[3] as Extract<ReviewSlide, { type: 'outro' }>
    expect(outro.topSubjectName).toBe('French')
  })

  it('picks the goal with the most banked minutes as the top subject, not the most chunks', () => {
    const goals = [
      goal({ id: 'a', name: 'Low chunk size', totalMinutes: 100, chunkMinutes: 5, completedChunks: 10, hue: 0 }), // 50 minutes
      goal({ id: 'b', name: 'High chunk size', totalMinutes: 200, chunkMinutes: 30, completedChunks: 4, hue: 5 }), // 120 minutes
    ]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    const topSubject = slides.find((s) => s.type === 'topSubject') as Extract<ReviewSlide, { type: 'topSubject' }>
    expect(topSubject.name).toBe('High chunk size')
  })

  it('lists every finished (>=100%) subject', () => {
    const goals = [
      goal({ id: 'a', name: 'Done', totalMinutes: 100, chunkMinutes: 10, completedChunks: 10, hue: 0 }),
      goal({ id: 'b', name: 'Not done', totalMinutes: 100, chunkMinutes: 10, completedChunks: 5, hue: 0 }),
    ]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    const finished = slides.find((s) => s.type === 'subjectsFinished') as Extract<ReviewSlide, { type: 'subjectsFinished' }>
    expect(finished.subjects.map((s) => s.name)).toEqual(['Done'])
  })

  it('skips the subjectsFinished slide when nothing is finished', () => {
    const goals = [goal({ id: 'a', name: 'In progress', totalMinutes: 100, chunkMinutes: 10, completedChunks: 5, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    expect(slideTypes(slides)).not.toContain('subjectsFinished')
  })

  it('includes the longest streak and best month from month docs', () => {
    const months = [
      month('2026-03', {
        '01': { total: 60, byGoal: {} },
        '02': { total: 60, byGoal: {} },
        '03': { total: 60, byGoal: {} },
      }),
    ]
    const goals = [goal({ id: 'a', name: 'French', totalMinutes: 600, chunkMinutes: 15, completedChunks: 12, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months, spending: [] })

    const streak = slides.find((s) => s.type === 'longestStreak') as Extract<ReviewSlide, { type: 'longestStreak' }>
    expect(streak).toMatchObject({ days: 3, startDate: '2026-03-01', endDate: '2026-03-03' })

    const bestMonth = slides.find((s) => s.type === 'bestMonth') as Extract<ReviewSlide, { type: 'bestMonth' }>
    expect(bestMonth.bestMonthIndex).toBe(2) // March, 0-indexed
    expect(bestMonth.monthlyHours).toHaveLength(12)
  })

  it('skips the sleep slide with fewer than 7 days of sleep data', () => {
    const months = [month('2026-01', {}, { '01': { hours: 8, quality: 4 } })]
    const goals = [goal({ id: 'a', name: 'French', totalMinutes: 100, chunkMinutes: 10, completedChunks: 1, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months, spending: [] })
    expect(slideTypes(slides)).not.toContain('sleep')
  })

  it('includes the sleep slide with 7+ days of data', () => {
    const sleep: Record<string, { hours: number; quality: number }> = {}
    for (let i = 1; i <= 10; i += 1) sleep[String(i).padStart(2, '0')] = { hours: 7, quality: 4 }
    const months = [month('2026-01', {}, sleep)]
    const goals = [goal({ id: 'a', name: 'French', totalMinutes: 100, chunkMinutes: 10, completedChunks: 1, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months, spending: [] })
    const sleepSlide = slides.find((s) => s.type === 'sleep') as Extract<ReviewSlide, { type: 'sleep' }>
    expect(sleepSlide.averageHours).toBe(7)
  })

  it('includes the spending slide with the top category', () => {
    const goals = [goal({ id: 'a', name: 'French', totalMinutes: 100, chunkMinutes: 10, completedChunks: 1, hue: 0 })]
    const spending = [
      spendingEntry({ id: '1', date: '2026-01-01', amount: 100, category: 'Food' }),
      spendingEntry({ id: '2', date: '2026-01-02', amount: 10, category: 'Fun' }),
    ]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending })
    const spendingSlide = slides.find((s) => s.type === 'spending') as Extract<ReviewSlide, { type: 'spending' }>
    expect(spendingSlide).toMatchObject({ topCategory: 'Food', topCategoryTotal: 100, total: 110 })
  })

  it('never produces an outro without at least one other slide', () => {
    expect(buildReviewSlides({ year: YEAR, goals: [], months: [], spending: [] })).toEqual([])
  })

  it('skips the intro/totalHours/topSubject slides entirely when every goal has 0 completed chunks (never zeros)', () => {
    const goals = [goal({ id: 'a', name: 'Not started', totalMinutes: 100, chunkMinutes: 10, completedChunks: 0, hue: 0 })]
    const slides = buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    expect(slides).toEqual([])
  })
})
