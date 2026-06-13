import { describe, expect, it } from 'vitest'
import type { GraffelEdge, GraffelNode } from '../format/types'
import {
  CLIPBOARD_FORMAT,
  buildFragment,
  isClipboardFragment,
  materializeFragment,
} from './clipboard'

function node(
  id: string,
  position: { x: number; y: number },
  parentId: string | null = null,
  type = 'basic:rectangle',
): GraffelNode {
  return { id, type, parentId, position, size: { w: 100, h: 60 }, data: { label: id } }
}

function edge(id: string, source: string, target: string): GraffelEdge {
  return { id, source, sourceHandle: 'right', target, targetHandle: 'left', type: 'straight', data: { label: '' } }
}

describe('buildFragment', () => {
  it('copies the selected nodes, normalizing root positions to the bbox origin', () => {
    const nodes = [node('a', { x: 100, y: 200 }), node('b', { x: 300, y: 250 })]
    const f = buildFragment(nodes, [], ['a', 'b'])
    expect(f.format).toBe(CLIPBOARD_FORMAT)
    expect(f.nodes.find((n) => n.id === 'a')!.position).toEqual({ x: 0, y: 0 })
    expect(f.nodes.find((n) => n.id === 'b')!.position).toEqual({ x: 200, y: 50 })
  })

  it('includes descendants of a copied container, keeping their relative positions', () => {
    const nodes = [
      node('box', { x: 100, y: 100 }, null, 'basic:group'),
      node('kid', { x: 30, y: 40 }, 'box'),
      node('outside', { x: 900, y: 900 }),
    ]
    const f = buildFragment(nodes, [], ['box'])
    expect(f.nodes.map((n) => n.id).sort()).toEqual(['box', 'kid'])
    expect(f.nodes.find((n) => n.id === 'kid')!.position).toEqual({ x: 30, y: 40 })
    expect(f.nodes.find((n) => n.id === 'kid')!.parentId).toBe('box')
  })

  it('keeps only edges with BOTH endpoints inside the copied set', () => {
    const nodes = [
      node('box', { x: 0, y: 0 }, null, 'basic:group'),
      node('k1', { x: 10, y: 10 }, 'box'),
      node('k2', { x: 200, y: 10 }, 'box'),
      node('outside', { x: 900, y: 900 }),
    ]
    const edges = [edge('in', 'k1', 'k2'), edge('cross', 'k1', 'outside')]
    const f = buildFragment(nodes, edges, ['box'])
    expect(f.edges.map((e) => e.id)).toEqual(['in'])
  })

  it('returns an empty fragment for an empty selection', () => {
    const f = buildFragment([node('a', { x: 0, y: 0 })], [], [])
    expect(f.nodes).toHaveLength(0)
    expect(f.edges).toHaveLength(0)
  })
})

describe('isClipboardFragment', () => {
  it('accepts what buildFragment produces and rejects foreign payloads', () => {
    const f = buildFragment([node('a', { x: 0, y: 0 })], [], ['a'])
    expect(isClipboardFragment(f)).toBe(true)
    expect(isClipboardFragment({ hello: 'world' })).toBe(false)
    expect(isClipboardFragment('text')).toBe(false)
    expect(isClipboardFragment(null)).toBe(false)
  })
})

describe('materializeFragment', () => {
  const idFor = (old: string) => `new_${old}`

  it('remaps ids and offsets roots by basePosition; nested children untouched', () => {
    const nodes = [
      node('box', { x: 100, y: 100 }, null, 'basic:group'),
      node('kid', { x: 30, y: 40 }, 'box'),
    ]
    const f = buildFragment(nodes, [], ['box'])
    const m = materializeFragment(f, { idFor, basePosition: { x: 500, y: 600 }, parentId: null })
    const box = m.nodes.find((n) => n.id === 'new_box')!
    const kid = m.nodes.find((n) => n.id === 'new_kid')!
    expect(box.position).toEqual({ x: 500, y: 600 }) // bbox-normalized root + base
    expect(box.parentId ?? null).toBeNull()
    expect(kid.parentId).toBe('new_box')
    expect(kid.position).toEqual({ x: 30, y: 40 })
  })

  it('parents pasted roots to the requested level (drill-down paste)', () => {
    const f = buildFragment([node('a', { x: 10, y: 10 })], [], ['a'])
    const m = materializeFragment(f, { idFor, basePosition: { x: 0, y: 0 }, parentId: 'lvl' })
    expect(m.nodes[0]!.parentId).toBe('lvl')
  })

  it('remaps edge endpoints and ids', () => {
    const nodes = [node('a', { x: 0, y: 0 }), node('b', { x: 200, y: 0 })]
    const f = buildFragment(nodes, [edge('e', 'a', 'b')], ['a', 'b'])
    const m = materializeFragment(f, { idFor, basePosition: { x: 0, y: 0 }, parentId: null })
    expect(m.edges).toHaveLength(1)
    expect(m.edges[0]!.id).toBe('new_e')
    expect(m.edges[0]!.source).toBe('new_a')
    expect(m.edges[0]!.target).toBe('new_b')
  })

  it('produces deep copies (mutating output does not touch the fragment)', () => {
    const f = buildFragment([node('a', { x: 0, y: 0 })], [], ['a'])
    const m = materializeFragment(f, { idFor, basePosition: { x: 0, y: 0 }, parentId: null })
    m.nodes[0]!.data.label = 'mutated'
    expect(f.nodes[0]!.data.label).toBe('a')
  })
})
