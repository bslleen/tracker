import { AnimatedNumber } from '@/components/ui'
import { StreakIcon } from '@/components/icons'

export interface HeatmapStreakStatsProps {
  currentStreak: number
  longestStreak: number
  activeDays: number
}

export function HeatmapStreakStats({ currentStreak, longestStreak, activeDays }: HeatmapStreakStatsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <StreakIcon width={28} height={28} className="text-streak" />
        <AnimatedNumber
          value={currentStreak}
          format={(value) => `${Math.round(value)}`}
          duration={0.7}
          className="text-hero leading-none text-text"
        />
      </div>
      <p className="text-[length:var(--text-small)] text-text-2">Current streak</p>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[length:var(--text-small)] text-text-2">
        <span>
          <span className="num text-text">{longestStreak}</span> longest streak
        </span>
        <span>
          <span className="num text-text">{activeDays}</span> active days
        </span>
      </div>
    </div>
  )
}
