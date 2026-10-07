import { getFirebaseDb } from '@/lib/firebase'
import { carryOverGoal, nextMonth } from '@/lib/chunks'
import { recordReads, recordWrites } from '@/lib/firestoreDevCounter'
import type { Goal, GoalData, Session, SessionData } from './types'
import { invalidate } from './cache'
import { DEMO_UID, demoApplyMonthReviewDecisions, demoRestoreDeletedGoal } from './demo/store'

export type GoalReviewDecision = 'carryOver' | 'archive' | 'abandon' | 'delete'

export interface GoalReviewChoice {
  goal: Goal
  decision: GoalReviewDecision
}

export interface ApplyMonthReviewInput {
  uid: string
  /** The month being reviewed — so its cache (and the month carried into) can be invalidated. */
  month: string
  choices: GoalReviewChoice[]
}

export interface DeletedGoalSnapshot {
  goal: Goal
  sessions: Session[]
}

export interface ApplyMonthReviewResult {
  /** In-memory copies of anything deleted — restoreDeletedGoal() can undo from these without re-reading Firestore (the whole point: it's already gone). */
  deleted: DeletedGoalSnapshot[]
}

/**
 * One batch for every goal's decision — carry-over creates the next month's
 * goal and marks this one "carried"; archive/abandon are a status flip;
 * delete removes the goal and every one of its sessions. Firestore batches
 * can't contain reads, so each delete's sessions are fetched up front, before
 * the batch is built, and handed back as the in-memory copy the "Undo" toast
 * needs (the whole point of doing this as a batch of deletes rather than a
 * soft-delete flag — there's nothing left in Firestore to reconstruct from).
 */
export async function applyMonthReviewDecisions({ uid, month, choices }: ApplyMonthReviewInput): Promise<ApplyMonthReviewResult> {
  if (uid === DEMO_UID) {
    const result = demoApplyMonthReviewDecisions(choices)
    invalidate(`goals:${uid}:${month}`)
    invalidate(`goals:${uid}:${nextMonth(month)}`)
    invalidate(`overdue-goals:${uid}`)
    invalidate(`year:${uid}:${month.slice(0, 4)}`)
    invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
    invalidate(`year-goals:${uid}:${nextMonth(month).slice(0, 4)}`)
    for (const { goal } of choices) {
      invalidate(`goal:${uid}:${goal.id}`)
      invalidate(`sessions:${uid}:${goal.id}`)
    }
    return result
  }

  const [db, { collection, doc, getDocs, query, serverTimestamp, where, writeBatch }] = await Promise.all([
    getFirebaseDb(),
    import('firebase/firestore'),
  ])

  const deleted: DeletedGoalSnapshot[] = []
  const sessionsToDelete = await Promise.all(
    choices
      .filter((choice) => choice.decision === 'delete')
      .map(async (choice) => {
        const sessionsSnap = await getDocs(query(collection(db, 'users', uid, 'sessions'), where('goalId', '==', choice.goal.id)))
        recordReads(sessionsSnap.docs.length)
        const sessions = sessionsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Session)
        deleted.push({ goal: choice.goal, sessions })
        return { goalId: choice.goal.id, sessions }
      }),
  )

  const batch = writeBatch(db)
  let batchWrites = 0

  for (const { goal, decision } of choices) {
    const goalRef = doc(db, 'users', uid, 'goals', goal.id)

    switch (decision) {
      case 'carryOver': {
        const carried = carryOverGoal(goal)
        const newGoalRef = doc(collection(db, 'users', uid, 'goals'))
        const newGoal: GoalData = {
          ...carried,
          createdAt: serverTimestamp() as GoalData['createdAt'],
          updatedAt: serverTimestamp() as GoalData['updatedAt'],
        }
        batch.set(newGoalRef, newGoal)
        batch.update(goalRef, { status: 'carried', updatedAt: serverTimestamp() })
        batchWrites += 2
        break
      }
      case 'archive':
        batch.update(goalRef, { status: 'archived', updatedAt: serverTimestamp() })
        batchWrites += 1
        break
      case 'abandon':
        batch.update(goalRef, { status: 'abandoned', updatedAt: serverTimestamp() })
        batchWrites += 1
        break
      case 'delete': {
        batch.delete(goalRef)
        batchWrites += 1
        const entry = sessionsToDelete.find((s) => s.goalId === goal.id)
        for (const session of entry?.sessions ?? []) {
          batch.delete(doc(db, 'users', uid, 'sessions', session.id))
          batchWrites += 1
        }
        break
      }
    }
  }

  await batch.commit()
  recordWrites(batchWrites)

  invalidate(`goals:${uid}:${month}`)
  invalidate(`goals:${uid}:${nextMonth(month)}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year:${uid}:${month.slice(0, 4)}`)
  invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
  invalidate(`year-goals:${uid}:${nextMonth(month).slice(0, 4)}`)
  for (const { goal } of choices) {
    invalidate(`goal:${uid}:${goal.id}`)
    invalidate(`sessions:${uid}:${goal.id}`)
  }

  return { deleted }
}

/** Undoes one deleted goal from its in-memory snapshot — re-creates the goal and every session doc with their original ids. */
export async function restoreDeletedGoal(uid: string, snapshot: DeletedGoalSnapshot): Promise<void> {
  if (uid === DEMO_UID) {
    demoRestoreDeletedGoal(snapshot)
    invalidate(`goals:${uid}:${snapshot.goal.month}`)
    invalidate(`goal:${uid}:${snapshot.goal.id}`)
    invalidate(`sessions:${uid}:${snapshot.goal.id}`)
    invalidate(`overdue-goals:${uid}`)
    invalidate(`year-goals:${uid}:${snapshot.goal.month.slice(0, 4)}`)
    return
  }

  const [db, { doc, writeBatch }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
  const batch = writeBatch(db)
  const { id: goalId, ...goalData } = snapshot.goal
  batch.set(doc(db, 'users', uid, 'goals', goalId), goalData satisfies GoalData)

  for (const session of snapshot.sessions) {
    const { id: sessionId, ...sessionData } = session
    batch.set(doc(db, 'users', uid, 'sessions', sessionId), sessionData satisfies SessionData)
  }

  await batch.commit()
  recordWrites(1 + snapshot.sessions.length)

  invalidate(`goals:${uid}:${snapshot.goal.month}`)
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`sessions:${uid}:${goalId}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year-goals:${uid}:${snapshot.goal.month.slice(0, 4)}`)
}
