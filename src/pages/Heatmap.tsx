import { useGoals } from '@/data/useGoals'
import { useYearSummary } from '@/data/useYearSummary'
import { HeatmapContent } from '@/features/heatmap/HeatmapContent'
import { useToday } from '@/hooks/useToday'
import { currentMonth } from '@/lib/chunks'

export default function Heatmap() {
  const today = useToday()
  const year = currentMonth().slice(0, 4)
  const { data: monthDocs } = useYearSummary(year)
  const { data: goals } = useGoals(currentMonth())

  return <HeatmapContent year={year} monthDocs={monthDocs ?? []} goals={goals ?? []} today={today} />
}
