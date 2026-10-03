import type { Goal, GoalStatus } from '@/data/types'

/** Total minutes / chunk size, rounded up — the last chunk may be partial. */
export function chunkCount(totalMinutes: number, chunkMinutes: number): number {
  return Math.ceil(totalMinutes / chunkMinutes)
}

export function chunksPerHour(chunkMinutes: number): number {
  return 60 / chunkMinutes
}

/** 0-100. 0 when there are no chunks to avoid dividing by zero. */
export function percentComplete(completedChunks: number, totalChunks: number): number {
  if (totalChunks <= 0) return 0
  return Math.min(100, Math.max(0, (completedChunks / totalChunks) * 100))
}

/**
 * Minutes left to log. Computed from raw minutes rather than
 * `(totalChunks - completedChunks) * chunkMinutes` so a partial last chunk
 * (totalMinutes not evenly divisible by chunkMinutes) isn't over-counted.
 */
export function remainingMinutes(totalMinutes: number, chunkMinutes: number, completedChunks: number): number {
  return Math.max(0, totalMinutes - completedChunks * chunkMinutes)
}

export function nextMonth(month: string): string {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)
  if (monthNum === 12) {
    return `${year + 1}-01`
  }
  return `${year}-${String(monthNum + 1).padStart(2, '0')}`
}

export interface CarriedGoalData {
  name: string
  month: string
  totalMinutes: number
  chunkMinutes: number
  completedChunks: number
  status: GoalStatus
  carriedFrom: string
  hue: number
}

/** New goal data for next month, carrying over only the unfinished minutes. */
export function carryOverGoal(goal: Goal): CarriedGoalData {
  return {
    name: goal.name,
    month: nextMonth(goal.month),
    totalMinutes: remainingMinutes(goal.totalMinutes, goal.chunkMinutes, goal.completedChunks),
    chunkMinutes: goal.chunkMinutes,
    completedChunks: 0,
    status: 'active',
    carriedFrom: goal.id,
    hue: goal.hue,
  }
}
