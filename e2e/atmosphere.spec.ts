import { expect, test } from '@playwright/test'

/**
 * Exercises the ambient background, Lenis scroll-reset, and the rebuilt
 * command palette against the real app shell (not a /styleguide/* fixture —
 * these are AppShell-level concerns: Sidebar, #bg-root, cross-page global
 * stores). Demo mode (a sessionStorage flag flipped by AuthGate's "Try the
 * demo" button) gets past the sign-in gate without a real Firebase project
 * behind this dev environment's placeholder env vars — see the note in
 * focus-mode.spec.ts. Since Phase 15, demo mode seeds a deterministic dataset
 * (6 goals, see src/data/demo/generator.ts) — its own behavior is covered by
 * e2e/demo-mode.spec.ts; this file only needs it to exist as a stable
 * "logged in, has content" baseline for atmosphere/palette checks.
 */

async function enterDemoMode(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByText('hours studied this month')).toBeVisible()
}

test('ambient background renders a WebGL canvas in #bg-root with no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await enterDemoMode(page)
  await expect(page.locator('#bg-root canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('reduced motion renders the static CSS gradient fallback instead of a canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await enterDemoMode(page)
  await expect(page.locator('#bg-root canvas')).toHaveCount(0)
  await expect(page.locator('#bg-root > div')).toBeVisible()
})

test('Cmd/Ctrl+K opens the command palette, and Escape closes it', async ({ page }) => {
  await enterDemoMode(page)
  await page.keyboard.press('Control+k')
  const input = page.getByPlaceholder(/Log 25 min/)
  await expect(input).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).toBeHidden()
})

test('the sidebar "Search" button opens the same palette instance', async ({ page }) => {
  await enterDemoMode(page)
  await page.getByRole('button', { name: /Search/ }).click()
  await expect(page.getByPlaceholder(/Log 25 min/)).toBeVisible()
})

test('"New goal" command works from a different page and opens Dashboard\'s modal there', async ({ page }) => {
  await enterDemoMode(page)
  await page.getByRole('link', { name: 'Sleep' }).click()
  await expect(page).toHaveURL(/\/sleep$/)

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/Log 25 min/).fill('new goal')
  await page.getByRole('option', { name: 'New goal' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'New goal' })).toBeVisible()
})

test('"Log sleep" command works from a different page and opens the sleep sheet there', async ({ page }) => {
  await enterDemoMode(page)
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/Log 25 min/).fill('log sleep')
  await page.getByRole('option', { name: 'Log sleep' }).click()

  await expect(page).toHaveURL(/\/sleep$/)
  await expect(page.getByText('How was it?')).toBeVisible()
})

test('navigating via "Go to" resets scroll to the top', async ({ page }) => {
  await enterDemoMode(page)
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder(/Log 25 min/).fill('heatmap')
  await page.getByRole('option', { name: 'Heatmap' }).click()

  await expect(page).toHaveURL(/\/heatmap$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('on mobile, a search icon opens the palette as a full-height drawer with no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await enterDemoMode(page)
  await page.getByRole('button', { name: 'Search / Command' }).click()
  const input = page.getByPlaceholder(/Log 25 min/)
  await expect(input).toBeVisible()
  await page.waitForTimeout(400) // let vaul's slide-up transition settle before reading position

  const box = await input.boundingBox()
  expect(box?.y ?? 9999).toBeLessThan(200)

  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(noHScroll).toBe(true)
})
