import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useEffect, useRef, useState } from 'react'
import type { NodeType } from '../format/types'
import { useDiagramStore } from '../store/diagramStore'

interface ShapeNodeData extends Record<string, unknown> {
  label: string
  shapeType: NodeType
  width: number
  height: number
}

const HANDLE_POSITIONS = [
  { id: 'top',    position: Position.Top },
  { id: 'right',  position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left',   position: Position.Left },
] as const

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { label, shapeType, width, height } = data as ShapeNodeData
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel)
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

  const classes = `graffel-shape ${shapeType}${selected ? ' is-selected' : ''}`

  return (
    <div
      className={classes}
      style={{ width, height }}
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
      {/* Targets share IDs with sources — React Flow allows both via `type="source"` connections;
          we add explicit hidden target handles so any edge-anchor can receive a drop. */}
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
  )
}
