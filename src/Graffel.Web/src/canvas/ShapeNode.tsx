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
  type LabelPosition,
  type NodeStyle,
} from '../format/style'
import { useDiagramStore } from '../store/diagramStore'
import { getShape, resolveAnchors, resolveDefaultLabelPosition, resolveFit } from '../shapes/registry'
import { anchorToBoxPercent } from './anchors'

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

// Half the connection-handle size (.react-flow__handle is 10px, border-box).
const HANDLE_HALF = 5

type HandleSideId = (typeof HANDLE_POSITIONS)[number]['id']

/**
 * Position a connection handle so the EDGE meets the silhouette anchor.
 * React Flow attaches edges HANDLE_HALF px outward from the handle's offset-box
 * center (along the side axis), so we place that center HANDLE_HALF px inward.
 */
function handleStyle(
  hid: HandleSideId,
  anchor: { x: number; y: number },
  width: number,
  height: number,
  fit: 'fill' | 'contain',
): CSSProperties {
  const { left, top } = anchorToBoxPercent(anchor, { w: width, h: height }, fit)
  let cx = (left / 100) * width
  let cy = (top / 100) * height
  if (hid === 'right') cx -= HANDLE_HALF
  else if (hid === 'left') cx += HANDLE_HALF
  else if (hid === 'top') cy += HANDLE_HALF
  else if (hid === 'bottom') cy -= HANDLE_HALF
  return {
    left: `${cx}px`,
    top: `${cy}px`,
    transform: 'none',
    margin: `${-HANDLE_HALF}px 0 0 ${-HANDLE_HALF}px`,
  }
}

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

/**
 * Positioning for the label container relative to the node box. 'center' is the
 * in-icon overlay (containers); the others sit just outside the icon edge.
 */
