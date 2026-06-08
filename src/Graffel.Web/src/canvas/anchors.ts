// Connection-anchor geometry.
//
// Shape icons are drawn into a square 0–100 viewBox. Container shapes stretch to
// fill the node box (preserveAspectRatio="none" → fit "fill"); pictogram shapes
// are scaled-to-fit and centered (preserveAspectRatio="xMidYMid meet" → fit
// "contain"), which letterboxes the icon when the node box isn't square.
//
// Connection handles are positioned as a percentage of the node *box*, but their
// anchor points are authored in *viewBox* coordinates (so they sit on the drawn
// silhouette). Under "contain" the two coordinate spaces diverge — this module
// maps a viewBox anchor to the on-screen box percentage so the handle (and the
// edge that attaches to it) lands on the actual icon edge instead of floating in
// the letterbox margin.

export type Fit = 'fill' | 'contain'

/** A connection anchor in the shape's 0–100 viewBox coordinate space. */
export interface Anchor {
  x: number
  y: number
}

/** Anchors used when a shape declares no per-side overrides: the box-edge midpoints. */
export const DEFAULT_ANCHORS: Record<'top' | 'right' | 'bottom' | 'left', Anchor> = {
  top:    { x: 50, y: 0 },
  right:  { x: 100, y: 50 },
  bottom: { x: 50, y: 100 },
  left:   { x: 0, y: 50 },
}

/**
 * Map a viewBox anchor (0–100) to a node-box percentage (0–100), accounting for
 * the preserveAspectRatio letterboxing implied by `fit`.
 */
export function anchorToBoxPercent(
  a: Anchor,
  size: { w: number; h: number },
  fit: Fit,
): { left: number; top: number } {
  if (fit === 'fill' || size.w <= 0 || size.h <= 0) {
    return { left: a.x, top: a.y }
  }
  // "contain": uniform scale to the smaller dimension, centered.
  const scale = Math.min(size.w, size.h) / 100
  const rendered = 100 * scale
  const offsetX = (size.w - rendered) / 2
  const offsetY = (size.h - rendered) / 2
  const px = offsetX + a.x * scale
  const py = offsetY + a.y * scale
  return { left: (px / size.w) * 100, top: (py / size.h) * 100 }
}
