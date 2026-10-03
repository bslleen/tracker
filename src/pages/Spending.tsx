import { PageHeader } from '@/components/PageHeader'
import { Stat } from '@/components/ui'

export default function Spending() {
  return (
    <div>
      <PageHeader title="Spending" description="No data yet." />
      <Stat value={0} label="spent this month" />
    </div>
  )
}
