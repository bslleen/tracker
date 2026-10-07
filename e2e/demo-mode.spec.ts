import { expect, test } from '@playwright/test'

/**
 * Demo mode (Phase 15): "Try the demo" on the sign-in screen seeds a
 * deterministic in-memory dataset (src/data/demo/generator.ts) with zero
 * Firebase calls, so every feature works with no sign-up. These tests run
 * against the real app shell — demo mode IS the real app, just backed by an
 * in-memory store instead of Firestore (see src/data/demo/store.ts and the
 * uid === DEMO_UID branches threaded through every src/data/*.ts hook).
 */

async function enterDemoMode(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByText('hours studied this month')).toBeVisible()
}

test('loads a fully populated dashboard with no sign-up and no Firebase calls', async ({ page }) => {
  const firebaseRequests: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('firestore.googleapis.com') || url.includes('identitytoolkit.googleapis.com')) {
      firebaseRequests.push(url)
    }
  })

  await enterDemoMode(page)

  // All 6 seeded goals, with their percentages always printed (never color-only).
  for (const [name, percent] of [
    ['French', '68%'],
    ['Machine learning', '42%'],
    ['Linear algebra', '91%'],
    ['German', '20%'],
    ['English', '100%'],
    ['Chess', '55%'],
  ] as const) {
    await expect(page.getByRole('link', { name: new RegExp(`^${name} `) })).toBeVisible()
    await expect(page.getByText(percent, { exact: true }).first()).toBeVisible()
  }

  expect(firebaseRequests).toEqual([])
})

test('the demo banner is inline (not fixed) and offers sign-in', async ({ page }) => {
  await enterDemoMode(page)
  const banner = page.getByText("Demo mode — changes aren't saved", { exact: false })
  await expect(banner).toBeVisible()

  const position = await banner.evaluate((el) => getComputedStyle(el.closest('div')!).position)
  expect(position).not.toBe('fixed')

  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue as guest' })).toBeVisible()
})

test('creating a goal and logging time both work, in memory, with no reload needed', async ({ page }) => {
  await enterDemoMode(page)

  await page.getByRole('button', { name: 'New goal' }).click()
  await page.getByLabel('Goal name').fill('Pottery')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Create goal' }).click()

  await expect(page.getByRole('link', { name: /^Pottery / })).toBeVisible()

  await page.getByRole('link', { name: /^Pottery / }).click()
  await expect(page).toHaveURL(/\/goals\//)
  await expect(page.getByText('0%', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Log time' }).first().click()
  await page.getByRole('button', { name: 'Log' }).click()
  await expect(page.getByText(/Logged \d+ min/)).toBeVisible()
})

test('Focus mode runs end to end against a seeded goal', async ({ page }) => {
  await enterDemoMode(page)
  await page.getByRole('link', { name: /^Chess / }).click()
  await page.getByRole('button', { name: 'Focus' }).click()
  await page.getByRole('button', { name: 'Start focus session' }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toContainText('Chess')
})

test('Year in Review loads a populated story from the seeded 12 months', async ({ page }) => {
  await enterDemoMode(page)
  await page.getByRole('link', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByText(/studied/)).toBeVisible()
})

test('Heatmap shows active days and a real streak from the seeded history', async ({ page }) => {
  await enterDemoMode(page)
  await page.getByRole('link', { name: 'Streaks' }).click()
  await expect(page.getByText('active days', { exact: false })).toBeVisible()
  await expect(page.getByRole('group', { name: /Study heatmap/ })).toBeVisible()
})
