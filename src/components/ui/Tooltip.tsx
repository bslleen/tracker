import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { getOverlayRoot } from '@/lib/overlay-root'
import { cn } from '@/lib/cn'

export const TooltipProvider = TooltipPrimitive.Provider

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={getOverlayRoot()}>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-tooltip rounded-sm border border-hairline bg-surface-2 px-2 py-1',
            'text-[length:var(--text-small)] text-text shadow-lg',
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-surface-2" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
