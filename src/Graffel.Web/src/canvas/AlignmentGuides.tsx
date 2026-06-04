import { useViewport, ViewportPortal } from '@xyflow/react'
import type { Guide } from './snap'

const CENTER_COLOR  = '#22d3ee'   // cyan-400
const EDGE_COLOR    = '#f472b6'   // pink-400
const SPACING_COLOR = '#fb923c'   // orange-400

export function AlignmentGuides({ guides }: { guides: Guide[] }) {
  const { zoom } = useViewport()
  if (guides.length === 0) return null
  // Keep visual stroke width constant on screen regardless of zoom.
  const stroke = 1 / Math.max(zoom, 0.01)
  // Tick mark length on screen (pre-zoom).
  const tickFlow = 6 / Math.max(zoom, 0.01)

  return (
    <ViewportPortal>
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        width={0}
        height={0}
        data-testid="alignment-guides"
      >
        {guides.map((g, i) => {
          if (g.kind === 'spacing') {
            // Spacing guide: line along the gap with two end ticks.
            const color = SPACING_COLOR
            const [a, b] = g.span
            if (g.axis === 'x') {
              const y = g.perpendicular
              return (
                <g key={i} data-testid="align-guide-spacing" data-kind="spacing" data-axis="x">
                  <line x1={a} y1={y} x2={b} y2={y} stroke={color} strokeWidth={stroke} />
                  <line x1={a} y1={y - tickFlow / 2} x2={a} y2={y + tickFlow / 2} stroke={color} strokeWidth={stroke} />
                  <line x1={b} y1={y - tickFlow / 2} x2={b} y2={y + tickFlow / 2} stroke={color} strokeWidth={stroke} />
                </g>
              )
            }
            const x = g.perpendicular
            return (
              <g key={i} data-testid="align-guide-spacing" data-kind="spacing" data-axis="y">
                <line x1={x} y1={a} x2={x} y2={b} stroke={color} strokeWidth={stroke} />
                <line x1={x - tickFlow / 2} y1={a} x2={x + tickFlow / 2} y2={a} stroke={color} strokeWidth={stroke} />
                <line x1={x - tickFlow / 2} y1={b} x2={x + tickFlow / 2} y2={b} stroke={color} strokeWidth={stroke} />
              </g>
            )
          }
          // Edge/center guide: single line at the matched coordinate.
          const color = g.kind === 'center' ? CENTER_COLOR : EDGE_COLOR
          if (g.axis === 'x') {
            return (
              <line
                key={i}
                data-testid={`align-guide-x-${g.position}`}
                data-kind={g.kind}
                x1={g.position}
                y1={g.range[0]}
                x2={g.position}
                y2={g.range[1]}
                stroke={color}
                strokeWidth={stroke}
              />
            )
          }
          return (
            <line
              key={i}
              data-testid={`align-guide-y-${g.position}`}
              data-kind={g.kind}
              x1={g.range[0]}
              y1={g.position}
              x2={g.range[1]}
              y2={g.position}
              stroke={color}
              strokeWidth={stroke}
            />
          )
        })}
      </svg>
    </ViewportPortal>
  )
}
