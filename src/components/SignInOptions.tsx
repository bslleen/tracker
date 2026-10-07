import { useState } from 'react'
import { Button } from '@/components/ui'
import { signInAsGuest, signInWithGoogle } from '@/data/useAuth'

type PendingAction = 'google' | 'guest' | null

export interface SignInOptionsProps {
  /** Called with the new user's uid right after a successful sign-in. */
  onSuccess?: (uid: string) => void
  googleLabel?: string
  guestLabel?: string
}

/** The two real sign-in methods — shared by AuthGate (first visit) and DemoSignInSheet (converting out of demo mode). */
export function SignInOptions({ onSuccess, googleLabel = 'Continue with Google', guestLabel = 'Try it first' }: SignInOptionsProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setPending('google')
    setError(null)
    try {
      const credential = await signInWithGoogle()
      onSuccess?.(credential.user.uid)
    } catch {
      setError('Could not sign in with Google. Try again.')
    } finally {
      setPending(null)
    }
  }

  async function handleGuest() {
    setPending('guest')
    setError(null)
    try {
      const credential = await signInAsGuest()
      onSuccess?.(credential.user.uid)
    } catch {
      setError('Could not start a session. Try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button size="lg" onClick={() => void handleGoogle()} disabled={pending !== null}>
        {googleLabel}
      </Button>
      <Button size="lg" variant="subtle" onClick={() => void handleGuest()} disabled={pending !== null}>
        {guestLabel}
      </Button>
      {error && <p className="text-[length:var(--text-small)] text-danger">{error}</p>}
    </div>
  )
}
