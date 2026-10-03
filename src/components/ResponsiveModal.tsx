import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { getOverlayRoot } from '@/lib/overlay-root'

const SPRING = { type: 'spring', stiffness: 380, damping: 32 } as const

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

/**
 * Same content, same API, two renderers: a vaul bottom-sheet drawer under
 * 768px, a centered Radix dialog at 768px and up. See CLAUDE.md ADAPTIVE
 * RULES #6.
 *
 * Radix/vaul's own `modal` mode duplicates what useOverlayLock already does
 * (body scroll lock) and the two would fight over body padding math, so both
 * are rendered with `modal={false}` here and useOverlayLock is the single
 * source of truth for scroll-lock + #app-root inert + Lenis. The trade-off:
 * Tab doesn't loop back to the first field after the last one (Radix's own
 * focus-trap loop is tied to the same `modal` flag) — background content is
 * still fully unreachable via `inert`, which is the part that matters most.
 */
export function ResponsiveModal({ open, onOpenChange, title, description, children }: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  useOverlayLock(open)

  if (isDesktop) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
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
              <Dialog.Content asChild forceMount>
                <motion.div
                  className="z-modal fixed top-1/2 left-1/2 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface p-6"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={SPRING}
                >
                  <Dialog.Title className="text-title text-text">{title}</Dialog.Title>
                  {description && (
                    <Dialog.Description className="mt-2 text-[length:var(--text-small)] text-text-2">
                      {description}
                    </Dialog.Description>
                  )}
                  <div className="mt-6">{children}</div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    )
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      container={getOverlayRoot()}
      modal={false}
      snapPoints={[0.5, 1]}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="z-overlay fixed inset-0 bg-black/60" />
        <Drawer.Content className="z-modal fixed inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-xl border border-hairline bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Drawer.Handle className="mx-auto mb-4 bg-hairline" />
          <Drawer.Title className="text-title text-text">{title}</Drawer.Title>
          {description && (
            <Drawer.Description className="mt-2 text-[length:var(--text-small)] text-text-2">
              {description}
            </Drawer.Description>
          )}
          <div className="mt-6 overflow-y-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
