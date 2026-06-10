import { useCallback, useEffect, useState } from 'react'
import { useStore } from '@xyflow/react'
import { useDiagramStore } from '../store/diagramStore'
import { getShape, resolveIsContainer } from '../shapes/registry'
import type {
  EdgeMarker,
  EdgeStyle,
  MarkerSize,
  NodeStyle,
  StrokeStyle,
  TextHAlign,
} from '../format/style'
import { ColorPicker, Field, Row, Segmented } from './controls'
import { MARKER_OPTIONS } from './markerOptions'
import { Popover } from './Popover'
import { toolbarAnchor, unionScreenBox, type Anchor, type Box } from './selectionBox'

const TOOLBAR_H = 44
const GAP = 8

/** Floating quick-style bar that tracks the current selection on the canvas. */
export function SelectionToolbar() {
  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)
  const selectedEdgeIds = useDiagramStore((s) => s.selectedEdgeIds)
  const nodes = useDiagramStore((s) => s.nodes)
  const edges = useDiagramStore((s) => s.edges)
  const readOnly = useDiagramStore((s) => s.readOnly)
  const editingNodeId = useDiagramStore((s) => s.editingNodeId)
  const updateNodeStyle = useDiagramStore((s) => s.updateNodeStyle)
  const updateEdgeStyle = useDiagramStore((s) => s.updateEdgeStyle)
  const groupNodes = useDiagramStore((s) => s.groupNodes)
  const ungroupNodes = useDiagramStore((s) => s.ungroupNodes)

  // Re-run positioning when the viewport pans/zooms.
  const transform = useStore((s) => s.transform)

  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [openPop, setOpenPop] = useState<string | null>(null)

  const mode: 'node' | 'edge' | null =
    selectedNodeIds.length > 0 ? 'node' : selectedEdgeIds.length > 0 ? 'edge' : null
  const hidden = readOnly || editingNodeId !== null || mode === null

  // Recompute the screen anchor from the rendered selection rects. Newly-created
  // nodes (e.g. a just-made group) mount a frame after the store updates, so if
  // we measure nothing yet we retry on the next few animation frames.
  useEffect(() => {
    if (hidden) { setAnchor(null); return }
    let raf = 0
    let tries = 0
    const measure = () => {
      const host = document.querySelector('.graffel-canvas-host') as HTMLElement | null
      if (!host) { setAnchor(null); return }
      const hb = host.getBoundingClientRect()
      const hostBox: Box = { left: hb.left, top: hb.top, width: hb.width, height: hb.height }
      const ids = mode === 'node' ? selectedNodeIds : selectedEdgeIds
      const sel = mode === 'node' ? '.react-flow__node' : '.react-flow__edge'
      const rects: Box[] = []
      for (const id of ids) {
        const el = host.querySelector(`${sel}[data-id="${id}"]`) as HTMLElement | null
        if (!el) continue
        const r = el.getBoundingClientRect()
        rects.push({ left: r.left, top: r.top, width: r.width, height: r.height })
      }
      const box = unionScreenBox(rects, hostBox)
      if (box) {
        setAnchor(toolbarAnchor(box, hostBox, TOOLBAR_H + GAP))
      } else if (tries < 5) {
        tries += 1
        raf = requestAnimationFrame(measure)
      } else {
        setAnchor(null)
      }
    }
    measure()
    return () => { if (raf) cancelAnimationFrame(raf) }
    // transform/nodes/edges drive re-positioning on pan/zoom/drag.
  }, [hidden, mode, selectedNodeIds, selectedEdgeIds, nodes, edges, transform])

  // Close any open popover when the selection changes.
  useEffect(() => { setOpenPop(null) }, [selectedNodeIds, selectedEdgeIds])

  const togglePop = useCallback((key: string) => {
    setOpenPop((cur) => (cur === key ? null : key))
  }, [])

  if (hidden || !anchor) return null

  const transformCss =
    anchor.placement === 'above'
      ? `translate(-50%, calc(-100% - ${GAP}px))`
      : `translate(-50%, ${GAP}px)`

  return (
    <div
      className="graffel-selection-toolbar"
      data-testid="selection-toolbar"
      style={{ left: anchor.x, top: anchor.y, transform: transformCss }}
      // Don't let clicks fall through to the canvas (which would deselect).
      onMouseDown={(e) => e.stopPropagation()}
    >
      {mode === 'node' ? (
        <NodeTools
          ids={selectedNodeIds}
          nodes={nodes}
          openPop={openPop}
          togglePop={togglePop}
          closePop={() => setOpenPop(null)}
          updateNodeStyle={updateNodeStyle}
          groupNodes={groupNodes}
          ungroupNodes={ungroupNodes}
        />
      ) : (
        <EdgeTools
          ids={selectedEdgeIds}
          edges={edges}
          openPop={openPop}
          togglePop={togglePop}
          updateEdgeStyle={updateEdgeStyle}
        />
      )}
    </div>
  )
}

