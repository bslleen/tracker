import { createPortal } from 'react-dom'
import { AmbientBackground } from '@/components/AmbientBackground'
import { getBgRoot } from '@/lib/bg-root'

/** Mounts the ambient WebGL/CSS background into #bg-root (CLAUDE.md LAYERING RULES #3). */
export function AmbientBackgroundPortal() {
  return createPortal(<AmbientBackground />, getBgRoot())
}
