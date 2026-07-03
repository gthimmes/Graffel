import { describe, expect, it } from 'vitest'
import { buildComposeGraph, composeNodeId } from './buildComposeGraph'
import { parseCompose } from './parseCompose'

const SAMPLE = `
services:
  web:
    image: nginx
    depends_on:
      - api
  api:
    build: .
    depends_on:
      - db
      - cache
  db:
    image: postgres:15
  cache:
    image: redis
`

describe('buildComposeGraph', () => {
  it('creates one node per service with a stable, source-derived id', () => {
    const { nodes } = buildComposeGraph(parseCompose(SAMPLE))
    expect(nodes.map((n) => n.id).sort()).toEqual(
      ['api', 'cache', 'db', 'web'].map(composeNodeId).sort(),
    )
    // Re-building the same source yields identical ids (the basis for re-sync).
    const again = buildComposeGraph(parseCompose(SAMPLE))
    expect(again.nodes.map((n) => n.id)).toEqual(nodes.map((n) => n.id))
  })

  it('infers shapes from images', () => {
    const { nodes } = buildComposeGraph(parseCompose(SAMPLE))
    const byId = new Map(nodes.map((n) => [n.id, n]))
    expect(byId.get(composeNodeId('db'))!.type).toBe('arch-core:database')
    expect(byId.get(composeNodeId('cache'))!.type).toBe('arch-core:cache')
    expect(byId.get(composeNodeId('web'))!.type).toBe('arch-core:api-gateway')
    expect(byId.get(composeNodeId('api'))!.type).toBe('arch-core:service')
  })

  it('labels nodes with the service name', () => {
    const { nodes } = buildComposeGraph(parseCompose(SAMPLE))
    expect(nodes.find((n) => n.id === composeNodeId('db'))!.data.label).toBe('db')
  })

  it('draws a depends_on edge from the dependent to its dependency', () => {
    const { edges } = buildComposeGraph(parseCompose(SAMPLE))
    const pairs = edges.map((e) => `${e.source}->${e.target}`).sort()
    expect(pairs).toEqual(
      [
        `${composeNodeId('web')}->${composeNodeId('api')}`,
        `${composeNodeId('api')}->${composeNodeId('db')}`,
        `${composeNodeId('api')}->${composeNodeId('cache')}`,
      ].sort(),
    )
    // Edge ids are stable & source-derived too.
    expect(edges.every((e) => e.id.startsWith('ce:'))).toBe(true)
  })

  it('ignores depends_on that points at an undeclared service', () => {
    const { edges } = buildComposeGraph(
      parseCompose(`
services:
  web:
    image: nginx
    depends_on:
      - ghost
`),
    )
    expect(edges).toHaveLength(0)
  })

  it('gives nodes non-zero sizes from the shape registry', () => {
    const { nodes } = buildComposeGraph(parseCompose(SAMPLE))
    for (const n of nodes) {
      expect(n.size.w).toBeGreaterThan(0)
      expect(n.size.h).toBeGreaterThan(0)
    }
  })
})
