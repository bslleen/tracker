import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { useGoals } from '@/data/useGoals'
import { AddGoalCard } from '@/features/goals/AddGoalCard'
import { GoalCard } from '@/features/goals/GoalCard'
import { NewGoalModal } from '@/features/goals/NewGoalModal'
import { currentMonth } from '@/lib/chunks'

export default function Dashboard() {
  const month = currentMonth()
  const { data: goals } = useGoals(month)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [justCreatedGoalId, setJustCreatedGoalId] = useState<string | null>(null)

  return (
    <div>
      <PageHeader title="Dashboard" description="Your goals this month." />

      {/* isolate: so a card's z-raised token (while its shared layout transition is
          animating) stacks above sibling cards without ever competing past this
          grid's own boundary — see CLAUDE.md LAYERING RULES. No overflow/contain
          here, or the morph would clip itself mid-animation. */}
      <div className="isolate grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {goals?.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              justCreated={goal.id === justCreatedGoalId}
              onPulseEnd={() => setJustCreatedGoalId(null)}
            />
          ))}
        </AnimatePresence>
        <AddGoalCard onClick={() => setIsCreateOpen(true)} />
      </div>

      <NewGoalModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(goalId) => setJustCreatedGoalId(goalId)}
      />
    </div>
  )
}
