import { Toaster } from 'sonner'
import { createPortal } from 'react-dom'
import { CheckIcon } from '@/components/icons'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { getToastRoot } from '@/lib/toast-root'

/**
 * Mounts Sonner's <Toaster> into #toast-root (CLAUDE.md LAYERING RULES #7).
 * Sonner ships its own stylesheet with a hardcoded, extremely high z-index
 * (nine 9s) on `[data-sonner-toaster]`, injected at runtime — since it's the
 * same specificity as a class selector, whichever rule lands later in the
 * cascade wins, which isn't reliable to depend on. An inline `style` always
 * beats any stylesheet rule, so the z-token goes there instead of a
 * className, and it's a var() reference rather than a raw number so
 * scripts/check-z-index.mjs still passes.
 */
export function ToastPortal() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return createPortal(
    <Toaster
      theme="dark"
      position={isDesktop ? 'bottom-right' : 'bottom-center'}
      offset={24}
      mobileOffset={{ bottom: 'calc(var(--nav-bottom-height) + env(safe-area-inset-bottom) + 16px)' }}
      style={{ zIndex: 'var(--z-toast)' }}
      icons={{ success: <CheckIcon className="text-accent" /> }}
      toastOptions={{
        style: {
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          color: 'var(--text)',
          borderRadius: 'var(--radius-md)',
        },
      }}
    />,
    getToastRoot(),
  )
}
