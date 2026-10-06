import { useState } from 'react'
import type { Month, MonthDayEntry, SleepEntry } from '@/data/types'
import { SleepContent } from '@/features/sleep/SleepContent'
import { useToday } from '@/hooks/useToday'
import { dateKey } from '@/lib/streak'

/** Deterministic daily sleep + study data for a full year, correlated so the cross-insight card has something honest to say: more sleep -> more study minutes. */
function buildFixtureMonths(today: Date): Month[] {
  const dayTotals = new Map<string, { sleep: SleepEntry; study: MonthDayEntry }>()
  const year = today.getFullYear()

  for (let dayOfYear = 0; dayOfYear < 366; dayOfYear += 1) {
    const date = new Date(year, 0, 1 + dayOfYear)
    if (date.getFullYear() !== year) break
    if (date > today) break

    const noise = (dayOfYear * 53) % 100
    const hours = 5 + (noise % 7) * 0.5 // 5.0 - 8.5h, deterministic spread
    const quality = 1 + (noise % 5)
    const studyMinutes = hours >= 7 ? 60 + (noise % 40) : 10 + (noise % 25)

    dayTotals.set(dateKey(date), {
      sleep: { hours, quality },
      study: { total: studyMinutes, byGoal: { french: studyMinutes } },
    })
  }

  const months = new Map<string, Month>()
  for (const [key, { sleep, study }] of dayTotals) {
    const [yr, mm, dd] = key.split('-')
    const monthId = `${yr}-${mm}`
    const month = months.get(monthId) ?? { id: monthId, days: {}, sleep: {} }
    month.days[dd!] = study
    month.sleep![dd!] = sleep
    months.set(monthId, month)
  }
  return Array.from(months.values())
}

/** Dev-only harness for /sleep — fixture month docs instead of real Firestore data. */
export default function StyleguideSleep() {
  const today = useToday()
  const [hasData, setHasData] = useState(true)
  const [lastLogged, setLastLogged] = useState<string | null>(null)

  const monthDocs = hasData ? buildFixtureMonths(today) : []

  return (
    <main className="min-h-dvh bg-bg p-[var(--gutter)] text-text">
      <div className="mx-auto mb-8 flex max-w-[1200px] flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="fixture-toggle-data"
          onClick={() => setHasData((value) => !value)}
          className="min-h-11 rounded-full border border-hairline px-3 text-[length:var(--text-small)] text-text-2 hover:text-text"
        >
          {hasData ? 'Show empty' : 'Show data'}
        </button>
        {lastLogged && (
          <span data-testid="fixture-last-logged" className="text-[length:var(--text-small)] text-text-2">
            Logged: {lastLogged}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-[1200px]">
        <SleepContent
          monthDocs={monthDocs}
          today={today}
          onLogSleep={(hours, quality) => setLastLogged(`${hours.toFixed(1)}h · quality ${quality}`)}
        />
      </div>
    </main>
  )
}
