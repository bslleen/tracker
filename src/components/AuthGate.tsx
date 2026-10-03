import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui'
import { enterDemoMode, useDemoMode } from '@/data/useDemoMode'
import { signInAsGuest, signInWithGoogle, useAuth } from '@/data/useAuth'

type PendingAction = 'google' | 'guest' | null

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const isDemoMode = useDemoMode()
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return <div className="min-h-dvh bg-bg" />
  }

  if (user || isDemoMode) {
    return <>{children}</>
  }

  async function handleGoogle() {
    setPending('google')
    setError(null)
    try {
      await signInWithGoogle()
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
      await signInAsGuest()
    } catch {
      setError('Could not start a session. Try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-[var(--gutter)] text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-hero leading-none text-text">Chunks</h1>
        <p className="text-[length:var(--text-body)] text-text-2">Small daily chunks, big goals.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" onClick={handleGoogle} disabled={pending !== null}>
          Continue with Google
        </Button>
        <Button size="lg" variant="subtle" onClick={handleGuest} disabled={pending !== null}>
          Try it first
        </Button>
        <Button size="sm" variant="ghost" onClick={enterDemoMode}>
          Demo mode
        </Button>
      </div>

      {error && <p className="text-[length:var(--text-small)] text-danger">{error}</p>}
    </main>
  )
}
