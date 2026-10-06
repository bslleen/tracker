import { collection, deleteDoc, doc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { computeChunkProgress, minutesBanked } from '@/lib/chunks'
import { invalidate } from './cache'
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

    return goal.month
  })

  if (month) {
    invalidate(`goal:${uid}:${goalId}`)
    invalidate(`goals:${uid}:${month}`)
  }
}

export async function setGoalStatus(uid: string, goalId: string, month: string, status: GoalStatus): Promise<void> {
  const goalRef = doc(db, 'users', uid, 'goals', goalId)
  await updateDoc(goalRef, { status, updatedAt: serverTimestamp() })
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`goals:${uid}:${month}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
}

export async function deleteGoal(uid: string, goalId: string, month: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'goals', goalId))
  invalidate(`goal:${uid}:${goalId}`)
  invalidate(`goals:${uid}:${month}`)
  invalidate(`overdue-goals:${uid}`)
  invalidate(`year-goals:${uid}:${month.slice(0, 4)}`)
}
