import { AnimatePresence, motion } from 'motion/react'
import { OverlayPortal } from '@/components/OverlayPortal'
import { Button } from '@/components/ui'
import { useOverlayLock } from '@/hooks/useOverlayLock'

export interface EndSessionDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Rendered from inside FocusMode's own JSX, so when it mounts it portals into
 * #overlay-root AFTER Focus Mode's own content — same z-modal token, later
 * DOM sibling, so it naturally layers on top without needing --z-toast.
 * useOverlayLock is reference-counted (see useOverlayLock.ts), so this stacks
 * correctly on top of Focus Mode's own lock rather than fighting it.
 */
export function EndSessionDialog({ open, onCancel, onConfirm }: EndSessionDialogProps) {
  useOverlayLock(open)

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && (
          <div className="z-modal fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={onCancel}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="end-session-title"
              className="relative w-[min(400px,calc(100vw-2rem))] rounded-xl border border-hairline bg-surface p-6"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <h2 id="end-session-title" className="text-title text-text">
                End session?
              </h2>
              <p className="mt-2 text-[length:var(--text-small)] text-text-2">
                The current chunk hasn't been logged yet — ending now won't save it.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onCancel}>
                  Keep going
                </Button>
                <Button variant="danger" className="flex-1" onClick={onConfirm}>
                  End session
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  )
}
