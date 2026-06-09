import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import type { EdgeType } from '../format/types'
import { useEdgeMenuStore } from './edgeMenuStore'
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
    markerStart,
    markerEnd,
    label,
    data,
  } = props

  const waypoints = ((data as WaypointEdgeData)?.waypoints ?? []) as Point[]
  const routingMode = (data as WaypointEdgeData)?.routingMode ?? 'orthogonal'
  const source = { x: sourceX, y: sourceY }
  const target = { x: targetX, y: targetY }

  let path: string
  let labelX: number
  let labelY: number
  if (waypoints.length > 0) {
    // User-owned routing: straight segments between waypoints.
    path = buildWaypointPath(source, waypoints, target)
    const pts = [source, ...waypoints, target]
    const mid = pts[Math.floor(pts.length / 2)]!
    labelX = mid.x; labelY = mid.y
  } else if (routingMode === 'straight') {
    [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  } else if (routingMode === 'bezier') {
    [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  } else {
    [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  }

  const readOnly = useDiagramStore((s) => s.readOnly)
  const openMenu = useEdgeMenuStore((s) => s.openAt)

  function onContextMenu(e: React.MouseEvent<SVGPathElement>) {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    openMenu(id, e.clientX, e.clientY)
  }

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerStart={markerStart} markerEnd={markerEnd} interactionWidth={20} />
      {/* Extra invisible-but-clickable path widens the context-menu hit area. */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: readOnly ? 'none' : 'stroke', cursor: 'context-menu' }}
        onContextMenu={onContextMenu}
        data-testid={`edge-hitbox-${id}`}
      />
      <EdgeLabel edgeId={id} x={labelX} y={labelY} label={typeof label === 'string' ? label : ''} readOnly={readOnly} />
      {selected && !readOnly ? (
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

/** Connector label rendered at the path midpoint; double-click to edit inline. */
function EdgeLabel({ edgeId, x, y, label, readOnly }: { edgeId: string; x: number; y: number; label: string; readOnly: boolean }) {
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setDraft(label) }, [label])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  // Nothing to show and nothing being edited → render nothing (no empty chip).
  if (!editing && !label) return null

  function commit() {
    if (draft !== label) updateEdgeLabel(edgeId, draft)
    setEditing(false)
  }

  return (
    <EdgeLabelRenderer>
      <div
        className="graffel-edge-label"
        style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, pointerEvents: readOnly ? 'none' : 'all' }}
        onDoubleClick={(e) => { if (!readOnly) { e.stopPropagation(); setEditing(true) } }}
        data-testid={`edge-label-${edgeId}`}
      >
        {editing ? (
          <input
            ref={inputRef}
            className="graffel-edge-label-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit() }
              if (e.key === 'Escape') { setDraft(label); setEditing(false) }
            }}
            autoFocus
            data-testid={`edge-label-input-${edgeId}`}
          />
        ) : (
          <span>{label}</span>
        )}
      </div>
    </EdgeLabelRenderer>
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
