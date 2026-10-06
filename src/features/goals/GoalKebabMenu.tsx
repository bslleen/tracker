import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useState, type ReactNode } from 'react'
import { ArchiveIcon, EditIcon, KebabIcon, TrashIcon } from '@/components/icons'
import { IconButton } from '@/components/ui'
import { useOverlayLock } from '@/hooks/useOverlayLock'
import { cn } from '@/lib/cn'
import { getOverlayRoot } from '@/lib/overlay-root'

export interface GoalKebabMenuProps {
  onEdit: () => void
  onChangeChunkSize: () => void
  onArchiveAbandoned: () => void
  onDelete: () => void
}

export function GoalKebabMenu({ onEdit, onChangeChunkSize, onArchiveAbandoned, onDelete }: GoalKebabMenuProps) {
  const [open, setOpen] = useState(false)
  // Radix's own `modal` lock would double up with useOverlayLock (see
  // ResponsiveModal.tsx) — this hook is the single source of truth for
  // scroll-lock/inert/Lenis, same pattern as every other overlay here.
  useOverlayLock(open)

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <IconButton aria-label="Goal options" variant="ghost">
          <KebabIcon />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal container={getOverlayRoot()}>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-dropdown flex w-56 flex-col gap-1 rounded-md border border-hairline bg-surface-2 p-1.5 shadow-lg"
        >
          <MenuItem icon={<EditIcon />} onSelect={onEdit}>
            Edit
          </MenuItem>
          <MenuItem onSelect={onChangeChunkSize}>Change chunk size</MenuItem>
          <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
          <MenuItem icon={<ArchiveIcon />} onSelect={onArchiveAbandoned}>
            Archive as abandoned
          </MenuItem>
          <MenuItem icon={<TrashIcon />} destructive onSelect={onDelete}>
            Delete
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MenuItem({
  icon,
  children,
  destructive = false,
  onSelect,
}: {
  icon?: ReactNode
  children: ReactNode
  destructive?: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[length:var(--text-small)] outline-none transition-colors',
        destructive ? 'text-danger hover:bg-danger/10' : 'text-text hover:bg-surface',
      )}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  )
}
