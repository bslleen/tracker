import { useState } from 'react'
import type { Goal, Month, MonthDayEntry } from '@/data/types'
import { HeatmapContent } from '@/features/heatmap/HeatmapContent'
import { useToday } from '@/hooks/useToday'
import { dateKey } from '@/lib/streak'

const FAKE_TIMESTAMP = {} as Goal['createdAt']

const FIXTURE_GOALS: Goal[] = [
  { id: 'french', name: 'French', month: '', totalMinutes: 2400, chunkMinutes: 15, completedChunks: 0, carryMinutes: 0, status: 'active', hue: 0, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
  { id: 'chess', name: 'Chess', month: '', totalMinutes: 1200, chunkMinutes: 10, completedChunks: 0, carryMinutes: 0, status: 'active', hue: 18, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
  { id: 'guitar', name: 'Guitar', month: '', totalMinutes: 900, chunkMinutes: 15, completedChunks: 0, carryMinutes: 0, status: 'active', hue: 9, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
]

/**
 * Deterministic, otherwise-ambient noise plus two forced streaks (a short
 * one ending today, a longer one further back — so current-streak and
 * longest-streak visibly differ), each padded with a zero-minute day on
 * either side so the streak lengths are exact, not accidentally merged with
 * nearby noise.
 */
function buildFixtureMonths(year: string, today: Date): Month[] {
  const yearNum = Number(year)
  const dayTotals = new Map<string, { total: number; byGoal: Record<string, number> }>()

  for (let dayOfYear = 0; dayOfYear < 366; dayOfYear += 1) {
    const date = new Date(yearNum, 0, 1 + dayOfYear)
    if (date.getFullYear() !== yearNum) break
    const noise = (dayOfYear * 53) % 100
    const minutes = noise < 60 ? 0 : Math.round((noise - 60) * 2.2)
    dayTotals.set(dateKey(date), splitAcrossGoals(minutes, dayOfYear))
  }

  function setDay(daysAgo: number, minutes: number) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    if (date.getFullYear() !== yearNum) return
    dayTotals.set(dateKey(date), splitAcrossGoals(minutes, daysAgo))
  }

  // Zero-pad boundaries first, then the streaks themselves (so the streak writes win if a window is short).
  setDay(6, 0)
  for (let i = 0; i < 6; i += 1) setDay(i, 25 + i * 5)

  setDay(71, 0)
  setDay(59, 0)
  for (let i = 60; i <= 70; i += 1) setDay(i, 20 + ((i * 7) % 40))

  const months = new Map<string, Month>()
  for (const [key, entry] of dayTotals) {
    const [yr, mm, dd] = key.split('-')
    const monthId = `${yr}-${mm}`
    const month = months.get(monthId) ?? { id: monthId, days: {} as Record<string, MonthDayEntry> }
    month.days[dd!] = entry
    months.set(monthId, month)
  }
  return Array.from(months.values())
}

function splitAcrossGoals(minutes: number, seed: number): { total: number; byGoal: Record<string, number> } {
  if (minutes <= 0) return { total: 0, byGoal: {} }
  const goalIndex = seed % FIXTURE_GOALS.length
  const goalId = FIXTURE_GOALS[goalIndex]!.id
  // Occasionally split the day across two goals, for a more realistic tooltip/details breakdown.
  if (seed % 5 === 0 && minutes > 20) {
    const otherId = FIXTURE_GOALS[(goalIndex + 1) % FIXTURE_GOALS.length]!.id
    const first = Math.round(minutes * 0.6)
    return { total: minutes, byGoal: { [goalId]: first, [otherId]: minutes - first } }
  }
  return { total: minutes, byGoal: { [goalId]: minutes } }
}

/** Dev-only harness for /heatmap — fixture month docs instead of real Firestore data, so the whole year can be driven by a real browser. */
export default function StyleguideHeatmap() {
  const today = useToday()
  const [hasData, setHasData] = useState(true)
  const year = String(today.getFullYear())

  const monthDocs = hasData ? buildFixtureMonths(year, today) : []
  const goals = hasData ? FIXTURE_GOALS : []

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap gap-2">
        <button
          type="button"
          data-testid="fixture-toggle-data"
          onClick={() => setHasData((value) => !value)}
          className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
        >
          {hasData ? 'Show empty' : 'Show data'}
        </button>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <HeatmapContent year={year} monthDocs={monthDocs} goals={goals} today={today} />
      </div>
    </main>
  )
}
