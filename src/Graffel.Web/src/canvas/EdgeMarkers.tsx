import type { EdgeMarker, MarkerSize } from '../format/style'

/**
 * One offscreen SVG that defines every marker × size × end-orientation combo.
 * Edges reference these via url(#graffel-{marker}-{size}-{role}).
 *
 * `context-stroke` makes the marker inherit the edge's stroke color so a red
 * line gets a red arrowhead. Supported in all modern browsers (Chromium,
 * Firefox, Safari 16+).
 */

const SIZES: MarkerSize[] = ['sm', 'md', 'lg']
const MARKERS: EdgeMarker[] = [
  'arrow', 'arrow-open',
  'triangle', 'triangle-filled',
  'diamond', 'diamond-filled',
  'circle', 'circle-filled',
]

interface MarkerBox { width: number; height: number; refX: number; refY: number; viewBox: string }

function box(size: MarkerSize): MarkerBox {
  const dim = size === 'sm' ? 6 : size === 'lg' ? 10 : 8
  return { width: dim, height: dim, refX: dim - 1, refY: dim / 2, viewBox: `0 0 ${dim} ${dim}` }
}

/** Marker id factory. Role distinguishes start vs end so we can orient correctly. */
export function markerId(marker: EdgeMarker, size: MarkerSize, role: 'start' | 'end'): string {
  return `graffel-${marker}-${size}-${role}`
}

/**
 * The marker id to put on a React Flow edge's markerStart/markerEnd, or
 * undefined for 'none'. React Flow itself wraps this id as `url('#<id>')` when
 * it renders the edge — so we must pass the BARE id here, not a `url(#...)`
 * string (doing so double-wraps it into an unresolvable reference).
 */
export function markerRef(marker: EdgeMarker | undefined, size: MarkerSize | undefined, role: 'start' | 'end'): string | undefined {
  if (!marker || marker === 'none') return undefined
  return markerId(marker, size ?? 'md', role)
}

export function EdgeMarkerDefs() {
  return (
    <svg
      width={0}
      height={0}
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        {SIZES.flatMap((s) =>
          MARKERS.flatMap((m) => (
            (['start', 'end'] as const).map((role) => (
              <MarkerEl key={`${m}-${s}-${role}`} marker={m} size={s} role={role} />
            ))
          )),
        )}
      </defs>
    </svg>
  )
}

function MarkerEl({ marker, size, role }: { marker: EdgeMarker; size: MarkerSize; role: 'start' | 'end' }) {
  const b = box(size)
  const id = markerId(marker, size, role)
  // start markers point inward toward the path's tail; "auto-start-reverse"
  // handles the rotation. end markers use "auto".
  const orient = role === 'start' ? 'auto-start-reverse' : 'auto'
  const SW = Math.max(b.width / 6, 0.8)

  let body: React.ReactNode
  switch (marker) {
    case 'arrow':
      body = <path d={`M 0 0 L ${b.width} ${b.height / 2} L 0 ${b.height} z`} fill="context-stroke" stroke="none" />
      break
    case 'arrow-open':
      body = (
        <polyline
          points={`0,0 ${b.width},${b.height / 2} 0,${b.height}`}
          fill="none" stroke="context-stroke" strokeWidth={SW} strokeLinejoin="miter" strokeLinecap="butt"
        />
      )
      break
    case 'triangle':
      body = <path d={`M 0 0 L ${b.width} ${b.height / 2} L 0 ${b.height} z`} fill="white" stroke="context-stroke" strokeWidth={SW} />
      break
    case 'triangle-filled':
      body = <path d={`M 0 0 L ${b.width} ${b.height / 2} L 0 ${b.height} z`} fill="context-stroke" stroke="none" />
      break
    case 'diamond':
      body = <polygon points={`0,${b.height / 2} ${b.width / 2},0 ${b.width},${b.height / 2} ${b.width / 2},${b.height}`} fill="white" stroke="context-stroke" strokeWidth={SW} />
      break
    case 'diamond-filled':
      body = <polygon points={`0,${b.height / 2} ${b.width / 2},0 ${b.width},${b.height / 2} ${b.width / 2},${b.height}`} fill="context-stroke" stroke="none" />
      break
    case 'circle': {
      const r = b.width / 2 - SW
      body = <circle cx={b.width / 2} cy={b.height / 2} r={r} fill="white" stroke="context-stroke" strokeWidth={SW} />
      break
    }
    case 'circle-filled': {
      const r = b.width / 2 - SW * 0.5
      body = <circle cx={b.width / 2} cy={b.height / 2} r={r} fill="context-stroke" stroke="none" />
      break
    }
    default:
      body = null
  }

  // For diamonds and circles the refX needs to be at the edge of the marker,
  // not 1px shy of it, so the line doesn't show through the open marker fill.
  let refX = b.refX
  if (marker === 'diamond' || marker === 'diamond-filled') refX = b.width
  if (marker === 'circle' || marker === 'circle-filled')   refX = b.width

  return (
    <marker
      id={id}
      viewBox={b.viewBox}
      refX={refX}
      refY={b.refY}
      markerWidth={b.width}
      markerHeight={b.height}
      orient={orient}
      markerUnits="userSpaceOnUse"
    >
      {body}
    </marker>
  )
}
