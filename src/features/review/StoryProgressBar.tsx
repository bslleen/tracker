export interface StoryProgressBarProps {
  slideCount: number
  currentIndex: number
  isPaused: boolean
  durationMs: number
  /** False under reduced motion unless the user opts in — bars stay static (no fill animation, no auto-advance) in that case. */
  autoAdvanceEnabled: boolean
  onSlideComplete: () => void
}

/** One segment per slide; the active one fills linearly over `durationMs` — a plain CSS animation (not JS-timed) so pause/resume is just `animation-play-state`, no elapsed-time bookkeeping needed. */
export function StoryProgressBar({ slideCount, currentIndex, isPaused, durationMs, autoAdvanceEnabled, onSlideComplete }: StoryProgressBarProps) {
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Slide ${currentIndex + 1} of ${slideCount}`}>
      {Array.from({ length: slideCount }, (_, index) => {
        const state = index < currentIndex ? 'done' : index > currentIndex ? 'upcoming' : 'active'
        return (
          <ProgressSegment
            key={index}
            state={state}
            durationMs={durationMs}
            isPaused={isPaused}
            autoAdvanceEnabled={autoAdvanceEnabled}
            onComplete={onSlideComplete}
          />
        )
      })}
    </div>
  )
}

function ProgressSegment({
  state,
  durationMs,
  isPaused,
  autoAdvanceEnabled,
  onComplete,
}: {
  state: 'done' | 'active' | 'upcoming'
  durationMs: number
  isPaused: boolean
  autoAdvanceEnabled: boolean
  onComplete: () => void
}) {
  const isAnimated = state === 'active' && autoAdvanceEnabled

  return (
    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
      {/* Keyed by `state` so becoming active (or completing) always remounts — a fresh CSS animation instance rather than one whose style just changed, which wouldn't restart it. */}
      <div
        key={state}
        className="h-full origin-left rounded-full bg-white"
        style={
          isAnimated
            ? { animation: `story-progress-fill ${durationMs}ms linear forwards`, animationPlayState: isPaused ? 'paused' : 'running' }
            : { transform: state === 'done' ? 'scaleX(1)' : 'scaleX(0)' }
        }
        onAnimationEnd={isAnimated ? onComplete : undefined}
      />
    </div>
  )
}
