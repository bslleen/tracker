import { Group } from '@visx/group'
import { scaleBand, scaleLinear } from '@visx/scale'
import { Bar } from '@visx/shape'
import { motion, useReducedMotion } from 'motion/react'
import type { Month } from '@/data/types'
import { SPRING_SOFT } from '@/lib/motion'

export interface WeeklySparklineProps {
  goalId: string
  monthSummary: Month | undefined
}

const WIDTH = 280
const HEIGHT = 56

/**
 * Last min(7, day-of-month) days — kept simple by reading the current
 * month's doc only (one read already cached by useMonthSummary elsewhere on
 * this page), rather than also fetching last month's doc just to cover a
 * cross-boundary 7-day window early in a month.
 */
export function WeeklySparkline({ goalId, monthSummary }: WeeklySparklineProps) {
  const prefersReducedMotion = useReducedMotion()
  const today = new Date().getDate()
  const dayCount = Math.min(7, today)
  const days = Array.from({ length: dayCount }, (_, index) => today - dayCount + 1 + index)

  const data = days.map((day) => ({
    day,
    minutes: monthSummary?.days[String(day).padStart(2, '0')]?.byGoal[goalId] ?? 0,
  }))

  if (data.every((entry) => entry.minutes === 0)) return null

  const maxMinutes = Math.max(1, ...data.map((entry) => entry.minutes))
  const xScale = scaleBand<number>({ domain: data.map((entry) => entry.day), range: [0, WIDTH], padding: 0.3 })
  const yScale = scaleLinear<number>({ domain: [0, maxMinutes], range: [HEIGHT, 0] })
  const barWidth = xScale.bandwidth()

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[length:var(--text-small)] text-text-2">This week</span>
      <svg width={WIDTH} height={HEIGHT} role="img" aria-label="Minutes logged per day this week">
        <Group>
          {data.map((entry) => {
            const barHeight = HEIGHT - yScale(entry.minutes)
            const x = xScale(entry.day) ?? 0
            const y = HEIGHT - barHeight

            if (prefersReducedMotion) {
              return <Bar key={entry.day} x={x} y={y} width={barWidth} height={barHeight} rx={2} fill="var(--accent)" />
            }

            return (
              <motion.rect
                key={entry.day}
                x={x}
                width={barWidth}
                rx={2}
                fill="var(--accent)"
                initial={{ height: 0, y: HEIGHT }}
                animate={{ height: barHeight, y }}
                transition={SPRING_SOFT}
              />
            )
          })}
        </Group>
      </svg>
    </div>
  )
}
