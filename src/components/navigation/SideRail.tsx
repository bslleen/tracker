import { Link, useLocation } from 'react-router-dom'
import { Tooltip } from '@/components/ui'
import { cn } from '@/lib/cn'
import { ActivePill } from './ActivePill'
import { LogTimeFab } from './LogTimeFab'
import { FULL_NAV_ITEMS } from './nav-items'

export function SideRail() {
  const location = useLocation()

  return (
    <nav
      className="z-nav fixed inset-y-0 left-0 hidden flex-col items-center gap-2 border-r border-hairline bg-surface py-4 md:flex lg:hidden"
      style={{ width: 'var(--nav-rail-width)' }}
    >
      {FULL_NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Tooltip key={item.label} content={item.label} side="right">
            <Link
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex min-h-11 min-w-11 items-center justify-center rounded-md"
            >
              {isActive && <ActivePill layoutId="rail-pill" className="absolute inset-1 rounded-md bg-accent/15" />}
              <item.icon className={cn('relative', isActive ? 'text-accent' : 'text-text-2')} />
            </Link>
          </Tooltip>
        )
      })}

      <div className="mt-auto">
        <LogTimeFab variant="rail" />
      </div>
    </nav>
  )
}
