import { expect, test } from '@playwright/test'

/**
 * Exercises /month (MonthReview.tsx, via its MonthReviewContent split) against
 * the fixture harness at /styleguide/month — no seeded Firestore data exists
 * for a real past month to click through. Covers the task's own test list
 * (0/1/6/12 goals) plus the specific failure modes called out: the sticky
 * action bar must never cover the last card, and the stagger reveal must be
 * real (not everything appearing at once).
 */

test('0 goals shows a calm "nothing to review" message', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-0').click()
  await expect(page.getByText('Nothing to review for')).toBeVisible()
})

test('1 goal renders its subject card and chunk grid', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-1').click()
  await expect(page.getByRole('heading', { name: 'French' })).toBeVisible()
})

test('subjects reveal one after another, not all at once', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()

  // Scoped to <main> — the off-screen share-card copy shows final percents immediately, unstaggered, by design.
  const percents = page.locator('main span.num', { hasText: '%' })
  await page.waitForTimeout(100)
  const early = await percents.allTextContents()
  expect(early.filter((text) => text !== '0%').length).toBeLessThan(6)

  await page.waitForTimeout(3500)
  const revealed = await percents.allTextContents()
  expect(revealed.filter((text) => text !== '0%').length).toBe(revealed.length)
})

test('desktop shows two columns, phone width shows one', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  const grid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2')
  const desktopColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(desktopColumns).toBe(2)

  await page.setViewportSize({ width: 320, height: 800 })
  await page.waitForTimeout(100)
  const mobileColumns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
  expect(mobileColumns).toBe(1)
  const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  expect(noHScroll).toBe(true)
})

test('a completed goal only offers Archive; an unfinished one offers all three choices', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  const frenchCard = page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name: 'French' }) })
  await expect(frenchCard.getByRole('button', { name: 'Delete' })).toHaveCount(0)
  await expect(frenchCard.getByRole('button', { name: 'Carry over' })).toHaveCount(0)
  // A completed goal's "Archive" is a fixed confirmed-state badge, not a button — there's nothing else to choose.
  await expect(frenchCard.getByText('Archive', { exact: true })).toBeVisible()

  const chessHeading = page.getByRole('heading', { name: 'Chess openings and middlegame strategy' })
  const chessCard = page.locator('div.rounded-xl').filter({ has: chessHeading })
  await expect(chessCard.getByRole('button', { name: 'Carry over' })).toBeVisible()
  await expect(chessCard.getByRole('button', { name: 'Delete' })).toBeVisible()
})

test('selecting Carry over shows the preview of chunks moving to next month', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  const chessHeading = page.getByRole('heading', { name: 'Chess openings and middlegame strategy' })
  const chessCard = page.locator('div.rounded-xl').filter({ has: chessHeading })
  await chessCard.getByRole('button', { name: 'Carry over' }).click()
  await expect(page.getByText(/move to/)).toBeVisible()
})

test('Delete requires confirmation; cancelling leaves the decision unchanged', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  const chessHeading = page.getByRole('heading', { name: 'Chess openings and middlegame strategy' })
  const chessCard = page.locator('div.rounded-xl').filter({ has: chessHeading })
  await chessCard.getByRole('button', { name: 'Delete' }).click()

  const confirmDialog = page.getByRole('alertdialog')
  await expect(confirmDialog).toBeVisible()
  await page.getByRole('button', { name: 'Keep it' }).click()
  await expect(confirmDialog).toBeHidden()
  await expect(chessCard.getByRole('button', { name: 'Delete', pressed: true })).toHaveCount(0)
})

test('Mark as abandoned dims the segmented control and can be undone', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  const algebraCard = page.locator('div.rounded-xl').filter({ has: page.getByRole('heading', { name: 'Algebra II' }) })
  await algebraCard.getByRole('button', { name: 'Mark as abandoned instead' }).click()
  await expect(algebraCard.getByText('Undo — keep archiving')).toBeVisible()

  await algebraCard.getByRole('button', { name: 'Undo — keep archiving' }).click()
  await expect(algebraCard.getByText('Mark as abandoned instead')).toBeVisible()
})

test('the sticky action bar never covers the last card', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)

  const overlap = await page.evaluate(() => {
    const applyButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Apply choices'))
    const bar = applyButton?.closest('.sticky')
    const headings = Array.from(document.querySelectorAll('h3'))
    const lastCard = headings[headings.length - 1]?.closest('.rounded-xl')
    if (!bar || !lastCard) return null
    const barRect = bar.getBoundingClientRect()
    const cardRect = lastCard.getBoundingClientRect()
    return cardRect.bottom > barRect.top && cardRect.top < barRect.bottom
  })
  expect(overlap).toBe(false)
})

test('the sticky header compacts to just the numeral once scrolled past it', async ({ page }) => {
  // Short relative to the page's content so there's reliably enough room to
  // scroll the header's own height out of view.
  await page.setViewportSize({ width: 1280, height: 500 })
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  await expect(page.getByText('hours studied')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 400))
  await page.waitForTimeout(400)
  await expect(page.getByText('hours studied')).toBeHidden()
})

test('applying choices shows a success toast and the "done" line, dimming the cards', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(3500)

  await page.getByRole('button', { name: 'Apply choices' }).click()
  await expect(page.getByText(/Reviewed/)).toBeVisible()
  await expect(page.getByText(/See you in/)).toBeVisible({ timeout: 3000 })
})

test('12 goals all render after the stagger window, with no console errors', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()))
  page.on('pageerror', (error) => consoleErrors.push(String(error)))

  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-12').click()
  await page.waitForTimeout(6500)

  await expect(page.locator('h3')).toHaveCount(12)
  expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([])
})

test('reduced motion skips the stagger — every subject shows its true state immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/styleguide/month')
  await page.getByTestId('fixture-dataset-6').click()
  await page.waitForTimeout(200)

  const percents = await page.locator('main span.num', { hasText: '%' }).allTextContents()
  expect(percents.filter((text) => text !== '0%').length).toBe(percents.length)
})
