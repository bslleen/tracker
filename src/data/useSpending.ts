import { collection, getDocs, limit as limitTo, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SpendingEntry } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

const MAX_ENTRIES = 300

/** Fetches once per month per session, capped at 300 docs — see CLAUDE.md's "Reads" note for /spending. */
export function useSpending(month: string): CachedQueryResult<SpendingEntry[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `spending:${uid}:${month}` : null

  return useCachedQuery<SpendingEntry[]>(key, async () => {
    const spendingQuery = query(
      collection(db, 'users', uid!, 'spending'),
      where('date', '>=', `${month}-01`),
      where('date', '<=', `${month}-31`),
      orderBy('date', 'desc'),
      limitTo(MAX_ENTRIES),
    )
    const snapshot = await getDocs(spendingQuery)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as SpendingEntry)
  })
}
