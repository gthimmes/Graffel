/** A rectangle. For host: its viewport position; for selection rects: viewport
 *  positions from getBoundingClientRect; for the returned union: host-LOCAL. */
export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Union of the given viewport rects, expressed in host-local coordinates
 * (subtracting the host's top-left). Returns null when there are no rects.
 */
export function unionScreenBox(rects: Box[], host: Box): Box | null {
  if (rects.length === 0) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.left)
    minY = Math.min(minY, r.top)
    maxX = Math.max(maxX, r.left + r.width)
    maxY = Math.max(maxY, r.top + r.height)
  }
  return {
    left: minX - host.left,
    top: minY - host.top,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export interface Anchor {
  /** Host-local x of the box's horizontal center (toolbar centers on this). */
  x: number
  /** Host-local y the toolbar anchors to (its top edge when 'below', bottom when 'above'). */
  y: number
  placement: 'above' | 'below'
}

/**
 * Where to put the toolbar relative to a (host-local) selection box: above it
 * when there's vertical room, otherwise flipped below. The caller translates by
 * (-50%, -100%) for 'above' and (-50%, 0) for 'below', plus a small CSS gap.
 */
export function toolbarAnchor(box: Box, _host: Box, toolbarH: number): Anchor {
  const x = box.left + box.width / 2
  const roomAbove = box.top >= toolbarH
  return roomAbove
    ? { x, y: box.top, placement: 'above' }
    : { x, y: box.top + box.height, placement: 'below' }
}
