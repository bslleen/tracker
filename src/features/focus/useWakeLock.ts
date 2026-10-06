import { useEffect } from 'react'

/**
 * Requests the Screen Wake Lock while `active`, releasing it when it goes
 * false or the component unmounts. The browser automatically releases the
 * lock whenever the tab is hidden (e.g. the phone's screen was locked, or the
 * user switched tabs) — the visibilitychange listener re-acquires it the
 * moment the page is visible again, so returning to a still-active focus
 * session keeps the screen awake rather than leaving the lock silently gone.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        // denied, unsupported, or page not visible yet — harmless, just no lock
      }
    }

    void acquire()

    function handleVisibilityChange() {
      if (!cancelled && document.visibilityState === 'visible' && !sentinel) {
        void acquire()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void sentinel?.release()
    }
  }, [active])
}
