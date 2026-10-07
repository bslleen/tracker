import { useEffect, useState } from 'react'
import { useAuth } from '@/data/useAuth'
import { useGoals } from '@/data/useGoals'
import { useMonthSummary } from '@/data/useMonthSummary'
import { DashboardContent } from '@/features/goals/DashboardContent'
import { NewGoalModal } from '@/features/goals/NewGoalModal'
import { newGoalModalStore } from '@/features/goals/newGoalModalStore'
import { MonthEndBanner } from '@/features/month/MonthEndBanner'
import { useToday } from '@/hooks/useToday'
import { currentMonth, previousMonth } from '@/lib/chunks'

const ENTRANCE_PLAYED_KEY = 'chunks:dashboard-entrance-played'

export default function Dashboard() {
  const { user } = useAuth()
  const today = useToday()
  const month = currentMonth()
  const prevMonth = previousMonth(month)

  const { data: goals, isLoading: isLoadingGoals } = useGoals(month)
  const { data: monthSummary } = useMonthSummary(month)
  const { data: prevMonthSummary } = useMonthSummary(prevMonth)

  const [isLocalCreateOpen, setIsLocalCreateOpen] = useState(false)
  const isGlobalCreateOpen = newGoalModalStore.useIsOpen()
  const isCreateOpen = isLocalCreateOpen || isGlobalCreateOpen
  const [justCreatedGoalId, setJustCreatedGoalId] = useState<string | null>(null)

  // The card-grid entrance stagger plays once per browser session, not on
  // every visit to this route — a lazy initializer reads sessionStorage
  // synchronously (same pattern as useDemoMode's getSnapshot), and the
  // effect below marks it played for any later mount.
  const [animateEntrance] = useState(() => sessionStorage.getItem(ENTRANCE_PLAYED_KEY) !== 'true')
  useEffect(() => {
    sessionStorage.setItem(ENTRANCE_PLAYED_KEY, 'true')
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <MonthEndBanner />

      <DashboardContent
        goals={goals ?? []}
        isLoadingGoals={isLoadingGoals}
        monthSummary={monthSummary}
        prevMonthSummary={prevMonthSummary}
        month={month}
        prevMonth={prevMonth}
        today={today}
        displayName={user?.displayName}
        justCreatedGoalId={justCreatedGoalId}
        onPulseEnd={() => setJustCreatedGoalId(null)}
        onCreateGoal={() => setIsLocalCreateOpen(true)}
        animateEntrance={animateEntrance}
      />

      <NewGoalModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsLocalCreateOpen(open)
          if (!open) newGoalModalStore.close()
        }}
        onCreated={(goalId) => setJustCreatedGoalId(goalId)}
      />
    </div>
  )
}
