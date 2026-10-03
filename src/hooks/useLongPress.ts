import { useCallback, useRef } from 'react'

const INITIAL_DELAY = 400
const REPEAT_INTERVAL = 90

/** Fires `callback` once immediately, then repeatedly while held (e.g. a +/- stepper). */
export function useLongPress(callback: () => void) {
  const timeoutRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    callback()
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(callback, REPEAT_INTERVAL)
    }, INITIAL_DELAY)
  }, [callback])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
