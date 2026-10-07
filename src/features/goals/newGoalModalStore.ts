import { createToggleStore } from '@/lib/createToggleStore'

/** Lets the command palette's "New goal" command open Dashboard's NewGoalModal from anywhere. */
export const newGoalModalStore = createToggleStore()
