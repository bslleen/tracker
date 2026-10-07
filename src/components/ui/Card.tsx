import { forwardRef, type HTMLAttributes, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, onPointerMove, ...props }, ref) => {
    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
      // Only a real mouse drives the spotlight — a touch tap shouldn't leave a
      // stale glow sitting wherever the finger last was (CLAUDE.md: "no global
      // custom cursor that could overlap UI"). Reading clientX/Y straight off
      // the event and writing CSS vars via setProperty skips a re-render per move.
      if (event.pointerType === 'mouse') {
        const rect = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
      }
      onPointerMove?.(event)
    }

    return (
      <div
        ref={ref}
        onPointerMove={handlePointerMove}
        className={cn(
          '@container relative rounded-xl border border-hairline bg-surface p-6',
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 before:content-['']",
          'before:[background:radial-gradient(240px_circle_at_var(--mx,50%)_var(--my,50%),var(--accent-glow),transparent_70%)]',
          '[@media(hover:hover)_and_(pointer:fine)]:hover:before:opacity-100',
          className,
        )}
        style={{ boxShadow: 'inset 0 1px 0 0 var(--hairline)', ...style }}
        {...props}
      />
    )
  },
)
Card.displayName = 'Card'
