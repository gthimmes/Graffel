import { useViewport, ViewportPortal } from '@xyflow/react'
import type { Guide } from './snap'

const CENTER_COLOR = '#22d3ee'   // cyan-400
const EDGE_COLOR   = '#f472b6'   // pink-400

export function AlignmentGuides({ guides }: { guides: Guide[] }) {
  const { zoom } = useViewport()
  if (guides.length === 0) return null
  // Keep visual stroke width constant on screen regardless of zoom.
  const stroke = 1 / Math.max(zoom, 0.01)

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
