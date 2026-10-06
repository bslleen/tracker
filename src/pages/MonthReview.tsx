import { useAuth } from '@/data/useAuth'
import { useGoals } from '@/data/useGoals'
import { applyMonthReviewDecisions, restoreDeletedGoal } from '@/data/monthReviewWrites'
import { earliestMonth, useOverdueGoals } from '@/data/useOverdueGoals'
import { MonthReviewContent } from '@/features/month/MonthReviewContent'
import { currentMonth, previousMonth } from '@/lib/chunks'

export default function MonthReview() {
  const { user } = useAuth()
  const currentMonthValue = currentMonth()
  const { data: overdueGoals } = useOverdueGoals(currentMonthValue)
  const reviewMonth = earliestMonth(overdueGoals ?? []) ?? previousMonth(currentMonthValue)

  const { data: goals, isLoading } = useGoals(reviewMonth)

  if (!user) {
    return <div className="min-h-[50vh]" />
  }

  return (
    <MonthReviewContent
      reviewMonth={reviewMonth}
      goals={goals ?? []}
      isLoading={isLoading}
      onApply={(choices) => applyMonthReviewDecisions({ uid: user.uid, month: reviewMonth, choices })}
      onRestore={(snapshot) => restoreDeletedGoal(user.uid, snapshot)}
    />
  )
}
