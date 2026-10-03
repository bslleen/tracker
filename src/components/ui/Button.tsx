import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { buttonVariantClasses, type ButtonVariant } from './button-variants'

type ButtonSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-[length:var(--text-small)]',
  md: 'min-h-11 px-4 text-[length:var(--text-body)]',
  lg: 'min-h-12 px-6 text-[length:var(--text-body)]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
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
Button.displayName = 'Button'
