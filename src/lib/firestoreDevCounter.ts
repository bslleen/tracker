/**
 * Dev-only Firestore read/write tally, reset once per page load. Every
 * src/data/*.ts hook/write function calls recordReads()/recordWrites() right
 * next to its actual getDoc/getDocs/setDoc/updateDoc/deleteDoc/batch/
 * transaction call — see CLAUDE.md's Firestore cost budget ("~25 reads
 * cold, ~0 warm" for the dashboard). A no-op in production builds.
 */
const isDev = import.meta.env.DEV

let reads = 0
let writes = 0
let logScheduled = false

function scheduleLog() {
  if (!isDev || logScheduled) return
  logScheduled = true
  // Coalesced to one line per tick, however many calls land in between —
  // a page's hooks typically fire several reads within the same microtask burst.
  queueMicrotask(() => {
    console.info(`[firestore] reads=${reads} writes=${writes} (this page load so far)`)
    logScheduled = false
  })
}

export function recordReads(count: number): void {
  if (!isDev) return
  reads += count
  scheduleLog()
}

export function recordWrites(count: number): void {
  if (!isDev) return
  writes += count
  scheduleLog()
}

export function getFirestoreDevCounts(): { reads: number; writes: number } {
  return { reads, writes }
}
