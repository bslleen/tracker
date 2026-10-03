import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MinusIcon, PlusIcon } from '@/components/icons'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { AnimatedNumber, Button, IconButton } from '@/components/ui'
import { logSession, undoSession } from '@/data/sessionWrites'
import { useAuth } from '@/data/useAuth'
import { useGoals } from '@/data/useGoals'
import { useLongPress } from '@/hooks/useLongPress'
import { chunkCount, computeChunkProgress, currentMonth } from '@/lib/chunks'
import { GoalPicker } from './GoalPicker'
import { NextChunksPreview } from './NextChunksPreview'

const QUICK_ADD_MINUTES = [5, 10, 25, 30]
const MINUTE_STEP = 5
const MAX_MINUTES = 600
const LAST_GOAL_STORAGE_KEY = 'chunks:last-goal-id'

export interface LogTimeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Preselects this goal, overriding the remembered last goal (e.g. opened from a goal's own page). */
  initialGoalId?: string
}

export function LogTimeSheet({ open, onOpenChange, initialGoalId }: LogTimeSheetProps) {
  const { user } = useAuth()
  const month = currentMonth()
  const { data: goals } = useGoals(month)
  const activeGoals = useMemo(() => goals?.filter((goal) => goal.status === 'active') ?? [], [goals])

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [minutes, setMinutes] = useState(15)
  const [isLogging, setIsLogging] = useState(false)

  // Reset the form whenever the sheet transitions to open — React's
  // "adjusting state when a prop changes" pattern (compare against a
  // mirrored `wasOpen` state during render) rather than an effect, since
  // the reset needs to happen before paint, not after.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      const remembered = localStorage.getItem(LAST_GOAL_STORAGE_KEY)
      const preferred = initialGoalId ?? remembered
      const resolved = activeGoals.find((goal) => goal.id === preferred)?.id ?? activeGoals[0]?.id ?? null
      setSelectedGoalId(resolved)
      setMinutes(15)
    }
  }

  const selectedGoal = activeGoals.find((goal) => goal.id === selectedGoalId) ?? null
  const totalChunks = selectedGoal ? chunkCount(selectedGoal.totalMinutes, selectedGoal.chunkMinutes) : 0
  const previewChunks = selectedGoal
    ? computeChunkProgress(
        minutes,
        selectedGoal.chunkMinutes,
        selectedGoal.carryMinutes,
        selectedGoal.completedChunks,
        selectedGoal.totalMinutes,
      ).chunksAdded
    : 0

  const decrement = useLongPress(() => setMinutes((current) => Math.max(1, current - MINUTE_STEP)))
  const increment = useLongPress(() => setMinutes((current) => Math.min(MAX_MINUTES, current + MINUTE_STEP)))

  async function handleLog() {
    if (!user || !selectedGoal) return
    setIsLogging(true)

    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const goalName = selectedGoal.name
    const loggedMinutes = minutes

    try {
      const result = await logSession({ uid: user.uid, goalId: selectedGoal.id, month, day, minutes: loggedMinutes })

      localStorage.setItem(LAST_GOAL_STORAGE_KEY, selectedGoal.id)
      onOpenChange(false)

      if (navigator.vibrate) {
        navigator.vibrate(10)
      }

      toast(`Logged ${loggedMinutes} min · ${goalName}`, {
        action: {
          label: 'Undo',
          onClick: () => {
            void undoSession(user.uid, result.sessionId)
          },
        },
      })
    } catch {
      toast.error('Could not log that session. Try again.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Log time">
      {activeGoals.length === 0 ? (
        <p className="text-[length:var(--text-small)] text-text-2">Create a goal first to log time against it.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <GoalPicker goals={activeGoals} selectedGoalId={selectedGoalId} onSelect={setSelectedGoalId} />

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <IconButton aria-label="Decrease minutes" variant="subtle" size="lg" {...decrement}>
                <MinusIcon />
              </IconButton>
              <AnimatedNumber value={minutes} className="min-w-[3ch] text-center text-hero leading-none text-text" />
              <IconButton aria-label="Increase minutes" variant="subtle" size="lg" {...increment}>
                <PlusIcon />
              </IconButton>
            </div>
            <span className="text-[length:var(--text-small)] text-text-2">
              minutes{selectedGoal && previewChunks > 0 && ` · = ${previewChunks} chunk${previewChunks === 1 ? '' : 's'}`}
            </span>

            <div className="flex gap-2">
              {QUICK_ADD_MINUTES.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setMinutes((current) => Math.min(MAX_MINUTES, current + amount))}
                  className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 transition-colors hover:text-text"
                >
                  +{amount}
                </button>
              ))}
            </div>

            {selectedGoal && (
              <NextChunksPreview
                completedChunks={selectedGoal.completedChunks}
                previewChunks={previewChunks}
                totalChunks={totalChunks}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => void handleLog()} disabled={!selectedGoal || isLogging}>
              Log
            </Button>
            <Button variant="ghost" onClick={() => toast('Focus timer lands in Phase 8.')}>
              Start focus timer
            </Button>
          </div>
        </div>
      )}
    </ResponsiveModal>
  )
}
