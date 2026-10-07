import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Full layering audit (CLAUDE.md LAYERING RULES) — hit-testing via
 * `document.elementFromPoint`, not just visual screenshots, since that's
 * what actually proves an overlay is clickable and nothing beneath it is
 * accidentally receiving clicks. See the audit report for the real bug this
 * found (and the false alarm it ruled out along the way).
 */

async function enterDemoMode(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByText('hours studied this month')).toBeVisible()
}

/** True if elementFromPoint(x,y) is the locator's own element, or a descendant of it. */
async function pointResolvesInto(page: Page, x: number, y: number, locator: Locator): Promise<boolean> {
  const handle = await locator.elementHandle()
  if (!handle) return false
  const result = await page.evaluateHandle(
    ([px, py, el]) => {
      const hit = document.elementFromPoint(px, py)
      return hit === el || (el as Element).contains(hit)
    },
    [x, y, handle] as const,
  )
  return result.jsonValue()
}

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('locator has no bounding box — is it visible?')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Is the point over a real (non-inert) nav link/button, or is nav obscured/inert there? */
async function navInfoAt(page: Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      const hit = document.elementFromPoint(px, py)
      return {
        isNavLink: !!hit?.closest('nav a, nav button'),
        isInert: !!hit?.closest('[inert]'),
        tag: hit?.tagName ?? null,
      }
    },
    [x, y] as const,
  )
}

const VIEWPORTS = [
  { width: 375, height: 812, label: '375x812' },
  { width: 768, height: 1024, label: '768x1024' },
  { width: 1280, height: 800, label: '1280x800' },
  { width: 1920, height: 1080, label: '1920x1080' },
] as const

/** A point guaranteed to land on a real nav link/button at this viewport's active nav tier. */
function navProbePoint(width: number, height: number): { x: number; y: number } {
  if (width < 768) return { x: 30, y: height - 20 } // BottomTabBar
  if (width < 1024) return { x: 36, y: 100 } // SideRail
  return { x: 50, y: 300 } // Sidebar
}