/** A toolbar button with a colored chip showing the current value. */
function ChipButton({
  label, color, testId, active, onClick,
}: { label: string; color?: string; testId?: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`stb-button${active ? ' is-active' : ''}`}
      onClick={onClick}
      data-testid={testId}
      title={label}
    >
      {color !== undefined ? (
        <span className="stb-chip" style={{ background: color || 'transparent' }} />
      ) : null}
      <span className="stb-label">{label}</span>
    </button>
  )
}

function NodeTools({
  ids, nodes, openPop, togglePop, closePop, updateNodeStyle, groupNodes, ungroupNodes,
}: {
  ids: string[]
  nodes: { id: string; type: string; parentId?: string | null; data: { style?: Record<string, unknown> } }[]
  openPop: string | null
  togglePop: (k: string) => void
  closePop: () => void
  updateNodeStyle: (id: string, patch: Record<string, unknown>) => void
  groupNodes: (ids: string[]) => string | null
  ungroupNodes: (id: string) => void
}) {
  const first = nodes.find((n) => n.id === ids[0])
  const style = (first?.data.style ?? {}) as NodeStyle
  const apply = (patch: Record<string, unknown>) => ids.forEach((id) => updateNodeStyle(id, patch))

  const topLevel = ids.filter((id) => {
    const n = nodes.find((x) => x.id === id)
    return n && (n.parentId ?? null) === null
  })
  const soleContainer =
    ids.length === 1 && resolveIsContainer(getShape(first?.type ?? ''))

  return (
    <>
      <div className="stb-pop-anchor">
        <ChipButton label="Fill" color={style.fill ?? '#ffffff'} testId="stb-fill"
          active={openPop === 'fill'} onClick={() => togglePop('fill')} />
        <Popover open={openPop === 'fill'} onClose={closePop} testId="stb-fill-pop">
          <ColorPicker testId="stb-fill-picker" value={style.fill}
            onChange={(c) => apply({ fill: c })} />
        </Popover>
      </div>

      <div className="stb-pop-anchor">
        <ChipButton label="Border" color={style.borderColor ?? '#94a3b8'} testId="stb-border"
          active={openPop === 'border'} onClick={() => togglePop('border')} />
        <Popover open={openPop === 'border'} onClose={closePop} testId="stb-border-pop">
          <ColorPicker testId="stb-border-picker" value={style.borderColor}
            onChange={(c) => apply({ borderColor: c })} />
        </Popover>
      </div>

      <div className="stb-pop-anchor">
        <ChipButton label="A" color={style.textColor ?? '#1f2330'} testId="stb-text"
          active={openPop === 'text'} onClick={() => togglePop('text')} />
        <Popover open={openPop === 'text'} onClose={closePop} testId="stb-text-pop">
          <Field label="Text color">
            <ColorPicker testId="stb-text-picker" value={style.textColor}
              onChange={(c) => apply({ textColor: c })} />
          </Field>
          <Row>
            <Field label="Size">
              <input type="number" min={8} max={72} step={1}
                value={style.fontSize ?? 13}
                onChange={(e) => apply({ fontSize: Number(e.target.value) })}
                data-testid="stb-font-size" />
            </Field>
            <Field label="Align">
              <Segmented<TextHAlign> testId="stb-align" value={style.textHAlign ?? 'center'}
                onChange={(v) => apply({ textHAlign: v })}
                options={[
                  { value: 'left', label: 'L' },
                  { value: 'center', label: 'C' },
                  { value: 'right', label: 'R' },
                ]} />
            </Field>
          </Row>
        </Popover>
      </div>

      {topLevel.length >= 2 ? (
        <button type="button" className="stb-button" data-testid="stb-group"
          title="Group" onClick={() => groupNodes(topLevel)}>
          <span className="stb-label">Group</span>
        </button>
      ) : null}
      {soleContainer ? (
        <button type="button" className="stb-button" data-testid="stb-ungroup"
          title="Ungroup" onClick={() => ungroupNodes(ids[0]!)}>
          <span className="stb-label">Ungroup</span>
        </button>
      ) : null}
    </>
  )
}

