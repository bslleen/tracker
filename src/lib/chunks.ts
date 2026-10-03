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

export interface ChunkProgressUpdate {
  chunksAdded: number
  newCarryMinutes: number
}

/**
 * Given a goal's current progress and a number of minutes just logged,
 * returns how many whole chunks that completes and the new remainder to
 * carry. Capped so completedChunks can never exceed the goal's chunk count
 * (also enforced by firestore.rules) — once a log would complete the goal,
 * any further minutes in that same session aren't carried into a chunk that
 * no longer exists. Shared by the write path (src/data/sessionWrites.ts) and
 * the Log Time sheet's live preview so they can't drift apart.
 */
export function computeChunkProgress(
  minutes: number,
  chunkMinutes: number,
  carryMinutes: number,
  completedChunks: number,
  totalMinutes: number,
): ChunkProgressUpdate {
  const maxChunks = chunkCount(totalMinutes, chunkMinutes)
  const remainingChunks = Math.max(0, maxChunks - completedChunks)

  const totalAvailable = carryMinutes + minutes
  const uncappedChunksAdded = Math.floor(totalAvailable / chunkMinutes)
  const chunksAdded = Math.min(uncappedChunksAdded, remainingChunks)
  const newCarryMinutes = chunksAdded < uncappedChunksAdded ? 0 : totalAvailable % chunkMinutes

  return { chunksAdded, newCarryMinutes }
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

/** "2026-10" for today's date. */
export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export interface CarriedGoalData {
  name: string
  month: string
  totalMinutes: number
  chunkMinutes: number
  completedChunks: number
  carryMinutes: number
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
    carryMinutes: 0,
    status: 'active',
    carriedFrom: goal.id,
    hue: goal.hue,
  }
}
