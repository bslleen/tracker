import { useState } from 'react'
import type { Month } from '@/data/types'
import { AnimatedNumber, Button } from '@/components/ui'
import {
  averageHours,
  buildDailySleepSeries,
  compareToLastWeek,
  computeSleepStudyInsight,
  type SleepRange,
} from './sleepChartData'
import { SleepChart } from './SleepChart'
import { SleepInsightCard } from './SleepInsightCard'
import { SleepLogSheet } from './SleepLogSheet'

export interface SleepContentProps {
  monthDocs: Month[]
  today: Date
  onLogSleep: (hours: number, quality: number) => void | Promise<void>
}

export function SleepContent({ monthDocs, today, onLogSleep }: SleepContentProps) {
  const [range, setRange] = useState<SleepRange>('30d')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const points = buildDailySleepSeries(monthDocs, today, range)
  const average = averageHours(points.filter((p) => p.hours > 0))
  const comparison = compareToLastWeek(monthDocs, today)
  const insight = computeSleepStudyInsight(monthDocs)

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Sleep</h1>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <AnimatedNumber
            value={average}
            format={(value) => `${value.toFixed(1)}h`}
            duration={0.9}
            className="text-hero leading-none text-text"
          />
          <span className="text-[length:var(--text-small)] text-text-2">
            average sleep ·{' '}
            {comparison.deltaPercent === 0
              ? 'same as last week'
              : `${Math.abs(comparison.deltaPercent)}% ${comparison.deltaPercent > 0 ? 'more' : 'less'} than last week`}
          </span>
        </div>

        <Button onClick={() => setIsSheetOpen(true)}>Log sleep</Button>
      </div>

      {insight && <SleepInsightCard insight={insight} />}

      <SleepChart points={points} range={range} onRangeChange={setRange} />

      <SleepLogSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} onLog={onLogSleep} />
    </div>
  )
}
