import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useGoal(goalId: string): CachedQueryResult<Goal | undefined> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `goal:${uid}:${goalId}` : null

  return useCachedQuery<Goal | undefined>(key, async () => {
    const snapshot = await getDoc(doc(db, 'users', uid!, 'goals', goalId))
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Goal) : undefined
  })
}
