// Schema defined in docs/adr/0002-graffel-file-format.md
// schemaVersion: bump on breaking change; loaders refuse unknown future versions.

export const CURRENT_SCHEMA_VERSION = 1 as const

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
  type: NodeType
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
