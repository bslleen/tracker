import { PageHeader } from '@/components/PageHeader'
import { Stat } from '@/components/ui'

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Your goals this month. No data yet." />
      <Stat value={0} label="chunks logged this month" />
    </div>
  )
}
