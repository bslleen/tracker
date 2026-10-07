import { useSyncExternalStore } from 'react'

export interface ToggleStore {
  open: () => void
  close: () => void
  toggle: () => void
  useIsOpen: () => boolean
}

/**
 * Same subscribe/snapshot shape as useDemoMode.ts and focusStore.ts — a
 * module-level open/closed flag for a single sheet/modal that's triggered
 * from somewhere outside its owner's component tree (here: the command
 * palette). The owner ORs this into its own local open state rather than
 * moving the modal to be globally mounted, so existing local callbacks
 * (e.g. Dashboard's "just created" pulse) keep working unchanged.
 */
export function createToggleStore(): ToggleStore {
  let isOpen = false
  const listeners = new Set<() => void>()

  function commit(next: boolean) {
    if (isOpen === next) return
    isOpen = next
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getSnapshot(): boolean {
    return isOpen
  }

  return {
    open: () => commit(true),
    close: () => commit(false),
    toggle: () => commit(!isOpen),
    useIsOpen: () => useSyncExternalStore(subscribe, getSnapshot, () => false),
  }
}
