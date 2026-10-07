import { getFirebaseDb } from '@/lib/firebase'
import { computeChunkProgress, minutesBanked } from '@/lib/chunks'
import { recordWrites } from '@/lib/firestoreDevCounter'
import { invalidate } from './cache'
import { DEMO_UID, demoCreateGoal, demoDeleteGoal, demoSetGoalStatus, demoUpdateGoalChunkMinutes, readDemoGoal } from './demo/store'
import type { GoalData, GoalStatus } from './types'

export interface CreateGoalInput {
  uid: string
  name: string
  /** "2026-10" */
  month: string
  totalMinutes: number
  chunkMinutes: number
  /** 0-30 hue shift within the accent green family */
  hue: number
  playlistNote?: string
}

export async function createGoal(input: CreateGoalInput): Promise<string> {
  if (input.uid === DEMO_UID) {
    const goalId = demoCreateGoal(input)
    invalidate(`goals:${input.uid}:${input.month}`)
    invalidate(`overdue-goals:${input.uid}`)
    invalidate(`year-goals:${input.uid}:${input.month.slice(0, 4)}`)
    return goalId
  }

  const [db, { collection, doc, serverTimestamp, setDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
  const goalRef = doc(collection(db, 'users', input.uid, 'goals'))

  const goal: GoalData = {
    name: input.name,
    month: input.month,
    totalMinutes: input.totalMinutes,
    chunkMinutes: input.chunkMinutes,
    completedChunks: 0,
    carryMinutes: 0,
    status: 'active',
    hue: input.hue,
    ...(input.playlistNote ? { playlistNote: input.playlistNote } : {}),
    createdAt: serverTimestamp() as GoalData['createdAt'],
    updatedAt: serverTimestamp() as GoalData['updatedAt'],
  }

  await setDoc(goalRef, goal)
  recordWrites(1)
  invalidate(`goals:${input.uid}:${input.month}`)
  invalidate(`overdue-goals:${input.uid}`)
  invalidate(`year-goals:${input.uid}:${input.month.slice(0, 4)}`)

  return goalRef.id
}

/**
 * Changing chunk size reflows the grid: completedChunks/carryMinutes are
 * recomputed from the total minutes actually banked so far (preserving real
 * progress) rather than just swapping the field, which would otherwise
 * leave completedChunks meaning a different amount of time than before.
 */
export async function updateGoalChunkMinutes(uid: string, goalId: string, newChunkMinutes: number): Promise<void> {
  if (uid === DEMO_UID) {
    const goal = readDemoGoal(goalId)
    if (!goal) return
    demoUpdateGoalChunkMinutes(goalId, newChunkMinutes)
    invalidate(`goal:${uid}:${goalId}`)
    invalidate(`goals:${uid}:${goal.month}`)
    return
  }

  const [db, { doc, runTransaction, serverTimestamp }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
  const goalRef = doc(db, 'users', uid, 'goals', goalId)

  const month = await runTransaction(db, async (tx) => {
    const snap = await tx.get(goalRef)
    if (!snap.exists()) return null
    const goal = snap.data() as GoalData

    const banked = minutesBanked(goal.completedChunks, goal.chunkMinutes, goal.carryMinutes)
    const { chunksAdded, newCarryMinutes } = computeChunkProgress(banked, newChunkMinutes, 0, 0, goal.totalMinutes)

    tx.update(goalRef, {
      chunkMinutes: newChunkMinutes,
      completedChunks: chunksAdded,
      carryMinutes: newCarryMinutes,
      updatedAt: serverTimestamp(),
    })
    recordWrites(1)

    return goal.month
  })

  if (month) {
    invalidate(`goal:${uid}:${goalId}`)
    invalidate(`goals:${uid}:${month}`)
  }
}

export async function setGoalStatus(uid: string, goalId: string, month: string, status: GoalStatus): Promise<void> {
  if (uid === DEMO_UID) {
    demoSetGoalStatus(goalId, status)
  } else {
    const [db, { doc, serverTimestamp, updateDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const goalRef = doc(db, 'users', uid, 'goals', goalId)
    await updateDoc(goalRef, { status, updatedAt: serverTimestamp() })
    recordWrites(1)
  }
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`goals:${uid}:${month}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
}

export async function deleteGoal(uid: string, goalId: string, month: string): Promise<void> {
  if (uid === DEMO_UID) {
    demoDeleteGoal(goalId)
  } else {
    const [db, { deleteDoc, doc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId))
    recordWrites(1)
  }
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`goals:${uid}:${month}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
}
