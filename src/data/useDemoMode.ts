import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'chunks:demo-mode'
const listeners = new Set<() => void>()

function getSnapshot(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Lets <AuthGate> through with no Firebase Auth user at all. The data
 * generator that actually populates demo content lands in Phase 15 — this
 * just flips the gate.
 */
export function enterDemoMode(): void {
  sessionStorage.setItem(STORAGE_KEY, 'true')
  for (const listener of listeners) listener()
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