for (const viewport of VIEWPORTS) {
  test.describe(`layering at ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('LogTimeSheet: Log button hit-tests correctly; nav is obscured/inert while open', async ({ page }) => {
      await enterDemoMode(page)
      const probe = navProbePoint(viewport.width, viewport.height)
      const before = await navInfoAt(page, probe.x, probe.y)
      expect(before.isNavLink, 'sanity check: nav link must be real and clickable before any overlay opens').toBe(true)

      await page.getByRole('button', { name: 'Log time' }).first().click()
      const logButton = page.getByRole('button', { name: 'Log', exact: true })
      await expect(logButton).toBeVisible()
      await page.waitForTimeout(400) // let vaul's slide-up (mobile) / spring (desktop) settle
      const { x, y } = await centerOf(logButton)
      expect(await pointResolvesInto(page, x, y, logButton)).toBe(true)

      const after = await navInfoAt(page, probe.x, probe.y)
      expect(after.isNavLink && !after.isInert, 'nav must not be a live clickable target while the sheet is open').toBe(false)
    })

    test('CommandPalette: primary item hit-tests correctly; nav is obscured/inert while open', async ({ page }) => {
      await enterDemoMode(page)
      const probe = navProbePoint(viewport.width, viewport.height)

      await page.keyboard.press('Control+k')
      const input = page.getByPlaceholder(/Log 25 min/)
      await expect(input).toBeVisible()
      await page.waitForTimeout(400)
      const { x, y } = await centerOf(input)
      expect(await pointResolvesInto(page, x, y, input)).toBe(true)

      const after = await navInfoAt(page, probe.x, probe.y)
      expect(after.isNavLink && !after.isInert).toBe(false)
    })
  })
}

test.describe('backdrop scrim regression (mobile sheets)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  // Real bug found by this audit: ResponsiveModal passes modal={false} to
  // vaul's Drawer.Root (so useOverlayLock stays the single source of truth
  // for scroll-lock instead of fighting vaul's own), but vaul's
  // Drawer.Overlay hard-codes `if (!modal) return null` — so every mobile
  // sheet in the app was rendering with zero dimming scrim. Background
  // content was still correctly unreachable via #app-root[inert], so this
  // was never a click-through bug, just a missing-visual one — easy to miss
  // with hit-testing alone, which is why this is a dedicated test.
  test('LogTimeSheet renders a backdrop scrim behind the drawer', async ({ page }) => {
    await enterDemoMode(page)
    await page.getByRole('button', { name: 'Log time' }).first().click()
    await expect(page.getByRole('button', { name: 'Log', exact: true })).toBeVisible()
    await page.waitForTimeout(300)

    const overlayRootFirstChild = await page.evaluate(() => {
      const root = document.getElementById('overlay-root')
      const el = root?.firstElementChild
      if (!el) return null
      const style = getComputedStyle(el)
      return { cls: el.className, bg: style.backgroundColor, opacity: style.opacity, position: style.position }
    })
    expect(overlayRootFirstChild).not.toBeNull()
    expect(overlayRootFirstChild?.position).toBe('fixed')
    expect(overlayRootFirstChild?.opacity).toBe('1')
    // bg-black/60 renders as an rgb(a)/oklab triplet depending on engine — just confirm it isn't transparent.
    expect(overlayRootFirstChild?.bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})

test.describe('stacked overlay combos (1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('toast renders above an open modal', async ({ page }) => {
    await enterDemoMode(page)
    await page.getByRole('button', { name: 'Log time' }).first().click()
    await expect(page.getByRole('button', { name: 'Log', exact: true })).toBeVisible()
    await page.waitForTimeout(300)

    await page.getByRole('button', { name: 'Log', exact: true }).click()
    const toast = page.locator('[data-sonner-toast]').first()
    await expect(toast).toBeVisible()
    await page.waitForTimeout(400) // let Sonner's slide-in settle before reading its box
    const { x, y } = await centerOf(toast)
    expect(await pointResolvesInto(page, x, y, toast)).toBe(true)
  })

  test('tooltip renders above a nested dialog + drawer (styleguide fixture)', async ({ page }) => {
    await page.goto('/styleguide')
    await page.getByRole('button', { name: /open stacked/i }).click()
    await expect(page.getByRole('button', { name: 'Open drawer' })).toBeVisible()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Open drawer' }).click()
    await expect(page.getByText('Drawer (z-modal)')).toBeVisible()
    await page.waitForTimeout(400)

    const tooltipTrigger = page.getByRole('button', { name: 'Show tooltip' })
    await tooltipTrigger.hover()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
    await page.waitForTimeout(300)
    const { x, y } = await centerOf(tooltip)
    expect(await pointResolvesInto(page, x, y, tooltip)).toBe(true)
  })

  test('EndSessionDialog (opened from inside Focus mode) hit-tests above Focus mode and the nav', async ({ page }) => {
    await enterDemoMode(page)
    await page.getByRole('link', { name: /^Chess / }).click()
    await page.getByRole('button', { name: 'Focus', exact: true }).click()
    await page.waitForTimeout(300)
    // Free mode (no target chunk count) so backdating the start time can never
    // auto-complete the session out from under this test — see the audit
    // report for how a 'fixed, 1 chunk' default session (the sheet's own
    // default) made this scenario impossible to reach at all.
    await page.getByRole('button', { name: 'Free' }).click()
    await page.getByRole('button', { name: 'Start focus session' }).click()
    await page.waitForTimeout(400)

    // Backdate startedAt instead of mocking Playwright's clock: page.clock
    // fast-forwarding past a running rAF/interval-heavy surface (ambient
    // WebGL background, Lenis, Motion's own scheduler) reliably hung this
    // app under test. Rewriting localStorage and letting real timers tick
    // is equivalent and doesn't touch the clock at all. Chess uses 5-minute
    // chunks, so 11 backdated minutes yields 2 completed chunks — enough to
    // cross FocusMode's `chunksAtStake > 1` confirm-dialog threshold.
    await page.evaluate(() => {
      const raw = localStorage.getItem('chunks:focus-session')
      if (!raw) throw new Error('no focus session in localStorage to backdate')
      const session = JSON.parse(raw)
      session.startedAt = Date.now() - 11 * 60 * 1000
      localStorage.setItem('chunks:focus-session', JSON.stringify(session))
    })
    await page.reload()
    await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeVisible()
    await page.waitForTimeout(600)

    await page.getByRole('button', { name: 'End session' }).click()
    const confirmDialog = page.getByRole('alertdialog')
    await expect(confirmDialog).toBeVisible()
    await page.waitForTimeout(300)

    const keepGoing = confirmDialog.getByRole('button', { name: 'Keep going' })
    const { x, y } = await centerOf(keepGoing)
    expect(await pointResolvesInto(page, x, y, keepGoing)).toBe(true)

    // Nothing at the nav's location should be a live, clickable nav link —
    // both Focus mode's own z-modal screen and the confirm dialog on top of
    // it must fully cover/obscure the sidebar underneath.
    const navHit = await navInfoAt(page, 50, 300)
    expect(navHit.isNavLink).toBe(false)
  })
})

test.describe('stacked overlay combos (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('drawer renders above the bottom nav on mobile', async ({ page }) => {
    await enterDemoMode(page)
    await page.getByRole('button', { name: 'Log time' }).first().click()
    await expect(page.getByRole('button', { name: 'Log', exact: true })).toBeVisible()
    await page.waitForTimeout(400)

    const info = await page.evaluate(() => {
      const el = document.elementFromPoint(190, 795)
      return { isInsideNav: !!el?.closest('nav'), isInsideModal: !!el?.closest('.z-modal') }
    })
    expect(info.isInsideNav).toBe(false)
    expect(info.isInsideModal).toBe(true)
  })
})

test.describe('scroll locking', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('page scroll is locked while a modal is open, and restored after close', async ({ page }) => {
    await enterDemoMode(page)
    // Establish a non-zero baseline to preserve. Driven via scrollTo rather
    // than a synthetic wheel event — deterministic regardless of Lenis's
    // RAF-smoothed interception of real wheel input.
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(400)
    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Log time' }).first().click()
    await expect(page.getByRole('button', { name: 'Log', exact: true })).toBeVisible()
    await page.waitForTimeout(300)

    const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow)
    expect(bodyOverflow).toBe('hidden')

    // A real user gesture (wheel), not a programmatic scrollTo: overflow:
    // hidden on body blocks native scroll input, but window.scrollTo still
    // physically moves document.scrollingElement regardless of overflow —
    // confirmed by a throwaway check, so asserting against scrollTo here
    // would pass even with no lock at all. Wheel is the real test.
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, -600)
    await page.waitForTimeout(500)
    const scrollDuringLock = await page.evaluate(() => window.scrollY)
    expect(scrollDuringLock).toBe(scrollBefore)

    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Log', exact: true })).not.toBeVisible()
    await page.waitForTimeout(300)

    const bodyOverflowAfter = await page.evaluate(() => getComputedStyle(document.body).overflow)
    expect(bodyOverflowAfter).not.toBe('hidden')
    const scrollAfter = await page.evaluate(() => window.scrollY)
    expect(scrollAfter).toBe(scrollBefore)

    // Lenis (if present) must resume: a wheel event now should move the page again.
    await page.mouse.move(640, 400)
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(800)
    const scrollAfterResume = await page.evaluate(() => window.scrollY)
    expect(scrollAfterResume).not.toBe(scrollAfter)
  })
})

test.describe('shared-element goal card morph', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('the morphing card is never rendered under the nav', async ({ page }) => {
    await enterDemoMode(page)

    const link = page.getByRole('link', { name: /^French / })
    await link.click()

    // Sample the bottom nav strip repeatedly through the animation window
    // (Motion's layout/layoutId spring typically settles within ~300-500ms)
    // rather than only checking the settled end state.
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(30)
      const info = await page.evaluate(() => {
        const points: [number, number][] = [[30, 795], [190, 795], [340, 795]]
        return points.map(([x, y]) => {
          const el = document.elementFromPoint(x, y)
          return { isNavOrUnobscured: !!el?.closest('nav'), isRaisedCard: !!el?.closest('.z-raised') }
        })
      })
      // At no sampled frame should an element carrying the morph's z-raised
      // class be sitting where the nav strip is — it must never visually
      // climb above nav (z-raised=10 < z-nav=200 by design).
      for (const point of info) {
        expect(point.isRaisedCard).toBe(false)
      }
    }

    await expect(page).toHaveURL(/\/goals\//)
  })
})
