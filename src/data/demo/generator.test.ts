import { describe, expect, it } from 'vitest'
import { chunkCount } from '@/lib/chunks'
import { generateDemoData } from './generator'

const FIXED_TODAY = new Date(2026, 9, 15) // October 15, 2026 — mid-month, enough runway for gaps/streak

describe('generateDemoData', () => {
  it('is byte-identical across two runs with the same seed and day', () => {
    const a = generateDemoData(42, FIXED_TODAY)
    const b = generateDemoData(42, FIXED_TODAY)
    expect(JSON.stringify([...a.goals])).toBe(JSON.stringify([...b.goals]))
    expect(JSON.stringify([...a.sessions])).toBe(JSON.stringify([...b.sessions]))
    expect(JSON.stringify([...a.months])).toBe(JSON.stringify([...b.months]))
    expect(JSON.stringify([...a.spending])).toBe(JSON.stringify([...b.spending]))
  })

  it('creates exactly 6 goals, all in the current month, matching the spec\'s hours/chunk sizes/percentages', () => {
    const data = generateDemoData(42, FIXED_TODAY)
    const goals = [...data.goals.values()]
    expect(goals).toHaveLength(6)

    const french = goals.find((g) => g.name === 'French')!
    expect(french.totalMinutes).toBe(40 * 60)
    expect(french.chunkMinutes).toBe(5)
    const frenchPercent = (french.completedChunks / chunkCount(french.totalMinutes, french.chunkMinutes)) * 100
    expect(frenchPercent).toBeGreaterThan(60)
    expect(frenchPercent).toBeLessThan(76)

    const english = goals.find((g) => g.name === 'English')!
    expect(english.completedChunks).toBe(chunkCount(english.totalMinutes, english.chunkMinutes))
    expect(english.carryMinutes).toBe(0)

    for (const goal of goals) {
      expect(goal.month).toBe('2026-10')
      expect(goal.status).toBe('active')
      expect(goal.carryMinutes).toBeLessThan(goal.chunkMinutes)
      expect(goal.carryMinutes).toBeGreaterThanOrEqual(0)
    }
  })

  it("each goal's session minutes sum to exactly its banked total (completedChunks*chunkMinutes + carryMinutes)", () => {
    const data = generateDemoData(42, FIXED_TODAY)
    for (const [goalId, goal] of data.goals) {
      const banked = goal.completedChunks * goal.chunkMinutes + goal.carryMinutes
      const sessionTotal = [...data.sessions.values()]
        .filter((s) => s.goalId === goalId)
        .reduce((sum, s) => sum + s.minutes, 0)
      expect(sessionTotal).toBe(banked)
    }
  })

  it('produces 12 months of data including sleep entries every day', () => {
    const data = generateDemoData(42, FIXED_TODAY)
    expect(data.months.size).toBe(12)
    expect(data.months.has('2026-10')).toBe(true)
    expect(data.months.has('2025-11')).toBe(true)
    const october = data.months.get('2026-10')!
    expect(Object.keys(october.sleep ?? {}).length).toBeGreaterThan(0)
    for (const month of data.months.values()) {
      for (const sleep of Object.values(month.sleep ?? {})) {
        expect(sleep.hours).toBeGreaterThanOrEqual(6)
        expect(sleep.hours).toBeLessThanOrEqual(8.5)
      }
    }
  })

  it('has at least a 14-day streak of active days ending today', () => {
    const data = generateDemoData(42, FIXED_TODAY)
    for (let back = 0; back < 14; back += 1) {
      const date = new Date(FIXED_TODAY.getFullYear(), FIXED_TODAY.getMonth(), FIXED_TODAY.getDate() - back)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const dayKey = String(date.getDate()).padStart(2, '0')
      const total = data.months.get(monthKey)?.days[dayKey]?.total ?? 0
      expect(total).toBeGreaterThan(0)
    }
  })

  it('generates spending entries across all 6 categories somewhere in the year', () => {
    const data = generateDemoData(42, FIXED_TODAY)
    const categories = new Set([...data.spending.values()].map((s) => s.category))
    expect(categories.size).toBe(6)
  })

  it('produces a different dataset for a different seed', () => {
    const a = generateDemoData(1, FIXED_TODAY)
    const b = generateDemoData(2, FIXED_TODAY)
    expect(JSON.stringify([...a.sessions])).not.toBe(JSON.stringify([...b.sessions]))
  })
})
