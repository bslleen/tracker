import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button, Card } from '@/components/ui'
import { linkGoogleAccount, useAuth } from '@/data/useAuth'

export default function Settings() {
  const { user } = useAuth()
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div>
      <PageHeader title="Settings" />

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
