import * as Dialog from '@radix-ui/react-dialog'
import { useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'
import { getOverlayRoot } from '@/lib/overlay-root'
import { Button, Card, Divider, IconButton, Kbd, ProgressRing, Stat, Tooltip } from '@/components/ui'
import type { ButtonVariant } from '@/components/ui/button-variants'
import { useOverlayLock } from '@/hooks/useOverlayLock'

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'ghost', 'subtle', 'danger']

export default function Styleguide() {
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Radix/vaul's own `modal` scroll-lock is turned off below so this hook is
  // the single source of truth for body-lock + inert + lenis, avoiding two
  // independent lock mechanisms fighting over body padding/overflow.
  useOverlayLock(modalOpen)
  useOverlayLock(drawerOpen)

  return (
    <main className="min-h-dvh bg-bg text-text" style={{ padding: 'var(--gutter)' }}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
        <header>
          <h1 className="text-title text-text">Styleguide</h1>
          <p className="text-[length:var(--text-small)] text-text-2">Dev-only route. Not part of the product.</p>
        </header>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
            <IconButton aria-label="Example icon button">i</IconButton>
          </div>
        </Section>

        <Section title="Card">
          <Card className="max-w-sm">
            <p className="text-[length:var(--text-body)] text-text">
              Surface, hairline border, radius-xl, container-query ready.
            </p>
          </Card>
        </Section>

        <Section title="Stat">
          <Stat value={247} label="minutes this month" />
        </Section>

        <Section title="Progress ring">
          <div className="flex flex-wrap gap-8">
            <RingDemo progress={0} label="0%" />
            <RingDemo progress={0.5} label="50%" />
            <RingDemo progress={1} label="100%" />
          </div>
        </Section>

        <Section title="Tooltip">
          <Tooltip content="Portaled to #overlay-root, z-tooltip (700).">
            <Button variant="subtle">Hover or focus me</Button>
          </Tooltip>
        </Section>

        <Section title="Stacked overlays (layering check)">
          <p className="max-w-prose text-[length:var(--text-small)] text-text-2">
            Opens a modal (z-modal), then a drawer from inside it (also z-modal — drawers and
            modals share one layer), then a tooltip from inside the drawer (z-tooltip, always
            highest). Confirms portals and the z-index token scale hold up three deep.
          </p>
          <Button onClick={() => setModalOpen(true)}>Open stacked overlays demo</Button>
        </Section>

        <Divider />
        <footer className="pb-8 text-[length:var(--text-small)] text-text-2">
          Press <Kbd>Esc</Kbd> to close any open overlay.
        </footer>
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen} modal={false}>
        <Dialog.Portal container={getOverlayRoot()}>
          <Dialog.Overlay className="z-modal fixed inset-0 bg-black/60" />
          <Dialog.Content className="z-modal fixed top-1/2 left-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-hairline bg-surface p-6">
            <Dialog.Title className="text-title text-text">Modal (z-modal)</Dialog.Title>
            <Dialog.Description className="mt-2 text-[length:var(--text-small)] text-text-2">
              This is the first overlay layer.
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => setDrawerOpen(true)}>Open drawer</Button>
              <Dialog.Close asChild>
                <Button variant="ghost">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen} container={getOverlayRoot()} modal={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="z-modal fixed inset-0 bg-black/60" />
          <Drawer.Content className="z-modal fixed inset-x-0 bottom-0 rounded-t-xl border border-hairline bg-surface-2 p-6">
            <Drawer.Title className="text-title text-text">Drawer (z-modal)</Drawer.Title>
            <p className="mt-2 text-[length:var(--text-small)] text-text-2">
              Opened from inside the modal. Same z-modal layer, rendered later in the DOM so it
              sits visually above it.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Tooltip content="z-tooltip (700) — always above modals and drawers.">
                <IconButton aria-label="Show tooltip">i</IconButton>
              </Tooltip>
              <Drawer.Close asChild>
                <Button variant="ghost">Close drawer</Button>
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[length:var(--text-small)] tracking-wide text-text-2 uppercase">{title}</h2>
      {children}
    </section>
  )
}

function RingDemo({ progress, label }: { progress: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing progress={progress} />
      <span className="num text-[length:var(--text-small)] text-text-2">{label}</span>
    </div>
  )
}
