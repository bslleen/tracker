import { collection, doc, getDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { invalidate } from './cache'
import type { SessionData } from './types'

export interface LogSessionInput {
  uid: string
  goalId: string
  /** "2026-10" */
  month: string
  /** two-digit day, e.g. "03" */
  day: string
  minutes: number
  chunks: number
}

function invalidateSessionWrite(uid: string, goalId: string, month: string) {
  invalidate(`goals:${uid}:${month}`)
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`month:${uid}:${month}`)
  invalidate(`year:${uid}:${month.slice(0, 4)}`)
  invalidate(`sessions:${uid}:${goalId}`)
}

/**
 * One batch: adds the session doc, increments the goal's completedChunks,
 * and increments the month doc's day/byGoal totals. Month fields are
 * incremented through dotted field paths (`days.03.total`, not a nested
 * `{ days: { '03': { total: ... } } }` object) — Firestore's `merge: true`
 * only shallow-merges top-level keys, so a nested object would silently
 * replace the whole `days.03` map (wiping other goals' totals for that day)
 * instead of merging into it.
 */
export async function logSession({ uid, goalId, month, day, minutes, chunks }: LogSessionInput): Promise<string> {
  const batch = writeBatch(db)

  const sessionRef = doc(collection(db, 'users', uid, 'sessions'))
  const session: SessionData = {
    goalId,
    date: `${month}-${day}`,
    minutes,
    chunks,
    at: serverTimestamp() as SessionData['at'],
  }
  batch.set(sessionRef, session)

  const goalRef = doc(db, 'users', uid, 'goals', goalId)
  batch.update(goalRef, {
    completedChunks: increment(chunks),
    updatedAt: serverTimestamp(),
  })

  const monthRef = doc(db, 'users', uid, 'months', month)
  batch.set(
    monthRef,
    {
      [`days.${day}.total`]: increment(minutes),
      [`days.${day}.byGoal.${goalId}`]: increment(minutes),
    },
    { merge: true },
  )

  await batch.commit()
  invalidateSessionWrite(uid, goalId, month)

  return sessionRef.id
}

/** The inverse of logSession: deletes the session and reverses both increments. */
export async function undoSession(uid: string, sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'users', uid, 'sessions', sessionId)
  const snapshot = await getDoc(sessionRef)
  if (!snapshot.exists()) return

  const session = snapshot.data() as SessionData
  const month = session.date.slice(0, 7)
  const day = session.date.slice(8, 10)

  const batch = writeBatch(db)
  batch.delete(sessionRef)

  const goalRef = doc(db, 'users', uid, 'goals', session.goalId)
  batch.update(goalRef, {
    completedChunks: increment(-session.chunks),
    updatedAt: serverTimestamp(),
  })

  const monthRef = doc(db, 'users', uid, 'months', month)
  batch.set(
    monthRef,
    {
      [`days.${day}.total`]: increment(-session.minutes),
      [`days.${day}.byGoal.${session.goalId}`]: increment(-session.minutes),
    },
    { merge: true },
  )

  await batch.commit()
  invalidateSessionWrite(uid, session.goalId, month)
}
