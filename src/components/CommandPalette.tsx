import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoals } from '@/data/useGoals'
import { earliestMonth, useOverdueGoals } from '@/data/useOverdueGoals'
import { openFocusPicker } from '@/features/focus/focusPickerStore'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { currentMonth, monthName } from '@/lib/chunks'
import { getOverlayRoot } from '@/lib/overlay-root'

/**
 * Minimal, single-purpose command palette: Cmd/Ctrl+K, "Focus on {goal}".
 * Built on cmdk's bare <Command> (not <Command.Dialog>, which manages its own
 * uncontrolled portal) wrapped in our own Radix Dialog + <OverlayPortal>-style
 * container, matching every other overlay in this app — see
 * CLAUDE.md LAYERING RULES #3/#7 (never portal straight into document.body).
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  useOverlayLock(open)

  const month = currentMonth()
  const { data: goals } = useGoals(month)
  const activeGoals = useMemo(() => goals?.filter((goal) => goal.status === 'active') ?? [], [goals])

  const { data: overdueGoals } = useOverdueGoals(month)
  const reviewMonth = earliestMonth(overdueGoals ?? [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleFocusGoal(goalId: string) {
    setOpen(false)
    openFocusPicker(goalId)
  }

  function handleReviewMonth() {
    setOpen(false)
    navigate('/month')
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal container={getOverlayRoot()} forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="z-overlay fixed inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="z-modal fixed top-[14vh] left-1/2 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2"
                initial={{ opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                <Command label="Command palette" className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-lg">
                  <Command.Input
                    autoFocus
                    placeholder="Focus on…"
                    className="w-full border-b border-hairline bg-transparent px-4 py-3 text-[length:var(--text-body)] text-text outline-none placeholder:text-text-2"
                  />
                  <Command.List className="max-h-80 overflow-y-auto p-1.5">
                    <Command.Empty className="px-3 py-6 text-center text-[length:var(--text-small)] text-text-2">
                      No goals to focus on.
                    </Command.Empty>
                    {reviewMonth && (
                      <Command.Group heading="Review">
                        <Command.Item
                          value={`Review ${monthName(reviewMonth)}`}
                          onSelect={handleReviewMonth}
                          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[length:var(--text-small)] text-text outline-none transition-colors data-[selected=true]:bg-surface-2"
                        >
                          Review {monthName(reviewMonth)}
                        </Command.Item>
                      </Command.Group>
                    )}
                    {activeGoals.length > 0 && (
                      <Command.Group heading="Focus">
                        {activeGoals.map((goal) => (
                          <Command.Item
                            key={goal.id}
                            value={`Focus on ${goal.name}`}
                            onSelect={() => handleFocusGoal(goal.id)}
                            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[length:var(--text-small)] text-text outline-none transition-colors data-[selected=true]:bg-surface-2"
                          >
                            Focus on {goal.name}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
