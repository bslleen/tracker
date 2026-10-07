import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoMonth } from './demo/store'
import type { Month } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

/** @param yyyyMm e.g. "2026-10" */
export function useMonthSummary(yyyyMm: string): CachedQueryResult<Month | undefined> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `month:${uid}:${yyyyMm}` : null

  return useCachedQuery<Month | undefined>(key, async () => {
    if (uid === DEMO_UID) return readDemoMonth(yyyyMm)
    const [db, { doc, getDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const snapshot = await getDoc(doc(db, 'users', uid!, 'months', yyyyMm))
    recordReads(1)
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Month) : undefined
  })
}
