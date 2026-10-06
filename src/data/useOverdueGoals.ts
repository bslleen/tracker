import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Goal } from './types'
import { useAuth } from './useAuth'
import { type CachedQueryResult, useCachedQuery } from './useCachedQuery'

/**
 * Active goals whose month is strictly before `currentMonthValue` — drives
 * the month-end review banner, its command-palette entry, and which month
 * /month lands on by default. An equality filter (status) plus a range
 * filter on a different field (month) needs the composite index declared in
 * firestore.indexes.json.
 */
export function useOverdueGoals(currentMonthValue: string): CachedQueryResult<Goal[]> {
  const { user } = useAuth()
  const uid = user?.uid ?? null
  const key = uid ? `overdue-goals:${uid}:${currentMonthValue}` : null

  return useCachedQuery<Goal[]>(key, async () => {
    const overdueQuery = query(
      collection(db, 'users', uid!, 'goals'),
      where('status', '==', 'active'),
      where('month', '<', currentMonthValue),
    )
    const snapshot = await getDocs(overdueQuery)
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Goal)
  })
}

/** Earliest (oldest) month among a set of goals, or null for an empty list — "2026-09" sorts before "2026-10" lexicographically, so plain string comparison works. */
export function earliestMonth(goals: Goal[]): string | null {
  if (goals.length === 0) return null
  return goals.reduce((earliest, goal) => (goal.month < earliest ? goal.month : earliest), goals[0]!.month)
}
