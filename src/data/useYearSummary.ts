import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoYearSummary } from './demo/store'
import type { Month } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

/** Reads exactly the year's 12 month docs (skipping ones that don't exist yet) — never more. */
export function useYearSummary(year: string): CachedQueryResult<Month[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `year:${uid}:${year}` : null

  return useCachedQuery<Month[]>(key, async () => {
    if (uid === DEMO_UID) return readDemoYearSummary(year)
    const [db, { doc, getDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const monthIds = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
    const snapshots = await Promise.all(monthIds.map((id) => getDoc(doc(db, 'users', uid!, 'months', id))))
    recordReads(snapshots.length)
    return snapshots.filter((snap) => snap.exists()).map((snap) => ({ id: snap.id, ...snap.data() }) as Month)
  })
}
