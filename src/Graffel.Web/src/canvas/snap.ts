// v3.9 alignment + snap geometry. Pure functions, no React or DOM.
//
// Given a dragged rect and other visible rects, decide where the dragged rect
// should "land" and which alignment guides should be drawn during the drag.
// Edge/center alignment beats grid; Alt-held caller passes disabled=true and
// gets identity back.
//
// v3.9.1 extends this with equal-spacing snap (fast-follow): when a dragged
// node sits between two row/column-aligned neighbors with mismatched gaps,
// nudge it so the gaps match. Edge/center alignment still wins on ties.

export const SNAP_THRESHOLD = 4
export const GRID_SIZE = 8
/** Maximum spread (max-min) of centerY across a row of rects that still
 *  counts as "in a row" for equal-spacing snap. */
export const ROW_TOLERANCE = 8

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface IdRect extends Rect {
  id: string
}

export type GuideKind = 'edge' | 'center' | 'spacing'

/**
 * Edge/center guide: a single line at `position` spanning `range` on the other axis.
 * Spacing guide: a line drawn at `perpendicular` (the median row/column coord)
 *   spanning `span` on the main axis — i.e. it sits across one gap.
 */
export type Guide =
  | { kind: 'edge' | 'center'; axis: 'x' | 'y'; position: number; range: [number, number] }
  | { kind: 'spacing'; axis: 'x' | 'y'; perpendicular: number; span: [number, number] }

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

type Axis = 'x' | 'y'

// A snap candidate carries the offset to apply and the guide(s) to render.
// kindPriority is used for tiebreaking: higher wins when |delta| is equal.
// center(2) > edge(1) > spacing(0).
interface Candidate {
  delta: number
  guides: Guide[]
  kindPriority: number
}

// For axis='x' we use the rect's horizontal lines (left/center/right).
// For axis='y' we use the rect's vertical lines (top/middle/bottom).
function lines(rect: Rect, axis: Axis): Array<{ value: number; kind: 'edge' | 'center' }> {
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

function centerX(r: Rect): number { return r.x + r.w / 2 }
function centerY(r: Rect): number { return r.y + r.h / 2 }

// Collect every edge↔edge and center↔center alignment candidate within threshold.
function collectAlignCandidates(
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
          const guide = buildAlignGuide(axis, ol.value, draggedRect, delta, otherRects, dl.kind)
          out.push({
            delta,
            guides: [guide],
            // center beats edge on tie; both beat spacing.
            kindPriority: dl.kind === 'center' ? 2 : 1,
          })
        }
      }
    }
  }
  return out
}

// Build the visible edge/center guide spanning the dragged rect plus all
// other rects that share the chosen position on this axis.
function buildAlignGuide(
  axis: Axis,
  position: number,
  draggedRect: Rect,
  delta: number,
  otherRects: IdRect[],
  draggedKind: 'edge' | 'center',
): Guide {
  const draggedAfter: Rect = {
    x: axis === 'x' ? draggedRect.x + delta : draggedRect.x,
    y: axis === 'y' ? draggedRect.y + delta : draggedRect.y,
    w: draggedRect.w,
    h: draggedRect.h,
  }
  const participating: Rect[] = [draggedAfter]
  for (const o of otherRects) {
    if (lines(o, axis).some((l) => l.value === position)) {
      participating.push(o)
    }
  }
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
  return { kind: draggedKind, axis, position, range: [min, max] }
}

// Collect equal-spacing candidates: for every pair of other rects (P, Q)
// such that they sit on opposite sides of the dragged rect along `axis` and
// all three are row/column-aligned within ROW_TOLERANCE, propose a delta
// that equalizes the two edge-to-edge gaps.
function collectSpacingCandidates(
  draggedRect: Rect,
  otherRects: IdRect[],
  axis: Axis,
  threshold: number,
): Candidate[] {
  const out: Candidate[] = []
  const dCenterPerp = axis === 'x' ? centerY(draggedRect) : centerX(draggedRect)
  // Prune to rects within row tolerance of the dragged rect on the perpendicular axis.
  const inRow = otherRects.filter((o) => {
    const oc = axis === 'x' ? centerY(o) : centerX(o)
    return Math.abs(oc - dCenterPerp) <= ROW_TOLERANCE
  })
  if (inRow.length < 2) return out

  // Split by which side of the dragged rect they sit on.
  const dStart = axis === 'x' ? draggedRect.x              : draggedRect.y
  const dEnd   = axis === 'x' ? draggedRect.x + draggedRect.w : draggedRect.y + draggedRect.h
  const leftSide: IdRect[] = []
  const rightSide: IdRect[] = []
  for (const o of inRow) {
    const oStart = axis === 'x' ? o.x         : o.y
    const oEnd   = axis === 'x' ? o.x + o.w   : o.y + o.h
    if (oEnd < dStart) leftSide.push(o)
    else if (oStart > dEnd) rightSide.push(o)
    // else: overlaps the dragged rect on this axis — skip.
  }
  if (leftSide.length === 0 || rightSide.length === 0) return out

  for (const L of leftSide) {
    const Lend = axis === 'x' ? L.x + L.w : L.y + L.h
    for (const R of rightSide) {
      const Rstart = axis === 'x' ? R.x : R.y
      const gap1 = dStart - Lend
      const gap2 = Rstart - dEnd
      // Also require row spread across all three (L, dragged, R) within tolerance.
      const lc = axis === 'x' ? centerY(L) : centerX(L)
      const rc = axis === 'x' ? centerY(R) : centerX(R)
      const spread = Math.max(lc, rc, dCenterPerp) - Math.min(lc, rc, dCenterPerp)
      if (spread > ROW_TOLERANCE) continue

      const delta = (gap2 - gap1) / 2
      if (Math.abs(delta) > threshold) continue

      // After applying delta, both gaps become (gap1 + gap2) / 2.
      const dStartAfter = dStart + delta
      const dEndAfter   = dEnd + delta
      const perpendicular = (lc + rc + dCenterPerp) / 3   // median-ish
      const span1: [number, number] = [Lend, dStartAfter]
      const span2: [number, number] = [dEndAfter, Rstart]
      const guides: Guide[] = [
        { kind: 'spacing', axis, perpendicular, span: span1 },
        { kind: 'spacing', axis, perpendicular, span: span2 },
      ]
      out.push({ delta, guides, kindPriority: 0 })
    }
  }
  return out
}

// Pick the best candidate: smallest |delta| wins; on tie, higher kindPriority
// (center > edge > spacing) wins.
function pickBest(cands: Candidate[]): Candidate | null {
  if (cands.length === 0) return null
  let best = cands[0]!
  for (let i = 1; i < cands.length; i++) {
    const c = cands[i]!
    const cAbs = Math.abs(c.delta)
    const bAbs = Math.abs(best.delta)
    if (cAbs < bAbs) best = c
    else if (cAbs === bAbs && c.kindPriority > best.kindPriority) best = c
  }
  return best
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

  const xCands = [
    ...collectAlignCandidates(draggedRect, otherRects, 'x', threshold),
    ...collectSpacingCandidates(draggedRect, otherRects, 'x', threshold),
  ]
  const yCands = [
    ...collectAlignCandidates(draggedRect, otherRects, 'y', threshold),
    ...collectSpacingCandidates(draggedRect, otherRects, 'y', threshold),
  ]
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

  if (bestX) guides.push(...bestX.guides)
  if (bestY) guides.push(...bestY.guides)

  return {
    offset: { x: offsetX, y: offsetY },
    position: { x: draggedRect.x + offsetX, y: draggedRect.y + offsetY },
    guides,
  }
}
