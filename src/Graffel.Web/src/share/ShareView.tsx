import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useState } from 'react'
import { DiagramCanvas } from '../canvas/DiagramCanvas'
import { useDiagramStore } from '../store/diagramStore'
import { parseDocument } from '../format/graffelFile'
import { parseLevelHash } from '../canvas/levelLink'
import { resolveShare } from './shareClient'
import { Presenter } from '../ui/Presenter'

interface ShareViewProps {
  token: string
}

export function ShareView({ token }: ShareViewProps) {
  const loadDocument = useDiagramStore((s) => s.loadDocument)
  const setReadOnly = useDiagramStore((s) => s.setReadOnly)
  const title = useDiagramStore((s) => s.title)
  const hasTour = useDiagramStore((s) => s.tourStops.length > 0)
  const startPresenting = useDiagramStore((s) => s.startPresenting)
  const [state, setState] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    setReadOnly(true)
    let cancelled = false
    void (async () => {
      try {
        const rec = await resolveShare(token)
        if (cancelled) return
        if (!rec) { setState('not-found'); return }
        try {
          const doc = parseDocument(rec.body)
          loadDocument(doc)
          // loadDocument resets readOnly through emptyState — set again after.
          setReadOnly(true)
          // Honor a #l=<id> deep-link so a share can open inside a container.
          const levelId = parseLevelHash(window.location.hash)
          if (levelId) useDiagramStore.getState().enterContainer(levelId)
          setState('ready')
        } catch (e) {
          setErrMsg((e as Error).message)
          setState('error')
        }
      } catch (e) {
        setErrMsg((e as Error).message)
        setState('error')
      }
    })()
    return () => { cancelled = true; setReadOnly(false) }
  }, [token, loadDocument, setReadOnly])

  if (state === 'loading') {
    return <div className="share-view-empty" data-testid="share-view-loading">Loading shared diagram…</div>
  }
  if (state === 'not-found') {
    return (
      <div className="share-view-empty" data-testid="share-view-not-found">
        <h2>This share link isn't valid.</h2>
        <p>It may have been revoked, or the link is mistyped.</p>
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="share-view-empty" data-testid="share-view-error">
        <h2>Couldn't open this shared diagram.</h2>
        <p>{errMsg}</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="graffel-app share-view" data-testid="share-view">
        <header className="graffel-toolbar share-view-toolbar">
          <span className="brand">Graffel</span>
          <span className="share-view-title" data-testid="share-view-title">{title}</span>
          <span className="spacer" />
          {hasTour ? (
            <button
              type="button"
              className="share-view-present"
              onClick={() => startPresenting()}
              data-testid="share-present"
            >▶ Present</button>
          ) : null}
          <span className="share-view-badge">Viewing — read-only</span>
          <a href="/" className="share-view-open-app">Open Graffel</a>
        </header>
        <div className="graffel-body share-view-body">
          <DiagramCanvas />
        </div>
        <Presenter />
      </div>
    </ReactFlowProvider>
  )
}
