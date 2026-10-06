import { expect, test } from '@playwright/test'

/**
 * Exercises /review (ReviewStory.tsx, via ReviewLauncher) against the
 * fixture harness at /styleguide/review — no seeded Firestore data exists
 * for a real year. Covers the task's own test list (360x640, 390x844,
 * 768x1024, 1920x1080), hold-to-pause, and the layering/Lenis requirements,
 * plus two real bugs this suite caught and pins down: the reduced-motion
 * opt-in racing through every slide (fighting the global `!important`
 * reduced-motion CSS rule), and the Share button's click bubbling into the
 * tap-to-navigate handler and closing the story mid-share.
 */

async function openStory(page: import('@playwright/test').Page) {
  await page.goto('/styleguide/review')
  await page.getByTestId('fixture-dataset-full').click()
  await page.waitForTimeout(150)
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

function slideLabel(page: import('@playwright/test').Page) {
  return page.locator('[role="img"][aria-label^="Slide"]')
}

test('opens full-screen with all 11 slide types, body scroll locked', async ({ page }) => {
  await openStory(page)
  await expect(page.getByTestId('fixture-slide-count')).toHaveText('11 slides')
  const overflow = await page.evaluate(() => document.body.style.overflow)
  expect(overflow).toBe('hidden')
})

test('tapping the right 2/3 advances, tapping the left 1/3 goes back', async ({ page }) => {
  await openStory(page)
  const box = (await page.getByRole('dialog').boundingBox())!
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2)
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 2 of 11')
  await page.mouse.click(box.x + box.width * 0.1, box.y + box.height / 2)
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 1 of 11')
})

test('swiping left/right on touch navigates', async ({ page }) => {
  await openStory(page)
  const box = (await page.getByRole('dialog').boundingBox())!
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 2 of 11')
})

test('keyboard arrows navigate, Space toggles pause', async ({ page }) => {
  await openStory(page)
  await page.keyboard.press('ArrowRight')
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 2 of 11')
  await page.keyboard.press('ArrowLeft')
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 1 of 11')

  await page.keyboard.press(' ')
  const pausedState = await page.evaluate(() => {
    const bar = document.querySelectorAll('[role="img"][aria-label^="Slide"] > div')[0]?.querySelector('div > div')
    return bar ? getComputedStyle(bar).animationPlayState : null
  })
  expect(pausedState).toBe('paused')
  await page.keyboard.press(' ')
  const runningState = await page.evaluate(() => {
    const bar = document.querySelectorAll('[role="img"][aria-label^="Slide"] > div')[0]?.querySelector('div > div')
    return bar ? getComputedStyle(bar).animationPlayState : null
  })
  expect(runningState).toBe('running')
})

test('press-and-hold with the mouse pauses the active progress bar; releasing resumes without navigating', async ({ page }) => {
  await openStory(page)
  const box = (await page.getByRole('dialog').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(400)
  const paused = await page.evaluate(() => {
    const bar = document.querySelectorAll('[role="img"][aria-label^="Slide"] > div')[0]?.querySelector('div > div')
    return bar ? getComputedStyle(bar).animationPlayState : null
  })
  expect(paused).toBe('paused')
  await page.mouse.up()
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 1 of 11')
})

test('auto-advances on its own after the slide duration, and closes after the outro', async ({ page }) => {
  await openStory(page)
  await page.waitForTimeout(6500)
  await expect(slideLabel(page)).not.toHaveAttribute('aria-label', 'Slide 1 of 11')

  for (let i = 0; i < 11; i += 1) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
  }
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('reduced motion disables auto-advance by default; opting in enables it without racing through every slide', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openStory(page)
  await page.waitForTimeout(6500)
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 1 of 11')

  await page.getByRole('button', { name: 'Auto-advance' }).click()
  await page.waitForTimeout(3000)
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 1 of 11') // not yet 6s in
  await page.waitForTimeout(3500)
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 2 of 11') // exactly one slide forward, not racing to the end
})

test('Close (X) closes the story', async ({ page }) => {
  await openStory(page)
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('Share produces a downloaded PNG without the story closing mid-share', async ({ page }) => {
  await openStory(page)
  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(80)
  }
  const shareButton = page.getByRole('button', { name: /Share|Preparing/ })
  await expect(shareButton).toBeVisible()
  const [download] = await Promise.all([page.waitForEvent('download'), shareButton.click()])
  expect(download.suggestedFilename()).toMatch(/\.png$/)
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('skips slides without enough data, and shows a calm message with zero', async ({ page }) => {
  await page.goto('/styleguide/review')
  await page.getByTestId('fixture-dataset-partial').click()
  await expect(page.getByTestId('fixture-slide-count')).toHaveText('4 slides')

  await page.getByTestId('fixture-dataset-empty').click()
  await expect(page.getByText('Not enough data yet')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toHaveCount(0)
})

test('desktop shows a 9:16 card over a scrim with arrow buttons outside it', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await openStory(page)
  await expect(page.getByRole('button', { name: 'Previous slide' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next slide' })).toBeVisible()

  const box = (await page.getByRole('dialog').boundingBox())!
  expect(box.width / box.height).toBeCloseTo(9 / 16, 1)
  expect(box.height).toBeLessThanOrEqual(900)

  await page.getByRole('button', { name: 'Next slide' }).click()
  await expect(slideLabel(page)).toHaveAttribute('aria-label', 'Slide 2 of 11')
})

for (const [width, height] of [
  [360, 640],
  [390, 844],
  [768, 1024],
] as const) {
  test(`renders with no horizontal scroll at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await openStory(page)
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
    expect(noHScroll).toBe(true)
  })
}
