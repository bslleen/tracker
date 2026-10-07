import { getFirebaseDb } from '@/lib/firebase'
import { recordWrites } from '@/lib/firestoreDevCounter'
import { invalidate } from './cache'
import { DEMO_UID, demoAddSpending, demoDeleteSpending, demoRestoreSpending } from './demo/store'
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
  if (uid === DEMO_UID) {
    const id = demoAddSpending({ date, amount, category, note })
    invalidateSpendingMonth(uid, date)
    return id
  }

  const [db, { collection, doc, serverTimestamp, setDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
  const entryRef = doc(collection(db, 'users', uid, 'spending'))
  const data: SpendingData = {
    date,
    amount,
    category,
    ...(note ? { note } : {}),
    createdAt: serverTimestamp() as SpendingData['createdAt'],
  }
  await setDoc(entryRef, data)
  recordWrites(1)
  invalidateSpendingMonth(uid, date)
  return entryRef.id
}

export async function deleteSpending(uid: string, entry: SpendingEntry): Promise<void> {
  if (uid === DEMO_UID) {
    demoDeleteSpending(entry.id)
  } else {
    const [db, { deleteDoc, doc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    await deleteDoc(doc(db, 'users', uid, 'spending', entry.id))
    recordWrites(1)
  }
  invalidateSpendingMonth(uid, entry.date)
}

/** Undo for deleteSpending — restores the exact doc (same id) from the in-memory copy captured before deletion. */
export async function restoreSpending(uid: string, entry: SpendingEntry): Promise<void> {
  if (uid === DEMO_UID) {
    demoRestoreSpending(entry)
  } else {
    const [db, { doc, setDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const { id, ...data } = entry
    await setDoc(doc(db, 'users', uid, 'spending', id), data)
    recordWrites(1)
  }
  invalidateSpendingMonth(uid, entry.date)
}
