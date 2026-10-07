import { toast } from 'sonner'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { SignInOptions } from '@/components/SignInOptions'
import { convertDemoToAccount } from '@/data/demo/convert'
import { exitDemoMode } from '@/data/useDemoMode'

export interface DemoSignInSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Opened from <DemoBanner>. A real sign-in immediately exits demo mode (every
 * src/data/* hook re-reads from the now-real, empty account on the next
 * render) and offers one optional, one-click import of the demo goals via a
 * toast — see src/data/demo/convert.ts for the batch itself.
 */
export function DemoSignInSheet({ open, onOpenChange }: DemoSignInSheetProps) {
  function handleSuccess(uid: string) {
    exitDemoMode()
    onOpenChange(false)
    toast('Signed in. Import your demo goals into this account?', {
      duration: 15_000,
      action: {
        label: 'Import',
        onClick: () => {
          void convertDemoToAccount(uid).then(
            (count) => toast.success(count > 0 ? `Imported ${count} goal${count === 1 ? '' : 's'}` : 'Nothing to import'),
            () => toast.error('Could not import your demo goals. Try again from Settings.'),
          )
        },
      },
    })
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Sign in"
      description="Keep today's progress by signing in — your demo goals can come with you."
    >
      <SignInOptions onSuccess={handleSuccess} guestLabel="Continue as guest" />
    </ResponsiveModal>
  )
}
