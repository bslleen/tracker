import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'chunks:focus-chime'
const listeners = new Set<() => void>()

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Off by default — the completion sequence is silent unless the user opts in from Settings. */
export function useChimeSetting(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export function setChimeSetting(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // ignore — the toggle just won't persist across reloads
  }
  for (const listener of listeners) listener()
}

/** A soft, short two-tone ping — synthesized so Focus Mode needs no bundled audio asset. */
export function playChime(): void {
  try {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    const ctx = new AudioContextCtor()
    const now = ctx.currentTime
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    oscillator.frequency.exponentialRampToValueAtTime(1318.5, now + 0.18)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.16, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65)

    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.7)
    oscillator.onended = () => void ctx.close()
  } catch {
    // audio unavailable (autoplay policy, unsupported) — the chime is a non-essential embellishment
  }
}
