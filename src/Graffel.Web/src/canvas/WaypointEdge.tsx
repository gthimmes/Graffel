import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { useDiagramStore } from '../store/diagramStore'
import type { EdgeType } from '../format/types'
import {
  buildWaypointPath,
  segmentMidpoints,
  snapToGrid,
  type Point,
} from './waypointPath'

interface WaypointEdgeData extends Record<string, unknown> {
  waypoints?: Point[]
  routingMode?: EdgeType
}

export function WaypointEdge(props: EdgeProps) {
  const {
    id,
    sourceX, sourceY,
    targetX, targetY,
    sourcePosition, targetPosition,
    selected,
    style,
    markerEnd,
    data,
  } = props

  const waypoints = ((data as WaypointEdgeData)?.waypoints ?? []) as Point[]
  const routingMode = (data as WaypointEdgeData)?.routingMode ?? 'orthogonal'
  const source = { x: sourceX, y: sourceY }
  const target = { x: targetX, y: targetY }

  let path: string
  if (waypoints.length > 0) {
    // User-owned routing: straight segments between waypoints.
    path = buildWaypointPath(source, waypoints, target)
  } else if (routingMode === 'straight') {
    [path] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  } else if (routingMode === 'bezier') {
    [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  } else {
    [path] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  }

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} interactionWidth={20} />
      {selected ? (
        <WaypointHandles
          edgeId={id}
          source={source}
          target={target}
          waypoints={waypoints}
        />
      ) : null}
    </>
  )
}

function WaypointHandles({
  edgeId,
  source,
  target,
  waypoints,
}: {
  edgeId: string
  source: Point
  target: Point
  waypoints: Point[]
}) {
  const mids = segmentMidpoints(source, waypoints, target)

  return (
    <g className="graffel-waypoint-handles" data-testid={`waypoint-handles-${edgeId}`}>
      {waypoints.map((p, i) => (
        <WaypointHandle
          key={`wp-${i}`}
          edgeId={edgeId}
          mode="real"
          index={i}
          x={p.x}
          y={p.y}
        />
      ))}
      {mids.map((m) => (
        <WaypointHandle
          key={`mid-${m.segmentIndex}`}
          edgeId={edgeId}
          mode="ghost"
          index={m.segmentIndex}
          x={m.x}
          y={m.y}
        />
      ))}
    </g>
  )
}

interface HandleProps {
  edgeId: string
  mode: 'real' | 'ghost'
  index: number
  x: number
  y: number
}

function WaypointHandle({ edgeId, mode, index, x, y }: HandleProps) {
  const moveEdgeWaypoint = useDiagramStore((s) => s.moveEdgeWaypoint)
  const addEdgeWaypoint = useDiagramStore((s) => s.addEdgeWaypoint)
  const removeEdgeWaypoint = useDiagramStore((s) => s.removeEdgeWaypoint)
  const { screenToFlowPosition } = useReactFlow()

  function onPointerDown(e: React.PointerEvent<SVGCircleElement>) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as SVGCircleElement).setPointerCapture(e.pointerId)

    // For ghost handles: convert to a real waypoint at this segment, then drag it.
    let dragIndex = index
    if (mode === 'ghost') {
      addEdgeWaypoint(edgeId, { x, y }, index)
      dragIndex = index
    }

    function onMove(ev: PointerEvent) {
      const flow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
      moveEdgeWaypoint(edgeId, dragIndex, snapToGrid(flow))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function onContextMenu(e: React.MouseEvent<SVGCircleElement>) {
    if (mode !== 'real') return
    e.preventDefault()
    e.stopPropagation()
    removeEdgeWaypoint(edgeId, index)
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={mode === 'real' ? 6 : 5}
      className={`graffel-waypoint-handle is-${mode}`}
      data-testid={`waypoint-handle-${edgeId}-${mode}-${index}`}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    />
  )
}
