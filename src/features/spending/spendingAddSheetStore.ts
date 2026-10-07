import { createToggleStore } from '@/lib/createToggleStore'

/** Lets the command palette's "Add spending" command open SpendingContent's SpendingAddSheet from anywhere. */
export const spendingAddSheetStore = createToggleStore()
