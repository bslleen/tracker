# Chunks

A self-learning tracker. See [CLAUDE.md](./CLAUDE.md) for the full product brief and conventions.

## Setup

```
npm install
cp .env.example .env.local   # fill in your Firebase project's web config
npm run dev
```

No Firebase project yet? Click **"Try the demo"** on the sign-in screen instead — see "Demo mode" below. It needs no `.env.local` at all.

## Demo mode

"Try the demo" on the sign-in screen seeds a deterministic in-memory dataset
(same seed every load — see `src/data/demo/generator.ts`) and makes **zero**
Firebase calls: every hook and write function in `src/data/*.ts` branches on
`uid === DEMO_UID` before ever touching `firebase/auth` or
`firebase/firestore`, both of which are dynamically imported (`import(...)`)
specifically so a demo session never even downloads that code (see
"Bundle analysis" below). Logging time, creating goals, Focus Mode, the
month-end flow, and Year in Review all work normally against the in-memory
store; nothing is saved past the browser tab.

Signing in from inside demo mode (the banner's "Sign in" button) exits demo
mode immediately and offers a one-click "Import your demo goals" toast,
which copies the demo goals into the new real account via one Firestore
batch (`src/data/demo/convert.ts`) — session/month/sleep/spending history is
intentionally not imported, just the goals themselves.

## Firebase

Auth (Google + anonymous) and Firestore only — no Cloud Functions, no Cloud
Storage (free Spark plan). Firestore access goes through the hooks in
`src/data/`; components never import `firebase/*` directly, and every one of
those hooks imports `firebase/auth`/`firebase/firestore` **dynamically**
(not at the top of the file), so the ~180KB (gzipped) SDK never loads for a
page that doesn't end up needing it — see `src/lib/firebase.ts`.

### Creating a Firebase project (first-time setup)

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it anything (e.g. "chunks-prod").
2. **Build → Authentication → Get started.** Enable two sign-in providers:
   - **Google** — toggle on, pick a support email.
   - **Anonymous** — toggle on (this is the "Try it first" guest option).
3. **Build → Firestore Database → Create database.** Choose **Production mode** (locked down by default; `firestore.rules` below is what actually opens it back up, scoped per-user) and a nearby region.
4. **Project settings (gear icon) → General → Your apps → Add app → Web.** Register the app (no hosting setup needed) — copy the `firebaseConfig` object it shows you into `.env.local` (see `.env.example` for the exact variable names; they map 1:1 to `apiKey`/`authDomain`/etc).
5. Once you have a Vercel URL (see "Deploying to Vercel" below): **Authentication → Settings → Authorized domains → Add domain** and add the `*.vercel.app` URL (and your custom domain, if any) — Google sign-in rejects popups from unauthorized origins.

### Deploying `firestore.rules` and `firestore.indexes.json`

1. Install the CLI once: `npm install -g firebase-tools` (or use the one already in this repo's devDependencies via `npx firebase`).
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

**Firebase web config values (`VITE_FIREBASE_API_KEY` etc.) are not
secrets** — they identify which Firebase project a client talks to, the same
way a URL does, and are visible in any deployed app's JS bundle by design.
Real security comes entirely from `firestore.rules`; that's what's actually
worth reviewing/testing (see below), not the env vars.

### Testing the rules against a real emulator

```
npm run test:rules
```

This starts the Firestore emulator (`firebase emulators:exec`), runs
`firestore-rules/firestore.rules.test.ts` against it with
`@firebase/rules-unit-testing` (real rules engine, not a reimplementation),
then tears the emulator down. 18 cases, all passing: user A can't read or
write user B's goals/sessions/spending/month docs, unauthenticated requests
are rejected, sessions are immutable after creation, and invalid shapes
(unknown fields, missing required fields, bad `status`, `completedChunks`
over the goal's max, `carryMinutes >= chunkMinutes`, negative amounts,
`minutes` out of range) are all rejected while valid writes succeed.
Requires Java (for the emulator) — already on most dev machines; CI should
install a JDK before this step.

## Deploying to Vercel

1. Import the repo in Vercel (framework preset: Vite — build command `npm run build`, output directory `dist`). `vercel.json` already has the SPA rewrite (`/* → /index.html`, so client-side routes like `/goals/123` don't 404 on refresh) and long-term `immutable` caching for the content-hashed `/assets/*` files Vite produces.
2. **Project Settings → Environment Variables** — add all six, exactly as named in `.env.example`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
3. Deploy, then go back to Firebase's **Authentication → Settings → Authorized domains** and add the Vercel URL (step 5 above) — Google sign-in will otherwise fail on the live site with an unauthorized-domain error.
4. Demo mode needs none of this — "Try the demo" works on a build with no env vars set at all, which is also exactly what `e2e/demo-mode.spec.ts`'s "no Firebase calls" assertion exercises.

## Free-tier (Spark plan) budget

Firestore's free tier is 50K reads / 20K writes / 1GB storage per day. A
dev-only counter (`src/lib/firestoreDevCounter.ts`, logs to the console,
compiled out of production via `import.meta.env.DEV`) tallies every real
`getDoc`/`getDocs`/transaction/batch call per page load — every hook and
write function in `src/data/*.ts` calls `recordReads`/`recordWrites` right
next to its actual Firestore call.

**Measured** (not estimated) against the real Firestore emulator, seeded
with a dataset shaped like the demo's own 6 goals, 0 overdue:

| Scenario | Reads | Writes |
|---|---|---|
| Dashboard, cold (fresh tab, nothing cached) | **8** | 0 |
| Dashboard, warm (same tab, `useCachedQuery` cache hit) | **0** | 0 |
| Logging one session | 0 (demo) / 1 (real, inside the transaction) | 3 |

8 cold reads breaks down as: `useGoals` (6, one per active goal this month),
`useMonthSummary` × 2 (current + previous month, 1 each) — comfortably under
the ~25-read budget even with more goals or a backlog of overdue ones.
"Warm" is 0 by construction: `useCachedQuery` (`src/data/useCachedQuery.ts`)
never calls its fetcher again for a key already in `src/data/cache.ts`'s
in-memory map, and Firestore's own `persistentLocalCache` (IndexedDB) means
even a hard page reload re-reading the same docs can be served from local
cache rather than the network, depending on staleness — see
`src/lib/firebase.ts`.

## Bundle analysis

`npm run build` writes `dist/bundle-stats.html` (via
`rollup-plugin-visualizer`, treemap view, gzip + brotli sizes) — open it
after any build to see the real breakdown.

The single largest fix applied here: `firebase/auth` + `firebase/firestore`
(~180KB gzipped combined) used to load as part of the main entry bundle for
every visitor, demo or not. `src/lib/firebase.ts`'s `getFirebaseAuth()` /
`getFirebaseDb()` and every `src/data/*.ts` hook/write function now import
them with a dynamic `import('firebase/auth')` / `import('firebase/firestore')`
**inside** the non-demo branch, so Rollup splits them into their own chunks
that only load the first time something real actually needs them. Also
lazy: the ambient WebGL background (`src/components/LazyAmbientBackgroundPortal.tsx`,
React.lazy — decorative, must never compete with real content for the
initial bundle), `html-to-image` (dynamically imported inside the Share
button's click handler in both `useMonthShare.ts` and `useReviewShare.ts` —
most visits to Month Review / Year in Review never click Share), and every
route's page component (already `React.lazy` per-route in
`src/components/AnimatedRoutes.tsx`, which is what keeps `visx` charts and
the Year in Review story/share-card machinery out of pages that don't use
them).

Initial JS for `/` (gzipped, measured from a real build): **~212KB** —
down from ~380KB before the Firebase split. Slightly over the ~200KB
"if possible" target; the remainder is React + Router + Motion + the shared
UI primitives, all genuinely needed for first paint.

## Accessibility audit

Contrast was checked by computing real WCAG ratios from the actual hex
values in `src/styles/tokens.css` (not eyeballing them) — one real failure
turned up: `--text-2` on `--surface-2` (the Kbd keyboard-hint chips, the
demo banner) measured 4.42:1, just under the 4.5:1 AA floor for normal-size
text. Fixed by nudging `--text-2` from `#7C858D` to `#7F8890` (a hair
lighter, visually indistinguishable) — now ≥4.6:1 against `bg`, `surface`,
and `surface-2` all three. `--accent` on `bg`/`surface` (11.2:1 / 10.3:1)
and `--danger`/`--streak` on `bg` (7.0:1 / 8.6:1) were already comfortably
over.

An automated `@axe-core/playwright` pass across every route and overlay
(Dashboard, Heatmap, Sleep, Spending, Settings, Year in Review, Month
Review, GoalDetail, the New Goal wizard, Log Time sheet, Focus Mode, the
command palette, the 404 page) found three real issues, all fixed:

- **Chunk grid** (`ChunkGrid`/`ChunkCell`): the interactive grid used
  `role="grid"`/`role="gridcell"`, which requires an intervening
  `role="row"` per visual row — this grid lays cells out via CSS Grid as a
  flat DOM list (arrow-key navigation and the pointer-proximity hover effect
  both index straight into `gridRef.current.children`), so adding row
  wrappers would have meant rewriting that indexing throughout. Switched to
  `role="listbox"`/`role="option"` instead — no row requirement, and
  `aria-selected` (already set per cell for "is this chunk filled") is
  exactly the right property for that role. Re-verified by hand afterward:
  arrow keys still move focus cell-to-cell and Space still toggles fill.
- **Heatmap calendar**: the scrollable grid container had `role="img"`
  while actually containing real `<button>` cells — `img` forbids
  interactive descendants. Changed to `role="group"` and added a
  visually-hidden (`sr-only`) plain-text summary of the active-day/streak
  counts directly on the grid, on top of the already-visible stats above it.
- **New Goal wizard's step indicator**: `role="progressbar"` with no
  accessible name. Added `aria-label="Step N of 3"`.

### Keyboard: focus restore + Escape

Two real keyboard-accessibility bugs turned up manually exercising every
overlay with a keyboard only (`e2e/a11y.spec.ts` now guards both):

- **Focus wasn't restored on close, anywhere.** Neither Radix Dialog nor
  vaul's Drawer do this automatically unless the trigger is their own
  `<Trigger>` component — every trigger in this app is a plain button
  rendered well outside the dialog tree (a sidebar button, a command
  palette item), so that mechanism never engaged; closing any sheet dropped
  focus to `<body>`. Fixed once, in the shared `ResponsiveModal` (every
  sheet/dialog in the app goes through it): capture `document.activeElement`
  and restore it on close. The capture can't happen in a `useEffect` —
  content with its own `autoFocus` (the command palette's search input)
  steals focus during the commit phase, before any passive effect runs, so
  a `useEffect`-based capture was silently recording the stolen focus
  instead of the real trigger. Capturing during render instead (the same
  "did a prop just change" pattern already used elsewhere for resetting a
  sheet's form state) runs before the update even commits, while focus is
  still wherever it was.
- **`DeleteGoalConfirmDialog` ignored Escape entirely.** Unlike the sheets
  (built on Radix Dialog, which wires DismissableLayer's Escape handling
  for free), the two simple yes/no confirm dialogs (`EndSessionDialog`,
  `DeleteGoalConfirmDialog`) are plain `AnimatePresence`-driven divs with no
  Radix primitive underneath, so neither inherits that. `EndSessionDialog`
  happened to work anyway (Focus Mode's own Escape handler toggles it open
  independently), but `DeleteGoalConfirmDialog` had no keyboard dismissal
  at all. Fixed with a scoped `keydown` listener, active only while open,
  calling the non-destructive `onCancel`.

## Performance (Lighthouse)

```
npm run build && npm run preview -- --port 4173
npx lighthouse http://localhost:4173 --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless"
```

Measured against the local preview build in this sandbox:

| Category | Score |
|---|---|
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |
| Performance (simulated mobile throttling) | 79 |
| Performance (observed/real timing, `--throttling-method=provided`) | **100** |

CLS is **0** and Total Blocking Time is **0ms** in both runs — the
font-fallback work (`src/styles/font-fallback.css`) and route-level code
splitting are doing their job. The gap between the two Performance numbers
is `vite preview`'s local server latency (~340ms, measured) getting
multiplied by Lighthouse's simulated mobile-4G throttling model — an
artifact of testing against a bare local server rather than a real CDN edge
(Vercel's). **Re-run Lighthouse against the actual deployed Vercel URL** for
a representative simulated-throttling score; the observed-timing run (100)
is the more honest signal for how fast the app itself actually is.

## Final checklist

- [x] `npm run build` — passes
- [x] `npm run lint` (ESLint + `scripts/check-z-index.mjs`) — passes
- [x] `npm test` (Vitest, 189 tests) — passes
- [x] `npx playwright test` (82 e2e tests — `e2e/demo-mode.spec.ts` + `e2e/a11y.spec.ts` + the rest) — passes
- [x] `npm run test:smoke` (Playwright against the actual production build + `vite preview`, not dev server) — passes
- [x] `npm run test:rules` (18 Firestore rules tests against the real emulator) — passes
- [x] Lighthouse mobile — Accessibility 100, Best Practices 100, SEO 100, Performance 100 (observed) / 79 (simulated, local-server-latency-skewed — see above)
- [x] Bundle — `dist/bundle-stats.html`; ~212KB gzip initial JS for `/`
