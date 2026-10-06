import { useMemo, useState } from 'react'
import type { Goal, Month, MonthDayEntry, SpendingEntry } from '@/data/types'
import { buildReviewSlides } from '@/features/review/insights'
import { ReviewLauncher } from '@/features/review/ReviewLauncher'
import { dateKey } from '@/lib/streak'

const FAKE_TIMESTAMP = {} as Goal['createdAt']
const YEAR = '2026'

function buildFixtureGoals(): Goal[] {
  return [
    // Top subject: most banked minutes (French: 80 chunks * 15min = 1200min = 20h).
    { id: 'french', name: 'French', month: `${YEAR}-02`, totalMinutes: 2400, chunkMinutes: 15, completedChunks: 80, carryMinutes: 0, status: 'active', hue: 0, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
    // Finished subjects (100%).
    { id: 'chess', name: 'Chess openings', month: `${YEAR}-01`, totalMinutes: 300, chunkMinutes: 10, completedChunks: 30, carryMinutes: 0, status: 'archived', hue: 18, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
    { id: 'guitar', name: 'Guitar basics', month: `${YEAR}-03`, totalMinutes: 450, chunkMinutes: 15, completedChunks: 30, carryMinutes: 0, status: 'archived', hue: 9, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
    // In-progress, not top, not finished.
    { id: 'spanish', name: 'Spanish', month: `${YEAR}-04`, totalMinutes: 1200, chunkMinutes: 15, completedChunks: 20, carryMinutes: 0, status: 'active', hue: 15, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
  ]
}

/** Deterministic month docs: a 10-day longest streak in February, a clear best month (March), a Tuesday-heavy pattern, and a best 7-day focus week in June — plus 20 days of sleep data. */
function buildFixtureMonths(): Month[] {
  const dayTotals = new Map<string, { total: number; byGoal: Record<string, number> }>()
  const sleepByDate = new Map<string, { hours: number; quality: number }>()

  function setDay(month: number, day: number, minutes: number) {
    const date = new Date(Number(YEAR), month, day)
    dayTotals.set(dateKey(date), { total: minutes, byGoal: { french: minutes } })
  }

  // 10-day longest streak, early February.
  for (let day = 1; day <= 10; day += 1) setDay(1, day, 45)

  // Scattered ambient activity through the rest of the year (lighter, so February/March/June stand out).
  for (let dayOfYear = 0; dayOfYear < 365; dayOfYear += 1) {
    const date = new Date(Number(YEAR), 0, 1 + dayOfYear)
    if (date.getFullYear() !== Number(YEAR)) break
    const key = dateKey(date)
    if (dayTotals.has(key)) continue
    const noise = (dayOfYear * 53) % 100
    if (noise > 70) dayTotals.set(key, { total: 20 + (noise % 15), byGoal: { spanish: 20 + (noise % 15) } })
  }

  // March: best month — every day gets a solid chunk of time.
  for (let day = 1; day <= 28; day += 1) setDay(2, day, 90)

  // Every Tuesday of the year gets logged, on top of whatever else — "You are a Tuesday person."
  const cursor = new Date(Number(YEAR), 0, 1)
  while (cursor.getFullYear() === Number(YEAR)) {
    if (cursor.getDay() === 2) {
      const key = dateKey(cursor)
      const existing = dayTotals.get(key)
      dayTotals.set(key, { total: (existing?.total ?? 0) + 60, byGoal: { ...existing?.byGoal, french: 60 } })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Best 7-day focus week — a big push in June.
  for (let day = 10; day <= 16; day += 1) setDay(5, day, 180)

  // 20 days of sleep data, averaging ~7.2h.
  for (let day = 1; day <= 20; day += 1) {
    const date = new Date(Number(YEAR), 6, day)
    sleepByDate.set(dateKey(date), { hours: 6.5 + (day % 4) * 0.5, quality: 1 + (day % 5) })
  }

  const months = new Map<string, Month>()
  for (const [key, entry] of dayTotals) {
    const [yr, mm, dd] = key.split('-')
    const monthId = `${yr}-${mm}`
    const month = months.get(monthId) ?? { id: monthId, days: {} as Record<string, MonthDayEntry>, sleep: {} }
    month.days[dd!] = entry
    months.set(monthId, month)
  }
  for (const [key, entry] of sleepByDate) {
    const [yr, mm, dd] = key.split('-')
    const monthId = `${yr}-${mm}`
    const month = months.get(monthId) ?? { id: monthId, days: {} as Record<string, MonthDayEntry>, sleep: {} }
    month.sleep![dd!] = entry
    months.set(monthId, month)
  }
  return Array.from(months.values())
}

function buildFixtureSpending(): SpendingEntry[] {
  const categories = ['Food', 'Transport', 'Fun', 'Learning']
  return Array.from({ length: 24 }, (_, index) => ({
    id: `spend-${index}`,
    date: `${YEAR}-0${(index % 9) + 1}-0${(index % 8) + 1}`,
    amount: 10 + ((index * 17) % 90),
    category: categories[index % categories.length]!,
    createdAt: FAKE_TIMESTAMP,
  }))
}

type DatasetKey = 'full' | 'partial' | 'empty'

/** Dev-only harness for /review — fixture year data instead of real Firestore, so every slide type can be driven by a real browser. */
export default function StyleguideReview() {
  const [datasetKey, setDatasetKey] = useState<DatasetKey>('full')

  const slides = useMemo(() => {
    if (datasetKey === 'empty') return buildReviewSlides({ year: YEAR, goals: [], months: [], spending: [] })
    if (datasetKey === 'partial') {
      // Just enough for intro/totalHours/topSubject — every other slide should be skipped automatically.
      const goals: Goal[] = [
        { id: 'french', name: 'French', month: `${YEAR}-01`, totalMinutes: 300, chunkMinutes: 15, completedChunks: 4, carryMinutes: 0, status: 'active', hue: 0, createdAt: FAKE_TIMESTAMP, updatedAt: FAKE_TIMESTAMP },
      ]
      return buildReviewSlides({ year: YEAR, goals, months: [], spending: [] })
    }
    return buildReviewSlides({ year: YEAR, goals: buildFixtureGoals(), months: buildFixtureMonths(), spending: buildFixtureSpending() })
  }, [datasetKey])

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap gap-2">
        {(['full', 'partial', 'empty'] as const).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`fixture-dataset-${key}`}
            onClick={() => setDatasetKey(key)}
            className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
          >
            {key}
          </button>
        ))}
        <span data-testid="fixture-slide-count" className="flex items-center text-[length:var(--text-small)] text-text-2">
          {slides.length} slides
        </span>
      </div>

      <div className="mx-auto max-w-[1200px]">
        <ReviewLauncher year={YEAR} slides={slides} />
      </div>
    </main>
  )
}
