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
 * Lets <AuthGate> through with no Firebase Auth user at all — src/data/*
 * hooks and write functions branch on this (via useAuth's DEMO_USER / the
 * DEMO_UID sentinel) to read/write the in-memory store in src/data/demo/
 * instead of Firestore.
 */
export function enterDemoMode(): void {
  sessionStorage.setItem(STORAGE_KEY, 'true')
  for (const listener of listeners) listener()
}

/** Called the moment a real sign-in succeeds — see DemoSignInSheet.tsx. */
export function exitDemoMode(): void {
  sessionStorage.removeItem(STORAGE_KEY)
  for (const listener of listeners) listener()
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
