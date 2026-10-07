import { getFirebaseDb } from '@/lib/firebase'
import { computeChunkProgress } from '@/lib/chunks'
import { recordReads, recordWrites } from '@/lib/firestoreDevCounter'
import { invalidate } from './cache'
import { DEMO_UID, demoLogSession, demoUndoSession } from './demo/store'
import type { GoalData, SessionData } from './types'

export interface LogSessionInput {
  uid: string
  goalId: string
  /** "2026-10" */
  month: string
  /** two-digit day, e.g. "03" */
  day: string
  minutes: number
}

export interface LogSessionResult {
  sessionId: string
  chunksAdded: number
  newCarryMinutes: number
}

function invalidateSessionWrite(uid: string, goalId: string, month: string) {
  invalidate(`goals:${uid}:${month}`)
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`month:${uid}:${month}`)
  invalidate(`year:${uid}:${month.slice(0, 4)}`)
  invalidate(`sessions:${uid}:${goalId}`)
}

/**
 * One transaction: reads the goal fresh (so a stale client-side carryMinutes
 * can't silently clobber a more recent value — e.g. a log from another tab),
 * computes how many whole chunks this session completes, then writes the
 * session doc, the goal's completedChunks/carryMinutes, and the month doc's
 * day/byGoal totals (via dotted field paths, not a nested object — Firestore's
 * `merge: true` only shallow-merges top-level keys, so a nested object would
 * silently replace the whole `days.03` map instead of merging into it).
 */
export async function logSession({ uid, goalId, month, day, minutes }: LogSessionInput): Promise<LogSessionResult> {
  if (uid === DEMO_UID) {
    const result = demoLogSession({ goalId, month, day, minutes })
    invalidateSessionWrite(uid, goalId, month)
    return result
  }

  const [db, { collection, doc, increment, runTransaction, serverTimestamp }] = await Promise.all([
    getFirebaseDb(),
    import('firebase/firestore'),
  ])
  const sessionRef = doc(collection(db, 'users', uid, 'sessions'))
  const goalRef = doc(db, 'users', uid, 'goals', goalId)
  const monthRef = doc(db, 'users', uid, 'months', month)

  const { chunksAdded, newCarryMinutes } = await runTransaction(db, async (tx) => {
    const goalSnap = await tx.get(goalRef)
    if (!goalSnap.exists()) {
      throw new Error(`Goal ${goalId} does not exist`)
    }
    recordReads(1)
    const goal = goalSnap.data() as GoalData
    const { chunksAdded, newCarryMinutes } = computeChunkProgress(
      minutes,
      goal.chunkMinutes,
      goal.carryMinutes,
      goal.completedChunks,
      goal.totalMinutes,
    )

    const session: SessionData = {
      goalId,
      date: `${month}-${day}`,
      minutes,
      chunks: chunksAdded,
      carryBefore: goal.carryMinutes,
      at: serverTimestamp() as SessionData['at'],
    }
    tx.set(sessionRef, session)

    tx.update(goalRef, {
      completedChunks: increment(chunksAdded),
      carryMinutes: newCarryMinutes,
      updatedAt: serverTimestamp(),
    })

    tx.set(
      monthRef,
      {
        [`days.${day}.total`]: increment(minutes),
        [`days.${day}.byGoal.${goalId}`]: increment(minutes),
      },
      { merge: true },
    )
    recordWrites(3)

    return { chunksAdded, newCarryMinutes }
  })

  invalidateSessionWrite(uid, goalId, month)
  return { sessionId: sessionRef.id, chunksAdded, newCarryMinutes }
}

/**
 * The inverse of logSession: deletes the session, reverses the month/goal
 * increments, and restores the goal's carryMinutes to exactly what it was
 * before (session.carryBefore) rather than trying to reverse the modulo
 * arithmetic, which would lose information.
 */
export async function undoSession(uid: string, sessionId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const reversed = demoUndoSession(sessionId)
    if (reversed) invalidateSessionWrite(uid, reversed.goalId, reversed.month)
    return
  }

  const [db, { doc, increment, runTransaction, serverTimestamp }] = await Promise.all([
    getFirebaseDb(),
    import('firebase/firestore'),
  ])
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId)

  const reversed = await runTransaction(db, async (tx) => {
    const sessionSnap = await tx.get(sessionRef)
    if (!sessionSnap.exists()) return null
    recordReads(1)
    const session = sessionSnap.data() as SessionData

    const month = session.date.slice(0, 7)
    const day = session.date.slice(8, 10)
    const goalRef = doc(db, 'users', uid, 'goals', session.goalId)
    const monthRef = doc(db, 'users', uid, 'months', month)

    tx.delete(sessionRef)

    tx.update(goalRef, {
      completedChunks: increment(-session.chunks),
      carryMinutes: session.carryBefore,
      updatedAt: serverTimestamp(),
    })

    tx.set(
      monthRef,
      {
        [`days.${day}.total`]: increment(-session.minutes),
        [`days.${day}.byGoal.${session.goalId}`]: increment(-session.minutes),
      },
      { merge: true },
    )
    recordWrites(3)

    return { goalId: session.goalId, month }
  })

  if (reversed) {
    invalidateSessionWrite(uid, reversed.goalId, reversed.month)
  }
}
