import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftIcon } from '@/components/icons'
import { AnimatedNumber, Button } from '@/components/ui'
import { deleteGoal, setGoalStatus } from '@/data/goalWrites'
import { logSession, undoSession } from '@/data/sessionWrites'
import { useAuth } from '@/data/useAuth'
import { openFocusPicker } from '@/features/focus/focusPickerStore'
import { cn } from '@/lib/cn'
import { useGoal } from '@/data/useGoal'
import { useMonthSummary } from '@/data/useMonthSummary'
import { useSessions } from '@/data/useSessions'
import { ChangeChunkSizeDialog } from '@/features/goals/ChangeChunkSizeDialog'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import { GoalKebabMenu } from '@/features/goals/GoalKebabMenu'
import { LogTimeSheet } from '@/features/sessions/LogTimeSheet'
import { SessionsList } from '@/features/sessions/SessionsList'
import { WeeklySparkline } from '@/features/sessions/WeeklySparkline'
import { chunkCount, currentMonth, formatHoursMinutes, formatMonthLabel, percentComplete, remainingMinutes } from '@/lib/chunks'

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: goal, isLoading } = useGoal(id ?? '')
  const { data: recentSessions } = useSessions(id ?? '', 10)
  const { data: monthSummary } = useMonthSummary(currentMonth())
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [isChunkSizeOpen, setIsChunkSizeOpen] = useState(false)
  const [isAnimatingLayout, setIsAnimatingLayout] = useState(false)

  if (isLoading) {
    return <div className="min-h-[50vh]" />
  }

  if (!goal) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton />
        <p className="text-[length:var(--text-small)] text-text-2">This goal doesn't exist (or isn't yours).</p>
      </div>
    )
  }

  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = percentComplete(goal.completedChunks, total)
  const chunksLeft = total - goal.completedChunks
  const minutesLeft = remainingMinutes(goal.totalMinutes, goal.chunkMinutes, goal.completedChunks)

  async function handleFillTo(index: number) {
    if (!user || !goal) return
    const chunksToAdd = index - goal.completedChunks + 1
    const minutes = chunksToAdd * goal.chunkMinutes
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')

    try {
      const result = await logSession({ uid: user.uid, goalId: goal.id, month: currentMonth(), day, minutes })
      toast(`Logged ${minutes} min · ${goal.name}`, {
        action: { label: 'Undo', onClick: () => void undoSession(user.uid, result.sessionId) },
      })
    } catch {
      toast.error('Could not log that session. Try again.')
    }
  }

  async function handleUndoLast() {
    const lastSessionId = recentSessions?.[0]?.id
    if (!user || !lastSessionId || !goal) return
    try {
      await undoSession(user.uid, lastSessionId)
      toast(`Undid last session · ${goal.name}`)
    } catch {
      toast.error('Could not undo that session. Try again.')
    }
  }

  async function handleArchiveAbandoned() {
    if (!user || !goal) return
    try {
      await setGoalStatus(user.uid, goal.id, goal.month, 'abandoned')
      toast(`Archived "${goal.name}" as abandoned`)
      navigate('/')
    } catch {
      toast.error('Could not archive that goal. Try again.')
    }
  }

  function handleDelete() {
    if (!goal) return
    toast(`Delete "${goal.name}"? This can't be undone.`, {
      action: {
        label: 'Confirm delete',
        onClick: () => {
          void (async () => {
            if (!user) return
            try {
              await deleteGoal(user.uid, goal.id, goal.month)
              toast(`Deleted "${goal.name}"`)
              navigate('/')
            } catch {
              toast.error('Could not delete that goal. Try again.')
            }
          })()
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <BackButton />

      <motion.div
        layout
        layoutId={`goal-shell-${goal.id}`}
        onLayoutAnimationStart={() => setIsAnimatingLayout(true)}
        onLayoutAnimationComplete={() => setIsAnimatingLayout(false)}
        className={cn('relative rounded-xl border border-hairline bg-surface p-6', isAnimatingLayout && 'z-raised')}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-title text-text">{goal.name}</h1>
            <span className="rounded-full border border-hairline px-2.5 py-1 text-[length:var(--text-small)] text-text-2">
              {formatMonthLabel(goal.month)}
            </span>
          </div>
          <GoalKebabMenu
            onEdit={() => toast('Editing goals is coming soon.')}
            onChangeChunkSize={() => setIsChunkSizeOpen(true)}
            onArchiveAbandoned={() => void handleArchiveAbandoned()}
            onDelete={handleDelete}
          />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <motion.div layout layoutId={`goal-progress-${goal.id}`} className="flex flex-col items-start gap-2 lg:w-[38%]">
            <AnimatedNumber
              value={Math.round(percent)}
              format={(value) => `${Math.round(value)}%`}
              className="text-hero leading-none text-text"
            />
            <p className="text-[length:var(--text-small)] text-text-2">
              {chunksLeft} chunks left · {formatHoursMinutes(minutesLeft)} left
            </p>
          </motion.div>

          <motion.div layout layoutId={`goal-grid-${goal.id}`} className="lg:w-[62%]">
            <ChunkGrid
              total={total}
              completed={goal.completedChunks}
              chunkMinutes={goal.chunkMinutes}
              accentShade={goal.hue}
              interactive
              size="lg"
              label={goal.name}
              onFillTo={(index) => void handleFillTo(index)}
              onUndoLast={() => void handleUndoLast()}
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="flex gap-3">
        <Button onClick={() => setIsLogOpen(true)}>Log time</Button>
        <Button variant="ghost" onClick={() => openFocusPicker(goal.id)}>
          Focus
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[length:var(--text-small)] text-text-2">Recent sessions</h2>
        <SessionsList sessions={recentSessions ?? []} />
      </section>

      <WeeklySparkline goalId={goal.id} monthSummary={monthSummary} />

      <LogTimeSheet open={isLogOpen} onOpenChange={setIsLogOpen} initialGoalId={goal.id} />
      <ChangeChunkSizeDialog goal={goal} open={isChunkSizeOpen} onOpenChange={setIsChunkSizeOpen} />
    </div>
  )
}

function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex min-h-11 w-fit items-center gap-2 rounded-md text-[length:var(--text-small)] text-text-2 transition-colors hover:text-text"
    >
      <ArrowLeftIcon />
      Back
    </button>
  )
}
