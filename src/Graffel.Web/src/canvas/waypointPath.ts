// Polyline SVG path through source → waypoints → target.
// Per ADR-0004: each waypoint is a corner the user placed; segments between consecutive
// points are straight lines. The user owns the routing.

export interface Point { x: number; y: number }

export function buildWaypointPath(
  source: Point,
  waypoints: Point[],
  target: Point,
): string {
  const points = [source, ...waypoints, target]
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')
}

export function segmentMidpoints(
  source: Point,
  waypoints: Point[],
  target: Point,
): Array<{ x: number; y: number; segmentIndex: number }> {
  const points = [source, ...waypoints, target]
  const mids: Array<{ x: number; y: number; segmentIndex: number }> = []
  for (let i = 0; i < points.length - 1; i++) {
    mids.push({
      x: (points[i]!.x + points[i + 1]!.x) / 2,
      y: (points[i]!.y + points[i + 1]!.y) / 2,
      segmentIndex: i,
    })
  }
  return mids
}

/** Total length of a polyline through the given points. */
export function pathLength(points: Point[]): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += Math.hypot(points[i + 1]!.x - points[i]!.x, points[i + 1]!.y - points[i]!.y)
  }
  return total
}

/**
 * The point at fraction `t` (0–1) of the way along a polyline, measured by
 * arc length. Clamped to the endpoints; a zero-length path returns its start.
 */
export function pointAtFraction(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]!
  const clamped = Math.max(0, Math.min(1, t))
  const total = pathLength(points)
  if (total === 0) return points[0]!
  let target = total * clamped
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (target <= seg || i === points.length - 2) {
      const f = seg === 0 ? 0 : target / seg
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    target -= seg
  }
  return points[points.length - 1]!
}

/** The fraction (0–1) along a polyline closest to an arbitrary point. */
export function fractionAtPoint(points: Point[], p: Point): number {
  if (points.length < 2) return 0.5
  const total = pathLength(points)
  if (total === 0) return 0.5
  let acc = 0
  let best = { dist: Infinity, frac: 0 }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!
    const dx = b.x - a.x, dy = b.y - a.y
    const seg = Math.hypot(dx, dy)
    if (seg > 0) {
      const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (seg * seg)))
      const proj = { x: a.x + dx * u, y: a.y + dy * u }
      const dist = Math.hypot(p.x - proj.x, p.y - proj.y)
      if (dist < best.dist) best = { dist, frac: (acc + u * seg) / total }
    }
    acc += seg
  }
  return best.frac
}

export const WAYPOINT_GRID = 8

function snap(n: number): number {
  const r = Math.round(n / WAYPOINT_GRID) * WAYPOINT_GRID
  return r === 0 ? 0 : r // collapse -0 to 0
}

export function snapToGrid(p: Point): Point {
  return { x: snap(p.x), y: snap(p.y) }
}
