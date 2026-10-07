import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoYearSpending } from './demo/store'
import type { SpendingEntry } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

// A once-a-year read for the review's spending slide — generous relative to
// useSpending's monthly 300-doc cap, still a hard ceiling.
const MAX_ENTRIES = 1000

export function useYearSpending(year: string): CachedQueryResult<SpendingEntry[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `year-spending:${uid}:${year}` : null

  return useCachedQuery<SpendingEntry[]>(key, async () => {
    if (uid === DEMO_UID) return readDemoYearSpending(year)
    const [db, { collection, getDocs, limit: limitTo, orderBy, query, where }] = await Promise.all([
      getFirebaseDb(),
      import('firebase/firestore'),
    ])
    const spendingQuery = query(
      collection(db, 'users', uid!, 'spending'),
      where('date', '>=', `${year}-01-01`),
      where('date', '<=', `${year}-12-31`),
      orderBy('date', 'desc'),
      limitTo(MAX_ENTRIES),
    )
    const snapshot = await getDocs(spendingQuery)
    recordReads(snapshot.docs.length)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as SpendingEntry)
  })
}
