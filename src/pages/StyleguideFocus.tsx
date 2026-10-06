import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button, Tooltip } from '@/components/ui'
import { signInAsGuest, useAuth } from '@/data/useAuth'
import { FocusMode } from '@/features/focus/FocusMode'
import { startFocusSession } from '@/features/focus/focusStore'

// Deliberately tiny so a Playwright run can observe a full chunk complete in
// a couple of seconds rather than real minutes.
const FAST_GOAL = { id: 'styleguide-goal-fast', name: 'French', hue: 0, chunkMinutes: 0.05 }
// Long enough that a simulated 2-minute tab-away lands mid-session, not past the end.
const LONG_GOAL = { id: 'styleguide-goal-long', name: 'Algebra', hue: 15, chunkMinutes: 5 }

/** Dev-only fixture: exercises Focus Mode without needing real Firestore data (see StyleguideGoalCard.tsx for the same pattern). */
export default function StyleguideFocus() {
  const { user } = useAuth()

  // A toast fired from behind an open Focus Mode can't come from a click on
  // this page's own content (Focus Mode makes #app-root inert, same as every
  // other overlay) — this window hook lets a Playwright run trigger one
  // programmatically to verify the layering, same as a background process
  // would in the real app. __signInTestUser lets the same run populate
  // useAuth() so the completion screen's "Log it" write path is exercisable.
  useEffect(() => {
    const testWindow = window as unknown as { __fireTestToast?: () => void; __signInTestUser?: () => Promise<unknown> }
    testWindow.__fireTestToast = () => toast('A toast fired during Focus Mode')
    testWindow.__signInTestUser = () => signInAsGuest()
    return () => {
      delete testWindow.__fireTestToast
      delete testWindow.__signInTestUser
    }
  }, [])

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-title text-text">Focus Mode fixture</h1>
      <p data-testid="auth-state" className="text-[length:var(--text-small)] text-text-2">
        {user ? `signed in as ${user.uid}` : 'signed out'}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => startFocusSession(FAST_GOAL, { mode: 'fixed', chunks: 2 })}>Start fixed · 2 chunks (fast)</Button>
        <Button variant="ghost" onClick={() => startFocusSession(FAST_GOAL, { mode: 'free' })}>
          Start free (fast)
        </Button>
        <Button variant="subtle" onClick={() => startFocusSession(LONG_GOAL, { mode: 'fixed', chunks: 3 })}>
          Start fixed · 3 chunks (long)
        </Button>
        <Button variant="ghost" onClick={() => toast('A toast fired during Focus Mode')}>
          Fire toast
        </Button>
        <Tooltip content="A tooltip above Focus Mode">
          <Button variant="ghost">Hover for tooltip</Button>
        </Tooltip>
      </div>
      <FocusMode />
    </div>
  )
}
