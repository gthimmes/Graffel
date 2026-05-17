import { useDiagramStore } from '../store/diagramStore'
import type { EdgeStyle } from '../format/style'
import type { EdgeType } from '../format/types'
import { ColorPicker, Field, Group, Row, Segmented } from './controls'

export function EdgeInspector({ edgeId }: { edgeId: string }) {
  const edge = useDiagramStore((s) => s.edges.find((e) => e.id === edgeId))
  const updateEdgeLabel = useDiagramStore((s) => s.updateEdgeLabel)
  const updateEdgeStyle = useDiagramStore((s) => s.updateEdgeStyle)
  const updateEdgeType = useDiagramStore((s) => s.updateEdgeType)

  if (!edge) return null
  const style = (edge.data.style ?? {}) as EdgeStyle

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
        </Row>
      </Group>
    </div>
  )
}
