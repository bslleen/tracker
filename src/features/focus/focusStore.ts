import type { Goal } from '@/data/types'
import {
  computeFocusProgress,
  createFocusSession,
  loadFocusSession,
  saveFocusSession,
  type FocusDuration,
  type FocusSessionData,
} from './focusSession'

/**
 * Module-level store (same subscribe/snapshot shape as useDemoMode.ts) rather
 * than React context — Focus Mode is triggered from distant, unrelated trees
 * (the Log Time sheet, a goal's detail page, the command palette) and must
 * also survive a full page reload, so localStorage is the actual source of
 * truth and this is just the live mirror of it.
 */
let session: FocusSessionData | null = loadFocusSession()
const listeners = new Set<() => void>()

function commit(next: FocusSessionData | null) {
  session = next
  saveFocusSession(session)
  for (const listener of listeners) listener()
}

export function subscribeFocusSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFocusSessionSnapshot(): FocusSessionData | null {
  return session
}

export function startFocusSession(goal: Pick<Goal, 'id' | 'name' | 'hue' | 'chunkMinutes'>, duration: FocusDuration): void {
  commit(createFocusSession(goal, duration))
}

export function pauseFocusSession(): void {
  if (!session || session.isPaused || session.phase !== 'active') return
  const progress = computeFocusProgress(session, Date.now())
  commit({ ...session, isPaused: true, accumulatedMs: progress.elapsedMs })
}

export function resumeFocusSession(): void {
  if (!session || !session.isPaused) return
  commit({ ...session, isPaused: false, startedAt: Date.now() })
}

/** Forfeits the session with nothing logged — used by "give up" and the end-session confirmation. */
export function clearFocusSession(): void {
  if (!session) return
  commit(null)
}

/**
 * Moves into the completion screen, freezing the whole-chunk count earned so
 * far. Used both when a fixed-duration target is reached naturally and when
 * the user finishes early. A session with zero completed chunks has nothing
 * worth a completion screen, so it's dismissed the same way "give up" is.
 */
export function completeFocusSession(): void {
  if (!session || session.phase !== 'active') return
  const progress = computeFocusProgress(session, Date.now())
  if (progress.completedChunksInSession <= 0) {
    commit(null)
    return
  }
  commit({
    ...session,
    phase: 'completed',
    accumulatedMs: progress.elapsedMs,
    completedAt: Date.now(),
    completedChunks: progress.completedChunksInSession,
  })
}
