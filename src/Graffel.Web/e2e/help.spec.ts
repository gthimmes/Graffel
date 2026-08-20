import { test, expect } from '@playwright/test'

// The in-app help center (help-navigator widget mounted in App.tsx).
// Playwright locators pierce the widget's shadow root automatically.
// No sign-in required — the editor and the help widget work anonymously.

test.describe('help center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('toolbar')).toBeVisible()
  })

  test('launcher opens contextual help; F1 toggles it', async ({ page }) => {
    await page.getByRole('button', { name: 'Open help' }).click()
    const panel = page.getByRole('dialog', { name: 'Graffel Help' })
    await expect(panel.getByText('Suggested for this page')).toBeVisible()
    await expect(panel.getByText('Your first diagram in 60 seconds')).toBeVisible()
    await expect(panel.getByText('Browse by topic')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel.getByText('Browse by topic')).not.toBeVisible()

    await page.keyboard.press('F1')
    await expect(panel.getByText('Browse by topic')).toBeVisible()
  })

  test('search, article rendering, feedback, and back navigation', async ({ page }) => {
    await page.keyboard.press('F1')
    const panel = page.getByRole('dialog', { name: 'Graffel Help' })

    await panel.getByPlaceholder('Search help articles…').fill('waypoint')
    await expect(panel.locator('mark').first()).toBeVisible()
    await panel
      .locator('button.hn-item', { hasText: 'Connector geometry: types, waypoints, routing' })
      .click()
    await expect(
      panel.getByRole('heading', { name: 'Connector geometry: types, waypoints, routing' }),
    ).toBeVisible()
    await expect(panel.getByText('Waypoints: explicit corners')).toBeVisible()

    await panel.getByRole('button', { name: 'Yes', exact: true }).click()
    await expect(panel.getByText('Thanks for the feedback!')).toBeVisible()

    await panel.getByRole('button', { name: 'Back' }).click()
    await expect(panel.locator('mark').first()).toBeVisible() // back on search results
  })

  test('category browsing drills into keyboard help', async ({ page }) => {
    await page.keyboard.press('F1')
    const panel = page.getByRole('dialog', { name: 'Graffel Help' })

    await panel.locator('button.hn-item', { hasText: 'Keyboard & speed' }).click()
    await expect(
      panel.getByText('Shortcuts, the command palette, and clipboard tricks for fast diagramming.'),
    ).toBeVisible()
    await panel
      .locator('button.hn-item', { hasText: 'Copy, paste, and duplicate' })
      .click()
    await expect(panel.getByText('system clipboard', { exact: false }).first()).toBeVisible()

    await panel.getByRole('button', { name: 'Back' }).click()
    await panel.getByRole('button', { name: 'Back' }).click()
    await expect(panel.getByText('Browse by topic')).toBeVisible()
  })
})
