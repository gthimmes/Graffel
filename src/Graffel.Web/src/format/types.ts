// Schema defined in docs/adr/0002-graffel-file-format.md
// schemaVersion: bump on breaking change; loaders refuse unknown future versions.

export const CURRENT_SCHEMA_VERSION = 1 as const

/**
 * The v1 shape types. Still exported for backward-compat with callers that
 * predate the v3 shape registry. The store's `addNode` accepts any string
 * shapeId — the registry resolves both pack-qualified ids ('arch-core:service')
 * and legacy unqualified ids ('service') to the same shape definition.
 */
export type NodeType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'text'
  | 'service'
  | 'database'
  | 'queue'
  | 'boundary'

export type EdgeType = 'orthogonal' | 'straight' | 'bezier'
export type HandleSide = 'top' | 'right' | 'bottom' | 'left'

export interface GraffelNode {
  id: string
  /** Shape id from the registry. Either pack-qualified ('basic:rectangle') or a v1 legacy id ('rectangle'). */
  type: string
  /**
   * Containment parent (a container node's id) or null/absent for top-level.
   * When set, `position` is RELATIVE to the parent (matching React Flow), so
   * dragging the parent moves children without the child positions drifting.
   */
  parentId?: string | null
  position: { x: number; y: number }
  size: { w: number; h: number }
  data: {
    label: string
    style?: Record<string, unknown>
  }
}

export interface GraffelEdge {
  id: string
  source: string
  sourceHandle: HandleSide | null
  target: string
  targetHandle: HandleSide | null
  type: EdgeType
  data: {
    label: string
    style?: Record<string, unknown>
    waypoints?: Array<{ x: number; y: number }>
    /** Label position as a fraction (0–1) along the connector path. Default 0.5. */
    labelT?: number
  }
}

export interface GraffelDocument {
  format: 'graffel'
  schemaVersion: number
  id: string
  metadata: {
    title: string
    createdAt: string
    updatedAt: string
    appVersion: string
  }
  viewport: { x: number; y: number; zoom: number }
  nodes: GraffelNode[]
  edges: GraffelEdge[]
  reserved: {
    remote: unknown
    ops: unknown
  }
}
