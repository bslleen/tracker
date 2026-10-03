import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Month } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

/** @param yyyyMm e.g. "2026-10" */
export function useMonthSummary(yyyyMm: string): CachedQueryResult<Month | undefined> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `month:${uid}:${yyyyMm}` : null

  return useCachedQuery<Month | undefined>(key, async () => {
    const snapshot = await getDoc(doc(db, 'users', uid!, 'months', yyyyMm))
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Month) : undefined
  })
}
