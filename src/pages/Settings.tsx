import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card } from '@/components/ui'
import { linkGoogleAccount, useAuth } from '@/data/useAuth'
import { setChimeSetting, useChimeSetting } from '@/features/focus/chimeSetting'
import { cn } from '@/lib/cn'

export default function Settings() {
  const { user } = useAuth()
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chimeEnabled = useChimeSetting()

  const isAnonymous = user?.isAnonymous ?? false

  async function handleLink() {
    if (!user) return
    setIsLinking(true)
    setError(null)
    try {
      await linkGoogleAccount(user)
    } catch {
      setError('Could not link a Google account. Try again.')
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />

      <Card className="max-w-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[length:var(--text-body)] text-text">Focus completion chime</span>
            <span className="text-[length:var(--text-small)] text-text-2">A soft sound when a focus session finishes.</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={chimeEnabled}
            aria-label="Focus completion chime"
            onClick={() => setChimeSetting(!chimeEnabled)}
            className={cn(
              'relative h-7 w-12 shrink-0 rounded-full border border-hairline transition-colors',
              chimeEnabled ? 'bg-accent/30' : 'bg-surface-2',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-text transition-transform',
                chimeEnabled ? 'translate-x-[22px]' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      </Card>

      {isAnonymous && (
        <Card className="max-w-sm">
          <p className="text-[length:var(--text-body)] text-text">
            You're using a guest session. Link a Google account to keep this data if you sign in
            elsewhere.
          </p>
          <Button className="mt-4" onClick={handleLink} disabled={isLinking}>
            Link Google account
          </Button>
          {error && <p className="mt-2 text-[length:var(--text-small)] text-danger">{error}</p>}
        </Card>
      )}
    </div>
  )
}
