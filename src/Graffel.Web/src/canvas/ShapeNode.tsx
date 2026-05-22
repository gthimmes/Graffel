import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  fontFamilyCss,
  fontWeightCss,
  type NodeStyle,
} from '../format/style'
import { useDiagramStore } from '../store/diagramStore'
import { getShape } from '../shapes/registry'

interface ShapeNodeData extends Record<string, unknown> {
  label: string
  shapeId: string
  width: number
  height: number
  style?: NodeStyle
}

const HANDLE_POSITIONS = [
  { id: 'top',    position: Position.Top },
  { id: 'right',  position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left',   position: Position.Left },
] as const

function hAlignFlex(a: 'left' | 'center' | 'right' | undefined): CSSProperties['justifyContent'] {
  if (a === 'left')   return 'flex-start'
  if (a === 'right')  return 'flex-end'
  return 'center'
}

function vAlignFlex(a: 'top' | 'middle' | 'bottom' | undefined): CSSProperties['alignItems'] {
  if (a === 'top')    return 'flex-start'
  if (a === 'bottom') return 'flex-end'
  return 'center'
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { label, shapeId, width, height, style } = data as ShapeNodeData
  const def = getShape(shapeId)
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel)
  const updateNodeSize = useDiagramStore((s) => s.updateNodeSize)
  const readOnly = useDiagramStore((s) => s.readOnly)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(label) }, [label])
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    if (draft !== label) updateNodeLabel(id, draft)
    setEditing(false)
  }

  const s = style ?? {}
  const merged = { ...(def?.defaultStyle ?? {}), ...s } as NodeStyle
  const fill        = (merged.fill        as string | undefined) ?? '#ffffff'
  const borderColor = (merged.borderColor as string | undefined) ?? '#94a3b8'
  const textColor   = merged.textColor ?? '#1f2330'

  const isTextShape = shapeId === 'basic:text' || shapeId === 'text'

  return (
    <>
      {!readOnly && (
        <NodeResizer
          isVisible={selected}
          minWidth={40}
          minHeight={30}
          onResize={(_e, params) => {
            updateNodeSize(id, { w: params.width, h: params.height })
          }}
          handleClassName="graffel-resize-handle"
          lineClassName="graffel-resize-line"
        />
      )}
      <div
        className={`graffel-shape-host${selected ? ' is-selected' : ''}`}
        style={{
          width,
          height,
          position: 'relative',
          // Font properties live here so the existing E2E selectors on the
          // host can observe them via toHaveCSS, and descendants inherit.
          color: textColor,
          fontFamily: fontFamilyCss(merged.fontFamily),
          fontSize: merged.fontSize ? `${merged.fontSize}px` : '13px',
          fontWeight: fontWeightCss(merged.fontWeight),
          textAlign: merged.textHAlign ?? 'center',
        }}
        onDoubleClick={() => !readOnly && setEditing(true)}
        data-testid={def?.legacyTestId ? `shape-${def.legacyTestId}` : `shape-${shapeId.replace(/[:]/g, '-')}`}
        data-shape-id={shapeId}
      >
        {/* The shape body (SVG) */}
        <div className="graffel-shape-body" style={{ position: 'absolute', inset: 0 }}>
          {def
            ? def.render({ width, height, selected: !!selected, fill, borderColor, textColor })
            : <FallbackShape width={width} height={height} fill={fill} borderColor={borderColor} />}
        </div>

        {/* Connection handles — only when editable */}
        {!readOnly && HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle key={hid} id={hid} type="source" position={position} isConnectable />
        ))}
        {!readOnly && HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle key={`t-${hid}`} id={hid} type="target" position={position} isConnectable style={{ opacity: 0 }} />
        ))}

        {/* Text overlay */}
        <div
          className={`graffel-shape-label-host${isTextShape ? ' is-text-shape' : ''}`}
          style={{
            position: 'absolute',
            inset: isTextShape ? 0 : 8,
            display: 'flex',
            alignItems: vAlignFlex(merged.textVAlign),
            justifyContent: hAlignFlex(merged.textHAlign),
            pointerEvents: editing ? 'auto' : 'none',
            color: textColor,
            fontFamily: fontFamilyCss(merged.fontFamily),
            fontSize: merged.fontSize ? `${merged.fontSize}px` : '13px',
            fontWeight: fontWeightCss(merged.fontWeight),
            textAlign: merged.textHAlign ?? 'center',
            userSelect: 'none',
          }}
        >
          {editing ? (
            <input
              ref={inputRef}
              className="graffel-shape-label-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit() }
                if (e.key === 'Escape') { setDraft(label); setEditing(false) }
              }}
              autoFocus
              data-testid="shape-label-input"
            />
          ) : (
            <span className="graffel-shape-label" data-testid="shape-label">{label}</span>
          )}
        </div>
      </div>
    </>
  )
}

function FallbackShape({ width, height, fill, borderColor }: { width: number; height: number; fill: string; borderColor: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x={1} y={1} width={98} height={98} fill={fill} stroke={borderColor} strokeWidth={2} />
      <line x1={10} y1={10} x2={90} y2={90} stroke={borderColor} strokeWidth={1} opacity={0.4} />
      <line x1={90} y1={10} x2={10} y2={90} stroke={borderColor} strokeWidth={1} opacity={0.4} />
    </svg>
  )
}
