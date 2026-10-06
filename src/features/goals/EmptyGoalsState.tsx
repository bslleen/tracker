import { Button } from '@/components/ui'

const SQUARE_COUNT = 60
const COLUMNS = 12
const CYCLE_MS = 3600
// A prime-ish step so each square's phase within the cycle looks scattered
// rather than lighting up in neat rows/columns — fully deterministic (no
// Math.random, which would make every render non-reproducible).
const DELAY_STEP_MS = 83

export interface EmptyGoalsStateProps {
  onCreateGoal: () => void
}

/** Shown when a month has no goals yet — a calm ambient field instead of a blank page. */
export function EmptyGoalsState({ onCreateGoal }: EmptyGoalsStateProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
        aria-hidden="true"
      >
        {Array.from({ length: SQUARE_COUNT }, (_, index) => (
          <div
            key={index}
            className="h-3 w-3 rounded-[28%] sm:h-4 sm:w-4"
            style={{
              animation: 'ambient-chunk-glow 3.6s ease-in-out infinite',
              animationDelay: `${(index * DELAY_STEP_MS) % CYCLE_MS}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex max-w-xs flex-col items-center gap-6">
        <p className="text-title text-text">What do you want to learn this month?</p>
        <Button onClick={onCreateGoal}>Create your first goal</Button>
      </div>
    </div>
  )
}