function labelBoxStyle(pos: LabelPosition, isTextShape: boolean): CSSProperties {
  const GAP = 5
  switch (pos) {
    case 'top':
      return { left: '50%', bottom: `calc(100% + ${GAP}px)`, transform: 'translateX(-50%)',
        minWidth: '100%', maxWidth: 220, textAlign: 'center', justifyContent: 'center', alignItems: 'flex-end' }
    case 'bottom':
      return { left: '50%', top: `calc(100% + ${GAP}px)`, transform: 'translateX(-50%)',
        minWidth: '100%', maxWidth: 220, textAlign: 'center', justifyContent: 'center', alignItems: 'flex-start' }
    case 'left':
      return { right: `calc(100% + ${GAP}px)`, top: '50%', transform: 'translateY(-50%)',
        maxWidth: 180, textAlign: 'right', justifyContent: 'flex-end', alignItems: 'center' }
    case 'right':
      return { left: `calc(100% + ${GAP}px)`, top: '50%', transform: 'translateY(-50%)',
        maxWidth: 180, textAlign: 'left', justifyContent: 'flex-start', alignItems: 'center' }
    case 'center':
    default:
      return { inset: isTextShape ? 0 : 8 }
  }
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { label, shapeId, width, height, style } = data as ShapeNodeData
  const def = getShape(shapeId)
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel)
  const updateNodeSize = useDiagramStore((s) => s.updateNodeSize)
  const readOnly = useDiagramStore((s) => s.readOnly)
  const editingNodeId = useDiagramStore((s) => s.editingNodeId)
  const editSeed = useDiagramStore((s) => s.editSeed)
  const beginEditNode = useDiagramStore((s) => s.beginEditNode)
  const endEditNode = useDiagramStore((s) => s.endEditNode)
  const editing = editingNodeId === id
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  // When an edit session opens, seed the draft: a seed char replaces the label
  // (and lands the caret at the end); otherwise edit the existing text selected.
  useEffect(() => {
    if (!editing) return
    if (editSeed != null) {
      setDraft(editSeed)
      requestAnimationFrame(() => {
        const el = inputRef.current
        if (el) { el.focus(); const n = el.value.length; el.setSelectionRange(n, n) }
      })
    } else {
      setDraft(label)
      requestAnimationFrame(() => inputRef.current?.select())
    }
    // Only re-seed when the editing target opens, not on every label keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id])

  function commit() {
    if (draft !== label) updateNodeLabel(id, draft)
    endEditNode()
  }

  const s = style ?? {}
  const merged = { ...(def?.defaultStyle ?? {}), ...s } as NodeStyle
  const fill        = (merged.fill        as string | undefined) ?? '#ffffff'
  const borderColor = (merged.borderColor as string | undefined) ?? '#94a3b8'
  const textColor   = merged.textColor ?? '#1f2330'

  const isTextShape = shapeId === 'basic:text' || shapeId === 'text'
  const fit = resolveFit(def)
  const labelPos: LabelPosition = merged.labelPosition ?? resolveDefaultLabelPosition(def)
  const isCenter = labelPos === 'center'
  const posStyle = labelBoxStyle(labelPos, isTextShape)
  const anchors = resolveAnchors(def)

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
        onDoubleClick={() => !readOnly && beginEditNode(id)}
        data-testid={def?.legacyTestId ? `shape-${def.legacyTestId}` : `shape-${shapeId.replace(/[:]/g, '-')}`}
        data-shape-id={shapeId}
      >
        {/* The shape body (SVG) */}
        <div className="graffel-shape-body" style={{ position: 'absolute', inset: 0 }}>
          {def
            ? def.render({ width, height, selected: !!selected, fill, borderColor, textColor })
            : <FallbackShape width={width} height={height} fill={fill} borderColor={borderColor} />}
        </div>

        {/* Connection handles — only when editable. Anchors are authored in the
            shape's viewBox space and mapped to box-% so they sit on the drawn
            silhouette even when the icon is letterboxed (fit="contain"). */}
        {/* Place each handle so the EDGE attaches exactly on the silhouette
            anchor. React Flow attaches edges half a handle (HANDLE_HALF) OUTWARD
            from the handle's box center along the side axis, and derives that
            center from the offset box (ignoring CSS transforms). So we set the
            box center HANDLE_HALF *inward* of the anchor (via px left/top +
            negative margin, transform none); RF's outward offset then lands the
            line precisely on the anchor. */}
        {!readOnly && HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle key={hid} id={hid} type="source" position={position} isConnectable
            style={handleStyle(hid, anchors[hid], width, height, fit)} />
        ))}
        {!readOnly && HANDLE_POSITIONS.map(({ id: hid, position }) => (
          <Handle key={`t-${hid}`} id={hid} type="target" position={position} isConnectable
            style={{ ...handleStyle(hid, anchors[hid], width, height, fit), opacity: 0 }} />
        ))}

        {/* Text overlay / outside label */}
        <div
          className={`graffel-shape-label-host${isTextShape ? ' is-text-shape' : ''} is-pos-${labelPos}`}
          data-testid="shape-label-host"
          data-label-pos={labelPos}
          style={{
            position: 'absolute',
            ...posStyle,
            display: 'flex',
            alignItems: isCenter ? vAlignFlex(merged.textVAlign) : posStyle.alignItems,
            justifyContent: isCenter ? hAlignFlex(merged.textHAlign) : posStyle.justifyContent,
            pointerEvents: editing ? 'auto' : 'none',
            color: textColor,
            fontFamily: fontFamilyCss(merged.fontFamily),
            fontSize: merged.fontSize ? `${merged.fontSize}px` : '13px',
            fontWeight: fontWeightCss(merged.fontWeight),
            textAlign: isCenter ? (merged.textHAlign ?? 'center') : posStyle.textAlign,
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
                if (e.key === 'Escape') { setDraft(label); endEditNode() }
              }}
              autoFocus
              data-testid="shape-label-input"
            />
          ) : (
            label
              ? <span className="graffel-shape-label" data-testid="shape-label">{label}</span>
              : null
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
