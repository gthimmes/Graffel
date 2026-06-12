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
import { getShape, resolveAnchors, resolveDefaultLabelPosition, resolveFit, resolveIconBounds, resolveIsContainer } from '../shapes/registry'
import { anchorToBoxPercent } from './anchors'

interface ShapeNodeData extends Record<string, unknown> {
  label: string
  shapeId: string
  width: number
  height: number
  style?: NodeStyle
  /** v3.14 drill-down (set by the canvas view layer). */
  collapsed?: boolean
  childCount?: number
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

/** The drawn icon's edges in node-box px (silhouette bounds through the fit). */
interface IconRect { top: number; bottom: number; left: number; right: number; cx: number; cy: number }

/**
 * Positioning for the label container. 'center' is the in-icon overlay
 * (containers). The others hug the icon's *silhouette* edge (rect), not the node
 * box — so letterboxed pictograms don't get a big gap above/below the label.
 */
function labelBoxStyle(pos: LabelPosition, isTextShape: boolean, r: IconRect): CSSProperties {
  const GAP = 4
  // width:max-content sizes the box to the text (then wraps at maxWidth) — an
  // absolutely-positioned block would otherwise be capped at boxWidth-left and
  // wrap a single word like "Customer".
  const MAXW = 220
  const common: CSSProperties = { width: 'max-content', maxWidth: MAXW }
  switch (pos) {
    case 'top':
      return { ...common, left: `${r.cx}px`, top: `${r.top - GAP}px`, transform: 'translate(-50%, -100%)', textAlign: 'center' }
    case 'bottom':
      return { ...common, left: `${r.cx}px`, top: `${r.bottom + GAP}px`, transform: 'translate(-50%, 0)', textAlign: 'center' }
    case 'left':
      return { ...common, left: `${r.left - GAP}px`, top: `${r.cy}px`, transform: 'translate(-100%, -50%)', textAlign: 'right' }
    case 'right':
      return { ...common, left: `${r.right + GAP}px`, top: `${r.cy}px`, transform: 'translate(0, -50%)', textAlign: 'left' }
    case 'center':
    default:
      return { inset: isTextShape ? 0 : 8 }
  }
}

export function ShapeNode({ id, data, selected }: NodeProps) {
  const { label, shapeId, width, height, style, collapsed, childCount } = data as ShapeNodeData
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
  const isContainer = resolveIsContainer(def)
  const fit = resolveFit(def)
  const labelPos: LabelPosition = merged.labelPosition ?? resolveDefaultLabelPosition(def)
  const isCenter = labelPos === 'center'
  const anchors = resolveAnchors(def)

  // The drawn icon's edges in box px (silhouette bounds through the fit), so
  // outside labels hug the icon — not the letterboxed node box.
  const ib = resolveIconBounds(def)
  const pct = (x: number, y: number) => anchorToBoxPercent({ x, y }, { w: width, h: height }, fit)
  const tp = pct(ib.x + ib.w / 2, ib.y)
  const bp = pct(ib.x + ib.w / 2, ib.y + ib.h)
  const lp = pct(ib.x, ib.y + ib.h / 2)
  const rp = pct(ib.x + ib.w, ib.y + ib.h / 2)
  const iconRect = {
    top: (tp.top / 100) * height,
    bottom: (bp.top / 100) * height,
    left: (lp.left / 100) * width,
    right: (rp.left / 100) * width,
    cx: (tp.left / 100) * width,
    cy: (lp.top / 100) * height,
  }
  const posStyle = labelBoxStyle(labelPos, isTextShape, iconRect)

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
        // Containers drill in on double-click — handled at the canvas level via
        // React Flow's onNodeDoubleClick (fires reliably in read-only too); their
        // labels edit via Enter/F2/typing. Other shapes double-click to edit.
        onDoubleClick={() => {
          if (!isContainer && !readOnly) beginEditNode(id)
        }}
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
            // Center labels fill the icon and use flex H/V alignment; outside
            // labels are point-anchored to the silhouette edge (block + translate).
            display: isCenter ? 'flex' : 'block',
            alignItems: isCenter ? vAlignFlex(merged.textVAlign) : undefined,
            justifyContent: isCenter ? hAlignFlex(merged.textHAlign) : undefined,
            pointerEvents: editing ? 'auto' : 'none',
            color: textColor,
            fontFamily: fontFamilyCss(merged.fontFamily),
            fontSize: merged.fontSize ? `${merged.fontSize}px` : '13px',
            fontWeight: fontWeightCss(merged.fontWeight),
            // H-align applies in both modes (text justification); position default
            // when the user hasn't picked one.
            textAlign: merged.textHAlign ?? (isCenter ? 'center' : posStyle.textAlign),
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

        {/* Collapsed-container badge: how many shapes are tucked inside. */}
        {isContainer && collapsed && (childCount ?? 0) > 0 ? (
          <span className="graffel-collapse-badge" data-testid="collapse-badge" title={`${childCount} hidden — double-click to enter`}>
            ▸ {childCount}
          </span>
        ) : null}
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
