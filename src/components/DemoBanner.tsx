import { useState } from 'react'
import { Button } from '@/components/ui'
import { useDemoMode } from '@/data/useDemoMode'
import { DemoSignInSheet } from './DemoSignInSheet'

/**
 * Lives inline inside <main>, above the routed page content — never
 * `position: fixed` (CLAUDE.md: nothing here should float over content, and
 * this isn't navigation or an overlay, so it has no reason to).
 */
export function DemoBanner() {
  const isDemo = useDemoMode()
  const [signInOpen, setSignInOpen] = useState(false)

  if (!isDemo) return null

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-2.5">
        <p className="text-[length:var(--text-small)] text-text-2">
          Demo mode — changes aren't saved <span aria-hidden="true">·</span> Sign in to keep your data
        </p>
        <Button size="sm" variant="subtle" onClick={() => setSignInOpen(true)}>
          Sign in
        </Button>
      </div>
      <DemoSignInSheet open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  )
}
