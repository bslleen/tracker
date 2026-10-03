import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useGoals(month: string): CachedQueryResult<Goal[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `goals:${uid}:${month}` : null

  return useCachedQuery<Goal[]>(key, async () => {
    const goalsQuery = query(collection(db, 'users', uid!, 'goals'), where('month', '==', month))
    const snapshot = await getDocs(goalsQuery)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Goal)
  })
}
