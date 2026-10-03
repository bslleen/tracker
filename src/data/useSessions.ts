import { collection, getDocs, limit as limitTo, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Session } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useSessions(goalId: string, limit = 20): CachedQueryResult<Session[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `sessions:${uid}:${goalId}:${limit}` : null

  return useCachedQuery<Session[]>(key, async () => {
    const sessionsQuery = query(
      collection(db, 'users', uid!, 'sessions'),
      where('goalId', '==', goalId),
      orderBy('date', 'desc'),
      limitTo(limit),
    )
    const snapshot = await getDocs(sessionsQuery)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Session)
  })
}
