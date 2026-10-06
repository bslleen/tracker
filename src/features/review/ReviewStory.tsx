import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@/components/icons'
import { OverlayPortal } from '@/components/OverlayPortal'
import { IconButton } from '@/components/ui'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import type { ReviewSlide } from './insights'
import { StoryProgressBar } from './StoryProgressBar'
import { StorySlideContent } from './StorySlideContent'

const SLIDE_DURATION_MS = 6000
const HOLD_THRESHOLD_MS = 180
const SWIPE_THRESHOLD_PX = 50

export interface ReviewStoryProps {
  open: boolean
  onClose: () => void
  slides: ReviewSlide[]
  onShare: () => void
  isSharing: boolean
}

/** A deterministic, very subtle per-slide gradient — "grays with a hint of green," never the same angle twice in a row. */
function slideBackground(index: number): string {
  const angle = (index * 47) % 360
  return `linear-gradient(${angle}deg, var(--bg), color-mix(in srgb, var(--accent) 6%, var(--bg)) 55%, var(--bg))`
}

export function ReviewStory({ open, onClose, slides, onShare, isSharing }: ReviewStoryProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  useOverlayLock(open)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [autoAdvanceOptIn, setAutoAdvanceOptIn] = useState(false)
  const autoAdvanceEnabled = !prefersReducedMotion || autoAdvanceOptIn
  // The CSS progress-bar fill drives timing in the normal case, but
  // globals.css's blanket reduced-motion rule forces EVERY animation's
  // duration to 0.01ms (`!important`) — including this one — regardless of
  // the opt-in. Fighting that with a second `!important` is more fragile
  // than just not using a CSS animation for this one fallback path: a plain
  // JS timer drives the opted-in-despite-reduced-motion case instead, and
  // the progress bar renders as a static (non-animating) "active" segment.
  // Caught via an actual 6-second real-browser wait, not by inspection — the
  // story was racing through all 11 slides in under a second.
  const useCssTimer = autoAdvanceEnabled && !prefersReducedMotion

  // Reset to the first slide every time the story is (re)opened — the
  // "adjust state when a prop changes" idiom used throughout this app
  // (see LogTimeSheet.tsx) rather than an effect.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setCurrentIndex(0)
      setIsPaused(false)
    }
  }

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(slides.length - 1, index)))
  }
  function advance() {
    if (currentIndex >= slides.length - 1) onClose()
    else goTo(currentIndex + 1)
  }
  function goBack() {
    goTo(currentIndex - 1)
  }

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const didHoldRef = useRef(false)

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    didHoldRef.current = false
    holdTimerRef.current = window.setTimeout(() => {
      didHoldRef.current = true
      setIsPaused(true)
    }, HOLD_THRESHOLD_MS)
  }

  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    clearHoldTimer()
    const start = pointerStartRef.current
    pointerStartRef.current = null

    // A hold that reached the pause threshold just resumes on release — it was never a navigation gesture.
    if (didHoldRef.current) {
      setIsPaused(false)
      return
    }
    if (!start) return

    const deltaX = event.clientX - start.x
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      if (deltaX < 0) advance()
      else goBack()
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (start.x - rect.left) / rect.width
    if (relativeX < 1 / 3) goBack()
    else advance()
  }

  function handlePointerCancel() {
    clearHoldTimer()
    if (didHoldRef.current) setIsPaused(false)
    pointerStartRef.current = null
  }

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') advance()
      else if (event.key === 'ArrowLeft') goBack()
      else if (event.key === ' ') {
        event.preventDefault()
        setIsPaused((current) => !current)
      } else if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIndex, slides.length])

  // The reduced-motion opt-in's fallback timer (see useCssTimer above) — a
  // plain setTimeout, since the CSS path is unavailable here. Pausing
  // restarts the full duration on resume rather than preserving elapsed
  // time; an acceptable simplification for this narrow, opt-in-only path.
  useEffect(() => {
    if (!open || useCssTimer || !autoAdvanceEnabled || isPaused) return
    const id = window.setTimeout(advance, SLIDE_DURATION_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useCssTimer, autoAdvanceEnabled, isPaused, currentIndex])

  if (!open || slides.length === 0) return null

  const slide = slides[currentIndex]!

  const storyBody = (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-bg"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Your year in review, slide ${currentIndex + 1} of ${slides.length}`}
    >
      <div aria-hidden="true" className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            className="absolute inset-0"
            style={{ background: slideBackground(currentIndex) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
          />
        </AnimatePresence>
      </div>

      <div className="relative flex flex-col gap-3 px-4 pt-4">
        <StoryProgressBar
          slideCount={slides.length}
          currentIndex={currentIndex}
          isPaused={isPaused}
          durationMs={SLIDE_DURATION_MS}
          autoAdvanceEnabled={useCssTimer}
          onSlideComplete={advance}
        />
        <div className="flex items-center justify-between">
          {prefersReducedMotion && !autoAdvanceOptIn ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setAutoAdvanceOptIn(true)
              }}
              className="text-[length:var(--text-small)] text-text-2 underline decoration-hairline underline-offset-4"
            >
              Auto-advance
            </button>
          ) : (
            <span />
          )}
          <IconButton
            aria-label="Close"
            variant="ghost"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            <XIcon />
          </IconButton>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full max-w-[480px]"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.3 }}
          >
            <StorySlideContent slide={slide} prefersReducedMotion={prefersReducedMotion} onShare={onShare} isSharing={isSharing} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <OverlayPortal>
        <div className="z-modal fixed inset-0 flex items-center justify-center bg-black/70">
          <IconButton aria-label="Previous slide" variant="ghost" className="absolute left-8" onClick={goBack} disabled={currentIndex === 0}>
            <ChevronLeftIcon />
          </IconButton>

          <div className="relative overflow-hidden rounded-2xl border border-hairline" style={{ height: 'min(92dvh, 900px)', aspectRatio: '9 / 16' }}>
            {storyBody}
          </div>

          <IconButton aria-label="Next slide" variant="ghost" className="absolute right-8" onClick={advance}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </OverlayPortal>
    )
  }

  return (
    <OverlayPortal>
      <div className="z-modal fixed inset-0" style={{ height: '100dvh' }}>
        {storyBody}
      </div>
    </OverlayPortal>
  )
}
