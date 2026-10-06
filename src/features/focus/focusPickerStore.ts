import { useSyncExternalStore } from 'react'

export interface FocusPickerState {
  open: boolean
  goalId?: string
}

let state: FocusPickerState = { open: false }
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Opens the goal + duration picker sheet, optionally preselecting a goal (goal page, command palette). */
export function openFocusPicker(goalId?: string): void {
  state = { open: true, goalId }
  emit()
}

export function closeFocusPicker(): void {
  state = { open: false, goalId: state.goalId }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): FocusPickerState {
  return state
}

export function useFocusPicker(): FocusPickerState {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({ open: false }))
}
