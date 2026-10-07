import { getFirebaseDb } from '@/lib/firebase'
import { recordReads } from '@/lib/firestoreDevCounter'
import { DEMO_UID, readDemoGoal } from './demo/store'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

export function useGoal(goalId: string): CachedQueryResult<Goal | undefined> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `goal:${uid}:${goalId}` : null

  return useCachedQuery<Goal | undefined>(key, async () => {
    if (uid === DEMO_UID) return readDemoGoal(goalId)
    const [db, { doc, getDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const snapshot = await getDoc(doc(db, 'users', uid!, 'goals', goalId))
    recordReads(1)
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Goal) : undefined
  })
}
