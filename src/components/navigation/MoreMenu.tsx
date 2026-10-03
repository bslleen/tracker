import * as Popover from '@radix-ui/react-popover'
import { Link, useLocation } from 'react-router-dom'
import { MoreIcon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getOverlayRoot } from '@/lib/overlay-root'
import { MORE_ITEMS } from './nav-items'

export function MoreMenu({ className }: { className?: string }) {
  const location = useLocation()
  const isActive = MORE_ITEMS.some((item) => item.to === location.pathname)

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={className} aria-label="More">
          <MoreIcon className={isActive ? 'text-accent' : 'text-text-2'} />
          <span className={cn('text-[length:var(--text-small)]', isActive ? 'text-accent' : 'text-text-2')}>
            More
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal container={getOverlayRoot()}>
        <Popover.Content
          side="top"
          sideOffset={12}
          align="end"
          className="z-dropdown flex w-44 flex-col gap-1 rounded-md border border-hairline bg-surface-2 p-2 shadow-lg"
        >
          {MORE_ITEMS.map((item) => (
            <Popover.Close asChild key={item.label}>
              <Link
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-sm px-2 py-2 text-[length:var(--text-small)] transition-colors hover:bg-surface',
                  location.pathname === item.to ? 'text-accent' : 'text-text',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
