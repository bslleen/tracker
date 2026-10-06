import type { Goal, Month } from '@/data/types'
import { shiftAccentHue } from '@/lib/color'

export interface TodayStripProps {
  goals: Goal[]
  monthSummary: Month | undefined
  /** Two-digit day, e.g. "03". */
  todayKey: string
}

/**
 * Minutes studied today per goal, as thin horizontal bars. Collapses to a
 * single "Today: N min" line below 480px (ADAPTIVE RULES — compact chrome on
 * the smallest phones).
 */
export function TodayStrip({ goals, monthSummary, todayKey }: TodayStripProps) {
  if (goals.length === 0) return null

  const entries = goals.map((goal) => ({ goal, minutes: monthSummary?.days[todayKey]?.byGoal[goal.id] ?? 0 }))
  const total = entries.reduce((sum, entry) => sum + entry.minutes, 0)
  const max = Math.max(1, ...entries.map((entry) => entry.minutes))

  return (
    <div>
      <div className="hidden flex-col gap-2 min-[480px]:flex">
        <span className="text-[length:var(--text-small)] text-text-2">Today</span>
        {entries.map(({ goal, minutes }) => (
          <div key={goal.id} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-[length:var(--text-small)] text-text-2">{goal.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-chunk-empty">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(minutes / max) * 100}%`,
                  backgroundColor: shiftAccentHue(goal.hue),
                  transition: 'width var(--duration-slow) var(--ease-out)',
                }}
              />
            </div>
            <span className="num w-12 shrink-0 text-right text-[length:var(--text-small)] text-text-2">{minutes}m</span>
          </div>
        ))}
      </div>
      <p className="text-[length:var(--text-small)] text-text-2 min-[480px]:hidden">Today: {total} min</p>
    </div>
  )
}
