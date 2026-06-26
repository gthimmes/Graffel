import { useDiagramStore } from '../store/diagramStore'
import { useTourUiStore } from './tourUiStore'

/**
 * v3.23 — walkthrough authoring panel. Lets the author capture the current
 * level + selection as ordered "stops", title/annotate them, reorder, preview,
 * and launch the presenter. Editor-only (mounted in the app, not share views).
 */
export function TourPanel() {
  const open = useTourUiStore((s) => s.panelOpen)
  const closePanel = useTourUiStore((s) => s.closePanel)
  const stops = useDiagramStore((s) => s.tourStops)
  const addTourStop = useDiagramStore((s) => s.addTourStop)
  const removeTourStop = useDiagramStore((s) => s.removeTourStop)
  const updateTourStop = useDiagramStore((s) => s.updateTourStop)
  const moveTourStop = useDiagramStore((s) => s.moveTourStop)
  const gotoStop = useDiagramStore((s) => s.gotoStop)
  const startPresenting = useDiagramStore((s) => s.startPresenting)

  if (!open) return null

  return (
    <aside className="graffel-tour-panel" data-testid="tour-panel" aria-label="Walkthrough">
      <header className="tour-panel-head">
        <h3>🎬 Walkthrough</h3>
        <button
          type="button"
          className="tour-panel-close"
          onClick={closePanel}
          data-testid="tour-panel-close"
          aria-label="Close walkthrough panel"
        >✕</button>
      </header>

      <p className="tour-panel-hint">
        Drill to a level, select what to highlight, then capture it as a stop.
      </p>
      <button
        type="button"
        className="tour-add-stop"
        onClick={() => addTourStop()}
        data-testid="tour-add-stop"
      >＋ Add current view as stop</button>

      {stops.length === 0 ? (
        <p className="tour-empty" data-testid="tour-empty">No stops yet.</p>
      ) : (
        <ol className="tour-stop-list">
          {stops.map((stop, i) => (
            <li key={stop.id} className="tour-stop" data-testid={`tour-stop-${stop.id}`}>
              <div className="tour-stop-row">
                <span className="tour-stop-index">{i + 1}</span>
                <input
                  className="tour-stop-title"
                  value={stop.title}
                  onChange={(e) => updateTourStop(stop.id, { title: e.target.value })}
                  data-testid={`tour-stop-title-${stop.id}`}
                  aria-label={`Stop ${i + 1} title`}
                />
                <button
                  type="button"
                  className="tour-stop-btn"
                  onClick={() => gotoStop(i)}
                  title="Preview this stop"
                  data-testid={`tour-stop-goto-${stop.id}`}
                >👁</button>
                <button
                  type="button"
                  className="tour-stop-btn"
                  onClick={() => moveTourStop(stop.id, -1)}
                  disabled={i === 0}
                  title="Move earlier"
                  data-testid={`tour-stop-up-${stop.id}`}
                >▲</button>
                <button
                  type="button"
                  className="tour-stop-btn"
                  onClick={() => moveTourStop(stop.id, 1)}
                  disabled={i === stops.length - 1}
                  title="Move later"
                  data-testid={`tour-stop-down-${stop.id}`}
                >▼</button>
                <button
                  type="button"
                  className="tour-stop-btn is-danger"
                  onClick={() => removeTourStop(stop.id)}
                  title="Delete stop"
                  data-testid={`tour-stop-delete-${stop.id}`}
                >🗑</button>
              </div>
              <textarea
                className="tour-stop-note"
                value={stop.note}
                placeholder="Add a note shown during the walkthrough…"
                onChange={(e) => updateTourStop(stop.id, { note: e.target.value })}
                data-testid={`tour-stop-note-${stop.id}`}
                aria-label={`Stop ${i + 1} note`}
                rows={2}
              />
            </li>
          ))}
        </ol>
      )}

      <footer className="tour-panel-foot">
        <button
          type="button"
          className="tour-present"
          onClick={() => startPresenting()}
          disabled={stops.length === 0}
          data-testid="tour-present"
        >▶ Present</button>
      </footer>
    </aside>
  )
}
