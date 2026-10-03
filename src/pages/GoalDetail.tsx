import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui'
import { useAuth } from '@/data/useAuth'
import { useGoal } from '@/data/useGoal'
import { useSessions } from '@/data/useSessions'
import { logSession, undoSession } from '@/data/sessionWrites'
import { ChunkGrid } from '@/features/goals/ChunkGrid'
import { LogTimeSheet } from '@/features/sessions/LogTimeSheet'
import { chunkCount, currentMonth, percentComplete } from '@/lib/chunks'

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: goal, isLoading } = useGoal(id ?? '')
  const { data: recentSessions } = useSessions(id ?? '', 1)
  const [isLogOpen, setIsLogOpen] = useState(false)

  if (isLoading) {
    return <PageHeader title="Goal" />
  }

  if (!goal) {
    return <PageHeader title="Goal" description="This goal doesn't exist (or isn't yours)." />
  }

  const total = chunkCount(goal.totalMinutes, goal.chunkMinutes)
  const percent = Math.round(percentComplete(goal.completedChunks, total))

  async function handleFillTo(index: number) {
    if (!user || !goal) return
    const chunksToAdd = index - goal.completedChunks + 1
    const minutes = chunksToAdd * goal.chunkMinutes
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')

    try {
      const result = await logSession({ uid: user.uid, goalId: goal.id, month: currentMonth(), day, minutes })
      toast(`Logged ${minutes} min · ${goal.name}`, {
        action: { label: 'Undo', onClick: () => void undoSession(user.uid, result.sessionId) },
      })
    } catch {
      toast.error('Could not log that session. Try again.')
    }
  }

  async function handleUndoLast() {
    const lastSessionId = recentSessions?.[0]?.id
    if (!user || !lastSessionId || !goal) return
    try {
      await undoSession(user.uid, lastSessionId)
      toast(`Undid last session · ${goal.name}`)
    } catch {
      toast.error('Could not undo that session. Try again.')
    }
  }

  return (
    <div>
      <PageHeader title={goal.name} description={`${percent}% complete`} />
      <ChunkGrid
        total={total}
        completed={goal.completedChunks}
        chunkMinutes={goal.chunkMinutes}
        accentShade={goal.hue}
        interactive
        size="lg"
        label={goal.name}
        onFillTo={(index) => void handleFillTo(index)}
        onUndoLast={() => void handleUndoLast()}
        className="mb-8"
      />
      <Button onClick={() => setIsLogOpen(true)}>Log time</Button>

      <LogTimeSheet open={isLogOpen} onOpenChange={setIsLogOpen} initialGoalId={goal.id} />
    </div>
  )
}
