import { expect, test } from '@playwright/test'

/**
 * Exercises the card<->detail shared layout transition against the fixture
 * harness at /styleguide/goal-card (no seeded Firestore data exists to click
 * through in the real app, so this is what stands in for it). Specifically
 * checking for what the task called out as failure modes: console errors,
 * orphaned duplicate layoutId elements, and the back-navigation round trip
 * breaking down under rapid repetition.
 */
test('goal card morph: open/close rapidly with no console errors or orphaned elements', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

  await page.goto('/styleguide/goal-card')
  await expect(page.getByTestId('fixture-dashboard')).toBeVisible()

  const frenchCard = page.getByRole('link').filter({ hasText: 'French' })
  await expect(frenchCard).toBeVisible()

  for (let i = 0; i < 20; i += 1) {
    await frenchCard.click()
    await expect(page.getByTestId('fixture-detail')).toBeVisible()
    await expect(page).toHaveURL(/\/styleguide\/goal-card\/french$/)

    // Exactly one of each — no orphaned clone left behind from a previous cycle.
    await expect(page.locator('[data-testid="fixture-detail"] h1')).toHaveCount(1)

    await page.getByTestId('fixture-back').click()
    await expect(page.getByTestId('fixture-dashboard')).toBeVisible()
    await expect(page).toHaveURL(/\/styleguide\/goal-card$/)
    await expect(page.getByRole('link').filter({ hasText: 'French' })).toHaveCount(1)
  }

  expect(consoleErrors, `Console errors during rapid open/close:\n${consoleErrors.join('\n')}`).toEqual([])
})

test('goal card morph: deep link straight to the detail page with no card to morph from', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

  await page.goto('/styleguide/goal-card/chess')
  await expect(page.getByTestId('fixture-detail')).toBeVisible()
  await expect(page.locator('h1')).toHaveText('Chess openings')

  expect(consoleErrors, `Console errors on deep link:\n${consoleErrors.join('\n')}`).toEqual([])
})

test('goal card morph: the detail shell renders at a sane, non-clipped size', async ({ page }) => {
  await page.goto('/styleguide/goal-card')
  await page.getByRole('link').filter({ hasText: 'French' }).click()
  await expect(page.getByTestId('fixture-detail')).toBeVisible()

  // If an ancestor had overflow:hidden/contain:paint mid-transition, the
  // shell would report a collapsed or clipped box instead of its real size.
  const box = await page.locator('[data-testid="fixture-detail"] h1').locator('..').locator('..').boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThan(200)
  expect(box!.height).toBeGreaterThan(100)
})
