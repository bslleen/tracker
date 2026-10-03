import type { Goal } from '@/data/types'
import { ProgressRing } from '@/components/ui'
import { chunkCount, percentComplete } from '@/lib/chunks'
import { cn } from '@/lib/cn'

export interface GoalPickerProps {
  goals: Goal[]
  selectedGoalId: string | null
  onSelect: (goalId: string) => void
}

export function GoalPicker({ goals, selectedGoalId, onSelect }: GoalPickerProps) {
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {goals.map((goal) => {
        const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
        const progress = percentComplete(goal.completedChunks, total) / 100
        const isSelected = goal.id === selectedGoalId

        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onSelect(goal.id)}
            aria-current={isSelected ? 'true' : undefined}
            className={cn(
              'flex min-w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-lg border p-3 transition-colors',
              isSelected ? 'border-accent bg-accent/10' : 'border-hairline bg-surface-2',
            )}
          >
            <ProgressRing progress={progress} size={40} strokeWidth={4} />
            <span className="max-w-24 truncate text-[length:var(--text-small)] text-text">{goal.name}</span>
          </button>
        )
      })}
    </div>
  )
}
