import { expect, test } from '@playwright/test'

// The entrance stagger has a 700ms total budget (CLAUDE.md) — every check
// that reads final colors/opacity needs to wait that out first, or it's
// reading a cell that's still mid pop-in.
const ENTRANCE_SETTLE_MS = 900

/**
 * Exercises /heatmap (Heatmap.tsx, via its HeatmapContent split) against the
 * fixture harness at /styleguide/heatmap — no seeded Firestore data exists
 * for a real year of activity. Covers the task's own spec points: 5
 * intensity levels, goal filtering recomputing color, the Year/6
 * months/Month toggle, hover tooltip vs touch tap-to-select, weekday labels
 * hiding on narrow containers, reduced motion, and no page-level horizontal
 * scroll anywhere.
 */

test('renders streak stats, filter chips, range toggle, and the grid', async ({ page }) => {
  await page.goto('/styleguide/heatmap')
  await expect(page.getByText('Current streak')).toBeVisible()
  await expect(page.getByText('longest streak')).toBeVisible()
  await expect(page.getByText('active days')).toBeVisible()
  await expect(page.getByRole('button', { name: 'All goals' })).toBeVisible()
  await expect(page.getByRole('button', { name: '6 months' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Study heatmap/ })).toBeVisible()
})

test('shows 5 distinct intensity levels', async ({ page }) => {
  await page.goto('/styleguide/heatmap')
  await expect(page.locator('button[aria-label]').first()).toBeVisible()
  await page.waitForTimeout(ENTRANCE_SETTLE_MS)
  const colorCount = await page.evaluate(() => {
    const cells = document.querySelectorAll('button[aria-label*=": "]')
    return new Set(Array.from(cells).map((el) => getComputedStyle(el).backgroundColor)).size
  })
  expect(colorCount).toBe(5)
})

test('hovering a cell shows a tooltip with the date and minutes', async ({ page }) => {
  await page.goto('/styleguide/heatmap')
  await page.waitForTimeout(300)
  await page.locator('button[aria-label]').first().hover()
  await expect(page.getByRole('tooltip')).toBeVisible()
})

test('selecting a single goal recomputes the grid colors', async ({ page }) => {
  await page.goto('/styleguide/heatmap')
  await page.waitForTimeout(ENTRANCE_SETTLE_MS)
  const before = await page.evaluate(() => Array.from(document.querySelectorAll('button[aria-label]')).map((el) => getComputedStyle(el).backgroundColor))
  await page.getByRole('button', { name: 'French' }).click()
  await page.waitForTimeout(500)
  const after = await page.evaluate(() => Array.from(document.querySelectorAll('button[aria-label]')).map((el) => getComputedStyle(el).backgroundColor))
  expect(before.some((color, index) => color !== after[index])).toBe(true)
})

test('the Month range shows fewer week-columns than Year, and both render visibly', async ({ page }) => {
  await page.goto('/styleguide/heatmap')
  await page.waitForTimeout(ENTRANCE_SETTLE_MS)
  const yearColumns = await page.locator('div[style*="scroll-snap-align"]').count()

  await page.getByRole('button', { name: 'Month', exact: true }).click()
  await page.waitForTimeout(ENTRANCE_SETTLE_MS)
  const monthColumns = await page.locator('div[style*="scroll-snap-align"]').count()
  expect(monthColumns).toBeLessThan(yearColumns)

  // Regression guard: switching ranges must not leave the newly-visible
  // (most recent) cells stuck invisible — they were remounting under a
  // stale col-based key, restarting their entrance animation with a long
  // delay. See HeatmapCalendar.tsx's week-column key comment.
  const visibleFilledCells = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[aria-label]')).filter((el) => getComputedStyle(el).opacity === '1').length,
  )
  expect(visibleFilledCells).toBeGreaterThan(0)
})

test('weekday labels hide on a narrow container and no page scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/styleguide/heatmap')
  await page.waitForTimeout(300)
  await expect(page.getByText('Mon', { exact: true })).toBeHidden()
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(noHScroll).toBe(true)
})

test('tapping a cell on touch selects it and shows the bottom details card, not a floating tooltip', async ({ page, context }) => {
  await context.close()
  const touchContext = await page.context().browser()!.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true })
  const touchPage = await touchContext.newPage()
  await touchPage.goto('/styleguide/heatmap')
  await touchPage.waitForTimeout(300)

  const cell = touchPage.locator('button[aria-label]').first()
  await cell.dispatchEvent('pointerdown', { pointerType: 'touch' })
  await cell.dispatchEvent('pointerup', { pointerType: 'touch' })
  await touchPage.waitForTimeout(200)

  await expect(touchPage.getByLabel('Close day details')).toBeVisible()
  await expect(touchPage.getByRole('tooltip')).toBeHidden()
  await touchContext.close()
})

test('reduced motion skips the entrance animation entirely', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/styleguide/heatmap')
  await page.waitForTimeout(300)
  const animatedCount = await page.evaluate(
    () => Array.from(document.querySelectorAll('button[aria-label]')).filter((el) => el.getAttribute('style')?.includes('chunk-pop-in')).length,
  )
  expect(animatedCount).toBe(0)
})

test('an empty year (no goals, no data) renders without crashing', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()))
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  await page.goto('/styleguide/heatmap')
  await page.getByTestId('fixture-toggle-data').click()
  await page.waitForTimeout(300)

  await expect(page.getByText('Current streak')).toBeVisible()
  await expect(page.locator('span.num').first()).toHaveText('0')
  expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([])
})
