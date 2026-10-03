import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div>
      <PageHeader title="Goal" description={`Placeholder detail view for goal "${id}". No data yet.`} />
    </div>
  )
}
