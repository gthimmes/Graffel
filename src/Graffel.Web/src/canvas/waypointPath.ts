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

export const WAYPOINT_GRID = 8

function snap(n: number): number {
  const r = Math.round(n / WAYPOINT_GRID) * WAYPOINT_GRID
  return r === 0 ? 0 : r // collapse -0 to 0
}

export function snapToGrid(p: Point): Point {
  return { x: snap(p.x), y: snap(p.y) }
}
