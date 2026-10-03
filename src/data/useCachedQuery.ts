import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { getCached, setCached, subscribe } from './cache'

export interface CachedQueryResult<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
}

const IDLE_RESULT: CachedQueryResult<never> = { data: undefined, isLoading: false, error: null }

/**
 * Fetches once per cache key, serving subsequent calls (including in other
 * mounted components) from the in-memory cache. Re-fetches only when a
 * write elsewhere calls invalidate() for this key — never polls, never
 * subscribes to Firestore. `key: null` means "not ready yet" (e.g. waiting
 * on auth) and resolves to an idle, non-loading, undefined result.
 *
 * `data` is never mirrored into React state: it's read straight from the
 * module-level cache at render time (the cache is the single source of
 * truth), and `bump` just forces a re-render once a fetch populates it.
 */
export function useCachedQuery<T>(key: string | null, fetcher: () => Promise<T>): CachedQueryResult<T> {
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [isLoading, setIsLoading] = useState(() => key !== null && getCached<T>(key) === undefined)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback((targetKey: string) => {
    setIsLoading(true)
    setError(null)
    fetcherRef
      .current()
      .then((result) => {
        setCached(targetKey, result)
        bump()
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!key) return

    if (getCached<T>(key) === undefined) {
      // Firestore reads are an async side effect with no "derive during
      // render" equivalent — this IS the effect's job, matching the rule's
      // own suggested shape (setState happens inside the fetch's
      // callbacks); `load`'s leading setIsLoading(true)/setError(null)
      // still trip the static check transitively, so it's disabled here
      // rather than deferred, which would make isLoading wrongly read
      // `false` while the request is in flight.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load(key)
    } else {
      setIsLoading(false)
    }

    return subscribe(key, () => load(key))
  }, [key, load])

  if (!key) {
    return IDLE_RESULT as CachedQueryResult<T>
  }

  return { data: getCached<T>(key), isLoading, error }
}
