import { useEffect } from 'react'
import { useLenis } from '@/lib/lenis-context'

// Module-level so nested overlays (modal > drawer > tooltip) share one
// counter regardless of where in the tree each one portals from.
let lockCount = 0
let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

function lock() {
  lockCount += 1
  if (lockCount > 1) return

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  previousBodyOverflow = document.body.style.overflow
  previousBodyPaddingRight = document.body.style.paddingRight

  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    const currentPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0
    document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
  }

  const appRoot = document.getElementById('app-root')
  appRoot?.setAttribute('inert', '')
  appRoot?.setAttribute('aria-hidden', 'true')
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  document.body.style.overflow = previousBodyOverflow
  document.body.style.paddingRight = previousBodyPaddingRight

  const appRoot = document.getElementById('app-root')
  appRoot?.removeAttribute('inert')
  appRoot?.removeAttribute('aria-hidden')
}

/**
 * Call from any mounted overlay (modal, drawer, command palette, focus mode,
 * story mode). Reference-counted: as long as at least one overlay is active,
 * body scroll stays locked, #app-root stays inert, and Lenis stays stopped.
 */
export function useOverlayLock(active = true) {
  const lenis = useLenis()

  useEffect(() => {
    if (!active) return

    lock()
    lenis?.stop()

    return () => {
      unlock()
      if (lockCount === 0) {
        lenis?.start()
      }
    }
  }, [active, lenis])
}
