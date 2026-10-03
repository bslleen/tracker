import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ActivePill } from './ActivePill'
import { LogTimeFab } from './LogTimeFab'
import { MoreMenu } from './MoreMenu'
import { TAB_BAR_ITEMS } from './nav-items'

export function BottomTabBar() {
  const location = useLocation()

  return (
    <nav
      className="z-nav fixed inset-x-0 bottom-0 flex items-stretch justify-around border-t border-hairline md:hidden"
      style={{
        height: 'var(--nav-bottom-height)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
      }}
    >
      {TAB_BAR_ITEMS.map((item) => {
        const isActive = location.pathname === item.to
        return (
          <Link
            key={item.label}
            to={item.to}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex flex-1 flex-col items-center justify-center gap-1"
          >
            {isActive && (
              <ActivePill layoutId="bottom-tab-pill" className="absolute inset-x-3 inset-y-1.5 rounded-full bg-accent/15" />
            )}
            <item.icon className={cn('relative', isActive ? 'text-accent' : 'text-text-2')} />
            <span className={cn('relative text-[length:var(--text-small)]', isActive ? 'text-accent' : 'text-text-2')}>
              {item.label}
            </span>
          </Link>
        )
      })}

      <MoreMenu className="relative flex flex-1 flex-col items-center justify-center gap-1" />

      <LogTimeFab variant="mobile" />
    </nav>
  )
}
