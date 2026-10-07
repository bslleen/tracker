import { expect, test } from '@playwright/test'

/**
 * Pre-deploy smoke test: runs against the actual production build served by
 * `vite preview` (see playwright.preview.config.ts), not the dev server —
 * catches anything that only breaks once minified/bundled/code-split (a
 * missing dynamic import, a prod-only env branch, etc). One linear walk
 * through the five things explicitly called out as must-work: demo mode
 * loads, create a goal, log time, Focus mode, the Year in Review story.
 */
test('demo mode loads, creates a goal, logs time, opens Focus mode and the Year in Review story', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByText('hours studied this month')).toBeVisible()

  // Create a goal
  await page.getByRole('button', { name: 'New goal' }).click()
  await page.getByLabel('Goal name').fill('Pottery')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Create goal' }).click()
  await expect(page.getByRole('link', { name: /^Pottery / })).toBeVisible()

  // Log time against it
  await page.getByRole('link', { name: /^Pottery / }).click()
  await expect(page).toHaveURL(/\/goals\//)
  await page.getByRole('button', { name: 'Log time' }).first().click()
  await page.getByRole('button', { name: 'Log' }).click()
  await expect(page.getByText(/Logged \d+ min/)).toBeVisible()

  // Focus mode, against a seeded goal
  await page.goto('/')
  await page.getByRole('link', { name: /^Chess / }).click()
  await page.getByRole('button', { name: 'Focus' }).click()
  await page.getByRole('button', { name: 'Start focus session' }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toContainText('Chess')

  // End it properly before moving on — an active session persists in
  // localStorage across navigation, and would otherwise keep rendering its
  // full-screen overlay on top of every later page in this test. (No
  // confirmation dialog at 0 chunks completed — ending fresh skips it.)
  await page.getByRole('button', { name: 'End session' }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeHidden()

  // Year in Review story
  await page.goto('/review')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByText(/studied/)).toBeVisible()

  expect(consoleErrors).toEqual([])
})
