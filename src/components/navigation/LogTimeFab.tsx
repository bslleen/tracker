import { useState } from 'react'
import { PlusIcon } from '@/components/icons'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface LogTimeFabProps {
  variant: 'mobile' | 'rail' | 'sidebar'
}

/**
 * Opens <LogTimeSheet> (Phase 5) via <ResponsiveModal>. Placeholder content
 * for now. Rendered inline by each nav tier (never a separately-positioned
 * fixed element) so the mobile circular button shares the bottom bar's own
 * stacking context — see CLAUDE.md LAYERING RULES.
 */
export function LogTimeFab({ variant }: LogTimeFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === 'mobile' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Log time"
          className={cn(
            'z-raised absolute left-1/2 -top-6 flex h-14 w-14 -translate-x-1/2 items-center justify-center',
            'rounded-full bg-accent text-bg shadow-lg',
          )}
        >
          <PlusIcon width={24} height={24} />
        </button>
      )}

      {variant === 'rail' && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Log time"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-accent text-bg"
        >
          <PlusIcon />
        </button>
      )}

      {variant === 'sidebar' && (
        <Button onClick={() => setOpen(true)} className="w-full justify-center">
          <PlusIcon width={18} height={18} />
          Log time
        </Button>
      )}

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Log time"
        description="The full chunk-logging flow lands in Phase 5."
      >
        <p className="text-[length:var(--text-small)] text-text-2">Placeholder — not wired up yet.</p>
      </ResponsiveModal>
    </>
  )
}
