// Floating-edge geometry (v3.19 Connector mastery).
//
// Instead of pinning an edge to a fixed handle (top/right/bottom/left), a floating
// edge attaches to the point on a node's perimeter that lies on the straight line
// between the two node centers. The attachment then slides cleanly around the
// silhouette as either node moves — no more connectors stabbing through a box or
// dangling off a corner.

export interface Point { x: number; y: number }
/** Absolute-flow rect: top-left origin + size. */
export interface Rect { x: number; y: number; width: number; height: number }
export type Side = 'top' | 'right' | 'bottom' | 'left'

export function rectCenter(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

/**
 * The point where the ray from `rect`'s center toward `towards` crosses the rect
 * boundary, plus which side it crosses. Degenerate (towards === center) → center.
 */
export function rectPerimeterPoint(rect: Rect, towards: Point): { point: Point; side: Side } {
  const c = rectCenter(rect)
  const dx = towards.x - c.x
  const dy = towards.y - c.y
  if (dx === 0 && dy === 0) return { point: c, side: 'right' }

  const hw = rect.width / 2
  const hh = rect.height / 2
  // Scale factor to reach the vertical / horizontal edge along the ray.
  const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity
  const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity
  const t = Math.min(tx, ty)

  const point = { x: c.x + dx * t, y: c.y + dy * t }
  // The smaller scale is the binding edge. Ties (corner) resolve to the
  // horizontal side, which reads better for mostly-horizontal layouts.
  let side: Side
  if (tx <= ty) side = dx > 0 ? 'right' : 'left'
  else side = dy > 0 ? 'bottom' : 'top'
  return { point, side }
}

/**
 * Which silhouette side of each node faces the other — used to auto-select a
 * shape's real connection anchor (keeping the line on the drawn silhouette)
 * rather than a free perimeter point in the bounding-box margin.
 */
export function chooseSides(source: Rect, target: Rect): { sourceSide: Side; targetSide: Side } {
  const f = floatingEndpoints(source, target)
  return { sourceSide: f.sourceSide, targetSide: f.targetSide }
}

/** Perimeter attachment points + sides for an edge between two node rects. */
export function floatingEndpoints(source: Rect, target: Rect): {
  source: Point
  target: Point
  sourceSide: Side
  targetSide: Side
} {
  const sc = rectCenter(source)
  const tc = rectCenter(target)
  const s = rectPerimeterPoint(source, tc)
  const t = rectPerimeterPoint(target, sc)
  return { source: s.point, target: t.point, sourceSide: s.side, targetSide: t.side }
}
