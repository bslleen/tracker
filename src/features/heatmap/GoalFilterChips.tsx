import type { Goal } from '@/data/types'
import { cn } from '@/lib/cn'
import { shiftAccentHue } from '@/lib/color'

export interface GoalFilterChipsProps {
  goals: Goal[]
  selectedGoalId: string | null
  onSelect: (goalId: string | null) => void
}

/** null selection = "All goals" (the default, combined-intensity view). */
export function GoalFilterChips({ goals, selectedGoalId, onSelect }: GoalFilterChipsProps) {
  if (goals.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by goal">
      <Chip label="All goals" isSelected={selectedGoalId === null} onClick={() => onSelect(null)} />
      {goals.map((goal) => (
        <Chip
          key={goal.id}
          label={goal.name}
          isSelected={selectedGoalId === goal.id}
          accentColor={shiftAccentHue(goal.hue)}
          onClick={() => onSelect(goal.id)}
        />
      ))}
    </div>
  )
}

function Chip({
  label,
  isSelected,
  accentColor,
  onClick,
}: {
  label: string
  isSelected: boolean
  accentColor?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className={cn(
        'flex min-h-9 max-w-40 items-center gap-1.5 truncate rounded-full border px-3 text-[length:var(--text-small)] transition-colors',
        isSelected ? 'border-accent bg-accent/10 text-text' : 'border-hairline text-text-2 hover:text-text',
      )}
    >
      {accentColor && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />}
      <span className="truncate">{label}</span>
    </button>
  )
}
