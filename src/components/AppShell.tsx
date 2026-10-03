import { AnimatedRoutes } from './AnimatedRoutes'
import { Navigation } from './navigation/Navigation'

/**
 * Three regions inside #app-root, nothing else: Navigation, the scrolling
 * <main>, and that's it. All floating UI portals out via #overlay-root /
 * #toast-root (CLAUDE.md LAYERING RULES #3).
 */
export function AppShell() {
  return (
    <>
      <Navigation />
      <main
        className="mx-auto min-h-dvh max-w-[1200px] px-[var(--gutter)] pt-[var(--gutter)] pb-[calc(var(--nav-bottom-height)+env(safe-area-inset-bottom)+var(--gutter))] md:pb-[var(--gutter)] md:pl-[calc(var(--nav-rail-width)+var(--gutter))] lg:pl-[calc(var(--nav-sidebar-width)+var(--gutter))]"
      >
        <AnimatedRoutes />
      </main>
    </>
  )
}
