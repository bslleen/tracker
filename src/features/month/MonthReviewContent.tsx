import { useState } from 'react'
import { toast } from 'sonner'
import type { Goal } from '@/data/types'
import type { ApplyMonthReviewResult, DeletedGoalSnapshot, GoalReviewChoice, GoalReviewDecision } from '@/data/monthReviewWrites'
import { minutesBanked, monthName, nextMonth } from '@/lib/chunks'
import { DeleteGoalConfirmDialog } from './DeleteGoalConfirmDialog'
import { MonthReviewActionBar } from './MonthReviewActionBar'
import { MonthReviewHeader } from './MonthReviewHeader'
import { MonthShareCard } from './MonthShareCard'
import { SubjectReviewCard } from './SubjectReviewCard'
import { useMonthShare } from './useMonthShare'

export interface MonthReviewContentProps {
  reviewMonth: string
  goals: Goal[]
  isLoading: boolean
  onApply: (choices: GoalReviewChoice[]) => Promise<ApplyMonthReviewResult>
  onRestore: (snapshot: DeletedGoalSnapshot) => Promise<void>
}

/**
 * Pure-props presentational half of /month (MonthReview.tsx fetches the real
 * data and wires the real Firestore writes; the styleguide fixture at
 * /styleguide/month feeds this the same component with fixture data and
 * no-Firestore write stubs — same split as DashboardContent/Dashboard.tsx).
 */
export function MonthReviewContent({ reviewMonth, goals, isLoading, onApply, onRestore }: MonthReviewContentProps) {
  // Frozen once "Apply choices" succeeds, so the success/"done" state shows a
  // stable final picture instead of reacting to the write it just made — the
  // "adjust state when a prop changes" pattern (see LogTimeSheet.tsx).
  const [isDone, setIsDone] = useState(false)
  const [lastSeenGoals, setLastSeenGoals] = useState(goals)
  const [goalsSnapshot, setGoalsSnapshot] = useState(goals)
  if (!isDone && goals !== lastSeenGoals) {
    setLastSeenGoals(goals)
    setGoalsSnapshot(goals)
  }
  const reviewGoals = goalsSnapshot
  const pendingGoals = reviewGoals.filter((goal) => goal.status === 'active')

  const [decisions, setDecisions] = useState<Record<string, Exclude<GoalReviewDecision, 'delete'>>>({})
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<Goal | null>(null)
  const [deletedGoalIds, setDeletedGoalIds] = useState<Set<string>>(new Set())
  const [isApplying, setIsApplying] = useState(false)
  const [actionBarHeight, setActionBarHeight] = useState(0)

  const { nodeRef: shareNodeRef, isSharing, share } = useMonthShare(reviewMonth)

  function getDecision(goal: Goal): GoalReviewDecision {
    if (deletedGoalIds.has(goal.id)) return 'delete'
    return decisions[goal.id] ?? 'archive'
  }

  function setDecision(goalId: string, decision: Exclude<GoalReviewDecision, 'delete'>) {
    setDeletedGoalIds((prev) => {
      if (!prev.has(goalId)) return prev
      const next = new Set(prev)
      next.delete(goalId)
      return next
    })
    setDecisions((prev) => ({ ...prev, [goalId]: decision }))
  }

  function confirmDelete() {
    if (!confirmDeleteGoal) return
    setDeletedGoalIds((prev) => new Set(prev).add(confirmDeleteGoal.id))
    setConfirmDeleteGoal(null)
  }

  const totalMinutes = reviewGoals.reduce(
    (sum, goal) => sum + minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes),
    0,
  )
  const totalHours = Math.round(totalMinutes / 60)
  const gridSize = reviewGoals.length <= 3 ? 'lg' : 'sm'

  async function handleApply() {
    if (pendingGoals.length === 0) return
    setIsApplying(true)
    const choices: GoalReviewChoice[] = pendingGoals.map((goal) => ({ goal, decision: getDecision(goal) }))

    try {
      const result = await onApply(choices)
      setIsDone(true)
      toast.success(`Reviewed ${monthName(reviewMonth)} · ${choices.length} goal${choices.length === 1 ? '' : 's'}`)
      for (const snapshot of result.deleted) {
        showUndoToast(snapshot, onRestore)
      }
    } catch {
      toast.error("Could not apply your choices — nothing was changed. Let's try again.")
    } finally {
      setIsApplying(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-[50vh]" />
  }

  if (reviewGoals.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-title text-text">Nothing to review for {monthName(reviewMonth)}</p>
        <p className="text-[length:var(--text-small)] text-text-2">Every goal from that month is already settled.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <MonthReviewHeader month={reviewMonth} totalHours={totalHours} onShare={() => void share()} isSharing={isSharing} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ paddingBottom: actionBarHeight }}>
        {reviewGoals.map((goal, index) => (
          <SubjectReviewCard
            key={goal.id}
            goal={goal}
            index={index}
            gridSize={gridSize}
            decision={getDecision(goal)}
            onSelectDecision={(decision) => setDecision(goal.id, decision)}
            onRequestDelete={() => setConfirmDeleteGoal(goal)}
            isDone={isDone || goal.status !== 'active'}
          />
        ))}
      </div>

      {pendingGoals.length > 0 && (
        <MonthReviewActionBar
          isDone={isDone}
          isApplying={isApplying}
          pendingCount={pendingGoals.length}
          doneMessage={`See you in ${monthName(nextMonth(reviewMonth))}`}
          onApply={() => void handleApply()}
          onHeightChange={setActionBarHeight}
        />
      )}

      <DeleteGoalConfirmDialog
        open={confirmDeleteGoal !== null}
        goalName={confirmDeleteGoal?.name ?? null}
        onCancel={() => setConfirmDeleteGoal(null)}
        onConfirm={confirmDelete}
      />

      <MonthShareCard ref={shareNodeRef} month={reviewMonth} totalHours={totalHours} goals={reviewGoals} />
    </div>
  )
}

function showUndoToast(snapshot: DeletedGoalSnapshot, onRestore: (snapshot: DeletedGoalSnapshot) => Promise<void>) {
  toast(`Deleted "${snapshot.goal.name}"`, {
    duration: 10_000,
    action: {
      label: 'Undo',
      onClick: () => {
        void onRestore(snapshot).then(
          () => toast(`Restored "${snapshot.goal.name}"`),
          () => toast.error(`Could not restore "${snapshot.goal.name}"`),
        )
      },
    },
  })
}
