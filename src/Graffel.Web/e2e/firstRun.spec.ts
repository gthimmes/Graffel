import { expect, test, type Page } from '@playwright/test'

// v3.18 — first-run / empty-canvas welcome: starter templates that land you on
// something real, and the discoverability that containers are enterable (the
// drill-down differentiator).

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

function viewRoot(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { viewRootId: string | null } } } }
    return w.__graffel.useDiagramStore.getState().viewRootId
  })
}
function nodeCount(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { nodes: unknown[] } } } }
    return w.__graffel.useDiagramStore.getState().nodes.length
  })
}

test('the empty canvas shows the welcome overlay with starter templates + shortcut tips', async ({ page }) => {
  await expect(page.getByTestId('welcome-overlay')).toBeVisible()
  await expect(page.getByTestId('template-architecture')).toBeVisible()
  await expect(page.getByTestId('template-flowchart')).toBeVisible()
  await expect(page.getByTestId('template-microservices')).toBeVisible()
  await expect(page.getByTestId('welcome-overlay')).toContainText('Double-click')
  await expect(page.getByTestId('welcome-overlay')).toContainText('command palette')
})

test('picking the architecture template loads a diagram and dismisses the overlay', async ({ page }) => {
  await page.getByTestId('template-architecture').click()
  await expect(page.getByTestId('welcome-overlay')).toHaveCount(0)
  expect(await nodeCount(page)).toBeGreaterThan(4)
  await expect(page.getByTestId('title-input')).toHaveValue('Web service architecture')
  // The container node is present and rendered.
  await expect(page.locator('.react-flow__node[data-id="api"]')).toBeVisible()
})

test('the architecture template teaches drill-down: its container is enterable', async ({ page }) => {
  await page.getByTestId('template-architecture').click()
  await page.waitForTimeout(400)
  // The enter hint advertises the container is openable.
  const apiNode = page.locator('.react-flow__node[data-id="api"]')
  await expect(apiNode.getByTestId('enter-hint')).toContainText('Double-click to open')
  // And it actually drills in.
  await apiNode.dblclick()
  await page.waitForTimeout(400)
  expect(await viewRoot(page)).toBe('api')
  await expect(page.getByTestId('breadcrumbs')).toBeVisible()
  // Inside, the children render; the container/outside nodes do not.
  await expect(page.locator('.react-flow__node[data-id="auth"]')).toBeVisible()
  await expect(page.locator('.react-flow__node[data-id="web"]')).toHaveCount(0)
})

test('drawing a shape dismisses the welcome overlay', async ({ page }) => {
  await expect(page.getByTestId('welcome-overlay')).toBeVisible()
  await page.getByTestId('palette-service').click()
  await expect(page.getByTestId('welcome-overlay')).toHaveCount(0)
})

test('the welcome "open it" link opens the command palette', async ({ page }) => {
  await page.getByTestId('welcome-open-palette').click()
  await expect(page.getByTestId('command-palette')).toBeVisible()
})

test('the welcome overlay never appears in a read-only share view', async ({ page }) => {
  // Even with an empty document, read-only mode (a share view) shows no overlay.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { setReadOnly: (v: boolean) => void } } } }
    w.__graffel.useDiagramStore.getState().setReadOnly(true)
  })
  await page.waitForTimeout(150)
  await expect(page.getByTestId('welcome-overlay')).toHaveCount(0)
})
