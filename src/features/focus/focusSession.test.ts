import { describe, expect, it } from 'vitest'
import { computeFocusProgress, createFocusSession, formatClock, type FocusSessionData } from './focusSession'

const GOAL = { id: 'g1', name: 'French', hue: 0, chunkMinutes: 25 }
const CHUNK_MS = 25 * 60_000

describe('createFocusSession', () => {
  it('starts unpaused, active, with zero elapsed time', () => {
    const session = createFocusSession(GOAL, { mode: 'fixed', chunks: 2 })
    expect(session.isPaused).toBe(false)
    expect(session.phase).toBe('active')
    expect(session.accumulatedMs).toBe(0)
    expect(session.targetChunks).toBe(2)
  })

  it('zeroes targetChunks in free mode', () => {
    const session = createFocusSession(GOAL, { mode: 'free' })
    expect(session.mode).toBe('free')
    expect(session.targetChunks).toBe(0)
  })
})

describe('computeFocusProgress — fixed mode', () => {
  function sessionAt(startedAt: number, targetChunks = 2): FocusSessionData {
    return { ...createFocusSession(GOAL, { mode: 'fixed', chunks: targetChunks }), startedAt }
  }

  it('reports half of the first chunk filled at the halfway point', () => {
    const now = 1_000_000
    const session = sessionAt(now - CHUNK_MS / 2)
    const progress = computeFocusProgress(session, now)
    expect(progress.currentChunkProgress).toBeCloseTo(0.5, 5)
    expect(progress.completedChunksInSession).toBe(0)
    expect(progress.isTargetReached).toBe(false)
  })

  it('rolls over into the second chunk once the first completes', () => {
    const now = 1_000_000
    const session = sessionAt(now - CHUNK_MS - CHUNK_MS / 4)
    const progress = computeFocusProgress(session, now)
    expect(progress.completedChunksInSession).toBe(1)
    expect(progress.currentChunkProgress).toBeCloseTo(0.25, 5)
  })

  it('caps at the target and reports isTargetReached once elapsed time exceeds it', () => {
    const now = 1_000_000
    const session = sessionAt(now - 2 * CHUNK_MS - 60_000)
    const progress = computeFocusProgress(session, now)
    expect(progress.isTargetReached).toBe(true)
    expect(progress.completedChunksInSession).toBe(2)
    expect(progress.currentChunkProgress).toBe(1)
    expect(progress.remainingMs).toBe(0)
  })

  it('freezes elapsed time while paused, ignoring startedAt', () => {
    const session: FocusSessionData = {
      ...createFocusSession(GOAL, { mode: 'fixed', chunks: 2 }),
      isPaused: true,
      accumulatedMs: CHUNK_MS / 2,
      startedAt: 0,
    }
    const progress = computeFocusProgress(session, 999_999_999)
    expect(progress.elapsedMs).toBe(CHUNK_MS / 2)
    expect(progress.currentChunkProgress).toBeCloseTo(0.5, 5)
  })
})

describe('computeFocusProgress — free mode', () => {
  it('has no remainingMs and counts completed chunks as time passes', () => {
    const now = 1_000_000
    const session: FocusSessionData = { ...createFocusSession(GOAL, { mode: 'free' }), startedAt: now - CHUNK_MS * 2.5 }
    const progress = computeFocusProgress(session, now)
    expect(progress.remainingMs).toBeNull()
    expect(progress.completedChunksInSession).toBe(2)
    expect(progress.currentChunkProgress).toBeCloseTo(0.5, 5)
    expect(progress.isTargetReached).toBe(false)
  })
})

describe('formatClock', () => {
  it('floors for count-up clocks', () => {
    expect(formatClock(90_400, 'floor')).toBe('01:30')
  })

  it('ceils for countdown clocks so it never shows 00:00 early', () => {
    expect(formatClock(1, 'ceil')).toBe('00:01')
    expect(formatClock(0, 'ceil')).toBe('00:00')
  })

  it('never goes negative', () => {
    expect(formatClock(-500, 'floor')).toBe('00:00')
  })
})
