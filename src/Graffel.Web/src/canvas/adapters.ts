import type {
  Edge as RFEdge,
  Node as RFNode,
} from '@xyflow/react'
import type {
  GraffelEdge,
  GraffelNode,
  HandleSide,
} from '../format/types'
import { strokeDashArray, type EdgeStyle } from '../format/style'
import { markerRef } from './EdgeMarkers'

export function toReactFlowNode(n: GraffelNode): RFNode {
  const rf: RFNode = {
    id: n.id,
    type: 'shape',
    position: { ...n.position },
    width: n.size.w,
    height: n.size.h,
    style: { width: n.size.w, height: n.size.h },
    data: {
      label: n.data.label,
      shapeId: n.type,
      width: n.size.w,
      height: n.size.h,
      style: n.data.style,
    },
  }
  // Nested nodes: React Flow keeps a child's position relative to its parent, so
  // dragging the parent moves the child. (Our store already stores child
  // positions relative to the parent, matching RF.) We deliberately do NOT set
  // extent:'parent' — that would trap the child inside the box and break the
  // "drag a shape out of the container to release it" interaction.
  if (n.parentId) {
    rf.parentId = n.parentId
  }
  return rf
}

export function toReactFlowEdge(e: GraffelEdge): RFEdge {
  const s = (e.data.style ?? {}) as EdgeStyle
  return {
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle ?? undefined,
    target: e.target,
    targetHandle: e.targetHandle ?? undefined,
    // Always our custom edge — it handles every routing mode + waypoints + selection handles.
    type: 'waypoint',
    label: e.data.label || undefined,
    data: {
      waypoints: e.data.waypoints ?? [],
      routingMode: e.type,
      labelT: e.data.labelT,
    },
    style: {
      stroke: s.strokeColor,
      strokeWidth: s.strokeWidth,
      strokeDasharray: strokeDashArray(s.strokeStyle),
    },
    markerStart: markerRef(s.markerStart, s.markerSize, 'start'),
    markerEnd:   markerRef(s.markerEnd,   s.markerSize, 'end'),
  }
}

export function isHandleSide(s: string | null | undefined): s is HandleSide {
  return s === 'top' || s === 'right' || s === 'bottom' || s === 'left'
}
