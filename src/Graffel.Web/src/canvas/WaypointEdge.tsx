import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  useReactFlow,
  useStoreApi,
  type EdgeProps,
  type InternalNode,
  type Node,
} from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDiagramStore } from '../store/diagramStore'
import type { EdgeType } from '../format/types'
import { useEdgeMenuStore } from './edgeMenuStore'
import type { Point, Rect } from './floating'
import { routeOrthogonal } from './orthogonalRoute'
import {
  buildWaypointPath,
  fractionAtPoint,
  pointAtFraction,
  segmentMidpoints,
  snapToGrid,
} from './waypointPath'

interface WaypointEdgeData extends Record<string, unknown> {
  waypoints?: Point[]
  routingMode?: EdgeType
  labelT?: number
}

const ROUTE_MARGIN = 12

function rectOf(n: InternalNode<Node> | undefined): Rect | null {
  if (!n) return null
  const p = n.internals.positionAbsolute
  const w = n.measured?.width
  const h = n.measured?.height
  if (p == null || w == null || h == null) return null
  return { x: p.x, y: p.y, width: w, height: h }
}

export function WaypointEdge(props: EdgeProps) {
  const {
    id,
    source: sourceId,
    target: targetId,
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
  const labelT = (data as WaypointEdgeData)?.labelT ?? 0.5

  // The endpoint coords (sourceX/Y, targetX/Y) come from React Flow, which
  // places them on the silhouette anchor of the facing side chosen in
  // DiagramCanvas — and React Flow only changes them (re-rendering this edge)
  // when THIS edge's own endpoints move. Obstacle rects are read imperatively
  // from the store at compute time (via the stable store API) rather than
  // subscribed to, so an unrelated node moving elsewhere doesn't re-run every
  // edge's router. Net effect: dragging a node only re-routes its incident edges.
  const storeApi = useStoreApi()

  const geom = useMemo(() => {
    const s = { x: sourceX, y: sourceY }
    const t = { x: targetX, y: targetY }

    // Manual waypoints are an explicit override — the user owns that routing.
    if (waypoints.length > 0) {
      const pts = [s, ...waypoints, t]
      return { path: buildWaypointPath(s, waypoints, t), points: pts, source: s, target: t }
    }

    if (routingMode === 'orthogonal') {
      // Only nearby siblings can realistically block the run — bound the
      // obstacle set (and thus the routing lattice) to keep it cheap.
      const pad = 80
      const bx0 = Math.min(s.x, t.x) - pad, bx1 = Math.max(s.x, t.x) + pad
      const by0 = Math.min(s.y, t.y) - pad, by1 = Math.max(s.y, t.y) + pad
      const obstacles: Rect[] = []
      for (const [nid, n] of storeApi.getState().nodeLookup) {
        if (nid === sourceId || nid === targetId) continue
        const r = rectOf(n)
        if (!r) continue
        if (r.x + r.width < bx0 || r.x > bx1 || r.y + r.height < by0 || r.y > by1) continue
        obstacles.push(r)
      }
      const route = routeOrthogonal(s, t, obstacles, { margin: ROUTE_MARGIN })
      if (route && route.length >= 2) {
        return { path: buildWaypointPath(route[0]!, route.slice(1, -1), route[route.length - 1]!), points: route, source: s, target: t }
      }
      // No clean orthogonal route — fall back to a smooth step so the edge still
      // renders sensibly.
      const [p] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
      return { path: p, points: [s, t], source: s, target: t }
    }

    if (routingMode === 'bezier') {
      const [p] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
      return { path: p, points: [s, t], source: s, target: t }
    }
    // straight
    return { path: buildWaypointPath(s, [], t), points: [s, t], source: s, target: t }
  }, [waypoints, routingMode, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, storeApi, sourceId, targetId])

  const labelPos = pointAtFraction(geom.points, labelT)

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
      <BaseEdge id={id} path={geom.path} style={style} markerStart={markerStart} markerEnd={markerEnd} interactionWidth={20} />
      {/* Extra invisible-but-clickable path widens the context-menu hit area. */}
      <path
        d={geom.path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: readOnly ? 'none' : 'stroke', cursor: 'context-menu' }}
        onContextMenu={onContextMenu}
        data-testid={`edge-hitbox-${id}`}
      />
      <EdgeLabel
        edgeId={id}
        x={labelPos.x}
        y={labelPos.y}
        label={typeof label === 'string' ? label : ''}
        pathPoints={geom.points}
        readOnly={readOnly}
      />
      {selected && !readOnly ? (
        <WaypointHandles
          edgeId={id}
          source={geom.source}
          target={geom.target}
          waypoints={waypoints}
        />
      ) : null}
    </>
  )
}

/**
 * Connector label rendered at a fraction along the path; double-click to edit
 * inline, drag to slide it anywhere along the connector.
 */
function EdgeLabel({ edgeId, x, y, label, pathPoints, readOnly }: {
  edgeId: string
  x: number
  y: number
  label: string
  pathPoints: Point[]
  readOnly: boolean
}) {
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel)
  const setEdgeLabelT = useDiagramStore((s) => s.setEdgeLabelT)
  const { screenToFlowPosition } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const draggingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setDraft(label) }, [label])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  // Nothing to show and nothing being edited → render nothing (no empty chip).
  if (!editing && !label) return null

  function commit() {
    if (draft !== label) updateEdgeLabel(edgeId, draft)
    setEditing(false)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (readOnly || editing || e.button !== 0) return
    e.stopPropagation()
    draggingRef.current = false
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)

    function onMove(ev: PointerEvent) {
      draggingRef.current = true
      const flow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
      setEdgeLabelT(edgeId, fractionAtPoint(pathPoints, flow))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <EdgeLabelRenderer>
      <div
        className={`graffel-edge-label${readOnly || editing ? '' : ' is-draggable'}`}
        style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, pointerEvents: readOnly ? 'none' : 'all' }}
        onPointerDown={onPointerDown}
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
