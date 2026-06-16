// Container auto-grow (v3.20). When a child sits at (or past) a container's edge,
// the container grows to keep it comfortably inside. Children are stored relative
// to the container, so growing past the LEFT/TOP edge also shifts the container's
// origin and offsets every child to compensate (keeping them visually put).

export interface Box { position: { x: number; y: number }; size: { w: number; h: number } }

export interface FitResult {
  /** New container position (relative to ITS parent). */
  position: { x: number; y: number }
  size: { w: number; h: number }
  /** Add this to every child's relative position to keep it visually fixed. */
  childDelta: { x: number; y: number }
}

export const CONTAINER_PADDING = 24

/**
 * Compute the container box (and any child offset) needed to hold all children
 * with `padding` clearance. Returns null when nothing needs to change — only
 * grows, never shrinks.
 */
export function fitContainer(container: Box, children: Box[], padding = CONTAINER_PADDING): FitResult | null {
  if (children.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const c of children) {
    minX = Math.min(minX, c.position.x)
    minY = Math.min(minY, c.position.y)
    maxX = Math.max(maxX, c.position.x + c.size.w)
    maxY = Math.max(maxY, c.position.y + c.size.h)
  }

  // How far the content pokes past the top/left padding line (≥ 0).
  const shiftX = Math.max(0, padding - minX)
  const shiftY = Math.max(0, padding - minY)
  // Width/height that fits the content + padding on the far edges (never shrink).
  const newW = Math.max(container.size.w, maxX + shiftX + padding)
  const newH = Math.max(container.size.h, maxY + shiftY + padding)

  if (shiftX === 0 && shiftY === 0 && newW === container.size.w && newH === container.size.h) {
    return null
  }
  return {
    position: { x: container.position.x - shiftX, y: container.position.y - shiftY },
    size: { w: newW, h: newH },
    childDelta: { x: shiftX, y: shiftY },
  }
}
