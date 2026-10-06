import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { invalidate } from './cache'
import type { SpendingData, SpendingEntry } from './types'

export interface AddSpendingInput {
  uid: string
  /** "2026-10-03" */
  date: string
  amount: number
  category: string
  note?: string
}

function invalidateSpendingMonth(uid: string, date: string) {
  invalidate(`spending:${uid}:${date.slice(0, 7)}`)
  invalidate(`year-spending:${uid}:${date.slice(0, 4)}`)
}

export async function addSpending({ uid, date, amount, category, note }: AddSpendingInput): Promise<string> {
  const entryRef = doc(collection(db, 'users', uid, 'spending'))
  const data: SpendingData = {
    date,
    amount,
    category,
    ...(note ? { note } : {}),
    createdAt: serverTimestamp() as SpendingData['createdAt'],
  }
  await setDoc(entryRef, data)
  invalidateSpendingMonth(uid, date)
  return entryRef.id
}

export async function deleteSpending(uid: string, entry: SpendingEntry): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'spending', entry.id))
  invalidateSpendingMonth(uid, entry.date)
}

/** Undo for deleteSpending — restores the exact doc (same id) from the in-memory copy captured before deletion. */
export async function restoreSpending(uid: string, entry: SpendingEntry): Promise<void> {
  const { id, ...data } = entry
  await setDoc(doc(db, 'users', uid, 'spending', id), data)
  invalidateSpendingMonth(uid, entry.date)
}
