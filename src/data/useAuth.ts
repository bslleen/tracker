import type { User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { getFirebaseAuth } from '@/lib/firebase'
import { DEMO_UID } from './demo/store'
import { useDemoMode } from './useDemoMode'

export interface AuthState {
  user: User | null
  isLoading: boolean
}

/**
 * A fixed stand-in for firebase/auth's User — only `.uid` and `.displayName`
 * are ever read anywhere in the app (see the data-layer survey this was
 * built from), so a cast is sufficient without satisfying User's full shape.
 */
const DEMO_USER = { uid: DEMO_UID, displayName: 'Guest' } as unknown as User

/**
 * Demo mode never touches firebase/auth at all — not even a local, no-network
 * onAuthStateChanged listener — so every hook downstream of useAuth() (which
 * all compute `uid = user?.uid ?? null`) transparently gets DEMO_UID instead,
 * with zero changes needed at any call site. `firebase/auth` itself is only
 * ever dynamically imported (see getFirebaseAuth), so a demo-only session
 * never fetches it at all.
 */
export function useAuth(): AuthState {
  const isDemo = useDemoMode()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isDemo) return
    let unsubscribe: (() => void) | undefined
    let cancelled = false

    void Promise.all([getFirebaseAuth(), import('firebase/auth')]).then(([auth, { onAuthStateChanged }]) => {
      if (cancelled) return
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser)
        setIsLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [isDemo])

  if (isDemo) {
    return { user: DEMO_USER, isLoading: false }
  }
  return { user, isLoading }
}

export async function signInWithGoogle() {
  const [auth, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signInAsGuest() {
  const [auth, { signInAnonymously }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
  return signInAnonymously(auth)
}

/** Upgrades an anonymous session to a Google account, keeping its data (same uid). */
export async function linkGoogleAccount(user: User) {
  const { GoogleAuthProvider, linkWithPopup } = await import('firebase/auth')
  return linkWithPopup(user, new GoogleAuthProvider())
}

export async function signOutUser() {
  const [auth, { signOut }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
  return signOut(auth)
}
