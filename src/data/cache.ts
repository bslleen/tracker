/**
 * Shared in-memory read cache for the hooks in src/data/. Fetched once per
 * session; writes call invalidate() so the next read (in this tab or an
 * already-mounted hook) goes back to Firestore instead of serving stale data.
 */

type Listener = () => void

const store = new Map<string, unknown>()
const listeners = new Map<string, Set<Listener>>()

export function getCached<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function setCached<T>(key: string, data: T): void {
  store.set(key, data)
}

/** A mounted hook calls this for its own key to be notified when invalidated. */
export function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) {
      listeners.delete(key)
    }
  }
}

/** Clears every cache key equal to, or prefixed by, `keyOrPrefix` and notifies its subscribers. */
export function invalidate(keyOrPrefix: string): void {
  for (const key of store.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      store.delete(key)
      for (const listener of listeners.get(key) ?? []) {
        listener()
      }
    }
  }
}

export function clearCache(): void {
  store.clear()
}
