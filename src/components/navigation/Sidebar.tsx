import { Link, useLocation } from 'react-router-dom'
import { SearchIcon } from '@/components/icons'
import { commandPaletteStore } from '@/components/commandPaletteStore'
import { Kbd } from '@/components/ui/Kbd'
import { cn } from '@/lib/cn'
import { ActivePill } from './ActivePill'
import { LogTimeFab } from './LogTimeFab'
import { FULL_NAV_ITEMS } from './nav-items'

export function Sidebar() {
  const location = useLocation()

  return (
    <nav
      className="z-nav fixed inset-y-0 left-0 hidden flex-col border-r border-hairline bg-surface p-4 lg:flex"
      style={{ width: 'var(--nav-sidebar-width)' }}
    >
      <div className="mb-6 px-2 text-[length:var(--text-body)] font-medium text-text">Chunks</div>

      <button
        type="button"
        onClick={() => commandPaletteStore.open()}
        className="mb-4 flex min-h-11 items-center justify-between gap-2 rounded-md border border-hairline px-3 text-[length:var(--text-small)] text-text-2"
      >
        <span className="inline-flex items-center gap-2">
          <SearchIcon width={16} height={16} />
          Search
        </span>
        <span className="inline-flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <LogTimeFab variant="sidebar" />

      <div className="mt-6 flex flex-col gap-1">
        {FULL_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.label}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex items-center gap-3 rounded-md px-3 py-2.5"
            >
              {isActive && <ActivePill layoutId="sidebar-pill" className="absolute inset-0 rounded-md bg-accent/15" />}
              <item.icon className={cn('relative', isActive ? 'text-accent' : 'text-text-2')} />
              <span
                className={cn('relative text-[length:var(--text-small)]', isActive ? 'text-accent' : 'text-text-2')}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto flex items-center gap-3 px-2 pt-4">
        <div className="h-9 w-9 rounded-full border border-hairline bg-surface-2" aria-hidden="true" />
        <span className="text-[length:var(--text-small)] text-text-2">Account</span>
      </div>
    </nav>
  )
}
