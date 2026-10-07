import { getFirebaseDb } from '@/lib/firebase'
import { recordWrites } from '@/lib/firestoreDevCounter'
import { invalidate } from './cache'
import { DEMO_UID, demoLogSleep } from './demo/store'
import type { SleepEntry } from './types'

/**
 * Written via a dotted field path (`sleep.${day}`), not a nested object — the
 * same reasoning as sessionWrites.ts's day totals: `merge: true` only
 * shallow-merges top-level keys, so a nested `{ sleep: { [day]: entry } }`
 * would silently replace the whole `sleep` map instead of merging into it.
 */
export async function logSleep(uid: string, month: string, day: string, entry: SleepEntry): Promise<void> {
  if (uid === DEMO_UID) {
    demoLogSleep(month, day, entry)
  } else {
    const [db, { doc, setDoc }] = await Promise.all([getFirebaseDb(), import('firebase/firestore')])
    const monthRef = doc(db, 'users', uid, 'months', month)
    await setDoc(monthRef, { [`sleep.${day}`]: entry }, { merge: true })
    recordWrites(1)
  }
  invalidate(`month:${uid}:${month}`)
  invalidate(`year:${uid}:${month.slice(0, 4)}`)
}
