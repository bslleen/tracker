import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { Goal } from '@/data/types'
import { Card } from '@/components/ui'
import { chunkCount, percentComplete } from '@/lib/chunks'
import { ChunkGrid } from './ChunkGrid'

export interface GoalCardProps {
  goal: Goal
  /** Plays a one-time soft accent pulse, then calls onPulseEnd. */
  justCreated?: boolean
  onPulseEnd?: () => void
}

export function GoalCard({ goal, justCreated = false, onPulseEnd }: GoalCardProps) {
  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = percentComplete(goal.completedChunks, total)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <Link to={`/goals/${goal.id}`} className="block">
        <Card
          className="flex flex-col gap-4"
          style={justCreated ? { animation: 'goal-pulse 1200ms var(--ease-out) forwards' } : undefined}
          onAnimationEnd={justCreated ? onPulseEnd : undefined}
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-[length:var(--text-body)] font-medium text-text">{goal.name}</h3>
            <span className="num text-[length:var(--text-small)] text-text-2">{Math.round(percent)}%</span>
          </div>
          <ChunkGrid total={total} completed={goal.completedChunks} className="max-h-24 overflow-hidden" />
        </Card>
      </Link>
    </motion.div>
  )
}
