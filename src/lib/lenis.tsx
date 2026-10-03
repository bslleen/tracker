import Lenis from 'lenis'
import { useEffect, useRef, type ReactNode } from 'react'
import { LenisContext } from './lenis-context'

// A ref object (not state) as the context value: its identity never changes,
// so no re-render is needed to propagate the instance once it's created —
// consumers just read `.current` at the point they need it (always from
// inside an effect/handler triggered by user interaction, never on first
// paint), and effects remain the only place the instance is constructed and
// torn down, which is what makes StrictMode's mount/cleanup/mount double
// pass safe here.
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const instance = new Lenis()
    lenisRef.current = instance

    let frameId: number
    function raf(time: number) {
      instance.raf(time)
      frameId = requestAnimationFrame(raf)
    }
    frameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frameId)
      instance.destroy()
      lenisRef.current = null
    }
  }, [])

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
}
