import { describe, expect, it } from 'vitest'
import { TEMPLATES, getTemplate } from './templates'
import { resolveIsContainer } from '../shapes/registry'
import { getShape } from '../shapes/registry'

describe('starter templates', () => {
  it('exposes at least three templates, each with id/name/description', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(3)
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
    }
  })

  it('every template builds a structurally valid, non-empty graffel document', () => {
    for (const t of TEMPLATES) {
      const doc = t.build()
      expect(doc.format).toBe('graffel')
      expect(doc.schemaVersion).toBe(1)
      expect(doc.id).toBeTruthy()
      expect(doc.nodes.length).toBeGreaterThan(0)
      // Node ids are unique and edges reference real nodes.
      const ids = new Set(doc.nodes.map((n) => n.id))
      expect(ids.size).toBe(doc.nodes.length)
      for (const e of doc.edges) {
        expect(ids.has(e.source)).toBe(true)
        expect(ids.has(e.target)).toBe(true)
      }
      // parentId, when present, points at a real (container) node.
      for (const n of doc.nodes) {
        if (n.parentId) {
          expect(ids.has(n.parentId)).toBe(true)
          expect(resolveIsContainer(getShape(doc.nodes.find((p) => p.id === n.parentId)!.type))).toBe(true)
        }
      }
    }
  })

  it('builds fresh document ids each call (no library-overwrite collisions)', () => {
    const t = TEMPLATES[0]!
    expect(t.build().id).not.toBe(t.build().id)
  })

  it('the architecture template is drillable — a container with children', () => {
    const arch = getTemplate('architecture')
    expect(arch).toBeTruthy()
    const doc = arch!.build()
    const container = doc.nodes.find((n) => resolveIsContainer(getShape(n.type)))
    expect(container).toBeTruthy()
    const children = doc.nodes.filter((n) => n.parentId === container!.id)
    expect(children.length).toBeGreaterThanOrEqual(2)
  })

  it('getTemplate returns undefined for an unknown id', () => {
    expect(getTemplate('nope')).toBeUndefined()
  })
})
