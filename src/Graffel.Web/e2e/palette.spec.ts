import { expect, test } from '@playwright/test'

// v1.4 Command palette: opens on `/`, fuzzy-filters, Enter runs, Esc closes.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('palette is closed by default', async ({ page }) => {
  await expect(page.getByTestId('command-palette')).toHaveCount(0)
})

test('/ opens the palette and Esc closes it', async ({ page }) => {
  // Make sure focus isn't inside an editable field.
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  await expect(page.getByTestId('palette-input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('command-palette')).toHaveCount(0)
})

test('typing filters results; Enter runs the highlighted command', async ({ page }) => {
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await page.getByTestId('palette-input').fill('service')
  // The Insert: Service command should be in the top results.
  await expect(page.getByTestId('palette-result-insert-service')).toBeVisible()
  await page.keyboard.press('Enter')
  // Palette closes...
  await expect(page.getByTestId('command-palette')).toHaveCount(0)
  // ...and a service shape was added.
  await expect(page.getByTestId('shape-service')).toBeVisible()
})

test('arrow keys navigate results', async ({ page }) => {
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await page.getByTestId('palette-input').fill('insert')
  const results = page.locator('[data-testid^="palette-result-"]')
  const first = results.first()
  // Wait for the filtered list + active-highlight reset to settle before pressing arrows.
  await expect(first).toHaveClass(/is-active/)
  await expect(results).not.toHaveCount(0)
  await page.keyboard.press('ArrowDown')
  await expect(results.nth(1)).toHaveClass(/is-active/)
  await page.keyboard.press('ArrowUp')
  await expect(first).toHaveClass(/is-active/)
})

test('clicking outside the palette closes it', async ({ page }) => {
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await expect(page.getByTestId('command-palette')).toBeVisible()
  // Click the backdrop, not the palette itself.
  await page.getByTestId('palette-backdrop').click({ position: { x: 5, y: 5 } })
  await expect(page.getByTestId('command-palette')).toHaveCount(0)
})

test('palette typing does NOT trigger quick-insert shortcuts', async ({ page }) => {
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  // The letter r in the input would otherwise insert a rectangle.
  await page.getByTestId('palette-input').fill('r')
  // No rectangle was added.
  await expect(page.getByTestId('shape-rectangle')).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('non-matching query shows the empty state', async ({ page }) => {
  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await page.getByTestId('palette-input').fill('xqxqxq')
  await expect(page.getByTestId('palette-empty')).toBeVisible()
})

test('running "Undo" from the palette undoes the last action', async ({ page }) => {
  // Add a node first so there's something to undo.
  await page.getByTestId('palette-service').click()
  await expect(page.getByTestId('shape-service')).toBeVisible()

  await page.getByTestId('canvas-host').hover()
  await page.keyboard.press('/')
  await page.getByTestId('palette-input').fill('undo')
  await expect(page.getByTestId('palette-result-undo')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('shape-service')).toHaveCount(0)
})
