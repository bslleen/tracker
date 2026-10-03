import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('@container rounded-xl border border-hairline bg-surface p-6', className)}
      style={{ boxShadow: 'inset 0 1px 0 0 var(--hairline)', ...style }}
      {...props}
    />
  ),
)
Card.displayName = 'Card'
