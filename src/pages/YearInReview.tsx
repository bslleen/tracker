import { useMemo } from 'react'
import { useYearGoals } from '@/data/useYearGoals'
import { useYearSpending } from '@/data/useYearSpending'
import { useYearSummary } from '@/data/useYearSummary'
import { buildReviewSlides } from '@/features/review/insights'
import { ReviewLauncher } from '@/features/review/ReviewLauncher'
import { currentMonth } from '@/lib/chunks'

export default function YearInReview() {
  const year = currentMonth().slice(0, 4)
  const { data: goals } = useYearGoals(year)
  const { data: months } = useYearSummary(year)
  const { data: spending } = useYearSpending(year)

  const slides = useMemo(
    () => buildReviewSlides({ year, goals: goals ?? [], months: months ?? [], spending: spending ?? [] }),
    [year, goals, months, spending],
  )

  return <ReviewLauncher year={year} slides={slides} />
}
