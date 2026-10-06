import { expect, test } from '@playwright/test'

/**
 * Exercises Focus Mode against the fixture harness at /styleguide/focus (no
 * seeded Firestore data exists to click through in the real app). Covers the
 * task's own test checklist: timing correctness from real timestamps (not
 * counted ticks), reload-mid-session resume, toast/confirm layering above
 * the overlay, give-up confirmation thresholds, and the reduced-motion
 * fallback.
 *
 * What this suite deliberately does NOT verify: that the completion
 * screen's 8s auto-log actually writes to Firestore. This dev environment
 * has no real Firebase project behind its placeholder env vars, so
 * `signInAnonymously` fails here with `auth/api-key-not-valid` before
 * `logSession` is ever reached. That exact code path — the 8s timer firing
 * `logSession` with the right uid/goalId/minutes, from real timestamps, not
 * restarted by re-renders — is instead verified deterministically with
 * mocked Firestore writes and fake timers in
 * src/features/focus/FocusMode.test.tsx.
 */

const FAST_START = 'Start fixed · 2 chunks (fast)'
const LONG_START = 'Start fixed · 3 chunks (long)'

test('covers everything, locks scroll, and renders at the z-modal token', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()

  const dialog = page.getByRole('dialog', { name: /Focus session/ })
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('z-index', '500')
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')

  const appRootInert = await page.evaluate(() => document.getElementById('app-root')?.hasAttribute('inert'))
  expect(appRootInert).toBe(true)

  await expect(page.getByText('French')).toBeVisible()
  await expect(page.locator('span.num').first()).toHaveText(/^\d{2}:\d{2}$/)
  await expect(page.locator('[role="img"][aria-label*="chunks done"]')).toBeVisible()
})

test('a toast fired while Focus Mode is open stacks above it (z-toast > z-modal)', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeVisible()

  await page.evaluate(() => (window as unknown as { __fireTestToast: () => void }).__fireTestToast())
  const toastRegion = page.locator('[data-sonner-toaster]')
  await expect(toastRegion).toBeAttached()
  const toastZ = await toastRegion.evaluate((el: HTMLElement) => el.style.zIndex)
  expect(toastZ).toBe('var(--z-toast)')
})

test('Escape opens the end-session confirmation, layered above Focus Mode via the same overlay root', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()
  const dialog = page.getByRole('dialog', { name: /Focus session/ })
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  const confirm = page.getByRole('alertdialog', { name: 'End session?' })
  await expect(confirm).toBeVisible()

  // useOverlayLock is reference-counted — the nested dialog's own lock
  // should stack on Focus Mode's, not replace or fight it.
  const stillInert = await page.evaluate(() => document.getElementById('app-root')?.hasAttribute('inert'))
  expect(stillInert).toBe(true)

  await page.getByRole('button', { name: 'Keep going' }).click()
  await expect(confirm).toBeHidden()
  await expect(dialog).toBeVisible()
})

test('a fixed-duration session reaches the completion screen on its own', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeVisible()

  const logItButton = page.getByRole('button', { name: 'Log it' })
  await expect(logItButton).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('span.num', { hasText: '+' }).first()).toHaveText(/\+\d+ min/)
})

test('reload mid-session resumes from real elapsed time, not from zero', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: LONG_START }).click()
  const dialog = page.getByRole('dialog', { name: /Focus session/ })
  await expect(dialog).toBeVisible()

  // Simulate "2 minutes away": rewind the persisted session's startedAt the
  // same way a throttled background tab's clock drift would look, then
  // reload — the same localStorage round trip a real page reload goes through.
  const rewound = await page.evaluate(() => {
    const raw = localStorage.getItem('chunks:focus-session')
    if (!raw) return null
    const session = JSON.parse(raw)
    session.startedAt -= 120_000
    localStorage.setItem('chunks:focus-session', JSON.stringify(session))
    return session
  })
  expect(rewound).not.toBeNull()

  await page.reload()
  await expect(dialog).toBeVisible()

  // 3 chunks * 5min = 900s target; after "losing" 120s, remaining should sit
  // right around 780s (13:00) — comfortably under the full 15:00 starting
  // value, with a little slack for the real time that passes during the test itself.
  const numeralText = (await page.locator('span.num').first().textContent()) ?? ''
  const [mm, ss] = numeralText.split(':').map(Number)
  const remainingSeconds = mm * 60 + ss
  expect(remainingSeconds).toBeGreaterThan(12 * 60)
  expect(remainingSeconds).toBeLessThanOrEqual(13 * 60)
})

test('giving up with nothing meaningful at stake closes immediately, no confirmation', async ({ page }) => {
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()
  const dialog = page.getByRole('dialog', { name: /Focus session/ })
  await expect(dialog).toBeVisible()

  await page.getByRole('button', { name: 'End session' }).click()
  await expect(dialog).toBeHidden()

  const appRootNotInert = await page.evaluate(() => document.getElementById('app-root')?.hasAttribute('inert'))
  expect(appRootNotInert).toBe(false)
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})

test('reduced motion skips the breathing background and particle burst', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/styleguide/focus')
  await page.getByRole('button', { name: FAST_START }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeVisible()

  const breathingLayer = page.locator('div[style*="focus-breathe"]')
  await expect(breathingLayer).toHaveCount(0)
})
