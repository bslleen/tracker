import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { invalidate } from './cache'
import type { GoalData } from './types'

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

  return goalRef.id
}
