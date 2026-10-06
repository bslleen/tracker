import { CommandPalette } from '@/components/CommandPalette'
import { FocusMode } from '@/features/focus/FocusMode'
import { FocusStartSheet } from '@/features/focus/FocusStartSheet'
import { AnimatedRoutes } from './AnimatedRoutes'
import { Navigation } from './navigation/Navigation'

/**
 * Three regions inside #app-root, nothing else: Navigation, the scrolling
 * <main>, and that's it. All floating UI portals out via #overlay-root /
 * #toast-root (CLAUDE.md LAYERING RULES #3). FocusMode/FocusStartSheet/
 * CommandPalette are mounted once here (not inside individual pages) since
 * they're triggered from several unrelated trees and must render above
 * everything including Navigation, regardless of which page is active.
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
      <CommandPalette />
      <FocusStartSheet />
      <FocusMode />
    </>
  )
}
