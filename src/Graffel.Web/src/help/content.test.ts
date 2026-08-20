import { describe, expect, it } from 'vitest'
import { ContentStore, createSearchIndex, renderMarkdown } from 'help-navigator'
import { helpContent } from './content'
import { allMappedArticleIds, helpArticlesFor } from './context'

describe('help content integrity', () => {
  const articleIds = new Set(helpContent.articles.map((a) => a.id))
  const categoryIds = new Set((helpContent.categories ?? []).map((c) => c.id))

  it('has unique article and category ids', () => {
    expect(articleIds.size).toBe(helpContent.articles.length)
    expect(categoryIds.size).toBe(helpContent.categories?.length)
  })

  it('every article belongs to a declared category', () => {
    for (const a of helpContent.articles) {
      expect(
        categoryIds.has(a.category ?? ''),
        `"${a.id}" has bad category "${a.category}"`,
      ).toBe(true)
    }
  })

  it('every declared category has at least one article', () => {
    for (const c of helpContent.categories ?? []) {
      expect(
        helpContent.articles.some((a) => a.category === c.id),
        `category "${c.id}" is empty`,
      ).toBe(true)
    }
  })

  it('every related id resolves and never self-references', () => {
    for (const a of helpContent.articles) {
      for (const rel of a.related ?? []) {
        expect(articleIds.has(rel), `"${a.id}" relates to unknown "${rel}"`).toBe(true)
        expect(rel).not.toBe(a.id)
      }
    }
  })

  it('bodies are substantive and render to HTML', () => {
    for (const a of helpContent.articles) {
      expect(a.body.trim().length, `"${a.id}" body too short`).toBeGreaterThan(100)
      expect(renderMarkdown(a.body).length).toBeGreaterThan(0)
    }
  })

  it('has featured articles for the help home view', () => {
    expect(helpContent.articles.filter((a) => a.featured).length).toBeGreaterThanOrEqual(4)
  })

  it('loads into a ContentStore without errors', () => {
    const store = new ContentStore(helpContent)
    expect(store.articles.length).toBe(helpContent.articles.length)
  })
})

describe('route context map', () => {
  const articleIds = new Set(helpContent.articles.map((a) => a.id))

  it('every mapped article id exists in the content', () => {
    for (const id of allMappedArticleIds()) {
      expect(articleIds.has(id), `route map references unknown article "${id}"`).toBe(true)
    }
  })

  it('the editor gets first-diagram, connector, and keyboard help', () => {
    const editor = helpArticlesFor('/')
    expect(editor).toContain('first-diagram')
    expect(editor).toContain('drawing-connectors')
    expect(editor).toContain('keyboard-shortcuts')
  })

  it('the read-only share view gets share/drill/present help', () => {
    const share = helpArticlesFor('/v/abc123')
    expect(share).toContain('share-links')
    expect(share).toContain('drilldown')
    expect(share).toContain('walkthrough-mode')
    expect(share).not.toContain('first-diagram')
  })

  it('unknown routes fall back to the first-diagram tour', () => {
    expect(helpArticlesFor('/nope')).toEqual(['first-diagram'])
  })
})

describe('help search over the real corpus', () => {
  const index = createSearchIndex(
    helpContent.articles.map((a) => ({ id: a.id, title: a.title, body: a.body, tags: a.tags })),
  )

  const expectations: Array<[string, string]> = [
    ['waypoint', 'connector-geometry'],
    ['reconnect', 'drawing-connectors'],
    ['arrowhead dashed', 'connector-styling'],
    ['tidy up', 'alignment-tidy'],
    ['mermaid', 'mermaid-interop'],
    ['docker compose', 'compose-living'],
    ['drill', 'drilldown'],
    ['group container', 'containers-grouping'],
    ['dark mode', 'canvas-navigation'],
    ['shortcut', 'keyboard-shortcuts'],
    ['snapshot restore', 'version-history'],
    ['drive', 'google-drive'],
    ['revoke', 'share-links'],
    ['walkthrough present', 'walkthrough-mode'],
    ['aws pack', 'shape-library'],
    ['export svg', 'export-images'],
  ]

  for (const [query, expectedId] of expectations) {
    it(`"${query}" surfaces ${expectedId} near the top`, () => {
      const top = index.search(query, 3).map((r) => r.id)
      expect(top, `query "${query}" returned ${JSON.stringify(top)}`).toContain(expectedId)
    })
  }
})
