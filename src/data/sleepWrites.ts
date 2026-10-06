import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { invalidate } from './cache'
import type { SleepEntry } from './types'

/**
 * Written via a dotted field path (`sleep.${day}`), not a nested object — the
 * same reasoning as sessionWrites.ts's day totals: `merge: true` only
 * shallow-merges top-level keys, so a nested `{ sleep: { [day]: entry } }`
 * would silently replace the whole `sleep` map instead of merging into it.
 */
export async function logSleep(uid: string, month: string, day: string, entry: SleepEntry): Promise<void> {
  const monthRef = doc(db, 'users', uid, 'months', month)
  await setDoc(monthRef, { [`sleep.${day}`]: entry }, { merge: true })
  invalidate(`month:${uid}:${month}`)
  invalidate(`year:${uid}:${month.slice(0, 4)}`)
}
