import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDiagramStore } from '../store/diagramStore'

/**
 * v3.23 — full-screen walkthrough player. Renders over the canvas while
 * `presenting` is true: shows the current stop's title + note, a step counter,
 * and prev/next/exit controls. Each stop drives the level + selection via the
 * store; this component frames the camera on the highlighted nodes and wires
 * presentation keyboard navigation. Works in read-only share views too.
 */
export function Presenter() {
  const presenting = useDiagramStore((s) => s.presenting)
  const stops = useDiagramStore((s) => s.tourStops)
  const index = useDiagramStore((s) => s.presentIndex)
  const selectedNodeIds = useDiagramStore((s) => s.selectedNodeIds)
  const next = useDiagramStore((s) => s.nextStop)
  const prev = useDiagramStore((s) => s.prevStop)
  const stop = useDiagramStore((s) => s.stopPresenting)
  const rf = useReactFlow()

  // Keyboard: →/Space/PageDown advance, ←/PageUp go back, Esc exits.
  useEffect(() => {
    if (!presenting) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault(); next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault(); prev()
      } else if (e.key === 'Escape') {
        e.preventDefault(); stop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presenting, next, prev, stop])

  // Frame the camera on the stop's highlighted nodes (or the whole level if the
  // stop has no selection). Delayed so the level's nodes have rendered first.
  useEffect(() => {
    if (!presenting) return
    const t = window.setTimeout(() => {
      const opts = { padding: 0.3, duration: 400 }
      if (selectedNodeIds.length > 0) {
        void rf.fitView({ ...opts, nodes: selectedNodeIds.map((id) => ({ id })) })
      } else {
        void rf.fitView(opts)
      }
    }, 80)
    return () => window.clearTimeout(t)
  }, [presenting, index, selectedNodeIds, rf])

  if (!presenting || stops.length === 0) return null

  const current = stops[index]
  const total = stops.length

  return (
    <div className="graffel-presenter" data-testid="presenter">
      <div className="presenter-bar">
        <button
          type="button"
          className="presenter-exit"
          onClick={stop}
          data-testid="presenter-exit"
          title="Exit walkthrough (Esc)"
        >✕ Exit</button>

        <div className="presenter-body">
          <div className="presenter-title" data-testid="presenter-title">{current?.title}</div>
          {current?.note ? (
            <div className="presenter-note" data-testid="presenter-note">{current.note}</div>
          ) : null}
        </div>

        <div className="presenter-nav">
          <button
            type="button"
            className="presenter-prev"
            onClick={prev}
            disabled={index === 0}
            data-testid="presenter-prev"
            title="Previous (←)"
          >‹ Prev</button>
          <span className="presenter-counter" data-testid="presenter-counter">{index + 1} / {total}</span>
          <button
            type="button"
            className="presenter-next"
            onClick={next}
            disabled={index === total - 1}
            data-testid="presenter-next"
            title="Next (→)"
          >Next ›</button>
        </div>
      </div>
    </div>
  )
}
