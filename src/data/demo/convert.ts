import { getFirebaseDb } from '@/lib/firebase'
import type { GoalData } from '@/data/types'
import { invalidate } from '../cache'
import { readAllDemoGoals } from './store'

/**
 * "Convert to account" — one Firestore batch that copies every demo goal
 * into the just-signed-in real account. carriedFrom is dropped: it would
 * point at a demo-only goal id that doesn't exist in the real account.
 * Session/month/spending history is deliberately NOT imported — the brief
 * scopes this to "the demo goals" specifically, one click, one batch.
 * firebase/firestore is imported dynamically — this module is statically
 * reachable from AppShell (via DemoBanner -> DemoSignInSheet), which is NOT
 * behind a route-level React.lazy boundary, so a static import here would
 * put all of Firestore back into the main bundle for every visitor.
 */
export async function convertDemoToAccount(uid: string): Promise<number> {
  const demoGoals = readAllDemoGoals()
  if (demoGoals.length === 0) return 0

  const [db, { collection, doc, serverTimestamp, writeBatch }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
  const batch = writeBatch(db)
  const monthsTouched = new Set<string>()

  for (const goal of demoGoals) {
    const goalRef = doc(collection(db, 'users', uid, 'goals'))
    const data: GoalData = {
      name: goal.name,
      month: goal.month,
      totalMinutes: goal.totalMinutes,
      chunkMinutes: goal.chunkMinutes,
      completedChunks: goal.completedChunks,
      carryMinutes: goal.carryMinutes,
      status: goal.status,
      hue: goal.hue,
      ...(goal.playlistNote ? { playlistNote: goal.playlistNote } : {}),
      createdAt: serverTimestamp() as GoalData['createdAt'],
      updatedAt: serverTimestamp() as GoalData['updatedAt'],
    }
    batch.set(goalRef, data)
    monthsTouched.add(goal.month)
  }

  await batch.commit()

  for (const month of monthsTouched) {
    invalidate(`goals:${uid}:${month}`)
    invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
  }
  invalidate(`overdue-goals:${uid}`)

  return demoGoals.length
}
