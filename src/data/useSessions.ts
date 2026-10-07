import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoSessions } from './demo/store'
import type { Session } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useSessions(goalId: string, limit = 20): CachedQueryResult<Session[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `sessions:${uid}:${goalId}:${limit}` : null

  return useCachedQuery<Session[]>(key, async () => {
    if (uid === DEMO_UID) return readDemoSessions(goalId, limit)
    const [db, { collection, getDocs, limit: limitTo, orderBy, query, where }] = await Promise.all([
      getFirebaseDb(),
      import('firebase/firestore'),
    ])
    const sessionsQuery = query(
      collection(db, 'users', uid!, 'sessions'),
      where('goalId', '==', goalId),
      orderBy('date', 'desc'),
      limitTo(limit),
    )
    const snapshot = await getDocs(sessionsQuery)
    recordReads(snapshot.docs.length)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Session)
  })
}
