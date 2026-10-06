import type { Goal } from '@/data/types'

export type FocusDuration = { mode: 'fixed'; chunks: number } | { mode: 'free' }

export interface FocusSessionData {
  goalId: string
  goalName: string
  hue: number
  chunkMinutes: number
  mode: 'fixed' | 'free'
  /** Only meaningful when mode === 'fixed'. */
  targetChunks: number
  /** Epoch ms when the current running segment started (ignored while paused). */
  startedAt: number
  /** Elapsed ms banked from all previous running segments. */
  accumulatedMs: number
  isPaused: boolean
  phase: 'active' | 'completed'
  completedAt: number | null
  /** Frozen once phase flips to 'completed' — the whole-chunk count to log. */
  completedChunks: number | null
}

export interface FocusProgress {
  elapsedMs: number
  chunkMs: number
  /** null in free mode — there is no target to count down to. */
  remainingMs: number | null
  /** 0..1 fill of the current/next chunk. */
  currentChunkProgress: number
  completedChunksInSession: number
  /** Fixed mode only: the chosen duration has fully elapsed. */
  isTargetReached: boolean
}

/** Drives both the ~5fps re-render cadence and the CSS transition duration that smooths between ticks. */
export const FOCUS_TICK_MS = 200

export const FOCUS_AUTO_LOG_MS = 8000

const STORAGE_KEY = 'chunks:focus-session'

export function loadFocusSession(): FocusSessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FocusSessionData
  } catch {
    return null
  }
}

export function saveFocusSession(session: FocusSessionData | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable (private browsing quota, etc.) — the session just won't survive a reload.
  }
}

export function createFocusSession(
  goal: Pick<Goal, 'id' | 'name' | 'hue' | 'chunkMinutes'>,
  duration: FocusDuration,
): FocusSessionData {
  return {
    goalId: goal.id,
    goalName: goal.name,
    hue: goal.hue,
    chunkMinutes: goal.chunkMinutes,
    mode: duration.mode,
    targetChunks: duration.mode === 'fixed' ? duration.chunks : 0,
    startedAt: Date.now(),
    accumulatedMs: 0,
    isPaused: false,
    phase: 'active',
    completedAt: null,
    completedChunks: null,
  }
}

/** Elapsed ms computed fresh from timestamps — never from counting ticks, so background throttling can't skew it. */
export function elapsedMsFor(session: FocusSessionData, now: number): number {
  if (session.isPaused || session.phase === 'completed') return session.accumulatedMs
  return session.accumulatedMs + Math.max(0, now - session.startedAt)
}

export function computeFocusProgress(session: FocusSessionData, now: number): FocusProgress {
  const chunkMs = session.chunkMinutes * 60_000
  const elapsedMs = elapsedMsFor(session, now)

  if (session.mode === 'fixed') {
    const targetMs = session.targetChunks * chunkMs
    const clamped = Math.min(elapsedMs, targetMs)
    const isTargetReached = clamped >= targetMs
    const completedChunksInSession = Math.min(Math.floor(clamped / chunkMs), session.targetChunks)
    const withinChunkMs = clamped - completedChunksInSession * chunkMs
    const currentChunkProgress = isTargetReached ? 1 : withinChunkMs / chunkMs

    return {
      elapsedMs,
      chunkMs,
      remainingMs: Math.max(0, targetMs - elapsedMs),
      currentChunkProgress,
      completedChunksInSession,
      isTargetReached,
    }
  }

  const completedChunksInSession = Math.floor(elapsedMs / chunkMs)
  const currentChunkProgress = (elapsedMs % chunkMs) / chunkMs

  return {
    elapsedMs,
    chunkMs,
    remainingMs: null,
    currentChunkProgress,
    completedChunksInSession,
    isTargetReached: false,
  }
}

/** "mm:ss". `round` picks whether a partial second rounds up (countdowns, so it never shows 00:00 early) or down (count-ups). */
export function formatClock(ms: number, round: 'ceil' | 'floor'): string {
  const totalSeconds = Math.max(0, round === 'ceil' ? Math.ceil(ms / 1000) : Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
