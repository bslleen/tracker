import type { SleepStudyInsight } from './sleepChartData'

export interface SleepInsightCardProps {
  insight: SleepStudyInsight
}

/** "You study 18% more after 7+ hours of sleep" — only ever rendered when the caller has already confirmed there's enough overlapping data (see computeSleepStudyInsight). */
export function SleepInsightCard({ insight }: SleepInsightCardProps) {
  if (insight.percentDifference === 0) return null
  const isMore = insight.percentDifference > 0

  return (
    <div className="rounded-xl border border-hairline bg-surface-2 px-5 py-4">
      <p className="text-[length:var(--text-small)] text-text">
        You study <span className="num font-medium text-accent">{Math.abs(insight.percentDifference)}%</span>{' '}
        {isMore ? 'more' : 'less'} after 7+ hours of sleep
      </p>
    </div>
  )
}
