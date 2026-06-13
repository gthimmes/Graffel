import { createEmptyDocument } from '../format/graffelFile'
import type { EdgeType, GraffelDocument, GraffelEdge, GraffelNode, HandleSide } from '../format/types'

// v3.18 — starter templates for the empty canvas. Each builds a real
// GraffelDocument so a first-time user lands on something meaningful in one
// click. The architecture template intentionally nests services inside an
// enterable container, so drill-down (the differentiator) is discovered in the
// first ten seconds.

export interface Template {
  id: string
  name: string
  description: string
  /** Emoji/glyph for the card. */
  glyph: string
  build: () => GraffelDocument
}

type NodeSpec = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  label?: string
  parentId?: string | null
}
type EdgeSpec = {
  id: string
  source: string
  target: string
  sourceHandle?: HandleSide
  targetHandle?: HandleSide
  type?: EdgeType
  label?: string
}

function node(s: NodeSpec): GraffelNode {
  return {
    id: s.id,
    type: s.type,
    parentId: s.parentId ?? null,
    position: { x: s.x, y: s.y },
    size: { w: s.w, h: s.h },
    data: { label: s.label ?? '' },
  }
}

function edge(s: EdgeSpec): GraffelEdge {
  return {
    id: s.id,
    source: s.source,
    sourceHandle: s.sourceHandle ?? 'right',
    target: s.target,
    targetHandle: s.targetHandle ?? 'left',
    type: s.type ?? 'orthogonal',
    data: { label: s.label ?? '', waypoints: [] },
  }
}

function doc(title: string, nodes: NodeSpec[], edges: EdgeSpec[]): GraffelDocument {
  const d = createEmptyDocument()
  d.metadata.title = title
  d.nodes = nodes.map(node)
  d.edges = edges.map(edge)
  return d
}

export const TEMPLATES: Template[] = [
  {
    id: 'architecture',
    name: 'Web service architecture',
    description: 'A web client, an API cluster you can double-click into, and a database. Try drilling into the cluster.',
    glyph: '🏗️',
    build: () =>
      doc(
        'Web service architecture',
        [
          { id: 'web', type: 'arch-core:client', x: 80, y: 280, w: 130, h: 95, label: 'Web App' },
          // Enterable container holding the cluster internals.
          { id: 'api', type: 'arch-core:boundary', x: 320, y: 150, w: 430, h: 360, label: 'API Cluster' },
          { id: 'gw', type: 'arch-core:api-gateway', x: 155, y: 40, w: 120, h: 90, label: 'Gateway', parentId: 'api' },
          { id: 'auth', type: 'arch-core:service', x: 40, y: 180, w: 120, h: 90, label: 'Auth', parentId: 'api' },
          { id: 'bill', type: 'arch-core:service', x: 270, y: 180, w: 120, h: 90, label: 'Billing', parentId: 'api' },
          { id: 'db', type: 'arch-core:database', x: 155, y: 255, w: 120, h: 95, label: 'Ledger DB', parentId: 'api' },
          { id: 'mail', type: 'arch-core:external', x: 880, y: 290, w: 140, h: 85, label: 'Email Provider' },
        ],
        [
          { id: 'e1', source: 'web', target: 'api', type: 'straight' },
          { id: 'e2', source: 'gw', sourceHandle: 'bottom', target: 'auth', targetHandle: 'top' },
          { id: 'e3', source: 'gw', sourceHandle: 'bottom', target: 'bill', targetHandle: 'top' },
          { id: 'e4', source: 'auth', sourceHandle: 'bottom', target: 'db', targetHandle: 'left' },
          { id: 'e5', source: 'bill', sourceHandle: 'bottom', target: 'db', targetHandle: 'right' },
          { id: 'e6', source: 'bill', target: 'mail', type: 'straight' },
        ],
      ),
  },
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'A start → process → decision → end skeleton, ready to relabel.',
    glyph: '🔀',
    build: () =>
      doc(
        'Flowchart',
        [
          { id: 's', type: 'flow:terminator', x: 300, y: 80, w: 160, h: 70, label: 'Start' },
          { id: 'p', type: 'flow:process', x: 300, y: 210, w: 160, h: 80, label: 'Do the work' },
          { id: 'd', type: 'basic:diamond', x: 300, y: 350, w: 180, h: 120, label: 'OK?' },
          { id: 'e', type: 'flow:terminator', x: 300, y: 540, w: 160, h: 70, label: 'End' },
          { id: 'r', type: 'flow:process', x: 560, y: 360, w: 160, h: 80, label: 'Handle error' },
        ],
        [
          { id: 'f1', source: 's', sourceHandle: 'bottom', target: 'p', targetHandle: 'top' },
          { id: 'f2', source: 'p', sourceHandle: 'bottom', target: 'd', targetHandle: 'top' },
          { id: 'f3', source: 'd', sourceHandle: 'bottom', target: 'e', targetHandle: 'top', label: 'yes' },
          { id: 'f4', source: 'd', sourceHandle: 'right', target: 'r', targetHandle: 'left', label: 'no' },
          { id: 'f5', source: 'r', sourceHandle: 'top', target: 'p', targetHandle: 'right' },
        ],
      ),
  },
  {
    id: 'microservices',
    name: 'Microservices (nested)',
    description: 'Two service domains, each an enterable container. Great for layered system maps.',
    glyph: '📦',
    build: () =>
      doc(
        'Microservices',
        [
          { id: 'gw', type: 'arch-core:api-gateway', x: 360, y: 60, w: 140, h: 95, label: 'Gateway' },
          { id: 'orders', type: 'arch-core:boundary', x: 120, y: 240, w: 320, h: 240, label: 'Orders domain' },
          { id: 'osvc', type: 'arch-core:service', x: 40, y: 70, w: 120, h: 90, label: 'Orders API', parentId: 'orders' },
          { id: 'odb', type: 'arch-core:database', x: 180, y: 70, w: 110, h: 95, label: 'Orders DB', parentId: 'orders' },
          { id: 'pay', type: 'arch-core:boundary', x: 520, y: 240, w: 320, h: 240, label: 'Payments domain' },
          { id: 'psvc', type: 'arch-core:service', x: 40, y: 70, w: 120, h: 90, label: 'Payments API', parentId: 'pay' },
          { id: 'pq', type: 'arch-core:queue', x: 170, y: 75, w: 120, h: 80, label: 'Events', parentId: 'pay' },
        ],
        [
          { id: 'm1', source: 'gw', sourceHandle: 'bottom', target: 'orders', targetHandle: 'top' },
          { id: 'm2', source: 'gw', sourceHandle: 'bottom', target: 'pay', targetHandle: 'top' },
          { id: 'm3', source: 'osvc', sourceHandle: 'right', target: 'odb', targetHandle: 'left' },
          { id: 'm4', source: 'psvc', sourceHandle: 'right', target: 'pq', targetHandle: 'left' },
        ],
      ),
  },
]

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
