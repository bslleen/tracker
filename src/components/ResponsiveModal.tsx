import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { cn } from '@/lib/cn'
import { SPRING_SNAPPY } from '@/lib/motion'
import { getOverlayRoot } from '@/lib/overlay-root'

export interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Full-height drawer on mobile instead of the default half/full snap points — for content (like the command palette) that wants to open already-expanded. */
  mobileFullHeight?: boolean
  /** Visually hides the title (still read by screen readers) for content that already shows its own heading/input as the first thing inside. */
  visuallyHiddenTitle?: boolean
  /** 'top' anchors the desktop dialog near the top of the viewport (e.g. the command palette) instead of the default vertical centering. */
  desktopPosition?: 'center' | 'top'
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
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  mobileFullHeight = false,
  visuallyHiddenTitle = false,
  desktopPosition = 'center',
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  useOverlayLock(open)

  // Neither Radix Dialog nor vaul's Drawer restores focus to whatever
  // triggered them here — both only know how to do that via their own
  // <Trigger> component, which every caller skips (the trigger is often a
  // plain button rendered well outside the dialog tree, e.g. a sidebar
  // button or a command palette item). So it's done by hand: remember
  // what had focus the moment this opens, give it back the moment it closes.
  //
  // The capture can't happen in a useEffect: content with its own
  // `autoFocus` (the command palette's search input) steals focus during
  // the commit phase, which runs before any passive effect, so by the time
  // a useEffect ran document.activeElement would already be the stolen
  // focus, not the real trigger. Capturing during render instead (the same
  // "did a prop just change" pattern LogTimeSheet/FocusStartSheet already
  // use) runs before this update is even committed, while focus is still
  // wherever it was before the dialog opened.
  const [wasOpen, setWasOpen] = useState(open)
  const [previouslyFocused, setPreviouslyFocused] = useState<HTMLElement | null>(null)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setPreviouslyFocused(document.activeElement as HTMLElement | null)
    }
  }

  useEffect(() => {
    if (open) return
    if (previouslyFocused && document.contains(previouslyFocused)) {
      previouslyFocused.focus()
    }
    // Only the close transition should fire this — re-running it for every
    // re-render that happens to carry the same `previouslyFocused` value
    // (e.g. a sibling state update while still open) isn't an infinite loop
    // either way since `open` is the only thing that actually changes here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const titleClassName = visuallyHiddenTitle ? 'sr-only' : 'text-title text-text'

  if (isDesktop) {
    const isTopAnchored = desktopPosition === 'top'
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
              <Dialog.Content asChild forceMount onCloseAutoFocus={(event) => event.preventDefault()}>
                <motion.div
                  className={cn(
                    'z-modal fixed left-1/2 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-hairline bg-surface p-6',
                    isTopAnchored ? 'top-[14vh]' : 'top-1/2 -translate-y-1/2',
                  )}
                  initial={{ opacity: 0, scale: 0.96, y: isTopAnchored ? -8 : 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: isTopAnchored ? -8 : 8 }}
                  transition={SPRING_SNAPPY}
                >
                  <Dialog.Title className={titleClassName}>{title}</Dialog.Title>
                  {description && (
                    <Dialog.Description className="mt-2 text-[length:var(--text-small)] text-text-2">
                      {description}
                    </Dialog.Description>
                  )}
                  <div className={visuallyHiddenTitle ? '' : 'mt-6'}>{children}</div>
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
      snapPoints={mobileFullHeight ? undefined : [0.5, 1]}
    >
      <Drawer.Portal>
        {/*
          Not vaul's own <Drawer.Overlay>: it hard-codes `if (!modal) return
          null` (node_modules/vaul/dist/index.js), so with `modal={false}`
          above — required so useOverlayLock stays the single source of
          truth for scroll-lock instead of fighting vaul's own — it never
          rendered at all. Every mobile sheet (LogTimeSheet, FocusStartSheet,
          the mobile command palette, …) was opening with zero backdrop
          scrim. A plain div sidesteps vaul's gate entirely and matches the
          desktop Dialog.Overlay above.
        */}
        {open && (
          <motion.div
            aria-hidden="true"
            className="z-overlay fixed inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
          />
        )}
        <Drawer.Content
          className={cn(
            'z-modal fixed inset-x-0 bottom-0 flex flex-col rounded-t-xl border border-hairline bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]',
            mobileFullHeight ? 'h-[94dvh]' : 'max-h-[90dvh]',
          )}
        >
          <Drawer.Handle className="mx-auto mb-4 bg-hairline" />
          <Drawer.Title className={titleClassName}>{title}</Drawer.Title>
          {description && (
            <Drawer.Description className="mt-2 text-[length:var(--text-small)] text-text-2">
              {description}
            </Drawer.Description>
          )}
          <div className={cn('overflow-y-auto', visuallyHiddenTitle ? '' : 'mt-6', mobileFullHeight && 'flex-1')}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
