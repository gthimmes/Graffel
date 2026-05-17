import { describe, expect, it } from 'vitest'
import {
  createEmptyDocument,
  parseDocument,
  serializeDocument,
} from './graffelFile'
import { CURRENT_SCHEMA_VERSION } from './types'

describe('graffelFile', () => {
  describe('createEmptyDocument', () => {
    it('produces a document with current schema version and the graffel format tag', () => {
      const doc = createEmptyDocument()
      expect(doc.format).toBe('graffel')
      expect(doc.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
      expect(doc.nodes).toEqual([])
      expect(doc.edges).toEqual([])
    })

    it('assigns a ULID-shaped id', () => {
      const doc = createEmptyDocument()
      // ULID = 26 chars, Crockford base32
      expect(doc.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    })

    it('sets reserved.remote and reserved.ops to null (v1)', () => {
      const doc = createEmptyDocument()
      expect(doc.reserved.remote).toBeNull()
      expect(doc.reserved.ops).toBeNull()
    })
  })

  describe('serialize / parse round-trip', () => {
    it('round-trips an empty document losslessly', () => {
      const doc = createEmptyDocument()
      const json = serializeDocument(doc)
      const parsed = parseDocument(json)
      expect(parsed).toEqual(doc)
    })

    it('round-trips a document with nodes and edges', () => {
      const doc = createEmptyDocument()
      doc.nodes.push({
        id: 'n_1',
        type: 'service',
        position: { x: 10, y: 20 },
        size: { w: 160, h: 80 },
        data: { label: 'API' },
      })
      doc.nodes.push({
        id: 'n_2',
        type: 'database',
        position: { x: 300, y: 100 },
        size: { w: 120, h: 80 },
        data: { label: 'Postgres' },
      })
      doc.edges.push({
        id: 'e_1',
        source: 'n_1',
        sourceHandle: 'right',
        target: 'n_2',
        targetHandle: 'left',
        type: 'orthogonal',
        data: { label: 'reads' },
      })
      const parsed = parseDocument(serializeDocument(doc))
      expect(parsed).toEqual(doc)
    })

    it('produces pretty-printed JSON (2-space indent, newlines)', () => {
      const doc = createEmptyDocument()
      const json = serializeDocument(doc)
      expect(json).toContain('\n')
      expect(json).toMatch(/^\{\n  "format"/)
    })
  })

  describe('parseDocument rejection', () => {
    it('throws when format tag is missing', () => {
      expect(() => parseDocument('{}')).toThrow(/format/i)
    })

    it('throws when schemaVersion is higher than current (forward-incompatible)', () => {
      const doc = createEmptyDocument()
      const tampered = JSON.stringify({
        ...doc,
        schemaVersion: CURRENT_SCHEMA_VERSION + 100,
      })
      expect(() => parseDocument(tampered)).toThrow(/schema version/i)
    })

    it('throws when input is not valid JSON', () => {
      expect(() => parseDocument('not json')).toThrow()
    })
  })
})
