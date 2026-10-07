import { useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import type { Goal, Month } from '@/data/types'
import { computeLongestStreak, computeStreak, countActiveDays, minutesFromDateMap } from '@/lib/streak'
import { GoalFilterChips } from './GoalFilterChips'
import { HeatmapCalendar } from './HeatmapCalendar'
import { HeatmapDayDetailsCard } from './HeatmapDayDetailsCard'
import { HeatmapRangeToggle } from './HeatmapRangeToggle'
import { HeatmapStreakStats } from './HeatmapStreakStats'
import { buildYearGrid, filterGridToGoal, sliceToRange, type HeatmapRange } from './heatmapGrid'

export interface HeatmapContentProps {
  year: string
  monthDocs: Month[]
  goals: Goal[]
  today: Date
}

export function HeatmapContent({ year, monthDocs, goals, today }: HeatmapContentProps) {
  const prefersReducedMotion = useReducedMotion() ?? false
  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'active'), [goals])
  const goalsById = useMemo(() => new Map(goals.map((goal) => [goal.id, goal])), [goals])
  const goalNameFor = (goalId: string) => goalsById.get(goalId)?.name ?? 'Other'

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [range, setRange] = useState<HeatmapRange>(() => (window.matchMedia('(max-width: 767px)').matches ? '6months' : 'year'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const fullGrid = useMemo(() => buildYearGrid(year, monthDocs), [year, monthDocs])
  const filteredGrid = useMemo(
    () => (selectedGoalId ? filterGridToGoal(fullGrid, selectedGoalId) : fullGrid),
    [fullGrid, selectedGoalId],
  )
  const displayedGrid = useMemo(() => sliceToRange(filteredGrid, range), [filteredGrid, range])

  const minutesMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const cell of filteredGrid.cells) {
      if (cell.inYear) map[cell.date] = cell.minutes
    }
    return map
  }, [filteredGrid])

  const currentStreak = useMemo(() => computeStreak(minutesFromDateMap(minutesMap), today), [minutesMap, today])
  const longestStreak = useMemo(() => computeLongestStreak(minutesMap), [minutesMap])
  const activeDays = useMemo(() => countActiveDays(minutesMap), [minutesMap])

  const hueShift = selectedGoalId ? (goalsById.get(selectedGoalId)?.hue ?? 0) : 0
  const selectedCell = displayedGrid.cells.find((cell) => cell.date === selectedDate && cell.inYear) ?? null

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Streaks</h1>

      <HeatmapStreakStats currentStreak={currentStreak} longestStreak={longestStreak} activeDays={activeDays} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <GoalFilterChips goals={activeGoals} selectedGoalId={selectedGoalId} onSelect={setSelectedGoalId} />
          <HeatmapRangeToggle value={range} onChange={setRange} />
        </div>

        <HeatmapCalendar
          grid={displayedGrid}
          year={year}
          hueShift={hueShift}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          goalNameFor={goalNameFor}
          prefersReducedMotion={prefersReducedMotion}
          summary={`Studied on ${activeDays} day${activeDays === 1 ? '' : 's'} in ${year}, currently on a ${currentStreak}-day run, best run so far ${longestStreak} day${longestStreak === 1 ? '' : 's'}.`}
        />
      </div>

      {selectedCell && (
        <HeatmapDayDetailsCard cell={selectedCell} goalNameFor={goalNameFor} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  )
}
