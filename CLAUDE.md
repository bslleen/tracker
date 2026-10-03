# Chunks — project brief

## Product
A self-learning tracker. A user creates goals (e.g. "French", "Algebra", "Chess"). Each goal has: a name, total hours, a chunk size (5, 10, 15, 30, 60 minutes, or custom), and a month. Total minutes / chunk size = number of chunks, shown as a grid of small squares. Studying fills squares. At the end of the month each goal is shown as a filled grid with a percentage, and the user chooses per goal: Carry over (unfinished chunks move to next month), Archive (keep the result, default), or Delete (confirm first). A goal can also be archived as "abandoned". Secondary trackers: sleep and spending. A "Year in review" story (Spotify-Wrapped style) summarizes everything.

## Stack
Vite, React 18+, TypeScript (strict), Tailwind CSS, Motion (framer-motion, import from "motion/react"), Radix UI primitives, vaul (mobile drawers), Sonner (toasts), cmdk (command palette), Lenis (smooth scroll), visx or D3 for charts, Firebase v10+ modular SDK (Auth + Firestore only). No Cloud Functions, no Cloud Storage (free Spark plan). Deploy target: Vercel static (Vite) build.

## Design principles
1. Minimal and calm. One idea per screen. Generous empty space. Never crowded.
2. ONE accent color (green). Everything else is gray. Subjects differ only by a slight shade/opacity shift of the same green family.
3. Big, confident typography: one giant numeral per screen, at most two other text sizes.
4. Motion is physical (springs), purposeful (only on meaningful events), and never blocks interaction. Respect prefers-reduced-motion everywhere.
5. Empty things stay quiet (gray). Completed things glow. Progress must feel earned.
6. It must feel as good on a 375px phone as on a 1920px monitor: adaptive, not merely "shrunk".

## Palette (defined once in src/styles/tokens.css, never hardcode colors elsewhere)
- --bg: #0B0D0E
- --surface: #14171A
- --surface-2: #1B1F23
- --chunk-empty: #23282D
- --text: #E8EAEC
- --text-2: #7C858D
- --accent: #4ADE80 (glow = accent at 30% alpha)
- --streak: #FB923C (tiny, rare use only)
- --danger: #F87171 (only for destructive actions)

## LAYERING RULES (strict, read twice)
The #1 bug source in this project would be stacking/z-index problems. These rules are mandatory:
1. z-index is NEVER written as a raw number in components. Only the tokens below, via CSS variables / Tailwind theme keys (z-raised, z-sticky, z-nav, z-dropdown, z-overlay, z-modal, z-toast, z-tooltip, z-cursor). Arbitrary values like z-[9999] are forbidden. CI script scripts/check-z-index.mjs enforces this.
2. Token scale: base 0 · raised 10 · sticky 100 · nav 200 · dropdown 300 · overlay 400 · modal 500 · toast 600 · tooltip 700 · cursor 800. Background layer is -1 inside its own root.
3. DOM has fixed sibling roots in index.html, in this order: #bg-root, #app-root, #overlay-root, #toast-root. Everything that floats (modals, drawers, popovers, dropdowns, tooltips, command palette, focus mode, story mode, toasts) renders into a portal in #overlay-root or #toast-root, NEVER inside a page component's subtree.
4. #app-root has `isolation: isolate` so page content can never fight with portals.
5. A stacking context is created by: transform, filter, backdrop-filter, opacity < 1, will-change, perspective, contain: paint, mix-blend-mode, isolation: isolate, position fixed/sticky. Never put `position: fixed` UI inside an element that has an animated transform/filter/backdrop-filter (a transformed ancestor becomes the containing block for fixed children and breaks them). Navigation and any fixed UI live OUTSIDE page-transition wrappers.
6. Page transition wrappers may animate transform/opacity only on the page content region, never on a wrapper that contains nav, overlays or portals.
7. All Radix portals receive `container={document.getElementById('overlay-root')}` through a shared <OverlayPortal> helper. Sonner's Toaster is mounted in #toast-root with tokenized z-index.
8. Backdrop-blur is used sparingly (max 1 or 2 elements visible at once) because it creates stacking contexts and is expensive.
9. When any overlay opens: lock body scroll, call lenis.stop(), trap focus, make #app-root `inert`. On close, undo all of it.
10. Shared-element (layoutId) transitions: the expanding element temporarily gets the `raised` token; the final expanded view lives in #overlay-root.

## ADAPTIVE RULES (strict)
1. Mobile-first. Breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1536. Content max width 1200px, centered.
2. Navigation: bottom tab bar under md (with env(safe-area-inset-bottom)), slim left rail from md to lg, full sidebar with labels from lg up.
3. Use dvh/svh (never plain vh) for full-height layouts. Respect safe-area insets on notched phones.
4. Fluid typography with clamp(). Giant numerals scale from ~56px (phone) to ~160px (desktop).
5. Use container queries (@container) for components that live in varying widths (goal cards, chunk grid, charts), not only viewport breakpoints.
6. Modals: a single <ResponsiveModal> component renders a vaul bottom-sheet drawer on touch/narrow screens and a centered Radix Dialog on md+. Same content, same API.
7. Touch targets >= 44x44px for buttons. Chunk squares are smaller, so every square has an invisible enlarged hit area, and mobile has a big "Log time" button as the primary way to fill chunks.
8. Hover-only interactions must have a touch equivalent. Nothing important is hover-only.
9. No horizontal page scroll at any width from 320px to 2560px.
10. Support landscape phones and tablets: the layout must not break at 667x375 or 1024x768.

## Code rules
- TypeScript strict, no `any`. Small components. Feature folders: src/features/{goals,sessions,focus,month,heatmap,sleep,spending,review}.
- All Firestore access goes through hooks in src/data/. Components never import firebase directly.
- Free-tier discipline: no onSnapshot on large collections; fetch once per session and cache; batch writes; denormalize (see data model in Phase 4).
- Every animation has a reduced-motion fallback (instant state change).
- Every interactive element is keyboard reachable with a visible focus ring in the accent color.

## Definition of done for any UI task
Checked at 375, 768, 1280 and 1920 px: no overlap, no clipped content, no horizontal scroll, overlays always above everything and clickable, reduced-motion works, focus order sensible.
