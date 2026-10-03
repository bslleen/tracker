import { useState } from 'react'
import { PlusIcon } from '@/components/icons'
import { Button } from '@/components/ui'
import { LogTimeSheet } from '@/features/sessions/LogTimeSheet'
import { cn } from '@/lib/cn'

export interface LogTimeFabProps {
  variant: 'mobile' | 'rail' | 'sidebar'
}

/**
 * Rendered inline by each nav tier (never a separately-positioned fixed
 * element) so the mobile circular button shares the bottom bar's own
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

      <LogTimeSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
