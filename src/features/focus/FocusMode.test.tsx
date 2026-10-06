import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logSession } from '@/data/sessionWrites'
import { FocusMode } from './FocusMode'
import { clearFocusSession, startFocusSession } from './focusStore'

vi.mock('@/data/sessionWrites', () => ({
  logSession: vi.fn().mockResolvedValue({ sessionId: 'session-1', chunksAdded: 1, newCarryMinutes: 0 }),
  undoSession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/data/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' }, isLoading: false }),
}))

// 1-minute chunks keep the fake-timer math small and readable.
const GOAL = { id: 'goal-1', name: 'French', hue: 0, chunkMinutes: 1 }

describe('FocusMode', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearFocusSession()
  })

  afterEach(() => {
    clearFocusSession()
    vi.useRealTimers()
  })

  it(
    'reaches the completion screen exactly when the chosen duration elapses, from real timestamps not counted ticks',
    async () => {
      render(
        <MemoryRouter>
          <FocusMode />
        </MemoryRouter>,
      )

      act(() => {
        startFocusSession(GOAL, { mode: 'fixed', chunks: 1 })
      })

      expect(screen.queryByRole('button', { name: 'Log it' })).not.toBeInTheDocument()

      // Just shy of the 1-minute target: still running.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(59_000)
      })
      expect(screen.queryByRole('button', { name: 'Log it' })).not.toBeInTheDocument()

      // Crossing the target flips to the completion screen on its own.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_500)
      })
      expect(screen.getByRole('button', { name: 'Log it' })).toBeInTheDocument()
      expect(logSession).not.toHaveBeenCalled()
    },
    15_000,
  )

  it(
    'auto-logs the completed chunks ~8s after completion, without the user pressing "Log it"',
    async () => {
      render(
        <MemoryRouter>
          <FocusMode />
        </MemoryRouter>,
      )

      act(() => {
        startFocusSession(GOAL, { mode: 'fixed', chunks: 1 })
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })
      expect(screen.getByRole('button', { name: 'Log it' })).toBeInTheDocument()

      // waitFor's own polling uses real timers under the hood, which never
      // advance here — assert directly instead; advanceTimersByTimeAsync
      // already flushes the microtasks logSession's mock resolves through.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(8_000)
      })

      expect(logSession).toHaveBeenCalledTimes(1)
      expect(logSession).toHaveBeenCalledWith(expect.objectContaining({ uid: 'test-uid', goalId: 'goal-1', minutes: 1 }))
    },
    15_000,
  )
})
