// v3.9 alignment + snap geometry. Pure functions, no React or DOM.
//
// Given a dragged rect and other visible rects, decide where the dragged rect
// should "land" and which alignment guides should be drawn during the drag.
// Edge/center alignment beats grid; Alt-held caller passes disabled=true and
// gets identity back.

export const SNAP_THRESHOLD = 4
export const GRID_SIZE = 8

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface IdRect extends Rect {
  id: string
}

export type GuideKind = 'edge' | 'center'

export interface Guide {
  /** 'x' = vertical line at constant x; 'y' = horizontal line at constant y. */
  axis: 'x' | 'y'
  position: number
  /** Extent of the line along the other axis: [min, max]. */
  range: [number, number]
  kind: GuideKind
}

export interface SnapInput {
  draggedRect: Rect
  otherRects: IdRect[]
  threshold?: number
  gridSize?: number | null
  disabled?: boolean
}

export interface SnapResult {
  offset: { x: number; y: number }
  /** Convenience: draggedRect top-left after applying offset. */
  position: { x: number; y: number }
  guides: Guide[]
}

// One candidate alignment between a target line on the dragged rect and a
// matching line on some other rect. delta is the position adjustment to apply
// to the dragged rect to land the alignment.
interface Candidate {
  delta: number
  /** Where the guide line sits in the world (the matched coordinate). */
  position: number
  /** Whether the dragged side of the candidate is a center or an edge. */
  draggedKind: GuideKind
  otherRect: IdRect
}

type Axis = 'x' | 'y'

// For axis='x' we use the rect's horizontal lines (left/center/right).
// For axis='y' we use the rect's vertical lines (top/middle/bottom).
function lines(rect: Rect, axis: Axis): Array<{ value: number; kind: GuideKind }> {
  if (axis === 'x') {
    return [
      { value: rect.x,              kind: 'edge'   },
      { value: rect.x + rect.w / 2, kind: 'center' },
      { value: rect.x + rect.w,     kind: 'edge'   },
    ]
  }
  return [
    { value: rect.y,              kind: 'edge'   },
    { value: rect.y + rect.h / 2, kind: 'center' },
    { value: rect.y + rect.h,     kind: 'edge'   },
  ]
}

function collectCandidates(
  draggedRect: Rect,
  otherRects: IdRect[],
  axis: Axis,
  threshold: number,
): Candidate[] {
  const out: Candidate[] = []
  const draggedLines = lines(draggedRect, axis)
  for (const other of otherRects) {
    const otherLines = lines(other, axis)
    for (const dl of draggedLines) {
      for (const ol of otherLines) {
        const delta = ol.value - dl.value
        if (Math.abs(delta) <= threshold) {
          out.push({
            delta,
            position: ol.value,
            // Kind reflects which kind of line on the *dragged* rect is being
            // aligned. Centers beat edges in tie-breaking.
            draggedKind: dl.kind,
            otherRect: other,
          })
        }
      }
    }
  }
  return out
}

// Pick the best candidate: smallest |delta| wins; on tie, center beats edge.
function pickBest(cands: Candidate[]): Candidate | null {
  if (cands.length === 0) return null
  let best = cands[0]!
  for (let i = 1; i < cands.length; i++) {
    const c = cands[i]!
    const cAbs = Math.abs(c.delta)
    const bAbs = Math.abs(best.delta)
    if (cAbs < bAbs) {
      best = c
    } else if (cAbs === bAbs && c.draggedKind === 'center' && best.draggedKind !== 'center') {
      best = c
    }
  }
  return best
}

// Build a guide spanning the dragged rect plus all other rects that share
// the chosen position on this axis.
function buildGuide(
  axis: Axis,
  position: number,
  draggedRectAfter: Rect,
  otherRects: IdRect[],
  kind: GuideKind,
): Guide {
  // Find all other rects whose any line on this axis matches `position`.
  const participating: Rect[] = [draggedRectAfter]
  for (const o of otherRects) {
    if (lines(o, axis).some((l) => l.value === position)) {
      participating.push(o)
    }
  }
  // Range is the extent along the *other* axis.
  let min = Infinity
  let max = -Infinity
  for (const p of participating) {
    if (axis === 'x') {
      min = Math.min(min, p.y)
      max = Math.max(max, p.y + p.h)
    } else {
      min = Math.min(min, p.x)
      max = Math.max(max, p.x + p.w)
    }
  }
  return { axis, position, range: [min, max], kind }
}

function gridSnap(value: number, grid: number): number {
  const r = Math.round(value / grid) * grid
  return r === 0 ? 0 : r
}

export function computeSnap(input: SnapInput): SnapResult {
  const {
    draggedRect,
    otherRects,
    threshold = SNAP_THRESHOLD,
    gridSize = null,
    disabled = false,
  } = input

  if (disabled) {
    return {
      offset: { x: 0, y: 0 },
      position: { x: draggedRect.x, y: draggedRect.y },
      guides: [],
    }
  }

  const xCands = collectCandidates(draggedRect, otherRects, 'x', threshold)
  const yCands = collectCandidates(draggedRect, otherRects, 'y', threshold)
  const bestX = pickBest(xCands)
  const bestY = pickBest(yCands)

  let offsetX = 0
  let offsetY = 0
  const guides: Guide[] = []

  if (bestX) {
    offsetX = bestX.delta
  } else if (gridSize && gridSize > 0) {
    offsetX = gridSnap(draggedRect.x, gridSize) - draggedRect.x
  }

  if (bestY) {
    offsetY = bestY.delta
  } else if (gridSize && gridSize > 0) {
    offsetY = gridSnap(draggedRect.y, gridSize) - draggedRect.y
  }

  const draggedAfter: Rect = {
    x: draggedRect.x + offsetX,
    y: draggedRect.y + offsetY,
    w: draggedRect.w,
    h: draggedRect.h,
  }

  if (bestX) {
    guides.push(buildGuide('x', bestX.position, draggedAfter, otherRects, bestX.draggedKind))
  }
  if (bestY) {
    guides.push(buildGuide('y', bestY.position, draggedAfter, otherRects, bestY.draggedKind))
  }

  return {
    offset: { x: offsetX, y: offsetY },
    position: { x: draggedAfter.x, y: draggedAfter.y },
    guides,
  }
}
