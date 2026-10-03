import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui'
import { useGoal } from '@/data/useGoal'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import { LogTimeSheet } from '@/features/sessions/LogTimeSheet'
import { chunkCount, percentComplete } from '@/lib/chunks'

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: goal, isLoading } = useGoal(id ?? '')
  const [isLogOpen, setIsLogOpen] = useState(false)

  if (isLoading) {
    return <PageHeader title="Goal" />
  }

  if (!goal) {
    return <PageHeader title="Goal" description="This goal doesn't exist (or isn't yours)." />
  }

  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = Math.round(percentComplete(goal.completedChunks, total))

  return (
    <div>
      <PageHeader title={goal.name} description={`${percent}% complete`} />
      <ChunkGrid total={total} completed={goal.completedChunks} className="mb-8" />
      <Button onClick={() => setIsLogOpen(true)}>Log time</Button>

      <LogTimeSheet open={isLogOpen} onOpenChange={setIsLogOpen} initialGoalId={goal.id} />
    </div>
  )
}
