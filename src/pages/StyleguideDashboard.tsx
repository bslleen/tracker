import { useState } from 'react'
import type { Goal, Month, MonthDayEntry } from '@/data/types'
import { DashboardContent } from '@/features/goals/DashboardContent'
import { useToday } from '@/hooks/useToday'
import { currentMonth, previousMonth } from '@/lib/chunks'

const FAKE_TIMESTAMP = {} as Goal['createdAt']

function goal(partial: Pick<Goal, 'id' | 'name' | 'totalMinutes' | 'chunkMinutes' | 'completedChunks' | 'hue'>): Goal {
  return {
    ...partial,
    month: currentMonth(),
    carryMinutes: 0,
    status: 'active',
    createdAt: FAKE_TIMESTAMP,
    updatedAt: FAKE_TIMESTAMP,
  }
}

const FOUR_GOALS: Goal[] = [
  goal({ id: 'french', name: 'French', totalMinutes: 2400, chunkMinutes: 15, completedChunks: 80, hue: 0 }),
  goal({ id: 'chess', name: 'Chess openings and middlegame strategy', totalMinutes: 1200, chunkMinutes: 10, completedChunks: 40, hue: 18 }),
  goal({ id: 'algebra', name: 'Algebra II', totalMinutes: 1800, chunkMinutes: 30, completedChunks: 10, hue: 28 }),
  goal({ id: 'guitar', name: 'Guitar', totalMinutes: 900, chunkMinutes: 15, completedChunks: 58, hue: 9 }),
]

const TWELVE_GOALS: Goal[] = Array.from({ length: 12 }, (_, index) =>
  goal({
    id: `goal-${index}`,
    name: `Subject ${index + 1}`,
    totalMinutes: 600 + index * 120,
    chunkMinutes: 15,
    completedChunks: (index * 7) % 30,
    hue: (index * 7) % 30,
  }),
)

function buildFixtureMonthSummary(today: Date, goals: Goal[]): Month {
  const days: Record<string, MonthDayEntry> = {}
  const recentMinutes = [45, 20, 0, 15]

  for (let offset = 0; offset < 5; offset += 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - offset)
    if (date.getMonth() !== today.getMonth()) continue // keep the fixture simple — no cross-month-boundary case here

    const byGoal: Record<string, number> = {}
    goals.forEach((g, index) => {
      byGoal[g.id] = offset === 0 ? (recentMinutes[index % recentMinutes.length] ?? 0) : 30
    })
    const total = Object.values(byGoal).reduce((sum, minutes) => sum + minutes, 0)
    days[String(date.getDate()).padStart(2, '0')] = { total, byGoal }
  }

  return { id: currentMonth(), days }
}

type DatasetKey = 'empty' | 'one' | 'four' | 'twelve'

const DATASETS: Record<DatasetKey, Goal[]> = {
  empty: [],
  one: FOUR_GOALS.slice(0, 1),
  four: FOUR_GOALS,
  twelve: TWELVE_GOALS,
}

/** Dev-only harness for Dashboard's populated/empty/loading states and goal-count edge cases, without needing seeded Firestore data. */
export default function StyleguideDashboard() {
  const today = useToday()
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('four')
  const [isLoading, setIsLoading] = useState(false)

  // Real loading only ever shows a skeleton before any goals exist yet (see
  // DashboardContent's showSkeleton) — simulate that rather than the
  // unrealistic "still loading but somehow already has fixture goals".
  const goals = isLoading ? [] : DATASETS[datasetKey]
  const monthSummary = buildFixtureMonthSummary(today, goals)

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap gap-2" data-testid="fixture-controls">
        {(Object.keys(DATASETS) as DatasetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`fixture-dataset-${key}`}
            onClick={() => setDatasetKey(key)}
            className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
          >
            {key} ({DATASETS[key].length})
          </button>
        ))}
        <button
          type="button"
          data-testid="fixture-toggle-loading"
          onClick={() => setIsLoading((value) => !value)}
          className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
        >
          {isLoading ? 'stop loading' : 'show loading'}
        </button>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <DashboardContent
          goals={goals}
          isLoadingGoals={isLoading}
          monthSummary={monthSummary}
          prevMonthSummary={undefined}
          month={currentMonth()}
          prevMonth={previousMonth(currentMonth())}
          today={today}
          displayName="Ada"
          justCreatedGoalId={null}
          onPulseEnd={() => {}}
          onCreateGoal={() => {}}
          animateEntrance
        />
      </div>
    </main>
  )
}
