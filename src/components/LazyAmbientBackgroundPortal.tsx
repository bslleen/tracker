import { lazy, Suspense } from 'react'

// Its own chunk, mounted after first paint — the raw-WebGL shader is
// decorative (CLAUDE.md LAYERING RULES #3: pointer-events none, never
// overlaps content) and must never compete with real page content for the
// initial bundle/LCP.
const AmbientBackgroundPortal = lazy(() =>
  import('./AmbientBackgroundPortal.tsx').then((m) => ({ default: m.AmbientBackgroundPortal })),
)

export function LazyAmbientBackgroundPortal() {
  return (
    <Suspense fallback={null}>
      <AmbientBackgroundPortal />
    </Suspense>
  )
}
