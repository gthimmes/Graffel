import { expect, test, type Page } from '@playwright/test'

// v3.16 — multi-document library, non-destructive New, in-app dialogs, and the
// share-link autosave-overwrite fix.

const LEGACY_KEY = 'graffel.currentDocument.v1'
const LIBRARY_KEY = 'graffel.library.v1'

async function seedLegacy(page: Page, title: string) {
  await page.goto('/')
  await page.evaluate(({ key, t }) => {
    localStorage.clear()
    const doc = {
      format: 'graffel', schemaVersion: 1, id: '01HXLEGACYDOCXXXXXXXXXXXXX',
      metadata: { title: t, createdAt: '2026-06-12T00:00:00Z', updatedAt: '2026-06-12T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [{ id: 'n1', type: 'basic:rectangle', parentId: null, position: { x: 200, y: 200 }, size: { w: 120, h: 70 }, data: { label: 'Legacy node' } }],
      edges: [], reserved: { remote: null, ops: null },
    }
    localStorage.setItem(key, JSON.stringify(doc))
  }, { key: LEGACY_KEY, t: title })
  await page.reload()
  await page.waitForSelector('.react-flow__node')
}

function ls(page: Page, key: string) {
  return page.evaluate((k) => localStorage.getItem(k), key)
}

test('migrates the legacy single-document key into the library on first load', async ({ page }) => {
  await seedLegacy(page, 'My Old Diagram')
  await expect(page.locator('.react-flow__node[data-id="n1"]')).toBeVisible()
  // Legacy key consumed; library key now present.
  expect(await ls(page, LEGACY_KEY)).toBeNull()
  expect(await ls(page, LIBRARY_KEY)).not.toBeNull()
})

test('"New" is non-destructive — both diagrams live in the library', async ({ page }) => {
  await seedLegacy(page, 'First')
  // New diagram — no native confirm dialog should appear (would hang the test).
  await page.getByTestId('action-new').click()
  await expect(page.locator('.react-flow__node')).toHaveCount(0)
  await page.getByTestId('title-input').fill('Second')
  await page.waitForTimeout(500) // autosave

  await page.getByTestId('action-documents').click()
  await expect(page.getByTestId('documents-dialog')).toBeVisible()
  // Both documents are listed.
  await expect(page.getByText('First')).toBeVisible()
  await expect(page.getByText('Second')).toBeVisible()

  // Open the original → its node returns.
  await page.getByText('First').click()
  await expect(page.locator('.react-flow__node[data-id="n1"]')).toBeVisible()
})

test('rename from the Documents dialog updates the list and the title bar', async ({ page }) => {
  await seedLegacy(page, 'Rename Me')
  await page.getByTestId('action-documents').click()
  const row = page.getByTestId('documents-dialog').locator('[data-testid^="doc-rename-"]').first()
  await row.click()
  const input = page.getByTestId('documents-dialog').locator('[data-testid^="doc-rename-input-"]').first()
  await input.fill('Renamed Diagram')
  await input.press('Enter')
  await expect(page.getByText('Renamed Diagram')).toBeVisible()
  await page.getByTestId('documents-close').click()
  await expect(page.getByTestId('title-input')).toHaveValue('Renamed Diagram')
})

test('delete asks via the in-app dialog, then removes the diagram', async ({ page }) => {
  await seedLegacy(page, 'First')
  await page.getByTestId('action-new').click()
  await page.getByTestId('title-input').fill('Second')
  await page.waitForTimeout(500)

  await page.getByTestId('action-documents').click()
  // Delete the non-current "First".
  const dialog = page.getByTestId('documents-dialog')
  const firstRow = dialog.locator('.graffel-doc-row', { hasText: 'First' })
  await firstRow.locator('[data-testid^="doc-delete-"]').click()
  // In-app confirm (not a native dialog).
  await expect(page.getByTestId('dialog-confirm')).toBeVisible()
  await page.getByTestId('dialog-ok').click()
  await expect(dialog.getByText('First')).toHaveCount(0)
  await expect(dialog.getByText('Second')).toBeVisible()
})

test('viewing a read-only (shared) diagram does NOT overwrite the local current doc', async ({ page }) => {
  await seedLegacy(page, 'My Local Work')
  const localId = await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { documentId: string } } } }
    return w.__graffel.useDiagramStore.getState().documentId
  })
  // Simulate a share view: readOnly + load a foreign document.
  await page.evaluate(() => {
    const w = window as unknown as { __graffel: { useDiagramStore: { getState: () => { setReadOnly: (v: boolean) => void; loadDocument: (d: unknown) => void } } } }
    const st = w.__graffel.useDiagramStore.getState()
    st.setReadOnly(true)
    st.loadDocument({
      format: 'graffel', schemaVersion: 1, id: '01HXSHAREDXXXXXXXXXXXXXXXX',
      metadata: { title: 'Someone Elses Diagram', createdAt: '2026-06-12T00:00:00Z', updatedAt: '2026-06-12T00:00:00Z', appVersion: 'dev' },
      viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [], reserved: { remote: null, ops: null },
    })
  })
  await page.waitForTimeout(700) // longer than the autosave debounce
  // The library's current pointer must still be the user's own document.
  const currentId = await page.evaluate((key) => {
    const idx = JSON.parse(localStorage.getItem(key) ?? '{}') as { currentId?: string }
    return idx.currentId ?? null
  }, LIBRARY_KEY)
  expect(currentId).toBe(localId)
  // And the shared doc was never written to the library.
  const sharedStored = await ls(page, 'graffel.doc.v1.01HXSHAREDXXXXXXXXXXXXXXXX')
  expect(sharedStored).toBeNull()
})
