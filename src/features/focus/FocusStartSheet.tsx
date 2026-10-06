import { useMemo, useState } from 'react'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { Button } from '@/components/ui'
import { useGoals } from '@/data/useGoals'
import { GoalPicker } from '@/features/sessions/GoalPicker'
import { chunkCount, currentMonth } from '@/lib/chunks'
import { cn } from '@/lib/cn'
import { closeFocusPicker, useFocusPicker } from './focusPickerStore'
import type { FocusDuration } from './focusSession'
import { startFocusSession } from './focusStore'

const CHUNK_OPTIONS = [1, 2, 3] as const

/** Mounted once (AppShell) — reads its own open state from focusPickerStore so any entry point can trigger it by goal id alone. */
export function FocusStartSheet() {
  const { open, goalId: initialGoalId } = useFocusPicker()
  const month = currentMonth()
  const { data: goals } = useGoals(month)
  const activeGoals = useMemo(() => goals?.filter((goal) => goal.status === 'active') ?? [], [goals])

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [duration, setDuration] = useState<FocusDuration>({ mode: 'fixed', chunks: 1 })

  // Reset the form whenever the sheet transitions to open (React's "adjust
  // state when a prop changes" pattern — see LogTimeSheet.tsx for the same
  // approach and why it's an if-in-render rather than a useEffect here).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const resolved = activeGoals.find((goal) => goal.id === initialGoalId)?.id ?? activeGoals[0]?.id ?? null
      setSelectedGoalId(resolved)
      setDuration({ mode: 'fixed', chunks: 1 })
    }
  }

  const selectedGoal = activeGoals.find((goal) => goal.id === selectedGoalId) ?? null
  const remainingChunks = selectedGoal
    ? Math.max(0, chunkCount(selectedGoal.totalMinutes, selectedGoal.chunkMinutes) - selectedGoal.completedChunks)
    : 0
  const chunkChoices = CHUNK_OPTIONS.filter((count) => count <= Math.max(1, remainingChunks))

  function handleStart() {
    if (!selectedGoal) return
    startFocusSession(selectedGoal, duration)
    closeFocusPicker()
  }

  return (
    <ResponsiveModal open={open} onOpenChange={(next) => !next && closeFocusPicker()} title="Focus">
      {activeGoals.length === 0 ? (
        <p className="text-[length:var(--text-small)] text-text-2">Create a goal first to focus on it.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <GoalPicker goals={activeGoals} selectedGoalId={selectedGoalId} onSelect={setSelectedGoalId} />

          <div className="flex flex-col gap-3">
            <span className="text-[length:var(--text-small)] text-text-2">Duration</span>
            <div className="flex flex-wrap gap-2">
              {chunkChoices.map((count) => (
                <DurationChip
                  key={count}
                  label={`${count} chunk${count === 1 ? '' : 's'}`}
                  selected={duration.mode === 'fixed' && duration.chunks === count}
                  onClick={() => setDuration({ mode: 'fixed', chunks: count })}
                />
              ))}
              <DurationChip label="Free" selected={duration.mode === 'free'} onClick={() => setDuration({ mode: 'free' })} />
            </div>
          </div>

          <Button onClick={handleStart} disabled={!selectedGoal}>
            Start focus session
          </Button>
        </div>
      )}
    </ResponsiveModal>
  )
}

function DurationChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'min-h-11 rounded-full border px-4 text-[length:var(--text-small)] transition-colors',
        selected ? 'border-accent bg-accent/10 text-text' : 'border-hairline text-text-2 hover:text-text',
      )}
    >
      {label}
    </button>
  )
}
