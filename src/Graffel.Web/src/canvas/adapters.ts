import type {
  Edge as RFEdge,
  Node as RFNode,
} from '@xyflow/react'
import type {
  GraffelEdge,
  GraffelNode,
  HandleSide,
} from '../format/types'
import type { EdgeStyle } from '../format/style'

export function toReactFlowNode(n: GraffelNode): RFNode {
  return {
    id: n.id,
    type: 'shape',
    position: { ...n.position },
    width: n.size.w,
    height: n.size.h,
    style: { width: n.size.w, height: n.size.h },
    data: {
      label: n.data.label,
      shapeType: n.type,
      width: n.size.w,
      height: n.size.h,
      style: n.data.style,
    },
  }
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
    },
    style: {
      stroke: s.strokeColor,
      strokeWidth: s.strokeWidth,
    },
  }
}

export function isHandleSide(s: string | null | undefined): s is HandleSide {
  return s === 'top' || s === 'right' || s === 'bottom' || s === 'left'
}
