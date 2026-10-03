import {
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'

export interface AuthState {
  user: User | null
  isLoading: boolean
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setIsLoading(false)
    })
  }, [])

  return { user, isLoading }
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export function signInAsGuest() {
  return signInAnonymously(auth)
}

/** Upgrades an anonymous session to a Google account, keeping its data (same uid). */
export function linkGoogleAccount(user: User) {
  return linkWithPopup(user, new GoogleAuthProvider())
}

export function signOutUser() {
  return signOut(auth)
}
