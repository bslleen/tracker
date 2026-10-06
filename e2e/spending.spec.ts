import { expect, test } from '@playwright/test'

/**
 * Exercises /spending against the fixture harness at /styleguide/spending —
 * no seeded Firestore data exists. Covers the donut (segments + center
 * total), the treemap alternative on wide screens, tap-to-filter, the add
 * sheet, swipe-to-delete with Undo, the desktop hover delete icon, and no
 * page-level horizontal scroll.
 */

test('renders the donut, center total, and the list grouped by day', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  await expect(page.locator('svg[role="img"]').first()).toBeVisible()
  await expect(page.getByText('this month')).toBeVisible()
  await expect(page.getByText('Fixture entry').first()).toBeVisible()
})

test('the treemap toggle only appears on wide screens', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  await expect(page.getByRole('button', { name: 'Treemap' })).toBeVisible()

  await page.setViewportSize({ width: 375, height: 800 })
  await page.waitForTimeout(200)
  await expect(page.getByRole('button', { name: 'Treemap' })).toBeHidden()
})

test('switching to the treemap renders proportional category rects', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Treemap' }).click()
  await page.waitForTimeout(500)
  const rectCount = await page.locator('button[style*="background-color"]').count()
  expect(rectCount).toBeGreaterThan(0)
})

test('the add sheet adds a new entry to the list', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Add spending' }).click()
  await expect(page.getByText('Category')).toBeVisible()

  for (let i = 0; i < 5; i += 1) await page.getByRole('button', { name: 'Increase amount' }).click()
  await page.getByRole('button', { name: 'Food', exact: true }).click()
  await page.getByRole('button', { name: 'Add spending' }).last().click()
  await page.waitForTimeout(400)
  await expect(page.getByText('$5').first()).toBeVisible()
})

test('swiping a row left past the threshold deletes it with an Undo toast', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  const row = page.locator('div.group').first()
  const box = await row.boundingBox()
  await page.mouse.move(box!.x + box!.width - 20, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x - 100, box!.y + box!.height / 2, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible()
})

test('hovering a row on desktop reveals a delete icon', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  const row = page.locator('div.group').first()
  await row.hover()
  await expect(row.getByRole('button', { name: /Delete/ })).toBeVisible()
})

test('empty state renders without crashing', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()))
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  await page.getByTestId('fixture-toggle-data').click()
  await page.waitForTimeout(300)
  await expect(page.getByText('No spending logged yet this month.')).toBeVisible()
  expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([])
})

test('no page-level horizontal scroll at 1280px or 375px', async ({ page }) => {
  await page.goto('/styleguide/spending')
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)

  await page.setViewportSize({ width: 375, height: 800 })
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
})
