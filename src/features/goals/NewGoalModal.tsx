import { ResponsiveModal } from '@/components/ResponsiveModal'
import { useGoals } from '@/data/useGoals'
import { currentMonth } from '@/lib/chunks'
import { NewGoalWizard } from './NewGoalWizard'

export interface NewGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (goalId: string) => void
}

export function NewGoalModal({ open, onOpenChange, onCreated }: NewGoalModalProps) {
  const { data: goals } = useGoals(currentMonth())

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="New goal">
      <NewGoalWizard
        existingGoalCount={goals?.length ?? 0}
        onCreated={(goalId) => {
          onOpenChange(false)
          onCreated(goalId)
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveModal>
  )
}
