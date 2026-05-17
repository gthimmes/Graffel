import { ulid } from 'ulid'
import {
  CURRENT_SCHEMA_VERSION,
  type GraffelDocument,
} from './types'

const APP_VERSION = '0.1.0'

export function createEmptyDocument(): GraffelDocument {
  const now = new Date().toISOString()
  return {
    format: 'graffel',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    id: ulid(),
    metadata: {
      title: 'Untitled diagram',
      createdAt: now,
      updatedAt: now,
      appVersion: APP_VERSION,
    },
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    edges: [],
    reserved: { remote: null, ops: null },
  }
}

export function serializeDocument(doc: GraffelDocument): string {
  return JSON.stringify(doc, null, 2)
}

export function parseDocument(json: string): GraffelDocument {
  const raw = JSON.parse(json) as unknown
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid graffel file: expected JSON object')
  }
  const obj = raw as Record<string, unknown>
  if (obj.format !== 'graffel') {
    throw new Error('Invalid graffel file: missing or wrong format tag')
  }
  if (typeof obj.schemaVersion !== 'number') {
    throw new Error('Invalid graffel file: missing schema version')
  }
  if (obj.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version ${obj.schemaVersion}; this build supports up to ${CURRENT_SCHEMA_VERSION}`,
    )
  }
  // Future: run migrations for schemaVersion < CURRENT.
  return obj as unknown as GraffelDocument
}
