import { useDiagramStore } from '../store/diagramStore'
import {
  FONT_FAMILIES,
  type FontFamilyId,
  type FontWeight,
  type LabelPosition,
  type NodeStyle,
  type TextHAlign,
  type TextVAlign,
} from '../format/style'
import { getShape, resolveDefaultLabelPosition } from '../shapes/registry'
import { ColorPicker, Field, Group, Row, Segmented } from './controls'

const LABEL_POSITIONS: { value: LabelPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

export function NodeInspector({ nodeId }: { nodeId: string }) {
  const node = useDiagramStore((s) => s.nodes.find((n) => n.id === nodeId))
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel)
  const updateNodeSize = useDiagramStore((s) => s.updateNodeSize)
  const updateNodeStyle = useDiagramStore((s) => s.updateNodeStyle)

  if (!node) return null
  const style = (node.data.style ?? {}) as NodeStyle
  const labelPos = style.labelPosition ?? resolveDefaultLabelPosition(getShape(node.type))

  return (
    <div className="inspector-body" data-testid="node-inspector">
      <h3>{node.type.charAt(0).toUpperCase() + node.type.slice(1)}</h3>

      <Group title="Text">
        <Field label="Label">
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateNodeLabel(nodeId, e.target.value)}
            data-testid="ni-label"
          />
        </Field>

        <Field label="Label position">
          <select
            value={labelPos}
            onChange={(e) =>
              updateNodeStyle(nodeId, { labelPosition: e.target.value as LabelPosition })
            }
            data-testid="ni-label-position"
          >
            {LABEL_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Font">
          <select
            value={style.fontFamily ?? 'system'}
            onChange={(e) =>
              updateNodeStyle(nodeId, { fontFamily: e.target.value as FontFamilyId })
            }
            data-testid="ni-font-family"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </Field>

        <Row>
          <Field label="Size">
            <input
              type="number"
              min={8}
              max={72}
              step={1}
              value={style.fontSize ?? 13}
              onChange={(e) =>
                updateNodeStyle(nodeId, { fontSize: Number(e.target.value) })
              }
              data-testid="ni-font-size"
            />
          </Field>
          <Field label="Weight">
            <Segmented<FontWeight>
              testId="ni-font-weight"
              value={style.fontWeight ?? 'regular'}
              onChange={(v) => updateNodeStyle(nodeId, { fontWeight: v })}
              options={[
                { value: 'regular', label: 'R' },
                { value: 'medium',  label: 'M' },
                { value: 'bold',    label: 'B' },
              ]}
            />
          </Field>
        </Row>

        <Field label="Text color">
          <ColorPicker
            testId="ni-text-color"
            value={style.textColor}
            onChange={(c) => updateNodeStyle(nodeId, { textColor: c })}
          />
        </Field>

        <Row>
          <Field label="H-align">
            <Segmented<TextHAlign>
              testId="ni-h-align"
              value={style.textHAlign ?? 'center'}
              onChange={(v) => updateNodeStyle(nodeId, { textHAlign: v })}
              options={[
                { value: 'left',   label: 'L' },
                { value: 'center', label: 'C' },
                { value: 'right',  label: 'R' },
              ]}
            />
          </Field>
          <Field label="V-align">
            <Segmented<TextVAlign>
              testId="ni-v-align"
              value={style.textVAlign ?? 'middle'}
              onChange={(v) => updateNodeStyle(nodeId, { textVAlign: v })}
              options={[
                { value: 'top',    label: 'T' },
                { value: 'middle', label: 'M' },
                { value: 'bottom', label: 'B' },
              ]}
            />
          </Field>
        </Row>
      </Group>

      <Group title="Appearance">
        <Field label="Fill">
          <ColorPicker
            testId="ni-fill"
            value={style.fill}
            onChange={(c) => updateNodeStyle(nodeId, { fill: c })}
          />
        </Field>
        <Field label="Border">
          <ColorPicker
            testId="ni-border-color"
            value={style.borderColor}
            onChange={(c) => updateNodeStyle(nodeId, { borderColor: c })}
          />
        </Field>
      </Group>

      <Group title="Size">
        <Row>
          <Field label="Width">
            <input
              type="number"
              min={20}
              max={2000}
              step={1}
              value={Math.round(node.size.w)}
              onChange={(e) =>
                updateNodeSize(nodeId, { w: Number(e.target.value), h: node.size.h })
              }
              data-testid="ni-width"
            />
          </Field>
          <Field label="Height">
            <input
              type="number"
              min={20}
              max={2000}
              step={1}
              value={Math.round(node.size.h)}
              onChange={(e) =>
                updateNodeSize(nodeId, { w: node.size.w, h: Number(e.target.value) })
              }
              data-testid="ni-height"
            />
          </Field>
        </Row>
      </Group>
    </div>
  )
}
