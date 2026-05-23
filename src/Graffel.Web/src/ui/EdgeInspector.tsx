import { useDiagramStore } from '../store/diagramStore'
import type {
  EdgeMarker,
  EdgeStyle,
  MarkerSize,
  StrokeStyle,
} from '../format/style'
import type { EdgeType } from '../format/types'
import { ColorPicker, Field, Group, Row, Segmented } from './controls'

export function EdgeInspector({ edgeId }: { edgeId: string }) {
  const edge = useDiagramStore((s) => s.edges.find((e) => e.id === edgeId))
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel)
  const updateEdgeStyle = useDiagramStore((s) => s.updateEdgeStyle)
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType)
  const clearEdgeWaypoints = useDiagramStore((s) => s.clearEdgeWaypoints)

  if (!edge) return null
  const style = (edge.data.style ?? {}) as EdgeStyle
  const waypointCount = edge.data.waypoints?.length ?? 0

  return (
    <div className="inspector-body" data-testid="edge-inspector">
      <h3>Connector</h3>

      <Group title="Shape">
        <Field label="Line">
          <Segmented<EdgeType>
            testId="ei-type"
            value={edge.type}
            onChange={(v) => updateEdgeType(edgeId, v)}
            options={[
              { value: 'orthogonal', label: 'Right-angle', title: 'Orthogonal' },
              { value: 'straight',   label: 'Straight',    title: 'Straight' },
              { value: 'bezier',     label: 'Curved',      title: 'Bezier' },
            ]}
          />
        </Field>
      </Group>

      <Group title="Corners">
        <div className="inspector-row-inline" data-testid="ei-waypoint-count">
          <span>{waypointCount === 0
            ? 'No corners — drag a midpoint to add one.'
            : `${waypointCount} corner${waypointCount === 1 ? '' : 's'}`}
          </span>
          {waypointCount > 0 ? (
            <button
              type="button"
              className="inspector-link-button"
              onClick={() => clearEdgeWaypoints(edgeId)}
              data-testid="ei-clear-corners"
            >
              Clear
            </button>
          ) : null}
        </div>
      </Group>

      <Group title="Label">
        <Field label="Text">
          <input
            type="text"
            value={edge.data.label}
            onChange={(e) => updateEdgeLabel(edgeId, e.target.value)}
            data-testid="ei-label"
            placeholder="(no label)"
          />
        </Field>
      </Group>

      <Group title="Stroke">
        <Field label="Color">
          <ColorPicker
            testId="ei-stroke-color"
            value={style.strokeColor}
            onChange={(c) => updateEdgeStyle(edgeId, { strokeColor: c })}
          />
        </Field>
        <Row>
          <Field label="Width">
            <input
              type="number"
              min={1}
              max={12}
              step={1}
              value={style.strokeWidth ?? 2}
              onChange={(e) =>
                updateEdgeStyle(edgeId, { strokeWidth: Number(e.target.value) })
              }
              data-testid="ei-stroke-width"
            />
          </Field>
          <Field label="Style">
            <Segmented<StrokeStyle>
              testId="ei-stroke-style"
              value={style.strokeStyle ?? 'solid'}
              onChange={(v) => updateEdgeStyle(edgeId, { strokeStyle: v })}
              options={[
                { value: 'solid',  label: '────' },
                { value: 'dashed', label: '─ ─' },
                { value: 'dotted', label: '· · ·' },
              ]}
            />
          </Field>
        </Row>
      </Group>

      <Group title="Endpoints">
        <Field label="Start">
          <select
            value={style.markerStart ?? 'none'}
            onChange={(e) => updateEdgeStyle(edgeId, { markerStart: e.target.value as EdgeMarker })}
            data-testid="ei-marker-start"
          >
            <option value="none">None</option>
            <option value="arrow">Arrow (filled)</option>
            <option value="arrow-open">Arrow (open)</option>
            <option value="triangle">Triangle (open)</option>
            <option value="triangle-filled">Triangle (filled)</option>
            <option value="diamond">Diamond (open)</option>
            <option value="diamond-filled">Diamond (filled)</option>
            <option value="circle">Circle (open)</option>
            <option value="circle-filled">Circle (filled)</option>
          </select>
        </Field>
        <Field label="End">
          <select
            value={style.markerEnd ?? 'none'}
            onChange={(e) => updateEdgeStyle(edgeId, { markerEnd: e.target.value as EdgeMarker })}
            data-testid="ei-marker-end"
          >
            <option value="none">None</option>
            <option value="arrow">Arrow (filled)</option>
            <option value="arrow-open">Arrow (open)</option>
            <option value="triangle">Triangle (open)</option>
            <option value="triangle-filled">Triangle (filled)</option>
            <option value="diamond">Diamond (open)</option>
            <option value="diamond-filled">Diamond (filled)</option>
            <option value="circle">Circle (open)</option>
            <option value="circle-filled">Circle (filled)</option>
          </select>
        </Field>
        <Field label="Marker size">
          <Segmented<MarkerSize>
            testId="ei-marker-size"
            value={style.markerSize ?? 'md'}
            onChange={(v) => updateEdgeStyle(edgeId, { markerSize: v })}
            options={[
              { value: 'sm', label: 'S' },
              { value: 'md', label: 'M' },
              { value: 'lg', label: 'L' },
            ]}
          />
        </Field>
      </Group>
    </div>
  )
}
