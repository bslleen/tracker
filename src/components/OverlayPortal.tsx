import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { getOverlayRoot } from '@/lib/overlay-root'

/** For floating content that isn't built on a Radix Portal. */
export function OverlayPortal({ children }: { children: ReactNode }) {
  return createPortal(children, getOverlayRoot())
}
