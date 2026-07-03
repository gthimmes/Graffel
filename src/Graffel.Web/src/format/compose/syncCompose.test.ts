import { describe, expect, it } from 'vitest'
import { syncComposeGraph } from './syncCompose'
import { buildComposeGraph, composeNodeId } from './buildComposeGraph'
import { parseCompose } from './parseCompose'
import type { GraffelEdge, GraffelNode } from '../types'

function build(yaml: string) {
  return buildComposeGraph(parseCompose(yaml))
}

const V1 = `services:
  web:
    image: nginx
    depends_on: [db]
  db:
    image: postgres`

describe('syncComposeGraph', () => {
  it('preserves the manual position/size/style of unchanged services', () => {
    const existing = build(V1)
    // Simulate manual editing: move web, resize it, give db a custom style.
    const moved = existing.nodes.map((n) =>
      n.id === composeNodeId('web')
        ? { ...n, position: { x: 999, y: 777 }, size: { w: 300, h: 120 }, data: { label: 'web', style: { fill: 'hotpink' } } }
        : n,
    )

    const fresh = build(V1) // same source, freshly generated at the origin
    const result = syncComposeGraph({ nodes: moved, edges: existing.edges }, fresh)

    const web = result.nodes.find((n) => n.id === composeNodeId('web'))!
    expect(web.position).toEqual({ x: 999, y: 777 })
    expect(web.size).toEqual({ w: 300, h: 120 })
    expect(web.data.style).toEqual({ fill: 'hotpink' })
    expect(result.diff.unchanged.sort()).toEqual([composeNodeId('db'), composeNodeId('web')].sort())
    expect(result.diff.added).toEqual([])
    expect(result.diff.removed).toEqual([])
  })

  it('adds a new service and stages it clear of the existing content', () => {
    const existing = build(V1)
    const bumped = existing.nodes.map((n) => ({ ...n, position: { x: 0, y: 0 }, size: { w: 100, h: 100 } }))
    const fresh = build(`services:
  web:
    image: nginx
    depends_on: [db, cache]
  db:
    image: postgres
  cache:
    image: redis`)

    const result = syncComposeGraph({ nodes: bumped, edges: existing.edges }, fresh)
    expect(result.diff.added).toEqual([composeNodeId('cache')])
    const cache = result.nodes.find((n) => n.id === composeNodeId('cache'))!
    // Placed below the existing bounding box (existing max y = 0 + 100), so > 100.
    expect(cache.position.y).toBeGreaterThan(100)
    // The new depends_on edge web→cache is present.
    expect(result.edges.some((e) => e.source === composeNodeId('web') && e.target === composeNodeId('cache'))).toBe(true)
  })

  it('removes a service that is gone from the source, plus its edges', () => {
    const existing = build(V1)
    const fresh = build(`services:
  web:
    image: nginx`)
    const result = syncComposeGraph({ nodes: existing.nodes, edges: existing.edges }, fresh)
    expect(result.diff.removed).toEqual([composeNodeId('db')])
    expect(result.nodes.some((n) => n.id === composeNodeId('db'))).toBe(false)
    // The web→db edge went with it.
    expect(result.edges.some((e) => e.target === composeNodeId('db'))).toBe(false)
  })

  it('reports a service whose inferred shape changed, and updates it', () => {
    const existing = build(`services:
  store:
    image: postgres`)
    const moved = existing.nodes.map((n) => ({ ...n, position: { x: 42, y: 42 } }))
    const fresh = build(`services:
  store:
    image: redis`)
    const result = syncComposeGraph({ nodes: moved, edges: [] }, fresh)
    expect(result.diff.changed).toEqual([composeNodeId('store')])
    const store = result.nodes.find((n) => n.id === composeNodeId('store'))!
    expect(store.type).toBe('arch-core:cache') // shape updated to the new image
    expect(store.position).toEqual({ x: 42, y: 42 }) // ...but layout preserved
  })

  it('never touches hand-added (non-compose) nodes or edges', () => {
    const existing = build(V1)
    const manualNode: GraffelNode = {
      id: 'n_manual', type: 'basic:rectangle', parentId: null,
      position: { x: 5, y: 5 }, size: { w: 80, h: 40 }, data: { label: 'note' },
    }
    const manualEdge: GraffelEdge = {
      id: 'e_manual', source: 'n_manual', target: composeNodeId('web'),
      sourceHandle: 'right', targetHandle: 'left', type: 'orthogonal', data: { label: '' },
    }
    const fresh = build(`services:
  web:
    image: nginx`) // db removed
    const result = syncComposeGraph(
      { nodes: [...existing.nodes, manualNode], edges: [...existing.edges, manualEdge] },
      fresh,
    )
    // Manual node + edge survive; they aren't in the diff at all.
    expect(result.nodes.some((n) => n.id === 'n_manual')).toBe(true)
    expect(result.edges.some((e) => e.id === 'e_manual')).toBe(true)
    expect(result.diff.removed).toEqual([composeNodeId('db')])
  })

  it('drops edges left dangling by a removal even if hand-drawn', () => {
    const existing = build(V1)
    const dangling: GraffelEdge = {
      id: 'e_dangling', source: composeNodeId('db'), target: 'n_ghost',
      sourceHandle: 'right', targetHandle: 'left', type: 'orthogonal', data: { label: '' },
    }
    const fresh = build(`services:
  web:
    image: nginx`) // db removed → e_dangling now references a gone node
    const result = syncComposeGraph(
      { nodes: existing.nodes, edges: [...existing.edges, dangling] },
      fresh,
    )
    expect(result.edges.some((e) => e.id === 'e_dangling')).toBe(false)
  })
})
