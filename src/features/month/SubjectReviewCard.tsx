import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { AnimatedNumber } from '@/components/ui'
import { CheckIcon } from '@/components/icons'
import type { Goal } from '@/data/types'
import type { GoalReviewDecision } from '@/data/monthReviewWrites'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import { chunkCount, formatHoursMinutes, monthName, nextMonth, percentComplete, remainingMinutes } from '@/lib/chunks'
import { cn } from '@/lib/cn'
import { DecisionControl } from './DecisionControl'

export interface SubjectReviewCardProps {
  goal: Goal
  /** Stagger position — this card waits `index * REVEAL_STAGGER_MS` before it reveals. */
  index: number
  gridSize: 'sm' | 'lg'
  decision: GoalReviewDecision
  onSelectDecision: (decision: Exclude<GoalReviewDecision, 'delete'>) => void
  onRequestDelete: () => void
  /** True once "Apply choices" has succeeded — dims the card and disables further input. */
  isDone: boolean
}

export const REVEAL_STAGGER_MS = 500

export function SubjectReviewCard({ goal, index, gridSize, decision, onSelectDecision, onRequestDelete, isDone }: SubjectReviewCardProps) {
  const prefersReducedMotion = useReducedMotion()
  // The stagger is itself a motion choice, not just the easing on top of it —
  // reduced motion means every subject's true state is shown right away,
  // not a faster version of the same one-after-another reveal.
  const [hasRevealed, setHasRevealed] = useState(prefersReducedMotion ?? false)

  useEffect(() => {
    if (prefersReducedMotion) return
    const id = window.setTimeout(() => setHasRevealed(true), index * REVEAL_STAGGER_MS)
    return () => window.clearTimeout(id)
  }, [index, prefersReducedMotion])

  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const finalPercent = percentComplete(goal.completedChunks, total)
  const isComplete = finalPercent >= 100
  const displayedCompleted = hasRevealed ? goal.completedChunks : 0
  const displayedPercent = hasRevealed ? finalPercent : 0

  const chunksRemaining = total - goal.completedChunks
  const minutesRemaining = remainingMinutes(goal.totalMinutes, goal.chunkMinutes, goal.completedChunks)
  const carryOverPreview = `${chunksRemaining} chunk${chunksRemaining === 1 ? '' : 's'} (${formatHoursMinutes(minutesRemaining)}) move to ${monthName(nextMonth(goal.month))}`

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: isDone ? 0.5 : 1, y: hasRevealed ? 0 : 16 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="@container flex flex-col gap-4 rounded-xl border border-hairline bg-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[length:var(--text-body)] font-medium text-text">{goal.name}</h3>
          {isComplete && hasRevealed && (
            <motion.span
              initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: prefersReducedMotion ? 0 : 0.3 }}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-accent"
              aria-label="Complete"
            >
              <CheckIcon width={12} height={12} />
            </motion.span>
          )}
        </div>
        <AnimatedNumber
          value={Math.round(displayedPercent)}
          format={(value) => `${Math.round(value)}%`}
          className={cn('text-title leading-none', isComplete ? 'text-accent' : 'text-text')}
        />
      </div>

      <ChunkGrid
        total={total}
        completed={displayedCompleted}
        chunkMinutes={goal.chunkMinutes}
        accentShade={goal.hue}
        size={gridSize}
        label={goal.name}
      />

      {!isDone && (
        <DecisionControl
          isComplete={isComplete}
          decision={decision}
          onSelect={onSelectDecision}
          onRequestDelete={onRequestDelete}
          carryOverPreview={carryOverPreview}
        />
      )}
    </motion.div>
  )
}
