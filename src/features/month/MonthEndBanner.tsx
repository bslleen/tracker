import { motion, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { earliestMonth, useOverdueGoals } from '@/data/useOverdueGoals'
import { currentMonth, monthName } from '@/lib/chunks'
import { SPRING_SNAPPY } from '@/lib/motion'

/** A calm nudge on the dashboard once any active goal's month has passed — see /month (MonthReview.tsx). */
export function MonthEndBanner() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const { data: overdueGoals } = useOverdueGoals(currentMonth())
  const reviewMonth = earliestMonth(overdueGoals ?? [])

  if (!reviewMonth) return null

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SNAPPY}
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-2 px-5 py-4"
    >
      <p className="text-[length:var(--text-small)] text-text">
        <span className="font-medium text-text">{monthName(reviewMonth)}</span> is complete — review your month
      </p>
      <Button size="sm" onClick={() => navigate('/month')}>
        Review {monthName(reviewMonth)}
      </Button>
    </motion.div>
  )
}
