import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { NodeType } from '../format/types'
import {
  fontFamilyCss,
  fontWeightCss,
  type NodeStyle,
} from '../format/style'
import { useDiagramStore } from '../store/diagramStore'

interface ShapeNodeData extends Record<string, unknown> {
  label: string
  shapeType: NodeType
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

function alignFlex(align: 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right'): CSSProperties['alignItems'] {
  if (align === 'top' || align === 'left')   return 'flex-start'
  if (align === 'bottom' || align === 'right') return 'flex-end'
  return 'center'
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { label, shapeType, width, height, style } = data as ShapeNodeData
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel)
  const updateNodeSize = useDiagramStore((s) => s.updateNodeSize)
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
  const containerStyle: CSSProperties = {
    width,
    height,
    background: s.fill,
    borderColor: s.borderColor,
    fontFamily: fontFamilyCss(s.fontFamily),
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    fontWeight: fontWeightCss(s.fontWeight),
    color: s.textColor,
    display: 'flex',
    alignItems: alignFlex(s.textVAlign ?? 'middle'),
    justifyContent: alignFlex(s.textHAlign ?? 'center'),
    textAlign: s.textHAlign ?? 'center',
  }

  const classes = `graffel-shape ${shapeType}${selected ? ' is-selected' : ''}`

  return (
    <>
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
      <div
        className={classes}
        style={containerStyle}
        onDoubleClick={() => setEditing(true)}
        data-testid={`shape-${shapeType}`}
      >
        {HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle
            key={hid}
            id={hid}
            type="source"
            position={position}
            isConnectable
          />
        ))}
        {HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle
            key={`t-${hid}`}
            id={hid}
            type="target"
            position={position}
            isConnectable
            style={{ opacity: 0 }}
          />
        ))}
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
    </>
  )
}
