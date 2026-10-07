import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { OverlayPortal } from '@/components/OverlayPortal'
import { Button } from '@/components/ui'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { SPRING_SNAPPY } from '@/lib/motion'

export interface DeleteGoalConfirmDialogProps {
  open: boolean
  goalName: string | null
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Same shape as Focus Mode's EndSessionDialog — a quick, danger-colored
 * yes/no, no type-to-confirm needed. Not built on Radix Dialog (unlike
 * ResponsiveModal), so it doesn't inherit DismissableLayer's Escape
 * handling — wired here directly, scoped to while it's actually open, so it
 * cancels (the non-destructive action) rather than confirming the delete.
 */
export function DeleteGoalConfirmDialog({ open, goalName, onCancel, onConfirm }: DeleteGoalConfirmDialogProps) {
  useOverlayLock(open)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  return (
    <OverlayPortal>
      <AnimatePresence>
        {open && goalName && (
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
              aria-labelledby="delete-goal-title"
              className="relative w-[min(420px,calc(100vw-2rem))] rounded-xl border border-hairline bg-surface p-6"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRING_SNAPPY}
            >
              <h2 id="delete-goal-title" className="text-title text-text">
                Delete "{goalName}"?
              </h2>
              <p className="mt-2 text-[length:var(--text-small)] text-text-2">
                This removes the goal and every session logged against it. You'll have 10 seconds to undo after
                applying your choices.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onCancel}>
                  Keep it
                </Button>
                <Button variant="danger" className="flex-1" onClick={onConfirm}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </OverlayPortal>
  )
}
