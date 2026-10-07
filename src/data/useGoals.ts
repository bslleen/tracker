import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoGoals } from './demo/store'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useGoals(month: string): CachedQueryResult<Goal[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `goals:${uid}:${month}` : null

  return useCachedQuery<Goal[]>(key, async () => {
    if (uid === DEMO_UID) return readDemoGoals(month)
    const [db, { collection, getDocs, query, where }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const goalsQuery = query(collection(db, 'users', uid!, 'goals'), where('month', '==', month))
    const snapshot = await getDocs(goalsQuery)
    recordReads(snapshot.docs.length)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Goal)
  })
}
