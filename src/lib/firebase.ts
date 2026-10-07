import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * firebase/app + firebase/auth + firebase/firestore together are ~180KB
 * gzipped — a lot to force into the initial bundle for a demo-mode visitor
 * who may never make a single real Firebase call. Every src/data/*.ts
 * hook/write function already runs inside an async fetcher (useCachedQuery)
 * or is itself async, so importing firebase/* dynamically — only from
 * inside the non-demo branch of each one — moves the whole SDK into its own
 * chunk that's fetched the first time something actually needs it, never
 * for a pure demo session. See DEMO_UID branches throughout src/data/.
 */
let appPromise: Promise<FirebaseApp> | null = null
function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp }) => initializeApp(firebaseConfig))
  }
  return appPromise
}

let authPromise: Promise<Auth> | null = null
export function getFirebaseAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = Promise.all([getFirebaseApp(), import('firebase/auth')]).then(([app, { getAuth }]) => getAuth(app))
  }
  return authPromise
}

let dbPromise: Promise<Firestore> | null = null
// Persistent local cache (IndexedDB) with multi-tab synchronization: repeat
// visits and additional tabs are served from cache instead of re-reading
// from Firestore, which matters on the free Spark plan's read quota.
export function getFirebaseDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = Promise.all([getFirebaseApp(), import('firebase/firestore')]).then(
      ([app, { initializeFirestore, persistentLocalCache, persistentMultipleTabManager }]) =>
        initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }),
    )
  }
  return dbPromise
}
