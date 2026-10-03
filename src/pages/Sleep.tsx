import { PageHeader } from '@/components/PageHeader'
import { Stat } from '@/components/ui'

export default function Sleep() {
  return (
    <div>
      <PageHeader title="Sleep" description="No data yet." />
      <Stat value={0} label="avg hours this week" />
    </div>
  )
}
