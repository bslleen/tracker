import type { ReactNode } from 'react'
import { Button } from '@/components/ui'
import { enterDemoMode, useDemoMode } from '@/data/useDemoMode'
import { useAuth } from '@/data/useAuth'
import { SignInOptions } from './SignInOptions'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const isDemoMode = useDemoMode()

  if (isLoading) {
    return <div className="min-h-dvh bg-bg" />
  }

  if (user || isDemoMode) {
    return <>{children}</>
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-bg px-[var(--gutter)] text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-hero leading-none text-text">Chunks</h1>
        <p className="text-[length:var(--text-body)] text-text-2">Small daily chunks, big goals.</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <SignInOptions />
        <Button size="sm" variant="ghost" onClick={enterDemoMode}>
          Try the demo
        </Button>
      </div>
    </main>
  )
}
