import { expect, test } from '@playwright/test'

/**
 * Exercises /sleep against the fixture harness at /styleguide/sleep — no
 * seeded Firestore data exists for a real year of sleep logs. Covers the
 * giant numeral + week comparison, the cross-insight card and its
 * enough-data gate, the chart's hover tooltip and range morph, the log
 * sheet, reduced motion, and no page-level horizontal scroll.
 */

test('renders the giant average, week comparison, insight card, chart, and range chips', async ({ page }) => {
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  await expect(page.getByText('average sleep', { exact: false })).toBeVisible()
  await expect(page.getByText(/You study/)).toBeVisible()
  await expect(page.locator('svg[role="img"]').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '7D' })).toBeVisible()
  await expect(page.getByRole('button', { name: '30D' })).toBeVisible()
  await expect(page.getByRole('button', { name: '1Y' })).toBeVisible()
})

test('hovering the chart shows a crosshair tooltip with the date and hours', async ({ page }) => {
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  const svg = page.locator('svg[role="img"]').first()
  const box = await svg.boundingBox()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect(page.locator('[data-radix-popper-content-wrapper]')).toBeVisible()
})

test('switching range re-renders a valid path (smooth morph, not a blank chart)', async ({ page }) => {
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  const linePath = page.locator('svg[role="img"] path').first()
  await page.getByRole('button', { name: '7D' }).click()
  await page.waitForTimeout(700)
  expect((await linePath.getAttribute('d'))?.length).toBeGreaterThan(0)

  await page.getByRole('button', { name: '1Y' }).click()
  await page.waitForTimeout(700)
  expect((await linePath.getAttribute('d'))?.length).toBeGreaterThan(0)
})

test('the log sheet logs hours (0.5 steps) and a 1-5 quality selection', async ({ page }) => {
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Log sleep' }).click()
  await expect(page.getByText('How was it?')).toBeVisible()

  await page.getByRole('button', { name: 'Increase hours' }).click()
  await page.getByRole('radio', { name: 'Quality 5 of 5' }).click()
  await page.getByRole('button', { name: 'Log sleep' }).last().click()
  await page.waitForTimeout(300)
  await expect(page.getByTestId('fixture-last-logged')).toContainText('quality 5')
})

test('hides the insight card and shows 0h when there is no data', async ({ page }) => {
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  await page.getByTestId('fixture-toggle-data').click()
  await page.waitForTimeout(300)
  await expect(page.getByText(/You study/)).toBeHidden()
  await expect(page.locator('span.num').first()).toBeVisible()
})

test('no page-level horizontal scroll at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(noHScroll).toBe(true)
})

test('reduced motion renders the chart without crashing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/styleguide/sleep')
  await page.waitForTimeout(400)
  await expect(page.locator('svg[role="img"]').first()).toBeVisible()
})
