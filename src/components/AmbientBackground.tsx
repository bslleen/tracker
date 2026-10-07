import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getFocusSessionSnapshot, subscribeFocusSession } from '@/features/focus/focusStore'
import { createAmbientShader, type AmbientShaderHandle } from '@/lib/ambientShader'
import { isLowPowerDevice } from '@/lib/ambientCapability'

function isFocusSessionActive(): boolean {
  return getFocusSessionSnapshot() !== null
}

/**
 * Lives in #bg-root (mounted via AmbientBackgroundPortal, see main.tsx) —
 * that root already has `position: fixed; inset: 0; z-index: var(--z-bg);
 * pointer-events: none` from globals.css, so this component only ever needs
 * to fill it, never position or z-index itself.
 */
export function AmbientBackground() {
  const prefersReducedMotion = useReducedMotion() ?? false
  const isFocusActive = useSyncExternalStore(subscribeFocusSession, isFocusSessionActive, () => false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleRef = useRef<AmbientShaderHandle | null>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // Capability gate is derived straight from render inputs, not synced into
  // state — only an actual WebGL compile failure (discovered inside the
  // effect below) needs its own state, since that can't be known up front.
  const prefersReducedData =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-data: reduce)').matches
  const isCapabilityFallback =
    prefersReducedMotion ||
    isLowPowerDevice(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined, prefersReducedData)
  const useStaticFallback = isCapabilityFallback || webglFailed

  useEffect(() => {
    if (isCapabilityFallback) return

    const canvas = canvasRef.current
    if (!canvas) return
    const handle = createAmbientShader(canvas)
    if (!handle) {
      setWebglFailed(true)
      return
    }

    handleRef.current = handle
    return () => {
      handle.destroy()
      handleRef.current = null
    }
  }, [isCapabilityFallback])

  // Paused while Focus Mode is open (it renders its own background) or the
  // tab is hidden — resumed the instant either condition clears.
  useEffect(() => {
    function sync() {
      const handle = handleRef.current
      if (!handle) return
      if (isFocusActive || document.hidden) handle.pause()
      else handle.resume()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [isFocusActive])

  if (useStaticFallback) {
    return (
      <div
        aria-hidden="true"
        className="h-full w-full"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, var(--accent-glow), transparent 55%), radial-gradient(circle at 82% 88%, var(--accent-glow), transparent 55%)',
          opacity: 0.5,
        }}
      />
    )
  }

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />
}