function EdgeTools({
  ids, edges, openPop, togglePop, updateEdgeStyle,
}: {
  ids: string[]
  edges: { id: string; data: { style?: Record<string, unknown> } }[]
  openPop: string | null
  togglePop: (k: string) => void
  updateEdgeStyle: (id: string, patch: Record<string, unknown>) => void
}) {
  const first = edges.find((e) => e.id === ids[0])
  const style = (first?.data.style ?? {}) as EdgeStyle
  const apply = (patch: Record<string, unknown>) => ids.forEach((id) => updateEdgeStyle(id, patch))
  const close = () => togglePop(openPop ?? '')

  return (
    <>
      <div className="stb-pop-anchor">
        <ChipButton label="Stroke" color={style.strokeColor ?? '#475569'} testId="stb-stroke"
          active={openPop === 'stroke'} onClick={() => togglePop('stroke')} />
        <Popover open={openPop === 'stroke'} onClose={close} testId="stb-stroke-pop">
          <ColorPicker testId="stb-stroke-picker" value={style.strokeColor}
            onChange={(c) => apply({ strokeColor: c })} />
        </Popover>
      </div>

      <div className="stb-pop-anchor">
        <ChipButton label="Line" testId="stb-line"
          active={openPop === 'line'} onClick={() => togglePop('line')} />
        <Popover open={openPop === 'line'} onClose={close} testId="stb-line-pop">
          <Row>
            <Field label="Width">
              <input type="number" min={1} max={12} step={1}
                value={style.strokeWidth ?? 2}
                onChange={(e) => apply({ strokeWidth: Number(e.target.value) })}
                data-testid="stb-stroke-width" />
            </Field>
            <Field label="Style">
              <Segmented<StrokeStyle> testId="stb-stroke-style" value={style.strokeStyle ?? 'solid'}
                onChange={(v) => apply({ strokeStyle: v })}
                options={[
                  { value: 'solid', label: '────' },
                  { value: 'dashed', label: '─ ─' },
                  { value: 'dotted', label: '· · ·' },
                ]} />
            </Field>
          </Row>
        </Popover>
      </div>

      <div className="stb-pop-anchor">
        <ChipButton label="Arrows" testId="stb-arrows"
          active={openPop === 'arrows'} onClick={() => togglePop('arrows')} />
        <Popover open={openPop === 'arrows'} onClose={close} testId="stb-arrows-pop">
          <Field label="Start">
            <select value={style.markerStart ?? 'none'} data-testid="stb-marker-start"
              onChange={(e) => apply({ markerStart: e.target.value as EdgeMarker })}>
              {MARKER_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="End">
            <select value={style.markerEnd ?? 'none'} data-testid="stb-marker-end"
              onChange={(e) => apply({ markerEnd: e.target.value as EdgeMarker })}>
              {MARKER_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Size">
            <Segmented<MarkerSize> testId="stb-marker-size" value={style.markerSize ?? 'md'}
              onChange={(v) => apply({ markerSize: v })}
              options={[
                { value: 'sm', label: 'S' },
                { value: 'md', label: 'M' },
                { value: 'lg', label: 'L' },
              ]} />
          </Field>
        </Popover>
      </div>
    </>
  )
}
