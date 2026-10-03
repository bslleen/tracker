# Chunks

A self-learning tracker. See [CLAUDE.md](./CLAUDE.md) for the full product brief and conventions.

## Setup

```
npm install
cp .env.example .env.local   # fill in your Firebase project's web config
npm run dev
```

## Firebase

Auth (Google + anonymous) and Firestore only — no Cloud Functions, no Cloud
Storage (free Spark plan). Firestore access goes through the hooks in
`src/data/`; components never import `firebase/*` directly.

### Deploying `firestore.rules` and `firestore.indexes.json`

1. Install the CLI once: `npm install -g firebase-tools`.
2. Link this directory to your Firebase project (one time): `firebase login`, then `firebase use --add` and pick the project matching `VITE_FIREBASE_PROJECT_ID`.
3. Deploy the rules:
   ```
   firebase deploy --only firestore:rules
   ```
4. Deploy the composite index the `useSessions` query needs (`goalId` ==, `date` desc):
   ```
   firebase deploy --only firestore:indexes
   ```
   Both can be deployed together with `firebase deploy --only firestore`.

Rules enforce that a user can only read/write their own `users/{uid}`
subtree, and validate the shape of goal, session, and spending writes
(allowed `status`/`chunkMinutes` values, numeric ranges, no unknown fields).
