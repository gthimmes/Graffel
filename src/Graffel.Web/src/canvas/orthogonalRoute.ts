// Obstacle-aware orthogonal connector routing (v3.19 Connector mastery).
//
// Given two endpoints and a set of obstacle rects, produce an axis-aligned
// polyline that bends around the obstacles instead of slicing through them, while
// minimising the number of corners (and, as a tiebreak, total length).
//
// Strategy: a Hanan-style lattice. Candidate grid lines are drawn at every
// obstacle's inflated edges plus the two endpoints, with an outer "escape ring"
// so a path around everything always exists. Lattice segments that cut through an
// inflated obstacle are forbidden; a bend-penalised Dijkstra finds the cleanest
// route. Returns null when no route exists (caller falls back to a simple curve).
//
// The two endpoints' own nodes must be EXCLUDED from `obstacles` by the caller —
// an edge naturally touches the boxes it connects.

import type { Point } from './floating'

export interface Rect { x: number; y: number; width: number; height: number }

interface RouteOpts {
  /** Clearance kept around every obstacle (px). Default 10. */
  margin?: number
}

/** Does an axis-aligned segment a→b pass through the OPEN interior of `rect`? */
export function segmentCrossesRect(a: Point, b: Point, rect: Rect): boolean {
  const left = rect.x, right = rect.x + rect.width
  const top = rect.y, bottom = rect.y + rect.height
  if (a.y === b.y) {
    const y = a.y
    if (y <= top || y >= bottom) return false
    const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x)
    return hi > left && lo < right
  }
  // vertical (a.x === b.x); diagonal inputs are not expected here
  const x = a.x
  if (x <= left || x >= right) return false
  const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y)
  return hi > top && lo < bottom
}

function inflate(r: Rect, m: number): Rect {
  return { x: r.x - m, y: r.y - m, width: r.width + 2 * m, height: r.height + 2 * m }
}

function uniqSorted(values: number[]): number[] {
  return [...new Set(values)].sort((p, q) => p - q)
}

const BEND_PENALTY = 1e6

