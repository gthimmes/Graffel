import { useDiagramStore } from '../store/diagramStore'
import { TEMPLATES } from '../templates/templates'
import { useUiStore } from './CommandPalette'

/**
 * v3.18 — empty-canvas welcome. Shown when the current document has no nodes (a
 * fresh diagram) and we're editable. Offers one-click starter templates — the
 * architecture one teaches drill-down immediately — plus the key shortcuts a
 * first-time user otherwise has no way to discover.
 */
export function WelcomeOverlay() {
  const nodeCount = useDiagramStore((s) => s.nodes.length)
  const readOnly = useDiagramStore((s) => s.readOnly)
  const loadDocument = useDiagramStore((s) => s.loadDocument)

  if (readOnly || nodeCount > 0) return null

  return (
    <div className="graffel-welcome" data-testid="welcome-overlay">
      <div className="graffel-welcome-card">
        <h1 className="graffel-welcome-title">Start a diagram</h1>
        <p className="graffel-welcome-sub">Pick a starter, or just drag a shape from the left.</p>

        <div className="graffel-welcome-templates">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="graffel-welcome-template"
              data-testid={`template-${t.id}`}
              onClick={() => loadDocument(t.build())}
            >
              <span className="graffel-welcome-glyph" aria-hidden>{t.glyph}</span>
              <span className="graffel-welcome-tname">{t.name}</span>
              <span className="graffel-welcome-tdesc">{t.description}</span>
            </button>
          ))}
        </div>

        <ul className="graffel-welcome-tips">
          <li><kbd>/</kbd> opens the command palette
            {' '}<button type="button" className="graffel-welcome-link" data-testid="welcome-open-palette"
              onClick={() => useUiStore.getState().openPalette()}>open it</button>
          </li>
          <li><b>Double-click</b> a container (a dashed box) to <b>drill inside</b> it — then use the breadcrumb to climb back out</li>
          <li><kbd>R</kbd> <kbd>E</kbd> <kbd>D</kbd> <kbd>T</kbd> drop a rectangle / ellipse / diamond / text at the cursor</li>
        </ul>
      </div>
    </div>
  )
}
