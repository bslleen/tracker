import { animate, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PauseIcon, PlayIcon, XIcon } from '@/components/icons'
import { OverlayPortal } from '@/components/OverlayPortal'
import { Button, IconButton } from '@/components/ui'
import { logSession, undoSession } from '@/data/sessionWrites'
import { useAuth } from '@/data/useAuth'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { currentMonth } from '@/lib/chunks'
import { cn } from '@/lib/cn'
import { shiftAccentHue } from '@/lib/color'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { playChime, useChimeSetting } from './chimeSetting'
import { CompletionBurst } from './CompletionBurst'
import { EndSessionDialog } from './EndSessionDialog'
import { FocusSquare } from './FocusSquare'
import { FOCUS_AUTO_LOG_MS, FOCUS_TICK_MS, computeFocusProgress, formatClock } from './focusSession'
import { clearFocusSession, completeFocusSession, getFocusSessionSnapshot, pauseFocusSession, resumeFocusSession, subscribeFocusSession } from './focusStore'
import { useWakeLock } from './useWakeLock'

const CONTROLS_HIDE_MS = 3000

export function FocusMode() {
  const session = useSyncExternalStore(subscribeFocusSession, getFocusSessionSnapshot, () => null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const prefersReducedMotion = Boolean(useReducedMotion())
  const chimeEnabled = useChimeSetting()
  const isLandscapePhone = useMediaQuery('(max-height: 480px) and (orientation: landscape)')

  const isActive = session !== null
  const isRunning = session?.phase === 'active' && !session.isPaused

  useOverlayLock(isActive)
  useWakeLock(isRunning)

  // The clock lives in state, refreshed from an effect/interval callback
  // (never read directly during render — Date.now() is impure) — but it's
  // always a fresh timestamp each time it's set, never a counted tick, so a
  // throttled background tab or a reload mid-session still lands on the
  // correct value the instant this runs again. Seeded from the session's own
  // startedAt so the very first paint (before the effect below runs) shows
  // exactly its banked progress rather than a Date.now() call during render.
  const [nowMs, setNowMs] = useState(() => session?.startedAt ?? 0)
  useEffect(() => {
    // Synchronizing with the system clock, not deriving from props/state —
    // there's no render-time equivalent for "what time is it right now".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowMs(Date.now())
    if (!isRunning) return
    const id = window.setInterval(() => setNowMs(Date.now()), FOCUS_TICK_MS)
    return () => window.clearInterval(id)
  }, [isRunning])

  const progress = session ? computeFocusProgress(session, nowMs) : null

  // Fixed-duration target reached naturally while running. Reruns on every
  // tick (cheap, idempotent): once completeFocusSession() flips the store's
  // phase to 'completed', `session.phase === 'active'` is false and it stops.
  useEffect(() => {
    if (session?.phase === 'active' && progress?.isTargetReached) {
      completeFocusSession()
    }
  }, [session, progress])

  // document.title mirrors the live countdown/count-up, restored once the session ends.
  const originalTitleRef = useRef<string | null>(null)
  useEffect(() => {
    if (isActive) {
      originalTitleRef.current ??= document.title
    } else if (originalTitleRef.current !== null) {
      document.title = originalTitleRef.current
      originalTitleRef.current = null
    }
  }, [isActive])

  useEffect(() => {
    if (!session || !progress) return
    const label =
      session.mode === 'fixed' ? formatClock(progress.remainingMs ?? 0, 'ceil') : formatClock(progress.elapsedMs, 'floor')
    document.title = `${label} · ${session.goalName}`
  }, [session, progress])

  const hasPlayedCompletionRef = useRef(false)
  useEffect(() => {
    if (session?.phase === 'completed') {
      if (!hasPlayedCompletionRef.current) {
        hasPlayedCompletionRef.current = true
        if (chimeEnabled) playChime()
      }
    } else {
      hasPlayedCompletionRef.current = false
    }
  }, [session?.phase, chimeEnabled])

  const handleLogIt = useCallback(async () => {
    if (!session || session.phase !== 'completed' || !session.completedChunks || !user) return
    const minutes = session.completedChunks * session.chunkMinutes
    const goalId = session.goalId
    const goalName = session.goalName
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')

    try {
      const result = await logSession({ uid: user.uid, goalId, month: currentMonth(), day, minutes })
      clearFocusSession()
      navigate('/')
      toast(`Logged ${minutes} min · ${goalName}`, {
        action: { label: 'Undo', onClick: () => void undoSession(user.uid, result.sessionId) },
      })
    } catch {
      toast.error('Could not log that session. Try again.')
    }
  }, [session, user, navigate])

  useEffect(() => {
    if (session?.phase !== 'completed' || session.completedAt === null) return
    const remaining = Math.max(0, FOCUS_AUTO_LOG_MS - (Date.now() - session.completedAt))
    const id = window.setTimeout(() => void handleLogIt(), remaining)
    return () => window.clearTimeout(id)
  }, [session?.phase, session?.completedAt, handleLogIt])

  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<number | null>(null)
  const armHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_MS)
  }, [])
  const showControls = useCallback(() => {
    setControlsVisible(true)
    armHideTimer()
  }, [armHideTimer])

  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)

  // Reset controls-visible / close the confirm dialog exactly on the
  // active<->inactive transition — React's "adjust state when a prop
  // changes" pattern (see LogTimeSheet.tsx for the same idiom) rather than a
  // useEffect, since there's no external system to synchronize with here.
  const [wasActive, setWasActive] = useState(isActive)
  if (isActive !== wasActive) {
    setWasActive(isActive)
    if (isActive) {
      setControlsVisible(true)
    } else {
      setIsEndDialogOpen(false)
    }
  }

  // The hide-timer itself IS a real external system (a timeout), so arming
  // it on activation stays in an effect.
  useEffect(() => {
    if (!isActive) return
    armHideTimer()
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    }
  }, [isActive, armHideTimer])

  // Escape always surfaces the confirmation (per spec), independent of the
  // ghost "end session" button's own confirm-only-if->1-chunk-at-stake rule.
  useEffect(() => {
    if (session?.phase !== 'active') return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsEndDialogOpen((open) => !open)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [session?.phase])

  function handleStopClick() {
    const chunksAtStake = progress?.completedChunksInSession ?? 0
    if (chunksAtStake > 1) {
      setIsEndDialogOpen(true)
    } else {
      clearFocusSession()
    }
  }

  if (!session || !progress) return null

  const completionMinutes = (session.completedChunks ?? 0) * session.chunkMinutes

  return (
    <OverlayPortal>
      <div
        className="z-modal fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-bg"
        style={{
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        onPointerMove={showControls}
        onPointerDown={showControls}
        role="dialog"
        aria-modal="true"
        aria-label={`Focus session · ${session.goalName}`}
      >
        {!prefersReducedMotion && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 60%)',
              animation: 'focus-breathe 8s ease-in-out infinite',
            }}
          />
        )}

        {session.phase === 'active' ? (
          <div className={cn('relative flex items-center justify-center', isLandscapePhone ? 'flex-row gap-12' : 'flex-col gap-8')}>
            <div className={cn('flex flex-col items-center gap-8', isLandscapePhone && 'gap-6')}>
              <p className="text-[length:var(--text-small)] text-text-2">{session.goalName}</p>
              <FocusSquare
                progress={progress.currentChunkProgress}
                hue={session.hue}
                isComplete={false}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <span className="num text-[clamp(2.25rem,6vw,4.5rem)] leading-none text-text">
                {session.mode === 'fixed' ? formatClock(progress.remainingMs ?? 0, 'ceil') : formatClock(progress.elapsedMs, 'floor')}
              </span>
              {session.mode === 'fixed' && session.targetChunks > 1 && (
                <div
                  className="flex items-center gap-2"
                  role="img"
                  aria-label={`${progress.completedChunksInSession} of ${session.targetChunks} chunks done`}
                >
                  {Array.from({ length: session.targetChunks }, (_, index) => (
                    <span
                      key={index}
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: index < progress.completedChunksInSession ? shiftAccentHue(session.hue) : 'var(--chunk-empty)',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-8">
            <div className="relative">
              <FocusSquare progress={1} hue={session.hue} isComplete prefersReducedMotion={prefersReducedMotion} />
              {!prefersReducedMotion && <CompletionBurst />}
            </div>
            <CompletionNumeral minutes={completionMinutes} prefersReducedMotion={prefersReducedMotion} />
            <Button onClick={() => void handleLogIt()}>Log it</Button>
          </div>
        )}

        {session.phase === 'active' && (
          <div
            className={cn(
              'absolute flex items-center gap-3 transition-opacity duration-300',
              controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0 focus-within:pointer-events-auto focus-within:opacity-100',
            )}
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <IconButton
              aria-label={session.isPaused ? 'Resume' : 'Pause'}
              variant="subtle"
              onClick={() => (session.isPaused ? resumeFocusSession() : pauseFocusSession())}
            >
              {session.isPaused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton aria-label="End session" variant="subtle" onClick={handleStopClick}>
              <XIcon />
            </IconButton>
          </div>
        )}
      </div>

      <EndSessionDialog
        open={isEndDialogOpen}
        onCancel={() => setIsEndDialogOpen(false)}
        onConfirm={() => {
          setIsEndDialogOpen(false)
          clearFocusSession()
        }}
      />
    </OverlayPortal>
  )
}

function CompletionNumeral({ minutes, prefersReducedMotion }: { minutes: number; prefersReducedMotion: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (prefersReducedMotion) {
      node.textContent = `+${minutes} min`
      return
    }
    node.textContent = '+0 min'
    const controls = animate(0, minutes, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        node.textContent = `+${Math.round(value)} min`
      },
    })
    return () => controls.stop()
  }, [minutes, prefersReducedMotion])

  return (
    <span ref={ref} className="num text-[clamp(2.25rem,6vw,4.5rem)] leading-none text-text">
      +{minutes} min
    </span>
  )
}
