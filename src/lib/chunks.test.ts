import { describe, expect, it } from 'vitest'
import type { Goal } from '@/data/types'
import { carryOverGoal, chunkCount, chunksPerHour, nextMonth, percentComplete, remainingMinutes } from './chunks'

describe('chunkCount', () => {
  it('divides evenly', () => {
    expect(chunkCount(60, 15)).toBe(4)
  })

  it('rounds up a partial last chunk', () => {
    expect(chunkCount(50, 15)).toBe(4)
  })

  it('handles a single chunk', () => {
    expect(chunkCount(5, 5)).toBe(1)
  })
})

describe('chunksPerHour', () => {
  it('divides evenly', () => {
    expect(chunksPerHour(15)).toBe(4)
  })

  it('returns a fraction for chunk sizes that do not divide an hour evenly', () => {
    expect(chunksPerHour(25)).toBeCloseTo(2.4)
  })
})

describe('percentComplete', () => {
  it('computes a mid-range percentage', () => {
    expect(percentComplete(2, 4)).toBe(50)
  })

  it('is 0 with zero completed chunks', () => {
    expect(percentComplete(0, 4)).toBe(0)
  })

  it('is 100 when fully complete', () => {
    expect(percentComplete(4, 4)).toBe(100)
  })

  it('is 0 when there are no chunks at all (avoids divide-by-zero)', () => {
    expect(percentComplete(0, 0)).toBe(0)
  })

  it('clamps above 100', () => {
    expect(percentComplete(6, 4)).toBe(100)
  })
})

describe('remainingMinutes', () => {
  it('subtracts completed minutes from the total', () => {
    expect(remainingMinutes(60, 15, 2)).toBe(30)
  })

  it('accounts for a partial last chunk instead of over-counting it', () => {
    // 50 minutes / 15-minute chunks = chunks of 15, 15, 15, 5.
    expect(remainingMinutes(50, 15, 3)).toBe(5)
  })

  it('never goes negative', () => {
    expect(remainingMinutes(60, 15, 10)).toBe(0)
  })
})

describe('nextMonth', () => {
  it('increments within a year', () => {
    expect(nextMonth('2026-01')).toBe('2026-02')
  })

  it('rolls over into the next year at December', () => {
    expect(nextMonth('2026-12')).toBe('2027-01')
  })

  it('pads single-digit months', () => {
    expect(nextMonth('2026-09')).toBe('2026-10')
  })
})

describe('carryOverGoal', () => {
  const goal: Goal = {
    id: 'goal-1',
    name: 'French',
    month: '2026-10',
    totalMinutes: 60,
    chunkMinutes: 15,
    completedChunks: 2,
    status: 'active',
    hue: 12,
    // Timestamp values are never read by carryOverGoal; casting keeps the
    // fixture focused on the fields this pure function actually touches.
    createdAt: {} as Goal['createdAt'],
    updatedAt: {} as Goal['updatedAt'],
  }

  it('carries only the unfinished minutes into next month', () => {
    expect(carryOverGoal(goal)).toEqual({
      name: 'French',
      month: '2026-11',
      totalMinutes: 30,
      chunkMinutes: 15,
      completedChunks: 0,
      status: 'active',
      carriedFrom: 'goal-1',
      hue: 12,
    })
  })

  it('carries a partial last chunk correctly', () => {
    const partial: Goal = { ...goal, totalMinutes: 50, completedChunks: 3 }
    expect(carryOverGoal(partial).totalMinutes).toBe(5)
  })

  it('rolls over into January from a December goal', () => {
    const december: Goal = { ...goal, month: '2026-12' }
    expect(carryOverGoal(december).month).toBe('2027-01')
  })
})
