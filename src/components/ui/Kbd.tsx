import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-hairline',
        'bg-surface-2 px-1.5 text-[length:var(--text-small)] text-text-2',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
