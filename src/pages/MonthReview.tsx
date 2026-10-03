import { PageHeader } from '@/components/PageHeader'
import { Stat } from '@/components/ui'

export default function MonthReview() {
  return (
    <div>
      <PageHeader title="Month review" description="No data yet." />
      <Stat value={0} label="% average completion" />
    </div>
  )
}