export function routeOrthogonal(
  source: Point,
  target: Point,
  obstacles: Rect[],
  opts: RouteOpts = {},
): Point[] | null {
  if (source.x === target.x && source.y === target.y) return [source]
  const margin = opts.margin ?? 10
  const infl = obstacles.map((o) => inflate(o, margin))

  // Candidate grid lines: endpoints + inflated obstacle edges + an escape ring.
  const xsRaw = [source.x, target.x]
  const ysRaw = [source.y, target.y]
  for (const r of infl) {
    xsRaw.push(r.x, r.x + r.width)
    ysRaw.push(r.y, r.y + r.height)
  }
  const ring = margin > 0 ? margin : 10
  xsRaw.push(Math.min(...xsRaw) - ring, Math.max(...xsRaw) + ring)
  ysRaw.push(Math.min(...ysRaw) - ring, Math.max(...ysRaw) + ring)
  const xs = uniqSorted(xsRaw)
  const ys = uniqSorted(ysRaw)

  const nx = xs.length, ny = ys.length
  const idx = (i: number, j: number) => i * ny + j
  const xi = new Map(xs.map((v, i) => [v, i]))
  const yi = new Map(ys.map((v, j) => [v, j]))

  const startI = xi.get(source.x)!, startJ = yi.get(source.y)!
  const goalI = xi.get(target.x)!, goalJ = yi.get(target.y)!
  const start = idx(startI, startJ)
  const goal = idx(goalI, goalJ)

  const pointAt = (n: number): Point => ({ x: xs[Math.floor(n / ny)]!, y: ys[n % ny]! })
  const clear = (a: Point, b: Point) => !infl.some((r) => segmentCrossesRect(a, b, r))

  // Neighbours of a lattice node: the adjacent node along each axis if the
  // connecting segment is clear of every inflated obstacle.
  function neighbours(n: number): Array<{ to: number; dir: 1 | 2; len: number }> {
    const i = Math.floor(n / ny), j = n % ny
    const here = pointAt(n)
    const out: Array<{ to: number; dir: 1 | 2; len: number }> = []
    const steps: Array<[number, number, 1 | 2]> = [
      [i - 1, j, 1], [i + 1, j, 1], // horizontal moves
      [i, j - 1, 2], [i, j + 1, 2], // vertical moves
    ]
    for (const [ni, nj, dir] of steps) {
      if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) continue
      const m = idx(ni, nj)
      const there = pointAt(m)
      if (!clear(here, there)) continue
      out.push({ to: m, dir, len: Math.abs(there.x - here.x) + Math.abs(there.y - here.y) })
    }
    return out
  }

  // Dijkstra over states (node, incomingDir): 0 = none/start, 1 = H, 2 = V.
  const stateKey = (n: number, d: number) => n * 3 + d
  const dist = new Map<number, number>()
  const prev = new Map<number, number>() // stateKey -> previous stateKey
  const heap = new MinHeap()
  const s0 = stateKey(start, 0)
  dist.set(s0, 0)
  heap.push(0, s0)

  let goalState = -1
  while (heap.size > 0) {
    const { cost, key } = heap.pop()!
    if (cost > (dist.get(key) ?? Infinity)) continue
    const node = Math.floor(key / 3)
    const dir = key % 3
    if (node === goal) { goalState = key; break }
    for (const nb of neighbours(node)) {
      const bend = dir !== 0 && dir !== nb.dir ? BEND_PENALTY : 0
      const nc = cost + bend + nb.len
      const nk = stateKey(nb.to, nb.dir)
      if (nc < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nc)
        prev.set(nk, key)
        heap.push(nc, nk)
      }
    }
  }

  if (goalState < 0) return null

  // Reconstruct, then collapse collinear runs.
  const pts: Point[] = []
  let cur: number | undefined = goalState
  while (cur !== undefined) {
    pts.push(pointAt(Math.floor(cur / 3)))
    cur = prev.get(cur)
  }
  pts.reverse()
  return simplify(pts)
}

/** Drop midpoints that lie on a straight run between their neighbours. */
function simplify(pts: Point[]): Point[] {
  if (pts.length <= 2) return pts
  const out: Point[] = [pts[0]!]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1]!, b = pts[i]!, c = pts[i + 1]!
    const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)
    if (!collinear) out.push(b)
  }
  out.push(pts[pts.length - 1]!)
  return out
}

/** Tiny binary min-heap keyed by numeric cost. */
class MinHeap {
  private costs: number[] = []
  private keys: number[] = []
  get size(): number { return this.costs.length }
  push(cost: number, key: number): void {
    this.costs.push(cost); this.keys.push(key)
    let i = this.costs.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.costs[p]! <= this.costs[i]!) break
      this.swap(i, p); i = p
    }
  }
  pop(): { cost: number; key: number } | undefined {
    if (this.costs.length === 0) return undefined
    const cost = this.costs[0]!, key = this.keys[0]!
    const lastC = this.costs.pop()!, lastK = this.keys.pop()!
    if (this.costs.length > 0) {
      this.costs[0] = lastC; this.keys[0] = lastK
      let i = 0
      const n = this.costs.length
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2
        let smallest = i
        if (l < n && this.costs[l]! < this.costs[smallest]!) smallest = l
        if (r < n && this.costs[r]! < this.costs[smallest]!) smallest = r
        if (smallest === i) break
        this.swap(i, smallest); i = smallest
      }
    }
    return { cost, key }
  }
  private swap(a: number, b: number): void {
    ;[this.costs[a], this.costs[b]] = [this.costs[b]!, this.costs[a]!]
    ;[this.keys[a], this.keys[b]] = [this.keys[b]!, this.keys[a]!]
  }
}
