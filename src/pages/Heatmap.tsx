import { PageHeader } from '@/components/PageHeader'
import { Stat } from '@/components/ui'

export default function Heatmap() {
  return (
    <div>
      <PageHeader title="Streaks" description="No data yet." />
      <Stat value={0} label="day streak" />
    </div>
  )
}
