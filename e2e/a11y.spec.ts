import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Keyboard/focus/automated-a11y regression guard. Two real bugs were found
 * and fixed building this: ResponsiveModal never restored focus to whatever
 * triggered it (neither Radix Dialog nor vaul's Drawer do this on their own
 * without a <Trigger> component, which every caller here skips), and
 * DeleteGoalConfirmDialog ignored Escape entirely (it isn't Radix-based, so
 * it never inherited DismissableLayer's handling).
 */

async function enterDemoMode(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByText('hours studied this month')).toBeVisible()
}

test('closing the command palette (desktop dialog) restores focus to its trigger', async ({ page }) => {
  await enterDemoMode(page)
  const trigger = page.getByRole('button', { name: /Search/ })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByPlaceholder(/Log 25 min/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByPlaceholder(/Log 25 min/)).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('closing the command palette (mobile drawer) restores focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await enterDemoMode(page)
  const trigger = page.getByRole('button', { name: 'Search / Command' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByPlaceholder(/Log 25 min/)).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400) // vaul's slide-down exit transition
  await expect(trigger).toBeFocused()
})

test('closing the Log Time sheet restores focus to its trigger', async ({ page }) => {
  await enterDemoMode(page)
  const trigger = page.getByRole('button', { name: 'Log time' }).first()
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('minutes', { exact: false }).first()).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  await expect(trigger).toBeFocused()
})

test('Escape closes the delete-confirmation dialog (not Radix-based, has its own handler)', async ({ page }) => {
  await page.goto('/styleguide/month')
  await page.getByRole('button', { name: '6 goals' }).click()
  await page.getByRole('button', { name: 'Delete' }).first().click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await expect(page.getByRole('alertdialog')).toBeHidden()
})

test('automated a11y scan (wcag2a/wcag2aa) finds no violations on the key routes', async ({ page }) => {
  await enterDemoMode(page)
  // See the note in the next test — the first-ever-this-session entrance
  // stagger is still animating in on this very first route.
  await page.waitForTimeout(1200)
  for (const route of ['/', '/heatmap', '/sleep', '/spending', '/settings', '/review', '/month']) {
    if (route !== '/') {
      await page.goto(route)
      await page.waitForTimeout(400)
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  }
})

test('automated a11y scan finds no violations on the chunk grid, New Goal wizard, or Focus Mode', async ({ page }) => {
  await enterDemoMode(page)
  // Dashboard's first-ever-this-session entrance stagger is still mid-fade
  // at this point — axe reads computed (partial-opacity) color at whatever
  // instant it runs, which briefly under-reports contrast on fading-in
  // text. Not a real bug (confirmed by re-scanning once settled); just let
  // it finish before scanning anything.
  await page.waitForTimeout(1200)

  await page.getByRole('link', { name: /^French / }).click()
  await expect(page).toHaveURL(/\/goals\//)
  await page.waitForTimeout(500)
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])

  await page.getByRole('button', { name: 'Focus', exact: true }).click()
  await page.getByRole('button', { name: 'Start focus session' }).click()
  await expect(page.getByRole('dialog', { name: /Focus session/ })).toBeVisible()
  await page.waitForTimeout(500) // let FocusStartSheet's own exit transition finish closing
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  await page.getByRole('button', { name: 'End session' }).click()

  await page.goto('/')
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'New goal' }).click()
  await page.waitForTimeout(500) // let the modal's own open transition settle
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
})
