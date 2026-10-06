import { animate } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import type { Goal, Month } from '@/data/types'
import { StreakIcon } from '@/components/icons'
import { MonthPaceBar } from '@/features/month/MonthPaceBar'
import { TodayStrip } from '@/features/month/TodayStrip'
import { cn } from '@/lib/cn'
import { daysInMonth, minutesBanked } from '@/lib/chunks'
import { greetingFor } from '@/lib/greeting'
import { computeStreak } from '@/lib/streak'
import { AddGoalCard } from './AddGoalCard'
import { EmptyGoalsState } from './EmptyGoalsState'
import { GoalCard } from './GoalCard'
import { GoalCardSkeleton } from './GoalCardSkeleton'

export interface DashboardContentProps {
  goals: Goal[]
  isLoadingGoals: boolean
  monthSummary: Month | undefined
  prevMonthSummary: Month | undefined
  /** "2026-10" */
  month: string
  /** "2026-09" */
  prevMonth: string
  today: Date
  displayName?: string | null
  justCreatedGoalId: string | null
  onPulseEnd: () => void
  onCreateGoal: () => void
  /** False after the first render this session — see Dashboard.tsx. */
  animateEntrance: boolean
}

// min(320px, 100%) rather than a bare 320px — the bare form would force a
// minimum column width wider than the available space (and so a horizontal
// scrollbar) on any viewport narrower than roughly 320px plus the page's own
// side gutters, which real phones (320px wide, per CLAUDE.md ADAPTIVE RULES)
// are.
const GRID_TEMPLATE_COLUMNS = 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))'

export function DashboardContent({
  goals,
  isLoadingGoals,
  monthSummary,
  prevMonthSummary,
  month,
  prevMonth,
  today,
  displayName,
  justCreatedGoalId,
  onPulseEnd,
  onCreateGoal,
  animateEntrance,
}: DashboardContentProps) {
  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'active'), [goals])

  const studiedMinutes = activeGoals.reduce(
    (sum, goal) => sum + minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes),
    0,
  )
  const plannedMinutes = activeGoals.reduce((sum, goal) => sum + goal.totalMinutes, 0)
  const plannedHours = Math.round(plannedMinutes / 60)
  const progressPercent = plannedMinutes > 0 ? (studiedMinutes / plannedMinutes) * 100 : 0
  const pacePercent = (today.getDate() / daysInMonth(month)) * 100

  const getMinutesForDay = (date: Date): number => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const day = String(date.getDate()).padStart(2, '0')
    const summary = key === month ? monthSummary : key === prevMonth ? prevMonthSummary : undefined
    return summary?.days[day]?.total ?? 0
  }
  const streak = computeStreak(getMinutesForDay, today)
  const todayKey = String(today.getDate()).padStart(2, '0')

  const greeting = greetingFor(today.getHours(), displayName)
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const showEmptyState = !isLoadingGoals && activeGoals.length === 0
  const showSkeleton = isLoadingGoals && activeGoals.length === 0

  return (
    <div className="flex flex-col gap-10">
      {/* A real heading for a11y/structure — the page's actual visual identity is the greeting below, not a generic title. */}
      <h1 className="sr-only">Dashboard</h1>

      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-[length:var(--text-small)] text-text-2">{greeting}</span>
          <span className="text-[length:var(--text-small)] text-text-2">{dateLabel}</span>
        </div>

        <div className="flex flex-col gap-3">
          <GiantStat value={Math.round(studiedMinutes / 60)} />
          <div className="flex flex-wrap items-center gap-2 text-[length:var(--text-small)] text-text-2">
            <span>of {plannedHours}h planned</span>
            {streak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <StreakIcon width={14} height={14} className="text-streak" />
                  {streak}-day streak
                </span>
              </>
            )}
          </div>
        </div>

        {!showEmptyState && <MonthPaceBar percent={progressPercent} paceMarkerPercent={pacePercent} />}
      </header>

      {showSkeleton ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
          {Array.from({ length: 3 }, (_, index) => (
            <GoalCardSkeleton key={index} />
          ))}
        </div>
      ) : showEmptyState ? (
        <EmptyGoalsState onCreateGoal={onCreateGoal} />
      ) : (
        <>
          <div className="isolate grid gap-4" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
            {activeGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                justCreated={goal.id === justCreatedGoalId}
                onPulseEnd={onPulseEnd}
                animateEntrance={animateEntrance}
                entranceIndex={index}
              />
            ))}
            <AddGoalCard onClick={onCreateGoal} />
          </div>

          <TodayStrip goals={activeGoals} monthSummary={monthSummary} todayKey={todayKey} />
        </>
      )}
    </div>
  )
}

function GiantStat({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previousValueRef = useRef(value)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = String(value)
      previousValueRef.current = value
      return
    }

    const controls = animate(previousValueRef.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
      },
    })
    previousValueRef.current = value

    return () => controls.stop()
  }, [value])

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span ref={ref} className={cn('num whitespace-nowrap text-hero leading-none text-text')}>
        {value}
      </span>
      <span className="text-[length:var(--text-small)] text-text-2">hours studied this month</span>
    </div>
  )
}
