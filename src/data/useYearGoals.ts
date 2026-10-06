import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

/** Every goal whose month falls within `year` — one range query (both bounds on the same field, like useSpending's date range), not 12 separate per-month reads. Used by the year-in-review insights engine, which needs every subject regardless of status. */
export function useYearGoals(year: string): CachedQueryResult<Goal[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `year-goals:${uid}:${year}` : null

  return useCachedQuery<Goal[]>(key, async () => {
    const goalsQuery = query(
      collection(db, 'users', uid!, 'goals'),
      where('month', '>=', `${year}-01`),
      where('month', '<=', `${year}-12`),
    )
    const snapshot = await getDocs(goalsQuery)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Goal)
  })
}
