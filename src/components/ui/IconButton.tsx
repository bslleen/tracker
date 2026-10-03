import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { buttonVariantClasses, type ButtonVariant } from './button-variants'

type IconButtonSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'min-h-11 min-w-11',
  md: 'min-h-11 min-w-11',
  lg: 'min-h-12 min-w-12',
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: IconButtonSize
  asChild?: boolean
  /** Required since there is no visible label — describes the action for screen readers. */
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'ghost', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors',
          'disabled:pointer-events-none disabled:opacity-40',
          buttonVariantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    )
  },
)
IconButton.displayName = 'IconButton'
